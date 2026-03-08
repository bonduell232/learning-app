'use client'

import { useTransition, useState } from 'react'
import { generateFlashcards } from '@/app/dashboard/actions'
import { Sparkles, Loader2 } from 'lucide-react'

export default function GenerateFlashcardsButton({ documentId }: { documentId: string }) {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    function handleClick() {
        setError(null)
        startTransition(async () => {
            const result = await generateFlashcards(documentId)
            if (result?.error) setError(result.error)
        })
    }

    if (error) {
        return (
            <span className="text-xs text-red-400 max-w-[200px] text-right leading-tight">
                {error}
            </span>
        )
    }

    return (
        <button
            onClick={handleClick}
            disabled={isPending}
            className="flex items-center gap-2 bg-[#9333EA]/20 hover:bg-[#9333EA]/30 border border-[#9333EA]/40 hover:border-[#9333EA]/70 text-[#c084fc] hover:text-white px-4 py-2 rounded-full text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_15px_rgba(147,51,234,0.3)]"
        >
            {isPending ? (
                <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    KI arbeitet...
                </>
            ) : (
                <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Lernkarten erstellen
                </>
            )}
        </button>
    )
}
