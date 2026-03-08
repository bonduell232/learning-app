'use server'

import { createClient } from '@/utils/supabase/server'
import {
    generateQuizQuestionsFromFile,
    generateQuizQuestionsFromText,
} from '@/utils/gemini'
import { revalidatePath } from 'next/cache'

export async function generateQuiz(documentId: string): Promise<{ quizId?: string; error?: string }> {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { error: 'Nicht angemeldet.' }

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

    const { data: fileData, error: storageErr } = await supabase.storage
        .from('documents')
        .download(doc.storage_path)
    if (storageErr || !fileData) return { error: `Datei konnte nicht geladen werden: ${storageErr?.message}` }

    const fileBuffer = Buffer.from(await fileData.arrayBuffer())

    let questions
    try {
        if (doc.type === 'PDF') {
            questions = await generateQuizQuestionsFromFile(fileBuffer, 'application/pdf', doc.title)
        } else if (doc.type === 'IMAGE') {
            const ext = doc.storage_path.split('.').pop()?.toLowerCase()
            const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'
            questions = await generateQuizQuestionsFromFile(fileBuffer, mime, doc.title)
        } else {
            const raw = fileBuffer.toString('utf-8').replace(/[^\x20-\x7E\u00C0-\u024F\n]/g, ' ')
            questions = await generateQuizQuestionsFromText(raw, doc.title)
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

    const rows = questions.map((q, i) => ({
        quiz_id: quiz.id,
        question: q.question,
        options: q.options,
        correct_index: q.correct_index,
        explanation: q.explanation ?? '',
        position: i,
    }))

    const { error: rowsErr } = await supabase.from('quiz_questions').insert(rows)
    if (rowsErr) {
        await supabase.from('quizzes').delete().eq('id', quiz.id)
        return { error: `DB-Fehler (Fragen): ${rowsErr.message}` }
    }

    revalidatePath('/dashboard')
    return { quizId: quiz.id }
}
