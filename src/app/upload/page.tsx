'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { checkUploadAllowed, analyzeStoredFile, confirmAndSaveDocuments, groupUploadedImages } from '@/app/upload/actions'
import type { AnalyzedFile, ConfirmedFile } from '@/app/upload/actions'
import type { ImageGroup } from '@/utils/gemini'
import ConfirmationStep from '@/app/upload/ConfirmationStep'
import { FileText, Image as ImageIcon, FileCode, X, CloudUpload, Plus, Brain, CheckCircle2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

// SSR-fähiger Browser-Client (kennt die Cookie-Session aus Next.js Auth)
const supabase = createClient()

const ACCEPTED_TYPES = [
    'application/pdf', 'image/jpeg', 'image/png', 'image/webp',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint',
]

const FILE_ICONS: Record<string, React.ReactNode> = {
    'application/pdf': <FileText className="w-5 h-5 text-red-400" />,
    'image/jpeg': <ImageIcon className="w-5 h-5 text-blue-400" />,
    'image/png': <ImageIcon className="w-5 h-5 text-blue-400" />,
    'image/webp': <ImageIcon className="w-5 h-5 text-blue-400" />,
}

function formatBytes(b: number) {
    return b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`
}

type FileStatus = 'pending' | 'uploading' | 'analyzing' | 'done' | 'error'

interface FileEntry { file: File; status: FileStatus; error?: string; result?: AnalyzedFile }

export interface UploadedImageInfo {
    id: number; file: File; storagePath: string; title: string; mimeType: string; previewUrl: string;
}

type Phase = 'selecting' | 'processing' | 'confirming' | 'saving'

export default function UploadPage() {
    const router = useRouter()
    const [phase, setPhase] = useState<Phase>('selecting')
    const [isDragging, setIsDragging] = useState(false)
    const [entries, setEntries] = useState<FileEntry[]>([])

    // States für ConfirmationStep
    const [analyzedLoose, setAnalyzedLoose] = useState<AnalyzedFile[]>([])
    const [analyzedImages, setAnalyzedImages] = useState<UploadedImageInfo[]>([])
    const [analyzedGroups, setAnalyzedGroups] = useState<ImageGroup[]>([])

    const [globalError, setGlobalError] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    const addFiles = useCallback((incoming: FileList | File[]) => {
        const arr = Array.from(incoming)
        const valid = arr.filter(f => ACCEPTED_TYPES.includes(f.type) && f.size <= 25 * 1024 * 1024)
        if (arr.length > valid.length) setGlobalError(`${arr.length - valid.length} Datei(en) übersprungen (Typ/Größe).`)
        else setGlobalError(null)
        setEntries(prev => {
            const existing = new Set(prev.map(e => e.file.name + e.file.size))
            return [...prev, ...valid.filter(f => !existing.has(f.name + f.size)).map(f => ({ file: f, status: 'pending' as FileStatus }))]
        })
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault(); setIsDragging(false); addFiles(e.dataTransfer.files)
    }, [addFiles])

    function removeFile(idx: number) {
        setEntries(prev => prev.filter((_, i) => i !== idx))
    }

    function patchEntry(idx: number, patch: Partial<FileEntry>) {
        setEntries(prev => prev.map((e, i) => i === idx ? { ...e, ...patch } : e))
    }

    // ── Sequentieller Upload-Loop ─────────────────────────────────
    async function handleProcess() {
        if (!entries.length) return
        setGlobalError(null)

        // 1. Freemium-Gate: Server-seitig prüfen
        const gate = await checkUploadAllowed()
        if (!gate.allowed) {
            setGlobalError('LIMIT_REACHED')
            return
        }

        setPhase('processing')
        const resultsLoose: AnalyzedFile[] = []
        const uploadedImages: UploadedImageInfo[] = []

        const { data: { session } } = await supabase.auth.getSession()
        if (!session) { setGlobalError('Nicht angemeldet'); setPhase('selecting'); return }
        const userId = session.user.id

        // Dateien hochladen
        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i]
            const title = entry.file.name.replace(/\.[^.]+$/, '')
            const ext = entry.file.name.split('.').pop() ?? 'bin'
            const storagePath = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

            patchEntry(i, { status: 'uploading' })
            const { error: upErr } = await supabase.storage
                .from('documents')
                .upload(storagePath, entry.file, { contentType: entry.file.type, upsert: false })

            if (upErr) { patchEntry(i, { status: 'error', error: upErr.message }); continue }

            if (entry.file.type.startsWith('image/')) {
                // Bild: wandert in den Bulk-Pool
                patchEntry(i, { status: 'analyzing' })
                uploadedImages.push({
                    id: uploadedImages.length, // 0-based for Gemini
                    file: entry.file,
                    storagePath,
                    title,
                    mimeType: entry.file.type,
                    previewUrl: URL.createObjectURL(entry.file)
                })
            } else {
                // PDF/Word: sofort einzeln analysieren
                patchEntry(i, { status: 'analyzing' })
                const res = await analyzeStoredFile(storagePath, entry.file.type, title)
                if (res.error) {
                    patchEntry(i, { status: 'error', error: res.error })
                } else if (res.file) {
                    patchEntry(i, { status: 'done', result: res.file })
                    resultsLoose.push(res.file)
                }
            }
        }

        // Bilder als Gruppe an Gemini schicken
        let imageGroups: ImageGroup[] = []
        if (uploadedImages.length > 0) {
            const { groups, error: grpErr } = await groupUploadedImages(
                uploadedImages.map(img => ({ storagePath: img.storagePath, mimeType: img.mimeType, title: img.title }))
            )

            if (grpErr || !groups) {
                // Fallback: Wenn Gemini fehlschlägt, mache jedes Bild zu einer Einzel-AnalyzedFile (wie vorher)
                for (const img of uploadedImages) {
                    resultsLoose.push({
                        storagePath: img.storagePath, title: img.title, mimeType: img.mimeType, fileType: 'IMAGE',
                        detectedSubject: 'Sonstiges', detectedTopic: 'Allgemein', confidence: 'low'
                    })
                }
            } else {
                imageGroups = groups
            }

            // Markiere alle Bilder im UI als done
            setEntries(prev => prev.map(e => e.file.type.startsWith('image/') && e.status === 'analyzing' ? { ...e, status: 'done' } : e))
        }

        if (resultsLoose.length > 0 || imageGroups.length > 0) {
            setAnalyzedLoose(resultsLoose)
            setAnalyzedImages(uploadedImages)
            setAnalyzedGroups(imageGroups)
            setPhase('confirming')
        } else {
            setGlobalError('Keine Datei konnte verarbeitet werden.')
            setPhase('selecting')
        }
    }

    async function handleConfirm(confirmed: ConfirmedFile[]) {
        setIsSaving(true)
        const result = await confirmAndSaveDocuments(confirmed)
        setIsSaving(false)
        if (result.error) { setGlobalError(result.error); return }
        const ids = result.documentIds ?? []
        if (ids.length === 1) router.push(`/learn/${ids[0]}`)
        else router.push('/dashboard')
    }

    const total = entries.length
    const done = entries.filter(e => e.status === 'done' || e.status === 'error').length
    const progressPct = total > 0 ? Math.round((done / total) * 100) : 0

    // ── Bestätigungs-Screen ───────────────────────────────────────
    if (phase === 'confirming' || phase === 'saving') {
        return (
            <div className="max-w-4xl mx-auto">
                {globalError && <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400 mb-4">{globalError}</div>}
                <ConfirmationStep
                    looseFiles={analyzedLoose}
                    imageGroups={analyzedGroups}
                    rawImages={analyzedImages}
                    onConfirm={handleConfirm}
                    isPending={isSaving}
                />
            </div>
        )
    }

    // ── Verarbeitungs-Screen ──────────────────────────────────────
    if (phase === 'processing') {
        return (
            <div className="max-w-2xl mx-auto">
                <div className="mb-8">
                    <p className="text-[#9333EA] text-sm font-semibold uppercase tracking-widest mb-2">Schritt 1 von 2</p>
                    <h2 className="text-3xl font-extrabold text-white mb-2">Dateien werden verarbeitet</h2>
                    <p className="text-white/40 text-sm">Jede Datei wird einzeln hochgeladen und von der KI analysiert.</p>
                </div>

                {/* Fortschrittsbalken */}
                <div className="mb-6">
                    <div className="flex justify-between text-xs text-white/40 mb-2">
                        <span>{done} von {total} abgeschlossen</span>
                        <span>{progressPct}%</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-[#9333EA] to-[#c084fc] rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPct}%` }}
                            transition={{ duration: 0.4 }}
                        />
                    </div>
                </div>

                {/* Datei-Status-Liste */}
                <div className="space-y-3">
                    {entries.map((entry, i) => (
                        <motion.div
                            key={entry.file.name + i}
                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex items-center gap-3 bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-3.5"
                        >
                            <div className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center shrink-0">
                                {FILE_ICONS[entry.file.type] ?? <FileCode className="w-5 h-5 text-white/40" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-medium truncate">{entry.file.name}</p>
                                <p className="text-white/30 text-xs">
                                    {entry.status === 'pending' && 'Wartet…'}
                                    {entry.status === 'uploading' && '⬆️ Wird hochgeladen…'}
                                    {entry.status === 'analyzing' && '🧠 KI analysiert…'}
                                    {entry.status === 'done' && `✅ ${entry.result?.detectedSubject} · ${entry.result?.detectedTopic}`}
                                    {entry.status === 'error' && `❌ ${entry.error}`}
                                </p>
                            </div>
                            <div className="shrink-0">
                                {entry.status === 'pending' && <div className="w-5 h-5 rounded-full border-2 border-white/10" />}
                                {(entry.status === 'uploading' || entry.status === 'analyzing') && (
                                    <motion.div
                                        className="w-5 h-5 rounded-full border-2 border-[#9333EA]/30 border-t-[#9333EA]"
                                        animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                                    />
                                )}
                                {entry.status === 'done' && <CheckCircle2 className="w-5 h-5 text-green-400" />}
                                {entry.status === 'error' && <AlertCircle className="w-5 h-5 text-red-400" />}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        )
    }

    // ── Dateiauswahl-Screen ───────────────────────────────────────
    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8">
                <p className="text-[#9333EA] text-sm font-semibold uppercase tracking-widest mb-2">Hochladen</p>
                <h1 className="text-4xl font-extrabold text-white mb-3">Lernmaterial hochladen</h1>
                <p className="text-white/50">Mehrere Dateien gleichzeitig – die KI erkennt Fach und Thema automatisch.</p>
            </div>

            {globalError === 'LIMIT_REACHED' && (
                <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl px-4 py-4 text-sm text-amber-300 mb-5">
                    Du hast dein Upload-Limit erreicht (1 Dokument im kostenlosen Plan).{' '}
                    <Link href="/upgrade" className="underline font-semibold">Jetzt upgraden →</Link>
                </div>
            )}
            {globalError && globalError !== 'LIMIT_REACHED' && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 text-sm text-amber-400 mb-4">{globalError}</div>
            )}

            {/* Drop Zone */}
            <div
                onDrop={handleDrop}
                onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onClick={() => inputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-3xl p-10 cursor-pointer transition-all mb-5
                    ${isDragging ? 'border-[#9333EA] bg-[#9333EA]/10 scale-[1.01]' : 'border-white/15 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.04]'}`}
            >
                <input ref={inputRef} type="file" multiple className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.ppt,.pptx"
                    onChange={e => { if (e.target.files) addFiles(e.target.files) }} />
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 transition-colors ${isDragging ? 'bg-[#9333EA]/30' : 'bg-white/5'}`}>
                    <CloudUpload className={`w-7 h-7 transition-colors ${isDragging ? 'text-[#9333EA]' : 'text-white/30'}`} />
                </div>
                <p className="text-white font-semibold">Dateien hierher ziehen</p>
                <p className="text-white/40 text-sm mt-1">oder klicken zum Durchsuchen</p>
                <p className="text-white/25 text-xs mt-2">PDF · Bild · Word · PowerPoint – max. 25 MB</p>
            </div>

            {/* Dateiliste */}
            <AnimatePresence>
                {entries.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2 mb-5">
                        {entries.map((entry, i) => (
                            <motion.div key={entry.file.name + entry.file.size}
                                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }} transition={{ delay: i * 0.04 }}
                                className="flex items-center gap-3 bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-3"
                            >
                                <div className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center shrink-0">
                                    {FILE_ICONS[entry.file.type] ?? <FileCode className="w-5 h-5 text-white/40" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white text-sm font-medium truncate">{entry.file.name}</p>
                                    <p className="text-white/30 text-xs">{formatBytes(entry.file.size)}</p>
                                </div>
                                <button onClick={e => { e.stopPropagation(); removeFile(i) }} className="text-white/20 hover:text-white/60 transition-colors p-1">
                                    <X className="w-4 h-4" />
                                </button>
                            </motion.div>
                        ))}
                        <button onClick={() => inputRef.current?.click()} className="flex items-center gap-2 text-[#9333EA] hover:text-[#a855f7] text-sm font-medium transition-colors px-1 py-1">
                            <Plus className="w-4 h-4" /> Weitere Dateien hinzufügen
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                onClick={handleProcess}
                disabled={entries.length === 0}
                className="w-full flex items-center justify-center gap-2 bg-[#9333EA] hover:bg-[#a855f7] disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-4 rounded-full font-bold transition-all hover:shadow-[0_0_25px_rgba(147,51,234,0.45)] hover:-translate-y-0.5"
            >
                <Brain className="w-4 h-4" />
                {entries.length === 0 ? 'Dateien wählen' : entries.length === 1 ? '1 Datei analysieren' : `${entries.length} Dateien analysieren`}
            </button>
        </div>
    )
}
