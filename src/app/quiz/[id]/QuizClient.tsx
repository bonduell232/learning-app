'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { ChevronLeft, Zap, Star, Trophy, RotateCcw, ArrowRight } from 'lucide-react'

interface Question { id: string; question: string; options: string[]; correct_index: number; explanation: string }
interface Quiz { id: string; title: string; question_count: number }

interface Props { quiz: Quiz; questions: Question[]; userId: string }

const TIMER_SECONDS = 20
const BASE_POINTS = 100
const TIME_BONUS = 50
const COMBO_LABELS: Record<number, string> = { 2: '🔥 Heiß!', 3: '⚡ Blitz-Modus!' }

export default function QuizClient({ quiz, questions, userId }: Props) {
    const [phase, setPhase] = useState<'playing' | 'result'>('playing')
    const [idx, setIdx] = useState(0)
    const [selected, setSelected] = useState<number | null>(null)
    const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS)
    const [score, setScore] = useState(0)
    const [combo, setCombo] = useState(0)
    const [maxCombo, setMaxCombo] = useState(0)
    const [answeredCorrect, setAnsweredCorrect] = useState(0)
    const [showExplanation, setShowExplanation] = useState(false)

    const current = questions[idx]
    const total = questions.length

    // Timer
    useEffect(() => {
        if (phase !== 'playing' || selected !== null) return
        if (timeLeft <= 0) { handleAnswer(-1); return }
        const t = setTimeout(() => setTimeLeft(s => s - 1), 1000)
        return () => clearTimeout(t)
    }, [timeLeft, selected, phase])

    const handleAnswer = useCallback((chosenIdx: number) => {
        if (selected !== null) return
        setSelected(chosenIdx)
        const isCorrect = chosenIdx === current.correct_index

        if (isCorrect) {
            const timePts = timeLeft >= 15 ? TIME_BONUS : 0
            const newCombo = combo + 1
            const multiplier = newCombo >= 3 ? 3 : newCombo >= 2 ? 2 : 1
            const gained = (BASE_POINTS + timePts) * multiplier
            setScore(s => s + gained)
            setCombo(newCombo)
            setMaxCombo(m => Math.max(m, newCombo))
            setAnsweredCorrect(c => c + 1)
        } else {
            setCombo(0)
        }
        setShowExplanation(true)
    }, [selected, current, combo, timeLeft])

    function nextQuestion() {
        if (idx + 1 >= total) {
            // Quiz speichern
            const supabase = createClient()
            const stars = answeredCorrect / total >= 0.8 ? 3 : answeredCorrect / total >= 0.5 ? 2 : 1
            supabase.from('quiz_results').insert({
                user_id: userId, quiz_id: quiz.id,
                score, max_score: total * (BASE_POINTS + TIME_BONUS) * 3,
                stars, longest_combo: maxCombo,
            })
            setPhase('result')
        } else {
            setIdx(i => i + 1)
            setSelected(null)
            setShowExplanation(false)
            setTimeLeft(TIMER_SECONDS)
        }
    }

    function restart() {
        setIdx(0); setSelected(null); setTimeLeft(TIMER_SECONDS)
        setScore(0); setCombo(0); setMaxCombo(0); setAnsweredCorrect(0)
        setShowExplanation(false); setPhase('playing')
    }

    // ── Ergebnisscreen ────────────────────────────────────────────────────────
    if (phase === 'result') {
        const pct = Math.round((answeredCorrect / total) * 100)
        const stars = pct >= 80 ? 3 : pct >= 50 ? 2 : 1
        const msg = pct >= 80 ? 'Fantastisch! Du hast den Stoff voll drauf! 🎉'
            : pct >= 50 ? 'Gut gemacht! Mit etwas Übung wird es noch besser. 💪'
                : 'Noch ein bisschen üben – du schaffst das! 📚'

        return (
            <div className="min-h-screen bg-[#060406] flex items-center justify-center px-4">
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/8 blur-[130px] rounded-full pointer-events-none" />
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 w-full max-w-md text-center">
                    <div className="text-6xl mb-6">
                        {stars === 3 ? '🏆' : stars === 2 ? '🥈' : '🥉'}
                    </div>
                    {/* Sterne */}
                    <div className="flex justify-center gap-3 mb-6">
                        {[1, 2, 3].map(s => (
                            <Star key={s} className={`w-10 h-10 ${s <= stars ? 'text-amber-400 fill-amber-400' : 'text-white/20'}`} />
                        ))}
                    </div>
                    <h2 className="text-3xl font-extrabold text-white mb-2">{pct}% richtig</h2>
                    <p className="text-white/50 mb-8">{msg}</p>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3 bg-white/[0.04] border border-white/10 rounded-2xl p-5 mb-8">
                        <div><p className="text-white/40 text-xs mb-1">Punkte</p><p className="text-white font-bold text-xl">{score.toLocaleString()}</p></div>
                        <div><p className="text-white/40 text-xs mb-1">Richtig</p><p className="text-white font-bold text-xl">{answeredCorrect}/{total}</p></div>
                        <div><p className="text-white/40 text-xs mb-1">Max-Kombo</p><p className="text-white font-bold text-xl">×{maxCombo}</p></div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button onClick={restart} className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-black px-6 py-3.5 rounded-full font-bold transition-all">
                            <RotateCcw className="w-4 h-4" /> Nochmal spielen
                        </button>
                        <Link href="/dashboard" className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white px-6 py-3.5 rounded-full font-medium transition-all">
                            <ChevronLeft className="w-4 h-4" /> Dashboard
                        </Link>
                    </div>
                </motion.div>
            </div>
        )
    }

    // ── Spielscreen ───────────────────────────────────────────────────────────
    const timerPct = (timeLeft / TIMER_SECONDS) * 100
    const timerColor = timerPct > 50 ? '#9333EA' : timerPct > 25 ? '#f59e0b' : '#ef4444'

    return (
        <div className="min-h-screen bg-[#060406] flex flex-col px-4 py-6">
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/6 blur-[130px] rounded-full pointer-events-none" />

            <div className="relative z-10 max-w-xl mx-auto w-full">
                {/* Topbar */}
                <div className="flex items-center justify-between mb-6">
                    <Link href="/dashboard" className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-sm transition-colors">
                        <ChevronLeft className="w-4 h-4" /> Abbrechen
                    </Link>
                    {/* Punkte + Kombo */}
                    <div className="flex items-center gap-3">
                        {combo >= 2 && (
                            <motion.div
                                key={combo}
                                initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                className="flex items-center gap-1.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 px-3 py-1 rounded-full text-xs font-bold"
                            >
                                <Zap className="w-3 h-3" />
                                {COMBO_LABELS[Math.min(combo, 3)] ?? `×${combo}`}
                            </motion.div>
                        )}
                        <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 text-white px-3 py-1 rounded-full text-sm font-bold">
                            <Trophy className="w-3.5 h-3.5 text-amber-400" />
                            {score.toLocaleString()}
                        </div>
                    </div>
                </div>

                {/* Fortschritt */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 rounded-full transition-all duration-500"
                            style={{ width: `${((idx + 1) / total) * 100}%` }} />
                    </div>
                    <span className="text-white/40 text-xs shrink-0">{idx + 1}/{total}</span>
                </div>

                {/* Timer-Ring */}
                <div className="flex justify-center mb-6">
                    <div className="relative w-16 h-16">
                        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                            <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
                            <circle cx="32" cy="32" r="28" fill="none" stroke={timerColor} strokeWidth="5"
                                strokeDasharray={`${2 * Math.PI * 28}`}
                                strokeDashoffset={`${2 * Math.PI * 28 * (1 - timerPct / 100)}`}
                                style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s' }} />
                        </svg>
                        <span className={`absolute inset-0 flex items-center justify-center text-xl font-bold ${timeLeft <= 5 ? 'text-red-400' : 'text-white'}`}>
                            {timeLeft}
                        </span>
                    </div>
                </div>

                {/* Frage */}
                <AnimatePresence mode="wait">
                    <motion.div key={idx} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                        transition={{ duration: 0.2 }}>
                        <div className="bg-white/[0.04] border border-white/10 rounded-3xl p-6 mb-6 text-center min-h-24 flex items-center justify-center">
                            <p className="text-white text-xl font-semibold leading-relaxed">{current.question}</p>
                        </div>

                        {/* Antwort-Optionen */}
                        <div className="grid grid-cols-1 gap-3">
                            {current.options.map((opt, i) => {
                                const isSelected = selected === i
                                const isCorrect = i === current.correct_index
                                const revealed = selected !== null

                                let cls = 'bg-white/[0.04] border-white/10 text-white/80 hover:bg-white/[0.08] hover:border-white/25'
                                if (revealed) {
                                    if (isCorrect) cls = 'bg-green-500/20 border-green-400/60 text-green-300'
                                    else if (isSelected) cls = 'bg-red-500/20 border-red-400/60 text-red-300'
                                    else cls = 'bg-white/[0.02] border-white/5 text-white/30'
                                }

                                return (
                                    <button key={i} onClick={() => handleAnswer(i)} disabled={revealed}
                                        className={`flex items-center gap-4 border rounded-2xl px-5 py-4 text-left transition-all duration-200 ${cls} disabled:cursor-default`}>
                                        <span className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 transition-colors
                      ${revealed && isCorrect ? 'bg-green-400 border-green-400 text-black' : revealed && isSelected ? 'bg-red-400 border-red-400 text-black' : 'border-white/20 text-white/40'}`}>
                                            {['A', 'B', 'C', 'D'][i]}
                                        </span>
                                        <span className="text-sm font-medium">{opt}</span>
                                    </button>
                                )
                            })}
                        </div>

                        {/* Erklärung + Weiter */}
                        {showExplanation && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-5 space-y-3">
                                <div className={`rounded-2xl px-5 py-4 text-sm border ${selected === current.correct_index ? 'bg-green-500/10 border-green-500/30 text-green-300' : 'bg-red-500/10 border-red-500/30 text-red-300'}`}>
                                    <span className="font-semibold">{selected === current.correct_index ? '✅ Richtig! ' : '❌ Falsch. '}</span>
                                    {current.explanation}
                                </div>
                                <button onClick={nextQuestion}
                                    className="w-full flex items-center justify-center gap-2 bg-[#9333EA] hover:bg-[#a855f7] text-white py-3.5 rounded-full font-bold transition-all hover:shadow-[0_0_20px_rgba(147,51,234,0.4)]">
                                    {idx + 1 >= total ? '🏁 Ergebnis anzeigen' : <>Weiter <ArrowRight className="w-4 h-4" /></>}
                                </button>
                            </motion.div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    )
}
