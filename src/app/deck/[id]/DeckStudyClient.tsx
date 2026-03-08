'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, RotateCcw, CheckCircle2, ChevronLeft, Sparkles } from 'lucide-react'

interface Flashcard {
    id: string
    front: string
    back: string
    position: number
}

interface DeckStudyClientProps {
    cards: Flashcard[]
    title: string
    deckId: string
}

export default function DeckStudyClient({ cards, title, deckId }: DeckStudyClientProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isFlipped, setIsFlipped] = useState(false)
    const [isFinished, setIsFinished] = useState(false)
    const [direction, setDirection] = useState(1) // 1 = vorwärts, -1 = rückwärts

    const total = cards.length
    const current = cards[currentIndex]

    const goNext = useCallback(() => {
        if (currentIndex >= total - 1) {
            setIsFinished(true)
            return
        }
        setDirection(1)
        setIsFlipped(false)
        setTimeout(() => setCurrentIndex(i => i + 1), 150)
    }, [currentIndex, total])

    const goPrev = useCallback(() => {
        if (currentIndex === 0) return
        setDirection(-1)
        setIsFlipped(false)
        setTimeout(() => setCurrentIndex(i => i - 1), 150)
    }, [currentIndex])

    const restart = () => {
        setCurrentIndex(0)
        setIsFlipped(false)
        setIsFinished(false)
        setDirection(1)
    }

    // Tastatursteuerung
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setIsFlipped(f => !f) }
            if (e.key === 'ArrowRight') goNext()
            if (e.key === 'ArrowLeft') goPrev()
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [goNext, goPrev])

    if (isFinished) {
        return (
            <div className="min-h-screen bg-[#060406] flex items-center justify-center px-4">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#9333EA]/10 blur-[120px] rounded-full pointer-events-none" />
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative z-10 text-center max-w-sm"
                >
                    <div className="text-7xl mb-6">🎉</div>
                    <h2 className="text-3xl font-extrabold text-white mb-3">Super gemacht!</h2>
                    <p className="text-white/50 mb-8">
                        Du hast alle <span className="text-[#9333EA] font-semibold">{total} Karteikarten</span> durchgegangen.
                    </p>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={restart}
                            className="flex items-center justify-center gap-2 bg-[#9333EA] hover:bg-[#a855f7] text-white px-6 py-3.5 rounded-full font-bold transition-all hover:shadow-[0_0_25px_rgba(147,51,234,0.45)]"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Nochmal üben
                        </button>
                        <Link
                            href="/dashboard"
                            className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white px-6 py-3.5 rounded-full font-medium transition-all"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Zum Dashboard
                        </Link>
                    </div>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#060406] flex flex-col px-4 py-8">
            {/* Hintergrund-Glow */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#9333EA]/10 blur-[150px] rounded-full pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 max-w-2xl mx-auto w-full mb-8 flex items-center justify-between">
                <Link href="/dashboard" className="flex items-center gap-2 text-white/40 hover:text-white/80 text-sm transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                    Dashboard
                </Link>
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-[#9333EA] rounded-lg flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-white font-semibold text-sm truncate max-w-[200px]">{title}</span>
                </div>
                <div className="text-white/40 text-sm font-medium">
                    {currentIndex + 1} / {total}
                </div>
            </div>

            {/* Fortschrittsbalken */}
            <div className="relative z-10 max-w-2xl mx-auto w-full mb-10">
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-[#9333EA] to-[#c084fc] rounded-full"
                        animate={{ width: `${((currentIndex + 1) / total) * 100}%` }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                    />
                </div>
            </div>

            {/* Karten-Bereich */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full">
                <p className="text-white/40 text-sm mb-6">
                    {isFlipped ? '✏️ Antwort' : '❓ Frage'} — Leertaste oder Klick zum Umdrehen
                </p>

                {/* 3D-Flip-Karte */}
                <div
                    className="w-full cursor-pointer"
                    style={{ perspective: '1200px' }}
                    onClick={() => setIsFlipped(f => !f)}
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={`${currentIndex}-${isFlipped}`}
                            initial={{ rotateY: isFlipped ? -90 : 90, opacity: 0 }}
                            animate={{ rotateY: 0, opacity: 1 }}
                            exit={{ rotateY: isFlipped ? 90 : -90, opacity: 0 }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                            className={`w-full min-h-64 rounded-3xl border flex items-center justify-center p-10 text-center select-none
                ${isFlipped
                                    ? 'bg-[#9333EA]/10 border-[#9333EA]/30'
                                    : 'bg-white/[0.04] border-white/10'
                                }`}
                        >
                            <p className={`text-2xl font-semibold leading-relaxed ${isFlipped ? 'text-white' : 'text-white/90'}`}>
                                {isFlipped ? current?.back : current?.front}
                            </p>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Navigation */}
                <div className="flex items-center gap-4 mt-8">
                    <button
                        onClick={goPrev}
                        disabled={currentIndex === 0}
                        className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>

                    <button
                        onClick={() => setIsFlipped(f => !f)}
                        className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white px-6 py-3 rounded-full text-sm font-medium transition-all"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Umdrehen
                    </button>

                    <button
                        onClick={goNext}
                        className="w-12 h-12 rounded-full bg-[#9333EA] hover:bg-[#a855f7] flex items-center justify-center text-white transition-all hover:shadow-[0_0_20px_rgba(147,51,234,0.4)]"
                    >
                        {currentIndex >= total - 1
                            ? <CheckCircle2 className="w-5 h-5" />
                            : <ArrowRight className="w-5 h-5" />
                        }
                    </button>
                </div>
            </div>
        </div>
    )
}
