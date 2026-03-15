'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
    FileText, Layers, Zap, Headphones, Plus, Folders, BookOpen, ChevronRight, Tag
} from 'lucide-react'
import DocumentListClient from './DocumentListClient'
import { SubjectTabLabel, TopicLabel, DeleteDeckButton, DeleteQuizButton, DeleteAudioButton } from './DashboardActions'

type DocRow = any // Entspricht dem in page.tsx

type Props = {
    allDocs: DocRow[]
    filteredDocs: DocRow[]
    subjects: string[]
    currentSubject: string
    greeting: string
    SUBJECT_PALETTES: any
}

function ContentRow({ href, topic, subtitle, badge, badgeColor, deleteButton }: {
    href: string; topic: string; subtitle: string; badge?: string
    badgeColor: 'purple' | 'amber' | 'blue'; deleteButton?: React.ReactNode
}) {
    const badgeStyles = {
        purple: 'bg-purple-500/10 border-purple-500/20 text-purple-300',
        amber: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
        blue: 'bg-blue-500/10 border-blue-500/20 text-blue-300',
    }
    return (
        <div className="flex items-center gap-2">
            <Link href={href} className="flex items-center justify-between flex-1 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] rounded-2xl px-5 py-3.5 transition-all group min-w-0">
                <div className="flex items-center gap-3 min-w-0">
                    <Tag className="w-3.5 h-3.5 text-white/30 shrink-0" />
                    <div className="min-w-0">
                        <p className="text-white text-sm font-semibold">{topic}</p>
                        <p className="text-white/30 text-xs truncate max-w-xs">{subtitle}</p>
                    </div>
                </div>
                {badge && <span className={`shrink-0 border text-xs px-2.5 py-1 rounded-full ml-3 ${badgeStyles[badgeColor]}`}>{badge}</span>}
            </Link>
            {deleteButton}
        </div>
    )
}

function EmptySection({ label }: { label: string }) {
    return <p className="text-white/25 text-sm text-center py-4">{label}</p>
}

function Section({ icon, title, count, actionHref, actionLabel, children }: {
    icon: React.ReactNode; title: string; count: number
    actionHref?: string; actionLabel?: string
    children: React.ReactNode
}) {
    return (
        <section className="bg-white/[0.02] border border-white/5 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">{icon}</div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        {title}
                        <span className="bg-white/10 text-white/50 text-xs py-0.5 px-2.5 rounded-full font-medium">{count}</span>
                    </h2>
                </div>
                {actionHref && actionLabel && (
                    <Link href={actionHref} className="text-[#9333EA] hover:text-[#c084fc] text-sm font-semibold flex items-center gap-1 transition-colors">
                        <Plus className="w-4 h-4" /> {actionLabel}
                    </Link>
                )}
            </div>
            {children}
        </section>
    )
}

function getTopic(d: DocRow) { return d.topic_name ?? 'Allgemein' }

