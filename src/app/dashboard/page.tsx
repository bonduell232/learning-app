import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
    FileText, Image as ImageIcon, FileCode, Upload,
    Headphones, Layers, Zap, BookOpen, Tag, Plus,
    ChevronRight, Folders
} from 'lucide-react'
import {
    SubjectTabLabel,
    TopicLabel,
    DeleteDocumentButton,
    DeleteDeckButton,
    DeleteQuizButton,
    DeleteAudioButton,
    ActionPill
} from './DashboardActions'
import DashboardTabs from './DashboardTabs'

// ── Typen ──────────────────────────────────────────────────────────────────────

type DocRow = {
    id: string; title: string; type: string; created_at: string
    subject: string | null; subject_name: string | null; topic_name: string | null; context_info: string | null
    flashcard_decks: { id: string; card_count: number; created_at: string }[]
    audio_summaries: { id: string; created_at: string }[]
    quizzes: { id: string; question_count: number; created_at: string }[]
}

// ── Hilfsfunktionen ────────────────────────────────────────────────────────────

const SUBJECT_PALETTES: Record<string, { tab: string; accent: string; topicBadge: string }> = {
    Geografie: { tab: 'border-green-500 text-green-300', accent: 'border-l-green-500', topicBadge: 'bg-green-500/10 text-green-300 border-green-500/20' },
    Mathematik: { tab: 'border-blue-500 text-blue-300', accent: 'border-l-blue-500', topicBadge: 'bg-blue-500/10 text-blue-300 border-blue-500/20' },
    Biologie: { tab: 'border-emerald-500 text-emerald-300', accent: 'border-l-emerald-500', topicBadge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' },
    Geschichte: { tab: 'border-amber-500 text-amber-300', accent: 'border-l-amber-500', topicBadge: 'bg-amber-500/10 text-amber-300 border-amber-500/20' },
    Physik: { tab: 'border-cyan-500 text-cyan-300', accent: 'border-l-cyan-500', topicBadge: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20' },
    Chemie: { tab: 'border-purple-500 text-purple-300', accent: 'border-l-purple-500', topicBadge: 'bg-purple-500/10 text-purple-300 border-purple-500/20' },
    Deutsch: { tab: 'border-red-500 text-red-300', accent: 'border-l-red-500', topicBadge: 'bg-red-500/10 text-red-300 border-red-500/20' },
    Englisch: { tab: 'border-indigo-500 text-indigo-300', accent: 'border-l-indigo-500', topicBadge: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' },
    'Natur und Technik': { tab: 'border-teal-500 text-teal-300', accent: 'border-l-teal-500', topicBadge: 'bg-teal-500/10 text-teal-300 border-teal-500/20' },
    Musik: { tab: 'border-pink-500 text-pink-300', accent: 'border-l-pink-500', topicBadge: 'bg-pink-500/10 text-pink-300 border-pink-500/20' },
    Kunst: { tab: 'border-rose-500 text-rose-300', accent: 'border-l-rose-500', topicBadge: 'bg-rose-500/10 text-rose-300 border-rose-500/20' },
    Sonstiges: { tab: 'border-slate-500 text-slate-300', accent: 'border-l-slate-500', topicBadge: 'bg-slate-500/10 text-slate-300 border-slate-500/20' },
}
const DEFAULT_PALETTE = { tab: 'border-[#9333EA] text-purple-300', accent: 'border-l-[#9333EA]', topicBadge: 'bg-[#9333EA]/10 text-purple-300 border-[#9333EA]/20' }
const TYPE_ICONS: Record<string, React.ReactNode> = {
    PDF: <FileText className="w-4 h-4 text-red-400" />,
    IMAGE: <ImageIcon className="w-4 h-4 text-blue-400" />,
    WORD: <FileCode className="w-4 h-4 text-sky-400" />,
    PRESENTATION: <FileCode className="w-4 h-4 text-orange-400" />,
    COLLECTION: <Folders className="w-4 h-4 text-[#9333EA]" />,
}
function palette(s: string) { return SUBJECT_PALETTES[s] ?? DEFAULT_PALETTE }
function getSubject(d: DocRow) { return d.subject_name ?? d.subject ?? 'Sonstiges' }
function getTopic(d: DocRow) { return d.topic_name ?? 'Allgemein' }

// ── Seite ──────────────────────────────────────────────────────────────────────

export default async function DashboardPage({
    searchParams,
}: { searchParams: Promise<{ fach?: string }> }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { fach: activeTab } = await searchParams

    const { data: rawDocs } = await supabase
        .from('documents')
        .select(`
            id, title, type, created_at, subject, subject_name, topic_name, context_info,
            flashcard_decks(id, card_count, created_at),
            audio_summaries(id, created_at),
            quizzes(id, question_count, created_at)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    const allDocs = (rawDocs ?? []) as unknown as DocRow[]
    const subjects = Array.from(new Set(allDocs.map(getSubject))).sort()
    const currentSubject = activeTab ?? subjects[0] ?? '__alle__'
    const filteredDocs = currentSubject === '__alle__' ? allDocs : allDocs.filter(d => getSubject(d) === currentSubject)

    const greeting = (user.email ?? '').split('@')[0]
    const col = palette(currentSubject)
    const decks = filteredDocs.flatMap(d => d.flashcard_decks.map(dk => ({ ...dk, doc: d })))
    const audios = filteredDocs.flatMap(d => d.audio_summaries.map(a => ({ ...a, doc: d })))
    const quizzes = filteredDocs.flatMap(d => d.quizzes.map(q => ({ ...q, doc: d })))

    return (
        <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                    <p className="text-[#9333EA] text-sm font-semibold uppercase tracking-widest mb-1">Dashboard</p>
                    <h1 className="text-4xl font-extrabold text-white">
                        Hallo, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9333EA] to-[#c084fc]">{greeting}</span>! 👋
                    </h1>
                </div>
                <Link href="/upload" className="flex items-center gap-2 bg-[#9333EA] hover:bg-[#a855f7] text-white px-5 py-3 rounded-full text-sm font-bold transition-all hover:shadow-[0_0_20px_rgba(147,51,234,0.4)] self-start sm:self-auto">
                    <Upload className="w-4 h-4" /> Hochladen
                </Link>
            </div>

            <DashboardTabs
                allDocs={allDocs}
                filteredDocs={filteredDocs}
                subjects={subjects}
                currentSubject={currentSubject}
                greeting={greeting}
                SUBJECT_PALETTES={SUBJECT_PALETTES}
            />
        </div>
    )
}

// Keine weiteren Subkomponenten hier
