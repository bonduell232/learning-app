'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { Pencil, Check, X, Loader2 } from 'lucide-react'

interface Props {
    value: string
    onRename: (newName: string) => Promise<{ error?: string }>
    className?: string
}

export default function RenameInline({ value, onRename, className = '' }: Props) {
    const [editing, setEditing] = useState(false)
    const [draft, setDraft] = useState(value)
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (editing) {
            setDraft(value)
            setTimeout(() => inputRef.current?.select(), 0)
        }
    }, [editing, value])

    function cancel() { setEditing(false); setError(null); setDraft(value) }

    function save() {
        if (draft.trim() === value) { cancel(); return }
        setError(null)
        startTransition(async () => {
            const result = await onRename(draft.trim())
            if (result.error) { setError(result.error) }
            else { setEditing(false) }
        })
    }

    function handleKey(e: React.KeyboardEvent) {
        if (e.key === 'Enter') save()
        if (e.key === 'Escape') cancel()
    }

    if (!editing) {
        return (
            <button
                onClick={() => setEditing(true)}
                className={`group flex items-center gap-1.5 text-left ${className}`}
                title="Umbenennen"
            >
                <span>{value}</span>
                <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-40 transition-opacity shrink-0" />
            </button>
        )
    }

    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
                <input
                    ref={inputRef}
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={handleKey}
                    disabled={isPending}
                    className="bg-white/10 border border-white/20 focus:border-[#9333EA]/60 rounded-lg px-2.5 py-1 text-white text-sm outline-none min-w-0 flex-1"
                />
                <button onClick={save} disabled={isPending} className="text-green-400 hover:text-green-300 disabled:opacity-40 p-1">
                    {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                </button>
                <button onClick={cancel} disabled={isPending} className="text-white/30 hover:text-white/60 p-1">
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
        </div>
    )
}