export default function DashboardTabs({ allDocs, filteredDocs, subjects, currentSubject, greeting, SUBJECT_PALETTES }: Props) {
    const [activeTab, setActiveTab] = useState<'material' | 'learn'>('learn')

    const DEFAULT_PALETTE = { tab: 'border-[#9333EA] text-purple-300', accent: 'border-l-[#9333EA]', topicBadge: 'bg-[#9333EA]/10 text-purple-300 border-[#9333EA]/20' }
    const col = SUBJECT_PALETTES[currentSubject] ?? DEFAULT_PALETTE

    const decks = filteredDocs.flatMap(d => d.flashcard_decks.map((dk: any) => ({ ...dk, doc: d })))
    const audios = filteredDocs.flatMap(d => d.audio_summaries.map((a: any) => ({ ...a, doc: d })))
    const quizzes = filteredDocs.flatMap(d => d.quizzes.map((q: any) => ({ ...q, doc: d })))

    return (
        <>
            {/* Top-Level Tabs (Material vs Lernraum) */}
            <div className="flex flex-col sm:flex-row gap-2 p-1 bg-white/[0.02] border border-white/10 rounded-3xl sm:rounded-full w-full sm:w-max mx-auto mb-6 sm:mb-10">
                <button
                    onClick={() => setActiveTab('material')}
                    className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === 'material' ? 'bg-[#9333EA] text-white shadow-[0_0_15px_rgba(147,51,234,0.3)]' : 'text-white/40 hover:text-white/80'}`}
                >
                    <Folders className="w-4 h-4" /> Material & Quellen
                </button>
                <button
                    onClick={() => setActiveTab('learn')}
                    className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === 'learn' ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'text-white/40 hover:text-white/80'}`}
                >
                    <BookOpen className="w-4 h-4" /> Mein Lernraum
                </button>
            </div>

            {/* Fach-Tabs (nur relevant für Material im Detail, oder Lernraum) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-4 mb-8 scrollbar-none flex-wrap">
                {subjects.map(subj => {
                    const isActive = currentSubject === subj
                    const p = SUBJECT_PALETTES[subj] ?? DEFAULT_PALETTE
                    return (
                        <div key={subj} className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full border text-sm font-semibold transition-all
                            ${isActive ? `${p.tab} bg-white/[0.06]` : 'border-white/10 text-white/40 hover:text-white/70 hover:border-white/20'}`}>
                            <BookOpen className="w-3.5 h-3.5 shrink-0" />
                            {isActive
                                ? <SubjectTabLabel name={subj} />
                                : <Link href={`?fach=${encodeURIComponent(subj)}`}>{subj}</Link>
                            }
                        </div>
                    )
                })}
                {subjects.length === 0 && <span className="text-white/30 text-sm">Noch keine Fächer vorhanden – starte mit einem Upload!</span>}
            </div>

            {/* TAB-INHALTE */}
            {activeTab === 'material' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <Section icon={<FileText className="w-4 h-4 text-[#9333EA]" />} title="Dateiablage" count={filteredDocs.length} actionHref="/upload" actionLabel="Hochladen">
                        {filteredDocs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 border border-dashed border-white/10 rounded-2xl">
                                <Folders className="w-10 h-10 text-white/20 mb-4" />
                                <p className="text-white/40 text-sm">Noch kein Material in diesem Fach vorhanden.</p>
                            </div>
                        ) : (
                            <DocumentListClient
                                filteredDocs={filteredDocs}
                                currentSubject={currentSubject}
                                col={col}
                            />
                        )}
                    </Section>
                </div>
            )}

            {activeTab === 'learn' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {filteredDocs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/10 rounded-3xl">
                            <BookOpen className="w-10 h-10 text-white/20 mb-4" />
                            <p className="text-white/40 text-sm mb-4">Noch keine Dokumente zum Lernen für dieses Fach.</p>
                            <button onClick={() => setActiveTab('material')} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-full text-sm font-bold transition-all">
                                Material sichten
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* ══ 2. LERNKARTEN ═══════════════════════════════════════ */}
                            <Section icon={<Layers className="w-4 h-4 text-purple-400" />} title="Lernkarten" count={decks.length}>
                                {decks.length > 0 ? (
                                    <div className="space-y-2">
                                        {decks.map(dk => (
                                            <ContentRow
                                                key={dk.id} href={`/deck/${dk.id}`}
                                                topic={getTopic(dk.doc)} subtitle={dk.doc.context_info ? `${dk.doc.context_info} • ${dk.doc.title}` : dk.doc.title}
                                                badge={`${dk.card_count} Karten`} badgeColor="purple"
                                                deleteButton={<DeleteDeckButton deckId={dk.id} />}
                                            />
                                        ))}
                                    </div>
                                ) : <EmptySection label="Noch keine Lernkarten – generiere welche im 'Material'-Tab!" />}
                            </Section>

                            {/* ══ 3. QUIZ ═════════════════════════════════════════════ */}
                            <Section icon={<Zap className="w-4 h-4 text-amber-400" />} title="Quizze" count={quizzes.length}>
                                {quizzes.length > 0 ? (
                                    <div className="space-y-2">
                                        {quizzes.map(q => (
                                            <ContentRow
                                                key={q.id} href={`/quiz/${q.id}`}
                                                topic={getTopic(q.doc)} subtitle={q.doc.context_info ? `${q.doc.context_info} • ${q.doc.title}` : q.doc.title}
                                                badge={`${q.question_count} Fragen`} badgeColor="amber"
                                                deleteButton={<DeleteQuizButton quizId={q.id} />}
                                            />
                                        ))}
                                    </div>
                                ) : <EmptySection label="Noch kein Quiz – generiere eines im 'Material'-Tab!" />}
                            </Section>

                            {/* ══ 4. AUDIO ════════════════════════════════════════════ */}
                            <Section icon={<Headphones className="w-4 h-4 text-blue-400" />} title="Audio-Podcasts" count={audios.length}>
                                {audios.length > 0 ? (
                                    <div className="space-y-2">
                                        {audios.map(a => (
                                            <ContentRow
                                                key={a.id} href={`/audio/${a.id}`}
                                                topic={getTopic(a.doc)} subtitle={a.doc.context_info ? `${a.doc.context_info} • ${a.doc.title}` : a.doc.title}
                                                badgeColor="blue"
                                                deleteButton={<DeleteAudioButton audioId={a.id} />}
                                            />
                                        ))}
                                    </div>
                                ) : <EmptySection label="Noch kein Podcast – generiere einen im 'Material'-Tab!" />}
                            </Section>
                        </>
                    )}
                </div>
            )}
        </>
    )
}
