import { createClient } from '@/utils/supabase/server'
import { redirect, notFound } from 'next/navigation'
import AudioPlayerClient from './AudioPlayerClient'

interface Props {
    params: Promise<{ id: string }>
}

export default async function AudioPage({ params }: Props) {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: audio } = await supabase
        .from('audio_summaries')
        .select('id, title, script, audio_url')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

    if (!audio) notFound()

    return (
        <AudioPlayerClient
            script={audio.script}
            title={audio.title}
            audioUrl={audio.audio_url ?? null}
        />
    )
}
