'use client'

import { useState, useRef, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { uploadDocument } from '@/app/upload/actions'
import { Upload, FileText, Image as ImageIcon, FileCode, Loader2, X, CloudUpload } from 'lucide-react'

const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint',
]

const TYPE_ICONS: Record<string, React.ReactNode> = {
    'application/pdf': <FileText className="w-6 h-6 text-red-400" />,
    'image/jpeg': <ImageIcon className="w-6 h-6 text-blue-400" />,
    'image/png': <ImageIcon className="w-6 h-6 text-blue-400" />,
    'image/webp': <ImageIcon className="w-6 h-6 text-blue-400" />,
}

function formatBytes(bytes: number) {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function UploadPage() {
    const router = useRouter()
    const [isDragging, setIsDragging] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()
    const inputRef = useRef<HTMLInputElement>(null)

    const handleFile = (file: File) => {
        setError(null)
        if (!ACCEPTED_TYPES.includes(file.type)) {
            setError('Dateityp nicht unterstützt. Bitte PDF, Bild, Word oder PowerPoint hochladen.')
            return
        }
        if (file.size > 20 * 1024 * 1024) {
            setError('Die Datei darf maximal 20 MB groß sein.')
            return
        }
        setSelectedFile(file)
    }

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const file = e.dataTransfer.files[0]
        if (file) handleFile(file)
    }, [])

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedFile) return
        setError(null)

        const formData = new FormData()
        formData.append('file', selectedFile)

        startTransition(async () => {
            const result = await uploadDocument(formData)
            if (result?.error) {
                setError(result.error)
            } else if (result?.documentId) {
                router.push(`/learn/${result.documentId}`)
            }
        })
    }

    return (
        <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="mb-10">
                <p className="text-[#9333EA] text-sm font-semibold uppercase tracking-widest mb-2">Hochladen</p>
                <h1 className="text-4xl font-extrabold text-white mb-3">Lernmaterial hochladen</h1>
                <p className="text-white/50">
                    Wir unterstützen PDFs, Bilder, Word-Dokumente und Präsentationen (max. 20 MB).
                </p>
            </div>


            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Drop Zone */}
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={() => setIsDragging(false)}
                    onClick={() => inputRef.current?.click()}
                    className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-3xl p-12 cursor-pointer transition-all
            ${isDragging
                            ? 'border-[#9333EA] bg-[#9333EA]/10 scale-[1.01]'
                            : selectedFile
                                ? 'border-[#9333EA]/50 bg-[#9333EA]/5'
                                : 'border-white/15 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.04]'
                        }`}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        name="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.ppt,.pptx"
                        onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleFile(file)
                        }}
                    />

                    {selectedFile ? (
                        <div className="flex flex-col items-center gap-3 text-center">
                            <div className="w-14 h-14 bg-[#9333EA]/20 rounded-2xl flex items-center justify-center">
                                {TYPE_ICONS[selectedFile.type] ?? <FileText className="w-6 h-6 text-[#9333EA]" />}
                            </div>
                            <div>
                                <p className="text-white font-semibold">{selectedFile.name}</p>
                                <p className="text-white/40 text-sm">{formatBytes(selectedFile.size)}</p>
                            </div>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setSelectedFile(null) }}
                                className="flex items-center gap-1.5 text-white/30 hover:text-white/60 text-xs transition-colors mt-1"
                            >
                                <X className="w-3.5 h-3.5" /> Andere Datei wählen
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3 text-center">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors
                ${isDragging ? 'bg-[#9333EA]/30' : 'bg-white/5'}`}>
                                <CloudUpload className={`w-7 h-7 transition-colors ${isDragging ? 'text-[#9333EA]' : 'text-white/30'}`} />
                            </div>
                            <div>
                                <p className="text-white font-semibold">Datei hierher ziehen</p>
                                <p className="text-white/40 text-sm">oder klicken zum Durchsuchen</p>
                            </div>
                            <p className="text-white/25 text-xs">PDF · Bild · Word · PowerPoint – max. 20 MB</p>
                        </div>
                    )}
                </div>

                {/* Fehler */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
                        {error}
                    </div>
                )}

                {/* Submit */}
                <button
                    type="submit"
                    disabled={!selectedFile || isPending}
                    className="w-full flex items-center justify-center gap-2 bg-[#9333EA] hover:bg-[#a855f7] disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-4 rounded-full font-bold transition-all hover:shadow-[0_0_25px_rgba(147,51,234,0.45)] hover:-translate-y-0.5"
                >
                    {isPending ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Wird hochgeladen...
                        </>
                    ) : (
                        <>
                            <Upload className="w-4 h-4" />
                            Jetzt hochladen
                        </>
                    )}
                </button>
            </form>
        </div>
    )
}
