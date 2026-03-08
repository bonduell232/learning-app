import { createClient } from '@/utils/supabase/server'
import { redirect, notFound } from 'next/navigation'
import QuizClient from './QuizClient'

interface Props {
    params: Promise<{ id: string }>
}

export default async function QuizPage({ params }: Props) {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: quiz } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()
    if (!quiz) notFound()

    const { data: questions } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', id)
        .order('position', { ascending: true })
    if (!questions?.length) notFound()

    return <QuizClient quiz={quiz} questions={questions} userId={user.id} />
}
