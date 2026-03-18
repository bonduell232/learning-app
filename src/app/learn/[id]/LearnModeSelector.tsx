'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { generateFlashcards } from '@/app/dashboard/actions'
import { generateAudio } from '@/app/audio/actions'
import { generateQuiz } from '@/app/quiz/actions'
import { Headphones, Layers, Zap, Loader2, ChevronLeft, Sparkles, ArrowRight, CheckCircle2, Lock } from 'lucide-react'
import Link from 'next/link'
import UpgradePrompt from '@/components/UpgradePrompt'

interface Props {
    documentId: string
    documentTitle: string
    documentType: string
    existingDeckId: string | null
    existingDeckCount: number | null
    existingAudioId: string | null
    existingQuizId: string | null
    existingQuizCount: number | null
    /** Ob User das Limit für das jeweilige Feature bereits erreicht hat */
    flashcardsLocked?: boolean
    audioLocked?: boolean
    quizLocked?: boolean
}

type Mode = 'podcast' | 'flashcards' | 'quiz'

const MESSAGES = [
    'KI liest dein Dokument...',
    'Lerninhalte werden analysiert...',
    'Fast fertig...',
]

export default function LearnModeSelector({
    documentId, documentTitle, documentType,
    existingDeckId, existingDeckCount,
    existingAudioId, existingQuizId, existingQuizCount,
}: Props) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [activeMode, setActiveMode] = useState<Mode | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isLimitReached, setIsLimitReached] = useState(false)
    const [limitFeature, setLimitFeature] = useState<'flashcards' | 'audio' | 'quiz' | undefined>()
    const [msgIdx, setMsgIdx] = useState(0)

    function startLoading(mode: Mode) {
        setActiveMode(mode)
        setError(null)
        setIsLimitReached(false)
        const iv = setInterval(() => setMsgIdx(i => (i + 1) % MESSAGES.length), 2500)
        startTransition(async () => {
            let result: { error?: string; deckId?: string; audioId?: string; quizId?: string } = {}
            if (mode === 'podcast') {
                result = await generateAudio(documentId)
                if (!result.error) router.push(`/audio/${result.audioId}`)
            } else if (mode === 'flashcards') {
                result = await generateFlashcards(documentId)
                if (!result.error) router.push(`/deck/${result.deckId}`)
            } else {
                result = await generateQuiz(documentId)
                if (!result.error) router.push(`/quiz/${result.quizId}`)
            }
            clearInterval(iv)
            if (result.error === 'LIMIT_REACHED') {
                setIsLimitReached(true)
                setLimitFeature(mode === 'podcast' ? 'audio' : mode)
                setActiveMode(null)
            } else if (result.error) {
                setError(result.error)
                setActiveMode(null)
            }
        })
    }

    const modes = [
        {
            id: 'podcast' as Mode,
            icon: <Headphones className="w-8 h-8" />,
            title: '🎧 Lernpodcast',
            desc: 'Lass dir die wichtigsten Inhalte zusammenfassen und vorlesen. Ideal, um nebenbei oder auf dem Schulweg zu lernen.',
            color: 'from-blue-500/20 to-blue-600/10',
            border: 'border-blue-500/30 hover:border-blue-400/60',
            glow: 'hover:shadow-[0_0_30px_rgba(59,130,246,0.2)]',
            existingId: existingAudioId,
            existingHref: existingAudioId ? `/audio/${existingAudioId}` : null,
            existingLabel: 'Podcast abspielen',
        },
        {
            id: 'flashcards' as Mode,
            icon: <Layers className="w-8 h-8" />,
            title: '🃏 Lernkarten',
            desc: `Die beste Methode, um Vokabeln und Fakten auswendig zu lernen. Wir erstellen dir automatisch Karteikarten aus deinem Text.`,
            color: 'from-purple-500/20 to-purple-600/10',
            border: 'border-purple-500/30 hover:border-purple-400/60',
            glow: 'hover:shadow-[0_0_30px_rgba(147,51,234,0.2)]',
            existingId: existingDeckId,
            existingHref: existingDeckId ? `/deck/${existingDeckId}` : null,
            existingLabel: `${existingDeckCount ?? ''} Karten üben`,
        },
        {
            id: 'quiz' as Mode,
            icon: <Zap className="w-8 h-8" />,
            title: '⚡ Wissensblitz',
            desc: 'Teste dein Wissen in einem schnellen Quiz. Beantworte Fragen zum Inhalt und knacke den Highscore!',
            color: 'from-amber-500/20 to-orange-600/10',
            border: 'border-amber-500/30 hover:border-amber-400/60',
            glow: 'hover:shadow-[0_0_30px_rgba(245,158,11,0.2)]',
            existingId: existingQuizId,
            existingHref: existingQuizId ? `/quiz/${existingQuizId}` : null,
            existingLabel: `${existingQuizCount ?? ''} Fragen spielen`,
        },
    ]

    return (
        <main className="min-h-screen bg-[#060406] flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#9333EA]/8 blur-[150px] rounded-full pointer-events-none" />

            <div className="relative z-10 w-full max-w-3xl">
                {/* Zurück */}
                <Link href="/dashboard" className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 text-sm mb-8 transition-colors">
                    <ChevronLeft className="w-4 h-4" /> Dashboard
                </Link>

                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#9333EA]/15 border border-[#9333EA]/30 mb-6">
                        <Sparkles className="w-4 h-4 text-[#9333EA]" />
                        <span className="text-sm font-medium text-[#c084fc]">Dokument bereit!</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3">
                        Wie möchtest du{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9333EA] to-[#c084fc]">
                            lernen?
                        </span>
                    </h1>
                    <p className="text-white/60 text-sm max-w-xl mx-auto leading-relaxed">
                        Super! <span className="text-white/80 font-bold">{documentTitle}</span> wurde erfolgreich vorbereitet.
                        Entscheide jetzt, wie du heute lernen möchtest – die KI erstellt alles passgenau für dich.
                    </p>
                </div>

                {/* Ladeoverlay */}
                {isPending && activeMode && (
                    <div className="fixed inset-0 z-50 bg-[#060406]/90 backdrop-blur-sm flex flex-col items-center justify-center gap-6">
                        <div className="relative w-20 h-20">
                            <div className="absolute inset-0 rounded-full border-4 border-[#9333EA]/20" />
                            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#9333EA] animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center text-3xl">
                                {activeMode === 'podcast' ? '🎧' : activeMode === 'flashcards' ? '🃏' : '⚡'}
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="text-white font-semibold text-lg mb-1">KI arbeitet...</p>
                            <p className="text-white/50 text-sm">{MESSAGES[msgIdx]}</p>
                        </div>
                    </div>
                )}

                {/* Fehler & Upgrade-Prompt */}
                {isLimitReached && (
                    <UpgradePrompt feature={limitFeature} />
                )}
                {error && !isLimitReached && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-2xl px-5 py-4 mb-6 text-sm text-red-400">
                        {error}
                    </div>
                )}

                {/* Modus-Karten */}
                <div className="grid md:grid-cols-3 gap-5">
                    {modes.map((mode, i) => (
                        <motion.div
                            key={mode.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1, duration: 0.4 }}
                        >
                            <div className={`relative flex flex-col h-full bg-gradient-to-b ${mode.color} border ${mode.border} ${mode.glow} rounded-3xl p-6 transition-all duration-300`}>
                                {/* Icon */}
                                <div className="text-white/80 mb-4">{mode.icon}</div>
                                <h2 className="text-white font-bold text-lg mb-2">{mode.title}</h2>
                                <p className="text-white/50 text-sm mb-6 flex-1">{mode.desc}</p>

                                {mode.existingHref ? (
                                    <Link
                                        href={mode.existingHref}
                                        className="flex items-center justify-center gap-2 w-full bg-white/10 hover:bg-white/15 text-white px-4 py-3 rounded-full text-sm font-semibold transition-all"
                                    >
                                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                                        {mode.existingLabel}
                                    </Link>
                                ) : (
                                    <button
                                        onClick={() => startLoading(mode.id)}
                                        disabled={isPending}
                                        className="flex items-center justify-center gap-2 w-full bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-3 rounded-full text-sm font-semibold transition-all"
                                    >
                                        {isPending && activeMode === mode.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <ArrowRight className="w-4 h-4" />
                                        )}
                                        Erstellen & starten
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </main>
    )
}
