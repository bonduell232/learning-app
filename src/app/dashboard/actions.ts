'use server'

import { createClient } from '@/utils/supabase/server'
import { generateFlashcardsFromFile, generateFlashcardsFromText } from '@/utils/gemini'
import { revalidatePath } from 'next/cache'

// Multimodal-fähige MIME-Typen, die Gemini direkt lesen kann
const MULTIMODAL_TYPES: Record<string, string> = {
    PDF: 'application/pdf',
    IMAGE: 'image/jpeg', // Platzhalter – wird unten korrekt aus DB geladen
}

export async function generateFlashcards(documentId: string): Promise<{ deckId?: string; error?: string }> {
    const supabase = await createClient()

    // 1. Authentifizierung
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { error: 'Nicht angemeldet.' }

    // 2. Dokument aus DB laden
    const { data: doc, error: docError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .eq('user_id', user.id)
        .single()

    if (docError || !doc) return { error: 'Dokument nicht gefunden.' }

    // 3. Prüfen ob bereits ein Deck existiert
    const { data: existingDeck } = await supabase
        .from('flashcard_decks')
        .select('id')
        .eq('document_id', documentId)
        .single()

    if (existingDeck) return { deckId: existingDeck.id }

    // 4. Datei aus Supabase Storage herunterladen
    const { data: fileData, error: storageError } = await supabase.storage
        .from('documents')
        .download(doc.storage_path)

    if (storageError || !fileData) {
        return { error: `Datei konnte nicht geladen werden: ${storageError?.message}` }
    }

    const fileBuffer = Buffer.from(await fileData.arrayBuffer())

    // 5. Gemini aufrufen (Strategie je nach Dateityp)
    let flashcards
    try {
        if (doc.type === 'PDF') {
            flashcards = await generateFlashcardsFromFile(fileBuffer, 'application/pdf', doc.title)
        } else if (doc.type === 'IMAGE') {
            // MIME-Typ aus Dateiendung ableiten
            const ext = doc.storage_path.split('.').pop()?.toLowerCase()
            const imageMime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'
            flashcards = await generateFlashcardsFromFile(fileBuffer, imageMime, doc.title)
        } else {
            // Word/Präsentation: Rohtext aus Puffer extrahieren (einfache Textextraktion)
            const rawText = fileBuffer.toString('utf-8').replace(/[^\x20-\x7E\u00C0-\u024F\n]/g, ' ')
            flashcards = await generateFlashcardsFromText(rawText, doc.title)
        }
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        return { error: `KI-Fehler: ${msg}` }
    }

    if (!flashcards || flashcards.length === 0) {
        return { error: 'Die KI konnte keine Karteikarten erstellen. Bitte versuche es mit einem anderen Dokument.' }
    }

    // 6. Deck in DB speichern
    const { data: deck, error: deckError } = await supabase
        .from('flashcard_decks')
        .insert({
            user_id: user.id,
            document_id: documentId,
            title: doc.title,
            card_count: flashcards.length,
        })
        .select('id')
        .single()

    if (deckError || !deck) {
        return { error: `Datenbankfehler (Deck): ${deckError?.message}` }
    }

    // 7. Einzelne Karten in DB speichern
    const cardRows = flashcards.map((card, i) => ({
        deck_id: deck.id,
        front: card.front,
        back: card.back,
        position: i,
    }))

    const { error: cardsError } = await supabase.from('flashcards').insert(cardRows)

    if (cardsError) {
        // Deck wieder löschen bei Fehler
        await supabase.from('flashcard_decks').delete().eq('id', deck.id)
        return { error: `Datenbankfehler (Karten): ${cardsError.message}` }
    }

    revalidatePath('/dashboard')
    return { deckId: deck.id }
}
