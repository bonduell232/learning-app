'use client'

/**
 * Client-Wrapper für alle interaktiven Dashboard-Aktionen:
 * - Löschen von Dateien, Decks, Quizzen, Audio
 * - Umbenennen von Fächern und Themen
 *
 * Wird vom Server Component (dashboard/page.tsx) eingebunden.
 */

import DeleteButton from '@/components/DeleteButton'
import RenameInline from '@/components/RenameInline'
import {
    deleteDocument,
    deleteFlashcardDeck,
    deleteQuiz,
    deleteAudio,
    renameSubject,
    renameTopic,
} from '@/app/dashboard/manage-actions'

// ── Fach-Tab mit Umbenennen ────────────────────────────────────────────────────

export function SubjectTabLabel({ name }: { name: string }) {
    return (
        <RenameInline
            value={name}
            onRename={(newName) => renameSubject(name, newName)}
            className="text-sm font-semibold"
        />
    )
}

// ── Thema-Label mit Umbenennen ─────────────────────────────────────────────────

export function TopicLabel({ subjectName, topicName }: { subjectName: string; topicName: string }) {
    return (
        <RenameInline
            value={topicName}
            onRename={(newName) => renameTopic(subjectName, topicName, newName)}
            className="text-white/60 text-sm font-semibold"
        />
    )
}

// ── Löschen: Dokument ──────────────────────────────────────────────────────────

export function DeleteDocumentButton({ documentId, title }: { documentId: string; title: string }) {
    return (
        <DeleteButton
            confirmText={`„${title}" und alle zugehörigen Lernkarten, Quizze und Audios löschen?`}
            onDelete={() => deleteDocument(documentId)}
        />
    )
}

// ── Löschen: Lernkarten-Deck ──────────────────────────────────────────────────

export function DeleteDeckButton({ deckId }: { deckId: string }) {
    return (
        <DeleteButton
            confirmText="Dieses Lernkarten-Deck löschen?"
            onDelete={() => deleteFlashcardDeck(deckId)}
        />
    )
}

// ── Löschen: Quiz ─────────────────────────────────────────────────────────────

export function DeleteQuizButton({ quizId }: { quizId: string }) {
    return (
        <DeleteButton
            confirmText="Dieses Quiz löschen?"
            onDelete={() => deleteQuiz(quizId)}
        />
    )
}

// ── LÖSCHEN: Audio ────────────────────────────────────────────────────────────

export function DeleteAudioButton({ audioId }: { audioId: string }) {
    return (
        <DeleteButton
            confirmText="Diesen Podcast löschen?"
            onDelete={() => deleteAudio(audioId)}
        />
    )
}

// ── GENERIERUNGS-PILLEN (Direkte Aktion statt Selector) ──────────────────────

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { generateFlashcards } from '@/app/dashboard/actions'
import { generateAudio } from '@/app/audio/actions'
import { generateQuiz } from '@/app/quiz/actions'

export function ActionPill({
    documentId,
    href,
    active,
    icon,
    label,
    color,
    mode
}: {
    documentId: string
    href: string
    active: boolean
    icon: React.ReactNode
    label: string
    color: 'purple' | 'amber' | 'blue'
    mode: 'flashcards' | 'quiz' | 'audio'
}) {
    const router = useRouter()
    const [showAudioOptions, setShowAudioOptions] = useState(false)
    const [isPending, startTransition] = useTransition()

    const s = {
        purple: active ? 'bg-purple-500/15 border-purple-500/30 text-purple-300 hover:border-purple-500/60' : 'bg-white/[0.03] border-white/10 text-white/30 hover:text-purple-300 hover:border-purple-500/30',
        amber: active ? 'bg-amber-500/15 border-amber-500/30 text-amber-300 hover:border-amber-500/60' : 'bg-white/[0.03] border-white/10 text-white/30 hover:text-amber-300 hover:border-amber-500/30',
        blue: active ? 'bg-blue-500/15 border-blue-500/30 text-blue-300 hover:border-blue-500/60' : 'bg-white/[0.03] border-white/10 text-white/30 hover:text-blue-300 hover:border-blue-500/30',
    }

    const handleGenerate = (audioMode: 'monologue' | 'conversation' = 'monologue') => {
        startTransition(async () => {
            let result: { error?: string; deckId?: string; audioId?: string; quizId?: string } = {}

            if (mode === 'flashcards') {
                result = await generateFlashcards(documentId)
                if (result.deckId) router.push(`/deck/${result.deckId}`)
            } else if (mode === 'audio') {
                result = await generateAudio(documentId, audioMode)
                if (result.audioId) router.push(`/audio/${result.audioId}`)
            } else if (mode === 'quiz') {
                result = await generateQuiz(documentId)
                if (result.quizId) router.push(`/quiz/${result.quizId}`)
            }

            if (result.error === 'LIMIT_REACHED') {
                alert('Limit erreicht! Bitte upgrade deinen Account.')
            } else if (result.error) {
                alert(result.error)
            }
        })
    }

    // Wenn schon vorhanden, dient es ganz normal als Link zum Deck/Quiz/Audio
    if (active) {
        return (
            <Link href={href} className={`flex items-center gap-1.5 border px-2.5 py-1.5 rounded-full text-xs font-medium transition-all ${s[color]}`}>
                {icon}{label}
            </Link>
        )
    }

    // Speziell für Audio: Auswahl zeigen
    if (mode === 'audio' && showAudioOptions && !isPending) {
        return (
            <div className="flex items-center gap-2 bg-white/[0.03] border border-white/10 rounded-full p-1 shadow-xl animate-in fade-in slide-in-from-left-2">
                <button
                    onClick={() => handleGenerate('monologue')}
                    className="px-3 py-1 rounded-full text-[10px] font-bold text-white/50 hover:text-white hover:bg-white/10 transition-all uppercase tracking-tight"
                >
                    Zusammenfassung
                </button>
                <div className="w-[1px] h-3 bg-white/10" />
                <button
                    onClick={() => handleGenerate('conversation')}
                    className="px-3 py-1 rounded-full text-[10px] font-bold text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition-all uppercase tracking-tight"
                >
                    Lern-Gespräch ✨
                </button>
            </div>
        )
    }

    // Wenn nicht vorhanden, Button mit Loading-State
    return (
        <button
            disabled={isPending}
            onClick={() => {
                if (mode === 'audio') {
                    setShowAudioOptions(true)
                } else {
                    handleGenerate()
                }
            }}
            className={`flex items-center gap-1.5 border px-2.5 py-1.5 rounded-full text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${s[color]}`}
        >
            {isPending ? (
                <div className="w-3 h-3 border-2 border-white/20 border-t-white/80 rounded-full animate-spin shrink-0" />
            ) : icon}
            {isPending ? 'Lädt...' : label}
        </button>
    )
}
