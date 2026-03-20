'use server'

import { createClient } from '@/utils/supabase/server'
import {
    generatePodcastScriptFromFile,
    generatePodcastScriptFromText,
    generatePodcastScriptFromCollection,
    scriptToAudioBuffer,
} from '@/utils/gemini'
import { revalidatePath } from 'next/cache'
import { getUserRole, checkLimit } from '@/utils/checkLimit'
import { isEnabled } from '@/config/features'

export async function generateAudio(documentId: string): Promise<{ audioId?: string; error?: string }> {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { error: 'Nicht angemeldet.' }

    // ── Freemium-Guard ─────────────────────────────────────────────
    const role = await getUserRole(supabase, user.id)
    if (!isEnabled('audio', role)) return { error: 'FEATURE_DISABLED' }
    const limit = await checkLimit(supabase, user.id, role, 'audio')
    if (!limit.allowed) return { error: 'LIMIT_REACHED' }
    // ──────────────────────────────────────────────────────────────

    const { data: doc } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .eq('user_id', user.id)
        .single()
    if (!doc) return { error: 'Dokument nicht gefunden.' }

    // Bereits vorhanden?
    const { data: existing } = await supabase
        .from('audio_summaries')
        .select('id')
        .eq('document_id', documentId)
        .single()
    if (existing) return { audioId: existing.id }

    // Datei(en) aus Storage laden
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

    // ── 1. Podcast-Script via Gemini generieren ─────────────────────
    let script: string
    try {
        if (doc.type === 'COLLECTION') {
            script = await generatePodcastScriptFromCollection(filesForGemini, doc.title)
        } else if (doc.type === 'PDF' || doc.type === 'IMAGE') {
            script = await generatePodcastScriptFromFile(filesForGemini[0].buffer, filesForGemini[0].mimeType, filesForGemini[0].title)
        } else {
            const raw = filesForGemini[0].buffer.toString('utf-8').replace(/[^\x20-\x7E\u00C0-\u024F\n]/g, ' ')
            script = await generatePodcastScriptFromText(raw, doc.title)
        }
    } catch (e) {
        return { error: `KI-Fehler (Script): ${e instanceof Error ? e.message : String(e)}` }
    }
    if (!script) return { error: 'Kein Podcast-Script generiert.' }

    // ── 2. Script → WAV via Gemini TTS ─────────────────────────────
    let wavBuffer: Buffer
    try {
        wavBuffer = await scriptToAudioBuffer(script)
    } catch (e) {
        // Fallback: Script ohne Audio speichern (Player nutzt dann Script-Text)
        console.warn('TTS fehlgeschlagen, speichere nur Script:', e)
        const { data: saved, error: dbErr } = await supabase
            .from('audio_summaries')
            .insert({ user_id: user.id, document_id: documentId, title: doc.title, script })
            .select('id').single()
        if (dbErr || !saved) return { error: `Datenbankfehler: ${dbErr?.message}` }
        revalidatePath('/dashboard')
        return { audioId: saved.id }
    }

    // ── 3. WAV in Supabase Storage hochladen ────────────────────────
    const audioPath = `${user.id}/${documentId}.wav`
    const { error: uploadErr } = await supabase.storage
        .from('audio-files')
        .upload(audioPath, wavBuffer, {
            contentType: 'audio/wav',
            upsert: true,
        })

    let audioUrl: string | null = null
    if (!uploadErr) {
        const { data: urlData } = supabase.storage
            .from('audio-files')
            .getPublicUrl(audioPath)
        audioUrl = urlData?.publicUrl ?? null
    } else {
        console.warn('Audio-Upload fehlgeschlagen:', uploadErr.message)
    }

    // ── 4. In DB speichern ──────────────────────────────────────────
    const { data: saved, error: dbErr } = await supabase
        .from('audio_summaries')
        .insert({
            user_id: user.id,
            document_id: documentId,
            title: doc.title,
            script,
            audio_url: audioUrl,
        })
        .select('id').single()

    if (dbErr || !saved) return { error: `Datenbankfehler: ${dbErr?.message}` }

    revalidatePath('/dashboard')
    return { audioId: saved.id }
}
