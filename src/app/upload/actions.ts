'use server'

import { createClient } from '@/utils/supabase/server'
import {
    detectSubjectAndTopicFromFile,
    detectSubjectAndTopicFromText,
    groupImagesByContext,
    ImageGroup
} from '@/utils/gemini'
import { getUserRole, checkLimit } from '@/utils/checkLimit'

/** MIME-Typ → Dateityp für die DB */
const mimeTypeMap: Record<string, string> = {
    'application/pdf': 'PDF',
    'image/jpeg': 'IMAGE',
    'image/png': 'IMAGE',
    'image/webp': 'IMAGE',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'WORD',
    'application/msword': 'WORD',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PRESENTATION',
    'application/vnd.ms-powerpoint': 'PRESENTATION',
}

export interface AnalyzedFile {
    storagePath: string
    title: string
    mimeType: string
    fileType: string
    detectedSubject: string
    detectedTopic: string
    contextInfo?: string
    confidence: 'high' | 'low'
}

export interface ConfirmedFile {
    storagePath: string
    title: string
    mimeType: string
    fileType: string
    subject: string
    topic: string
    contextInfo?: string
}

/**
 * Schritt 1a: Prüft ob der User uploaden darf (Freemium-Gate).
 * Muss vor dem client-seitigen Upload aufgerufen werden.
 */
export async function checkUploadAllowed(): Promise<{ allowed: boolean; error?: string }> {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { allowed: false, error: 'Nicht angemeldet.' }
    const role = await getUserRole(supabase, user.id)
    const limit = await checkLimit(supabase, user.id, role, 'upload')
    return { allowed: limit.allowed, error: limit.allowed ? undefined : 'LIMIT_REACHED' }
}

/**
 * Schritt 1b: KI-Analyse einer bereits in Storage hochgeladenen Datei.
 * Erhält nur Metadaten (kein File-Binärstrom!) – kein Timeout-Risiko.
 */
export async function analyzeStoredFile(
    storagePath: string,
    mimeType: string,
    title: string
): Promise<{ file?: AnalyzedFile; error?: string }> {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { error: 'Nicht angemeldet.' }

    const fileType = mimeTypeMap[mimeType] ?? 'PDF'

    try {
        const { data: fileData, error: storageErr } = await supabase.storage
            .from('documents')
            .download(storagePath)
        if (storageErr || !fileData) return { error: `Datei nicht gefunden: ${storageErr?.message}` }

        const buf = Buffer.from(await fileData.arrayBuffer())
        let detection

        if (fileType === 'PDF' || fileType === 'IMAGE') {
            detection = await detectSubjectAndTopicFromFile(buf, mimeType, title)
        } else {
            const rawText = buf.toString('utf-8').replace(/[^\x20-\x7E\u00C0-\u024F\n]/g, ' ')
            detection = await detectSubjectAndTopicFromText(rawText, title)
        }

        return {
            file: {
                storagePath,
                title,
                mimeType,
                fileType,
                detectedSubject: detection.subject,
                detectedTopic: detection.topic,
                contextInfo: detection.context_info,
                confidence: detection.confidence,
            }
        }
    } catch {
        return {
            file: {
                storagePath, title, mimeType, fileType,
                detectedSubject: 'Sonstiges', detectedTopic: 'Allgemein', contextInfo: '', confidence: 'low'
            }
        }
    }
}

/**
 * Schritt 2: Bestätigte Fach-/Thema-Zuordnung in DB speichern.
 * Speichert subject_name + topic_name direkt im documents-Eintrag (kein extra Tabellen-Join nötig).
 */
export async function confirmAndSaveDocuments(
    files: ConfirmedFile[]
): Promise<{ documentIds?: string[]; error?: string }> {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { error: 'Nicht angemeldet.' }

    const documentIds: string[] = []

    for (const file of files) {
        const { data: doc, error: docErr } = await supabase
            .from('documents')
            .insert({
                user_id: user.id,
                title: file.title,
                type: file.fileType,
                subject: file.subject,       // bestehende Spalte (Text)
                storage_path: file.storagePath,
                subject_name: file.subject,   // neue Text-Spalte (toleriert falls fehlt)
                topic_name: file.topic,       // neue Text-Spalte (toleriert falls fehlt)
                context_info: file.contextInfo, // neue Text-Spalte (toleriert falls fehlt)
            })
            .select('id').single()

        // Fallback: falls subject_name / topic_name / context_info noch nicht in DB-Schema existieren
        if (docErr?.message?.includes('subject_name') || docErr?.message?.includes('topic_name') || docErr?.message?.includes('context_info')) {
            const { data: doc2, error: docErr2 } = await supabase
                .from('documents')
                .insert({
                    user_id: user.id,
                    title: file.title,
                    type: file.fileType,
                    subject: file.subject,
                    storage_path: file.storagePath,
                })
                .select('id').single()
            if (docErr2 || !doc2) return { error: `Speicher-Fehler: ${docErr2?.message}` }
            documentIds.push(doc2.id)
        } else if (docErr || !doc) {
            return { error: `Speicher-Fehler: ${docErr?.message}` }
        } else {
            documentIds.push(doc.id)
        }
    }

    return { documentIds }
}

/**
 * Nimmt die frisch hochgeladenen Bilder (ihre Storage-Pfade) und formatiert sie für Gemini,
 * um logische Gruppen zurückzugeben.
 */
export async function groupUploadedImages(
    images: { storagePath: string; mimeType: string; title: string }[]
): Promise<{ groups?: ImageGroup[]; error?: string }> {
    if (!images.length) return { groups: [] }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { error: 'Nicht angemeldet.' }

    try {
        // Lade alle Bild-Buffer parallel aus Supabase herunter
        const buffers = await Promise.all(
            images.map(async (img) => {
                const { data, error } = await supabase.storage.from('documents').download(img.storagePath)
                if (error || !data) throw new Error(`Fehler beim Laden von ${img.title}`)
                const arrayBuf = await data.arrayBuffer()
                return {
                    buffer: Buffer.from(arrayBuf),
                    mimeType: img.mimeType,
                    title: img.title
                }
            })
        )

        // Sende zur KI
        const groups = await groupImagesByContext(buffers)
        return { groups }
    } catch (err: any) {
        return { error: err.message ?? 'KI-Gruppierung fehlgeschlagen.' }
    }
}
