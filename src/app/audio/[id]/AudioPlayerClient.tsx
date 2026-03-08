'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Play, Pause, ChevronLeft, SkipBack, Volume2, Gauge } from 'lucide-react'

interface Props {
    script: string
    title: string
}

const SPEEDS = [0.75, 1, 1.25, 1.5]
const SPEED_LABELS: Record<number, string> = { 0.75: '0.75×', 1: '1×', 1.25: '1.25×', 1.5: '1.5×' }

function splitSentences(text: string): string[] {
    return text.match(/[^.!?]+[.!?]+/g)?.map(s => s.trim()).filter(Boolean) ?? [text]
}

export default function AudioPlayerClient({ script, title }: Props) {
    const sentences = splitSentences(script)
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentIdx, setCurrentIdx] = useState(0)
    const [speed, setSpeed] = useState(1)
    const [finished, setFinished] = useState(false)
    const utterRef = useRef<SpeechSynthesisUtterance | null>(null)

    const speak = useCallback((idx: number, spd: number) => {
        if (idx >= sentences.length) { setIsPlaying(false); setFinished(true); return }
        window.speechSynthesis.cancel()
        const utter = new SpeechSynthesisUtterance(sentences[idx])
        utter.lang = 'de-DE'
        utter.rate = spd
        utter.onend = () => speak(idx + 1, spd)
        utterRef.current = utter
        setCurrentIdx(idx)
        window.speechSynthesis.speak(utter)
    }, [sentences])

    function togglePlay() {
        if (finished) { setFinished(false); setCurrentIdx(0); speak(0, speed); setIsPlaying(true); return }
        if (isPlaying) {
            window.speechSynthesis.cancel()
            setIsPlaying(false)
        } else {
            speak(currentIdx, speed)
            setIsPlaying(true)
        }
    }

    function restart() {
        window.speechSynthesis.cancel()
        setCurrentIdx(0); setFinished(false); setIsPlaying(true)
        speak(0, speed)
    }

    function changeSpeed(s: number) {
        setSpeed(s)
        if (isPlaying) { window.speechSynthesis.cancel(); speak(currentIdx, s) }
    }

    useEffect(() => () => { window.speechSynthesis.cancel() }, [])

    const progress = finished ? 100 : (currentIdx / sentences.length) * 100

    return (
        <div className="min-h-screen bg-[#060406] flex flex-col px-4 py-8">
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/8 blur-[130px] rounded-full pointer-events-none" />

            <div className="relative z-10 max-w-2xl mx-auto w-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <Link href="/dashboard" className="flex items-center gap-2 text-white/40 hover:text-white/70 text-sm transition-colors">
                        <ChevronLeft className="w-4 h-4" /> Dashboard
                    </Link>
                    <div className="flex items-center gap-2 text-white/60 text-sm">
                        <Volume2 className="w-4 h-4" />
                        <span>Lernpodcast</span>
                    </div>
                </div>

                {/* Titel */}
                <div className="mb-8">
                    <p className="text-blue-400 text-xs font-semibold uppercase tracking-widest mb-2">🎧 Podcast</p>
                    <h1 className="text-2xl font-extrabold text-white">{title}</h1>
                </div>

                {/* Vinyl / Play-Bereich */}
                <div className="flex justify-center mb-10">
                    <button
                        onClick={togglePlay}
                        className={`w-32 h-32 rounded-full flex items-center justify-center border-4 transition-all duration-300
              ${isPlaying
                                ? 'bg-blue-500/20 border-blue-400/60 shadow-[0_0_40px_rgba(59,130,246,0.4)] animate-pulse'
                                : 'bg-white/5 border-white/20 hover:border-blue-400/40 hover:bg-blue-500/10'
                            }`}
                    >
                        {isPlaying
                            ? <Pause className="w-12 h-12 text-white" />
                            : <Play className="w-12 h-12 text-white ml-1" />
                        }
                    </button>
                </div>

                {/* Fortschritt */}
                <div className="mb-8">
                    <div className="flex justify-between text-white/30 text-xs mb-2">
                        <span>Satz {Math.min(currentIdx + 1, sentences.length)} von {sentences.length}</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-300 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Aktueller Satz (hervorgehoben) */}
                <div className="bg-white/[0.04] border border-white/10 rounded-3xl p-6 mb-8 min-h-24 flex items-center justify-center">
                    <p className={`text-center text-lg leading-relaxed transition-all duration-300 ${isPlaying ? 'text-white' : 'text-white/40'}`}>
                        {finished ? '🎉 Podcast fertig! Du hast alles gehört.' : sentences[currentIdx] ?? ''}
                    </p>
                </div>

                {/* Steuerung */}
                <div className="flex items-center justify-between">
                    <button onClick={restart} className="flex items-center gap-2 text-white/40 hover:text-white/70 text-sm transition-colors px-4 py-2 rounded-full hover:bg-white/5">
                        <SkipBack className="w-4 h-4" /> Neustart
                    </button>
                    <div className="flex items-center gap-2">
                        <Gauge className="w-4 h-4 text-white/40" />
                        {SPEEDS.map(s => (
                            <button
                                key={s}
                                onClick={() => changeSpeed(s)}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all
                  ${speed === s ? 'bg-blue-500/30 text-blue-300 border border-blue-500/40' : 'text-white/40 hover:text-white/70 hover:bg-white/5'}`}
                            >
                                {SPEED_LABELS[s]}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Volltext als Scrollbereich */}
                <div className="mt-10 border-t border-white/10 pt-6">
                    <p className="text-white/30 text-xs uppercase tracking-wide mb-4">Vollständiger Text</p>
                    <div className="space-y-2">
                        {sentences.map((s, i) => (
                            <p
                                key={i}
                                className={`text-sm leading-relaxed transition-colors duration-300 ${i === currentIdx && isPlaying ? 'text-white font-medium' : i < currentIdx ? 'text-white/30' : 'text-white/50'}`}
                            >
                                {s}
                            </p>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
