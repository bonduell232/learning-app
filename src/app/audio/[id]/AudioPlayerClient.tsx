'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { Play, Pause, ChevronLeft, SkipBack, Volume2, Gauge } from 'lucide-react'

interface Props {
    script: string
    title: string
    audioUrl: string | null
}

const SPEEDS = [0.75, 1, 1.25, 1.5]

function splitSentences(text: string): string[] {
    return text.match(/[^.!?]+[.!?]+/g)?.map(s => s.trim()).filter(Boolean) ?? [text]
}

// ── HTML5-basierter Player (wenn audioUrl vorhanden) ──────────────────────────

function RealAudioPlayer({ audioUrl, title, script }: { audioUrl: string; title: string; script: string }) {
    const audioRef = useRef<HTMLAudioElement>(null)
    const [playing, setPlaying] = useState(false)
    const [progress, setProgress] = useState(0)
    const [duration, setDuration] = useState(0)
    const [speed, setSpeed] = useState(1)
    const [currentSentence, setCurrentSentence] = useState(0)
    const sentences = splitSentences(script)

    function fmt(s: number) {
        const m = Math.floor(s / 60)
        const sec = Math.floor(s % 60).toString().padStart(2, '0')
        return `${m}:${sec}`
    }

    function togglePlay() {
        if (!audioRef.current) return
        if (playing) { audioRef.current.pause() }
        else { audioRef.current.play() }
    }

    function restart() {
        if (!audioRef.current) return
        audioRef.current.currentTime = 0
        audioRef.current.play()
    }

    function seek(e: React.ChangeEvent<HTMLInputElement>) {
        if (!audioRef.current) return
        audioRef.current.currentTime = parseFloat(e.target.value)
    }

    function changeSpeed(s: number) {
        setSpeed(s)
        if (audioRef.current) audioRef.current.playbackRate = s
    }

    useEffect(() => {
        const el = audioRef.current
        if (!el) return
        const onPlay = () => setPlaying(true)
        const onPause = () => setPlaying(false)
        const onTime = () => {
            setProgress(el.currentTime)
            // Satz-Highlighting (grobe Annäherung via Zeitanteil)
            const pct = el.duration ? el.currentTime / el.duration : 0
            setCurrentSentence(Math.min(Math.floor(pct * sentences.length), sentences.length - 1))
        }
        const onLoad = () => setDuration(el.duration)
        el.addEventListener('play', onPlay)
        el.addEventListener('pause', onPause)
        el.addEventListener('timeupdate', onTime)
        el.addEventListener('loadedmetadata', onLoad)
        return () => {
            el.removeEventListener('play', onPlay)
            el.removeEventListener('pause', onPause)
            el.removeEventListener('timeupdate', onTime)
            el.removeEventListener('loadedmetadata', onLoad)
        }
    }, [sentences.length])

    const pct = duration > 0 ? (progress / duration) * 100 : 0

    return (
        <div className="min-h-screen bg-[#060406] flex flex-col px-4 py-8">
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/8 blur-[130px] rounded-full pointer-events-none" />
            <audio ref={audioRef} src={audioUrl} preload="metadata" />

            <div className="relative z-10 max-w-2xl mx-auto w-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <Link href="/dashboard" className="flex items-center gap-2 text-white/40 hover:text-white/70 text-sm transition-colors">
                        <ChevronLeft className="w-4 h-4" /> Dashboard
                    </Link>
                    <div className="flex items-center gap-2 text-white/60 text-sm">
                        <Volume2 className="w-4 h-4" />
                        <span>KI-Lernpodcast</span>
                    </div>
                </div>

                {/* Titel */}
                <div className="mb-8">
                    <p className="text-blue-400 text-xs font-semibold uppercase tracking-widest mb-2">🎧 Podcast</p>
                    <h1 className="text-2xl font-extrabold text-white">{title}</h1>
                </div>

                {/* Play-Button */}
                <div className="flex justify-center mb-8">
                    <button
                        onClick={togglePlay}
                        className={`w-28 h-28 rounded-full flex items-center justify-center border-4 transition-all duration-300
                            ${playing
                                ? 'bg-blue-500/20 border-blue-400/60 shadow-[0_0_40px_rgba(59,130,246,0.4)] animate-pulse'
                                : 'bg-white/5 border-white/20 hover:border-blue-400/40 hover:bg-blue-500/10'}`}
                    >
                        {playing
                            ? <Pause className="w-10 h-10 text-white" />
                            : <Play className="w-10 h-10 text-white ml-1" />}
                    </button>
                </div>

                {/* Seek-Bar */}
                <div className="mb-8">
                    <input
                        type="range" min={0} max={duration || 100} step={0.1} value={progress}
                        onChange={seek}
                        className="w-full h-1.5 rounded-full accent-blue-500 cursor-pointer mb-2"
                    />
                    <div className="flex justify-between text-white/30 text-xs">
                        <span>{fmt(progress)}</span>
                        <span>{fmt(duration)}</span>
                    </div>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden mt-1">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-blue-300 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
                    </div>
                </div>

                {/* Aktueller Satz */}
                <div className="bg-white/[0.04] border border-white/10 rounded-3xl p-6 mb-6 min-h-20 flex items-center justify-center">
                    <p className={`text-center text-base leading-relaxed transition-all duration-300 ${playing ? 'text-white' : 'text-white/40'}`}>
                        {sentences[currentSentence] ?? ''}
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
                            <button key={s} onClick={() => changeSpeed(s)}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all
                                    ${speed === s ? 'bg-blue-500/30 text-blue-300 border border-blue-500/40' : 'text-white/40 hover:text-white/70 hover:bg-white/5'}`}>
                                {s}×
                            </button>
                        ))}
                    </div>
                </div>

                {/* Volltext */}
                <div className="mt-10 border-t border-white/10 pt-6">
                    <p className="text-white/30 text-xs uppercase tracking-wide mb-4">Vollständiger Text</p>
                    <div className="space-y-2">
                        {sentences.map((s, i) => (
                            <p key={i} className={`text-sm leading-relaxed transition-colors duration-300
                                ${i === currentSentence && playing ? 'text-white font-medium' : i < currentSentence ? 'text-white/30' : 'text-white/50'}`}>
                                {s}
                            </p>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

// ── Fallback: Browser TTS (wenn kein audioUrl) ────────────────────────────────

function BrowserTTSPlayer({ script, title }: { script: string; title: string }) {
    // Einfache Säuberung für die Browser-Stimme
    const cleanText = script
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/#/g, '')
        .replace(/ Lukas:/g, ' Lukas sagt:')
        .replace(/ Sarah:/g, ' Sarah sagt:')
        .trim();

    const sentences = splitSentences(cleanText)
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentIdx, setCurrentIdx] = useState(0)
    const [speed, setSpeed] = useState(1)
    const [finished, setFinished] = useState(false)
    const utterRef = useRef<SpeechSynthesisUtterance | null>(null)

    function speak(idx: number, spd: number) {
        if (idx >= sentences.length) { setIsPlaying(false); setFinished(true); return }
        window.speechSynthesis.cancel()
        const utter = new SpeechSynthesisUtterance(sentences[idx])
        
        // Sprache erkennen (Grobe Heuristik für Englisch)
        const englishWords = ['the', 'and', 'is', 'you', 'that', 'it', 'he', 'for', 'was', 'on', 'are', 'as', 'with', 'his', 'they', 'at', 'be', 'this', 'have', 'from']
        const wordCount = sentences[idx].toLowerCase().split(/\s+/).length
        const englishMatch = sentences[idx].toLowerCase().split(/\s+/).filter(w => englishWords.includes(w)).length
        
        utter.lang = (englishMatch / wordCount > 0.2) ? 'en-US' : 'de-DE'
        utter.rate = spd
        utter.onend = () => speak(idx + 1, spd)
        utterRef.current = utter
        setCurrentIdx(idx)
        window.speechSynthesis.speak(utter)
    }

    function togglePlay() {
        if (finished) { setFinished(false); setCurrentIdx(0); speak(0, speed); setIsPlaying(true); return }
        if (isPlaying) { window.speechSynthesis.cancel(); setIsPlaying(false) }
        else { speak(currentIdx, speed); setIsPlaying(true) }
    }

    useEffect(() => () => { window.speechSynthesis.cancel() }, [])
    const progress = finished ? 100 : (currentIdx / sentences.length) * 100

    return (
        <div className="min-h-screen bg-[#060406] flex flex-col px-4 py-8">
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/8 blur-[130px] rounded-full pointer-events-none" />
            <div className="relative z-10 max-w-2xl mx-auto w-full">
                <div className="flex items-center justify-between mb-8">
                    <Link href="/dashboard" className="flex items-center gap-2 text-white/40 hover:text-white/70 text-sm transition-colors">
                        <ChevronLeft className="w-4 h-4" /> Dashboard
                    </Link>
                    <span className="text-white/40 text-xs">Browser-Vorlesen</span>
                </div>
                <p className="text-blue-400 text-xs font-semibold uppercase tracking-widest mb-2">🎧 Podcast</p>
                <h1 className="text-2xl font-extrabold text-white mb-8">{title}</h1>
                <div className="flex justify-center mb-8">
                    <button onClick={togglePlay}
                        className={`w-28 h-28 rounded-full flex items-center justify-center border-4 transition-all duration-300
                            ${isPlaying ? 'bg-blue-500/20 border-blue-400/60 animate-pulse' : 'bg-white/5 border-white/20 hover:border-blue-400/40'}`}>
                        {isPlaying ? <Pause className="w-10 h-10 text-white" /> : <Play className="w-10 h-10 text-white ml-1" />}
                    </button>
                </div>
                <div className="mb-6">
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-blue-300 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                    </div>
                </div>
                <div className="bg-white/[0.04] border border-white/10 rounded-3xl p-6 min-h-20 flex items-center justify-center">
                    <p className={`text-center text-base leading-relaxed ${isPlaying ? 'text-white' : 'text-white/40'}`}>
                        {finished ? '🎉 Fertig!' : sentences[currentIdx] ?? ''}
                    </p>
                </div>
            </div>
        </div>
    )
}

// ── Haupt-Export ──────────────────────────────────────────────────────────────

export default function AudioPlayerClient({ script, title, audioUrl }: Props) {
    if (audioUrl) {
        return <RealAudioPlayer audioUrl={audioUrl} title={title} script={script} />
    }
    return <BrowserTTSPlayer script={script} title={title} />
}
