'use client'

import { useState, useTransition } from 'react'
import { Trash2, Loader2 } from 'lucide-react'

interface Props {
    onDelete: () => Promise<{ error?: string }>
    label?: string
    /** Bestätigungs-Text im Dialog */
    confirmText?: string
}

export default function DeleteButton({ onDelete, label, confirmText }: Props) {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    function handleClick() {
        const msg = confirmText ?? 'Wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.'
        if (!window.confirm(msg)) return
        setError(null)
        startTransition(async () => {
            const result = await onDelete()
            if (result.error) setError(result.error)
        })
    }

    return (
        <div className="inline-flex flex-col items-end gap-1">
            <button
                onClick={handleClick}
                disabled={isPending}
                title={label ?? 'Löschen'}
                className="flex items-center gap-1.5 text-white/20 hover:text-red-400 disabled:opacity-40 transition-colors p-1.5 rounded-lg hover:bg-red-500/10"
            >
                {isPending
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Trash2 className="w-3.5 h-3.5" />}
                {label && <span className="text-xs">{label}</span>}
            </button>
            {error && <p className="text-red-400 text-xs max-w-[200px] text-right">{error}</p>}
        </div>
    )
}
