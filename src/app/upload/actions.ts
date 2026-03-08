'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function uploadDocument(formData: FormData): Promise<{ documentId?: string; error?: string }> {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { error: 'Nicht angemeldet.' }

    const file = formData.get('file') as File
    if (!file || file.size === 0) return { error: 'Keine Datei ausgewählt.' }

    if (file.size > 20 * 1024 * 1024) return { error: 'Die Datei darf maximal 20 MB groß sein.' }

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

    const fileType = mimeTypeMap[file.type] ?? 'OTHER'
    if (fileType === 'OTHER') return { error: 'Dateityp nicht unterstützt. Erlaubt: PDF, Bilder, Word, PowerPoint.' }

    const storagePath = `${user.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`

    const { error: storageError } = await supabase.storage
        .from('documents')
        .upload(storagePath, file, { contentType: file.type, upsert: false })

    if (storageError) return { error: `Upload fehlgeschlagen: ${storageError.message}` }

    // Eintrag anlegen und die neue ID zurückbekommen
    const { data: docData, error: dbError } = await supabase
        .from('documents')
        .insert({
            user_id: user.id,
            title: file.name.replace(/\.[^/.]+$/, ''),
            type: fileType,
            subject: 'SONSTIGES',
            storage_path: storagePath,
        })
        .select('id')
        .single()

    if (dbError || !docData) {
        await supabase.storage.from('documents').remove([storagePath])
        return { error: `Datenbankfehler: ${dbError?.message}` }
    }

    revalidatePath('/dashboard')
    return { documentId: docData.id }
}
