'use server'

import { createClient } from '@/utils/supabase/server'
import {
    generatePodcastScriptFromFile,
    generatePodcastScriptFromText,
} from '@/utils/gemini'
import { revalidatePath } from 'next/cache'

export async function generateAudio(documentId: string): Promise<{ audioId?: string; error?: string }> {
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
        .from('audio_summaries')
        .select('id')
        .eq('document_id', documentId)
        .single()
    if (existing) return { audioId: existing.id }

    // Datei aus Storage laden
    const { data: fileData, error: storageErr } = await supabase.storage
        .from('documents')
        .download(doc.storage_path)
    if (storageErr || !fileData) return { error: `Datei konnte nicht geladen werden: ${storageErr?.message}` }

    const fileBuffer = Buffer.from(await fileData.arrayBuffer())

    // Podcast-Script via Gemini generieren
    let script: string
    try {
        if (doc.type === 'PDF') {
            script = await generatePodcastScriptFromFile(fileBuffer, 'application/pdf', doc.title)
        } else if (doc.type === 'IMAGE') {
            const ext = doc.storage_path.split('.').pop()?.toLowerCase()
            const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'
            script = await generatePodcastScriptFromFile(fileBuffer, mime, doc.title)
        } else {
            const raw = fileBuffer.toString('utf-8').replace(/[^\x20-\x7E\u00C0-\u024F\n]/g, ' ')
            script = await generatePodcastScriptFromText(raw, doc.title)
        }
    } catch (e) {
        return { error: `KI-Fehler: ${e instanceof Error ? e.message : String(e)}` }
    }

    if (!script) return { error: 'Kein Podcast-Script generiert.' }

    const { data: saved, error: dbErr } = await supabase
        .from('audio_summaries')
        .insert({ user_id: user.id, document_id: documentId, title: doc.title, script })
        .select('id')
        .single()

    if (dbErr || !saved) return { error: `Datenbankfehler: ${dbErr?.message}` }

    revalidatePath('/dashboard')
    return { audioId: saved.id }
}
