'use client'

import { Crown, Lock } from 'lucide-react'
import Link from 'next/link'

interface Props {
    /** Kontext: welches Feature ist gesperrt */
    feature?: 'upload' | 'flashcards' | 'audio' | 'quiz'
    /** Aktuelle / max. Nutzung anzeigen, z.B. "1 / 1" */
    current?: number
    max?: number
}

const LABELS: Record<string, string> = {
    upload: 'Weitere Uploads',
    flashcards: 'Weitere Lernkarten-Decks',
    audio: 'Weitere Audio-Zusammenfassungen',
    quiz: 'Weitere Quizze',
}

export default function UpgradePrompt({ feature, current, max }: Props) {
    const label = feature ? LABELS[feature] : 'Dieses Feature'

    return (
        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/25 rounded-2xl px-4 py-4 mt-2">
            <div className="w-8 h-8 bg-amber-500/20 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                <Lock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-amber-300 font-semibold text-sm">
                    {label} {max !== undefined && current !== undefined
                        ? `(${current}/${max} genutzt)`
                        : ''} – nur für Premium
                </p>
                <p className="text-amber-400/70 text-xs mt-0.5">
                    Im kostenlosen Plan ist jeweils 1 erlaubt.
                </p>
                <Link
                    href="/upgrade"
                    className="inline-flex items-center gap-1.5 mt-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold px-3 py-1.5 rounded-full transition-colors"
                >
                    <Crown className="w-3 h-3" /> Upgrade auf Premium
                </Link>
            </div>
        </div>
    )
}
