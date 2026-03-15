'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// ── LÖSCHEN ────────────────────────────────────────────────────────────────────

/** Dokument + Storage-Datei löschen (cascaded: Decks, Quizze, Audio werden per FK gelöscht) */
export async function deleteDocument(
    documentId: string
): Promise<{ error?: string }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Nicht angemeldet.' }

    // Storage-Pfad holen
    const { data: doc } = await supabase
        .from('documents')
        .select('storage_path')
        .eq('id', documentId)
        .eq('user_id', user.id)
        .single()

    if (doc?.storage_path) {
        await supabase.storage.from('documents').remove([doc.storage_path])
    }

    const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId)
        .eq('user_id', user.id)

    if (error) return { error: error.message }
    revalidatePath('/dashboard')
    return {}
}

/** 
 * Mehrere Dokumente + Storage-Dateien gleichzeitig löschen 
 */
export async function deleteMultipleDocuments(
    documentIds: string[]
): Promise<{ error?: string }> {
    if (!documentIds?.length) return {}

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Nicht angemeldet.' }

    // Storage-Pfade holen
    const { data: docs } = await supabase
        .from('documents')
        .select('storage_path')
        .in('id', documentIds)
        .eq('user_id', user.id)

    if (docs && docs.length > 0) {
        // Sammle alle Pfade (einzelne Dateien + entpackte Collections)
        const pathsToRemove: string[] = []
        for (const doc of docs) {
            if (doc.storage_path) {
                try {
                    // Prüfen, ob es ein JSON-Array (COLLECTION) ist
                    const parsed = JSON.parse(doc.storage_path)
                    if (Array.isArray(parsed)) {
                        pathsToRemove.push(...parsed)
                    } else {
                        pathsToRemove.push(doc.storage_path)
                    }
                } catch {
                    // Normaler String
                    pathsToRemove.push(doc.storage_path)
                }
            }
        }
        if (pathsToRemove.length > 0) {
            await supabase.storage.from('documents').remove(pathsToRemove)
        }
    }

    const { error } = await supabase
        .from('documents')
        .delete()
        .in('id', documentIds)
        .eq('user_id', user.id)

    if (error) return { error: error.message }
    revalidatePath('/dashboard')
    return {}
}

/** Lernkarten-Deck löschen */
export async function deleteFlashcardDeck(
    deckId: string
): Promise<{ error?: string }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Nicht angemeldet.' }

    const { error } = await supabase
        .from('flashcard_decks')
        .delete()
        .eq('id', deckId)
        .eq('user_id', user.id)

    if (error) return { error: error.message }
    revalidatePath('/dashboard')
    return {}
}

/** Quiz löschen */
export async function deleteQuiz(
    quizId: string
): Promise<{ error?: string }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Nicht angemeldet.' }

    const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quizId)
        .eq('user_id', user.id)

    if (error) return { error: error.message }
    revalidatePath('/dashboard')
    return {}
}

/** Audio-Zusammenfassung löschen */
export async function deleteAudio(
    audioId: string
): Promise<{ error?: string }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Nicht angemeldet.' }

    const { error } = await supabase
        .from('audio_summaries')
        .delete()
        .eq('id', audioId)
        .eq('user_id', user.id)

    if (error) return { error: error.message }
    revalidatePath('/dashboard')
    return {}
}

// ── UMBENENNEN ─────────────────────────────────────────────────────────────────

/** Fach umbenennen – aktualisiert alle Dokumente des Users mit dem alten Namen */
export async function renameSubject(
    oldName: string,
    newName: string
): Promise<{ error?: string }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Nicht angemeldet.' }

    const trimmed = newName.trim()
    if (!trimmed) return { error: 'Name darf nicht leer sein.' }
    if (trimmed === oldName) return {}

    const { error } = await supabase
        .from('documents')
        .update({ subject_name: trimmed, subject: trimmed })
        .eq('user_id', user.id)
        .eq('subject_name', oldName)

    if (error) return { error: error.message }
    revalidatePath('/dashboard')
    return {}
}

/** Thema umbenennen – aktualisiert alle Dokumente mit altem Thema-Namen innerhalb des Fachs */
export async function renameTopic(
    subjectName: string,
    oldTopic: string,
    newTopic: string
): Promise<{ error?: string }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Nicht angemeldet.' }

    const trimmed = newTopic.trim()
    if (!trimmed) return { error: 'Name darf nicht leer sein.' }
    if (trimmed === oldTopic) return {}

    const { error } = await supabase
        .from('documents')
        .update({ topic_name: trimmed })
        .eq('user_id', user.id)
        .eq('subject_name', subjectName)
        .eq('topic_name', oldTopic)

    if (error) return { error: error.message }
    revalidatePath('/dashboard')
    return {}
}
