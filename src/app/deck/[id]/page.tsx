import { createClient } from '@/utils/supabase/server'
import { redirect, notFound } from 'next/navigation'
import DeckStudyClient from './DeckStudyClient'

interface Props {
    params: Promise<{ id: string }>
}

export default async function DeckPage({ params }: Props) {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Deck laden + Eigentümerprüfung
    const { data: deck } = await supabase
        .from('flashcard_decks')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

    if (!deck) notFound()

    // Karteikarten laden
    const { data: cards } = await supabase
        .from('flashcards')
        .select('*')
        .eq('deck_id', id)
        .order('position', { ascending: true })

    if (!cards || cards.length === 0) notFound()

    return (
        <DeckStudyClient
            cards={cards}
            title={deck.title}
            deckId={deck.id}
        />
    )
}
