'use server'

import { createClient } from '@/utils/supabase/server'
import {
    generateQuizQuestionsFromFile,
    generateQuizQuestionsFromText,
    generateQuizQuestionsFromCollection,
} from '@/utils/gemini'
import { revalidatePath } from 'next/cache'
import { getUserRole, checkLimit } from '@/utils/checkLimit'
import { isEnabled } from '@/config/features'

/** Fisher-Yates Shuffle: mischt Antwortoptionen zufällig und passt correct_index an */
function shuffleOptions(options: string[], correctIndex: number): { options: string[]; correct_index: number } {
    const indexed = options.map((opt, i) => ({ opt, isCorrect: i === correctIndex }))
    for (let i = indexed.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indexed[i], indexed[j]] = [indexed[j], indexed[i]]
    }
    return {
        options: indexed.map(x => x.opt),
        correct_index: indexed.findIndex(x => x.isCorrect),
    }
}

export async function generateQuiz(documentId: string): Promise<{ quizId?: string; error?: string }> {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { error: 'Nicht angemeldet.' }

    // ── Freemium-Guard ───────────────────────────────────────────
    const role = await getUserRole(supabase, user.id)
    if (!isEnabled('quiz', role)) return { error: 'FEATURE_DISABLED' }
    const limit = await checkLimit(supabase, user.id, role, 'quiz')
    if (!limit.allowed) return { error: 'LIMIT_REACHED' }
    // ─────────────────────────────────────────────────────────────

    const { data: doc } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .eq('user_id', user.id)
        .single()
    if (!doc) return { error: 'Dokument nicht gefunden.' }

    // Bereits vorhanden?
    const { data: existing } = await supabase
        .from('quizzes')
        .select('id')
        .eq('document_id', documentId)
        .single()
    if (existing) return { quizId: existing.id }

    let filesForGemini: { buffer: Buffer; mimeType: string; title: string }[] = []

    try {
        if (doc.type === 'COLLECTION') {
            const paths: string[] = JSON.parse(doc.storage_path)
            filesForGemini = await Promise.all(paths.map(async (path, idx) => {
                const { data, error } = await supabase.storage.from('documents').download(path)
                if (error || !data) throw new Error(`Bild konnte nicht geladen werden (${path}): ${error?.message}`)
                const buf = Buffer.from(await data.arrayBuffer())
                const ext = path.split('.').pop()?.toLowerCase()
                const mimeTag = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'
                return { buffer: buf, mimeType: mimeTag, title: `Seite ${idx + 1}` }
            }))
        } else {
            const { data: fileData, error: storageError } = await supabase.storage.from('documents').download(doc.storage_path)
            if (storageError || !fileData) return { error: `Datei konnte nicht geladen werden: ${storageError?.message}` }
            const buf = Buffer.from(await fileData.arrayBuffer())
            const ext = doc.storage_path.split('.').pop()?.toLowerCase()
            const mimeTag = doc.type === 'PDF' ? 'application/pdf' : (ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg')
            filesForGemini = [{ buffer: buf, mimeType: mimeTag, title: doc.title }]
        }
    } catch (e: any) {
        return { error: `Storage-Fehler: ${e.message}` }
    }

    const subject = doc.subject_name || doc.subject || undefined
    const topic = doc.topic_name || undefined

    let questions
    try {
        const logStats = { supabase, userId: user.id, documentId, type: (doc.type === 'COLLECTION' ? 'COLLECTION' : 'QUIZ') as any }

        if (doc.type === 'COLLECTION') {
            questions = await generateQuizQuestionsFromCollection(filesForGemini, doc.title, subject, topic, logStats)
        } else if (doc.type === 'PDF' || doc.type === 'IMAGE') {
            questions = await generateQuizQuestionsFromFile(filesForGemini[0].buffer, filesForGemini[0].mimeType, filesForGemini[0].title, subject, topic, logStats)
        } else {
            const raw = filesForGemini[0].buffer.toString('utf-8').replace(/[^\x20-\x7E\u00C0-\u024F\n]/g, ' ')
            questions = await generateQuizQuestionsFromText(raw, doc.title, subject, topic, logStats)
        }
    } catch (e) {
        return { error: `KI-Fehler: ${e instanceof Error ? e.message : String(e)}` }
    }

    if (!questions?.length) return { error: 'Keine Fragen generiert.' }

    const { data: quiz, error: quizErr } = await supabase
        .from('quizzes')
        .insert({ user_id: user.id, document_id: documentId, title: doc.title, question_count: questions.length })
        .select('id')
        .single()
    if (quizErr || !quiz) return { error: `DB-Fehler: ${quizErr?.message}` }

    // Antwortoptionen für jede Frage zufällig mischen
    const rows = questions.map((q, i) => {
        const shuffled = shuffleOptions(q.options, q.correct_index)
        return {
            quiz_id: quiz.id,
            question: q.question,
            options: shuffled.options,
            correct_index: shuffled.correct_index,
            explanation: q.explanation ?? '',
            position: i,
        }
    })

    const { error: rowsErr } = await supabase.from('quiz_questions').insert(rows)
    if (rowsErr) {
        await supabase.from('quizzes').delete().eq('id', quiz.id)
        return { error: `DB-Fehler (Fragen): ${rowsErr.message}` }
    }

    revalidatePath('/dashboard')
    return { quizId: quiz.id }
}
