'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
    FileText, Image as ImageIcon, FileCode,
    Headphones, Layers, Zap, ChevronRight, Folders, Trash2
} from 'lucide-react'
import { TopicLabel, DeleteDocumentButton, ActionPill } from './DashboardActions'
import { deleteMultipleDocuments } from './manage-actions'
import { formatDate } from '@/utils/format'

const TYPE_ICONS: Record<string, React.ReactNode> = {
    PDF: <FileText className="w-4 h-4 text-red-400" />,
    IMAGE: <ImageIcon className="w-4 h-4 text-blue-400" />,
    WORD: <FileCode className="w-4 h-4 text-sky-400" />,
    PRESENTATION: <FileCode className="w-4 h-4 text-orange-400" />,
    COLLECTION: <Folders className="w-4 h-4 text-[#9333EA]" />,
}

// Typdefinition analog zu Dashboard
type DocRow = any

interface Props {
    filteredDocs: DocRow[]
    currentSubject: string
    col: { tab: string; accent: string; topicBadge: string }
}

export default function DocumentListClient({ filteredDocs, currentSubject, col }: Props) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [isDeleting, startTransition] = useTransition()

    function toggleSelect(id: string) {
        const next = new Set(selectedIds)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        setSelectedIds(next)
    }

    function toggleAll() {
        if (selectedIds.size === filteredDocs.length) setSelectedIds(new Set())
        else setSelectedIds(new Set(filteredDocs.map(d => d.id)))
    }

    function handleDeleteSelected() {
        if (selectedIds.size === 0) return
        if (confirm(`Möchtest du wirklich die ${selectedIds.size} ausgewählten Dokumente (inklusive Lernkarten, Audios und Quizze) dauerhaft löschen?`)) {
            startTransition(async () => {
                const { error } = await deleteMultipleDocuments(Array.from(selectedIds))
                if (error) {
                    alert('Fehler beim Löschen: ' + error)
                } else {
                    setSelectedIds(new Set())
                }
            })
        }
    }

    if (filteredDocs.length === 0) return null

    return (
        <div className="space-y-2">
            {/* Toolbar für Mehrfachauswahl */}
            <div className="flex items-center justify-between px-2 mb-2 bg-white/[0.01] rounded-lg">
                <button onClick={toggleAll} className="text-white/40 hover:text-white/70 text-xs py-2 px-2 transition-colors">
                    {selectedIds.size === filteredDocs.length ? 'Alle abwählen' : 'Alle auswählen'}
                </button>
                {selectedIds.size > 0 && (
                    <button
                        disabled={isDeleting}
                        onClick={handleDeleteSelected}
                        className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        {isDeleting ? 'Lösche...' : `${selectedIds.size} löschen`}
                    </button>
                )}
            </div>

            {/* Dokumentenliste */}
            {filteredDocs.map(doc => {
                const deck = doc.flashcard_decks?.[0] ?? null
                const audio = doc.audio_summaries?.[0] ?? null
                const quiz = doc.quizzes?.[0] ?? null
                const topicName = doc.topic_name ?? 'Allgemein'
                const isSelected = selectedIds.has(doc.id)

                return (
                    <div key={doc.id} className={`flex flex-col lg:flex-row lg:items-center gap-3 border-l-2 ${col.accent} ${isSelected ? 'bg-white/[0.05]' : 'bg-white/[0.02]'} rounded-r-xl pl-4 pr-3 py-3 transition-colors`}>
                        {/* Checkbox & Textbereich gruppiert */}
                        <div className="flex items-start lg:items-center gap-3 flex-1 min-w-0">
                            {/* Checkbox */}
                            <div className="flex items-center mt-0.5 lg:mt-0 shrink-0">
                                <div
                                    onClick={() => toggleSelect(doc.id)}
                                    className={`w-5 h-5 rounded flex items-center justify-center cursor-pointer border transition-colors ${isSelected ? 'bg-[#9333EA] border-[#9333EA]' : 'border-white/20 bg-white/5 hover:border-white/40'}`}
                                >
                                    {isSelected && (
                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                                <div className="flex items-start gap-2.5 min-w-0">
                                    <div className="shrink-0 mt-0.5">{TYPE_ICONS[doc.type] ?? <FileCode className="w-4 h-4 text-white/30" />}</div>
                                    <div className="flex-1 min-w-0">
                                        <Link href={`/learn/${doc.id}`} className="text-white/90 hover:text-white text-sm font-semibold truncate transition-colors group flex items-center gap-1.5">
                                            <span className="truncate">{doc.title}</span>
                                            <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-50 shrink-0 hidden sm:block" />
                                        </Link>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-1.5">
                                            <span className="text-white/30 text-[10px] uppercase tracking-wider tabular-nums shrink-0 whitespace-nowrap bg-white/5 px-1.5 py-0.5 rounded">
                                                {formatDate(doc.created_at)}
                                            </span>
                                            {doc.context_info && (
                                                <span className="text-white/40 text-[10px] truncate leading-tight max-w-[150px] sm:max-w-[250px]">{doc.context_info}</span>
                                            )}
                                            <div className="flex shrink-0 ml-auto sm:ml-0">
                                                <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full flex items-center uppercase tracking-tighter ${col.topicBadge}`}>
                                                    <TopicLabel subjectName={currentSubject} topicName={topicName} />
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions (auf Mobile eingerückt, auf Desktop rechts bündig) */}
                        <div className="flex items-center gap-1.5 shrink-0 flex-wrap lg:flex-nowrap pl-8 lg:pl-0 mt-1 lg:mt-0">
                            <ActionPill documentId={doc.id} mode="flashcards" href={deck ? `/deck/${deck.id}` : `/learn/${doc.id}`} active={!!deck} icon={<Layers className="w-3 h-3" />} label={deck ? `${deck.card_count} Karten` : 'Lernkarten'} color="purple" />
                            <ActionPill documentId={doc.id} mode="quiz" href={quiz ? `/quiz/${quiz.id}` : `/learn/${doc.id}`} active={!!quiz} icon={<Zap className="w-3 h-3" />} label={quiz ? `${quiz.question_count} Fragen` : 'Quiz'} color="amber" />
                            <ActionPill documentId={doc.id} mode="audio" href={audio ? `/audio/${audio.id}` : `/learn/${doc.id}`} active={!!audio} icon={<Headphones className="w-3 h-3" />} label={audio ? 'Podcast' : 'Audio'} color="blue" />
                            <div className="ml-auto lg:ml-0">
                                <DeleteDocumentButton documentId={doc.id} title={doc.title} />
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
