import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FileText, Image as ImageIcon, FileCode, Upload, Clock, Sparkles, BookOpen, Layers } from 'lucide-react'
import GenerateFlashcardsButton from './GenerateFlashcardsButton'

const TYPE_ICONS: Record<string, React.ReactNode> = {
    PDF: <FileText className="w-5 h-5 text-red-400" />,
    IMAGE: <ImageIcon className="w-5 h-5 text-blue-400" />,
    WORD: <FileCode className="w-5 h-5 text-sky-400" />,
    PRESENTATION: <FileCode className="w-5 h-5 text-orange-400" />,
}

const TYPE_LABELS: Record<string, string> = {
    PDF: 'PDF', IMAGE: 'Bild', WORD: 'Word', PRESENTATION: 'Präsentation',
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('de-DE', {
        day: '2-digit', month: 'short', year: 'numeric'
    })
}

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: documents } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    // Vorhandene Decks laden (um zu wissen, welche Dokumente bereits Karten haben)
    const { data: decks } = await supabase
        .from('flashcard_decks')
        .select('id, document_id, card_count')
        .eq('user_id', user.id)

    const deckByDocId = new Map(decks?.map(d => [d.document_id, d]) ?? [])

    const email = user.email ?? ''
    const greeting = email.split('@')[0]

    return (
        <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-12">
                <p className="text-[#9333EA] text-sm font-semibold uppercase tracking-widest mb-2">Dashboard</p>
                <h1 className="text-4xl font-extrabold text-white mb-3">
                    Hallo, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9333EA] to-[#c084fc]">{greeting}</span>! 👋
                </h1>
                <p className="text-white/50">Hier sind all deine hochgeladenen Lernmaterialien.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-10">
                <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5">
                    <p className="text-white/40 text-xs font-medium uppercase tracking-wide mb-1">Dokumente</p>
                    <p className="text-3xl font-bold text-white">{documents?.length ?? 0}</p>
                </div>
                <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5">
                    <p className="text-white/40 text-xs font-medium uppercase tracking-wide mb-1">Karteikarten-Decks</p>
                    <p className="text-3xl font-bold text-white">{decks?.length ?? 0}</p>
                </div>
                <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5">
                    <p className="text-white/40 text-xs font-medium uppercase tracking-wide mb-1">Abo</p>
                    <p className="text-xl font-bold text-white">Kostenlos</p>
                </div>
            </div>

            {/* Documents */}
            <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-white">Meine Dokumente</h2>
                <Link
                    href="/upload"
                    className="flex items-center gap-2 bg-[#9333EA] hover:bg-[#a855f7] text-white px-5 py-2.5 rounded-full text-sm font-bold transition-all hover:shadow-[0_0_20px_rgba(147,51,234,0.4)]"
                >
                    <Upload className="w-4 h-4" />
                    Hochladen
                </Link>
            </div>

            {documents && documents.length > 0 ? (
                <div className="space-y-3">
                    {documents.map((doc) => {
                        const deck = deckByDocId.get(doc.id)
                        return (
                            <div
                                key={doc.id}
                                className="flex items-center gap-4 bg-white/[0.04] border border-white/10 rounded-2xl px-5 py-4 hover:border-[#9333EA]/30 hover:bg-white/[0.06] transition-all"
                            >
                                {/* Icon */}
                                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center shrink-0">
                                    {TYPE_ICONS[doc.type] ?? <FileText className="w-5 h-5 text-white/40" />}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-semibold truncate">{doc.title}</p>
                                    <p className="text-white/40 text-xs mt-0.5 flex items-center gap-2">
                                        <span>{TYPE_LABELS[doc.type] ?? doc.type}</span>
                                        <span>·</span>
                                        <Clock className="w-3 h-3 inline" />
                                        <span>{formatDate(doc.created_at)}</span>
                                    </p>
                                </div>

                                {/* Aktion */}
                                <div className="shrink-0">
                                    {deck ? (
                                        <Link
                                            href={`/deck/${deck.id}`}
                                            className="flex items-center gap-2 bg-white/5 hover:bg-[#9333EA]/20 border border-white/10 hover:border-[#9333EA]/40 text-white/80 hover:text-white px-4 py-2 rounded-full text-xs font-semibold transition-all"
                                        >
                                            <BookOpen className="w-3.5 h-3.5" />
                                            {deck.card_count} Karten üben
                                        </Link>
                                    ) : (
                                        <GenerateFlashcardsButton documentId={doc.id} />
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/10 rounded-3xl">
                    <div className="w-16 h-16 bg-[#9333EA]/10 rounded-2xl flex items-center justify-center mb-4">
                        <Upload className="w-7 h-7 text-[#9333EA]" />
                    </div>
                    <h3 className="text-white font-semibold text-lg mb-2">Noch keine Dokumente</h3>
                    <p className="text-white/40 text-sm text-center max-w-xs mb-6">
                        Lade deine ersten Lernmaterialien hoch und lass unsere KI Karteikarten für dich erstellen.
                    </p>
                    <Link
                        href="/upload"
                        className="flex items-center gap-2 bg-[#9333EA] hover:bg-[#a855f7] text-white px-6 py-3 rounded-full text-sm font-bold transition-all"
                    >
                        <Upload className="w-4 h-4" />
                        Erstes Dokument hochladen
                    </Link>
                </div>
            )}
        </div>
    )
}
