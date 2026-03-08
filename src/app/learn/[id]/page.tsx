import { createClient } from '@/utils/supabase/server'
import { redirect, notFound } from 'next/navigation'
import LearnModeSelector from './LearnModeSelector'

interface Props {
    params: Promise<{ id: string }>
}

export default async function LearnPage({ params }: Props) {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: doc } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

    if (!doc) notFound()

    // Prüfen was bereits generiert wurde
    const [{ data: deck }, { data: audio }, { data: quiz }] = await Promise.all([
        supabase.from('flashcard_decks').select('id, card_count').eq('document_id', id).single(),
        supabase.from('audio_summaries').select('id').eq('document_id', id).single(),
        supabase.from('quizzes').select('id, question_count').eq('document_id', id).single(),
    ])

    return (
        <LearnModeSelector
            documentId={id}
            documentTitle={doc.title}
            documentType={doc.type}
            existingDeckId={deck?.id ?? null}
            existingDeckCount={deck?.card_count ?? null}
            existingAudioId={audio?.id ?? null}
            existingQuizId={quiz?.id ?? null}
            existingQuizCount={quiz?.question_count ?? null}
        />
    )
}
