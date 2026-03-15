'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, BookOpen, Tag, Loader2, ArrowRight, Lightbulb, GripVertical, FileText, Image as ImageIcon } from 'lucide-react'
import type { AnalyzedFile, ConfirmedFile } from '@/app/upload/actions'
import type { ImageGroup } from '@/utils/gemini'
import type { UploadedImageInfo } from '@/app/upload/page'

interface Props {
    looseFiles: AnalyzedFile[]
    imageGroups: ImageGroup[]
    rawImages: UploadedImageInfo[]
    onConfirm: (confirmed: ConfirmedFile[]) => void
    isPending: boolean
}

const SUBJECT_COLORS: Record<string, string> = {
    Geografie: 'bg-green-500/15 border-green-500/40 text-green-300',
    Mathematik: 'bg-blue-500/15 border-blue-500/40 text-blue-300',
    Biologie: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
    Geschichte: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
    Physik: 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300',
    Chemie: 'bg-purple-500/15 border-purple-500/40 text-purple-300',
    Deutsch: 'bg-red-500/15 border-red-500/40 text-red-300',
    Englisch: 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300',
}
const DEFAULT_COLOR = 'bg-[#9333EA]/15 border-[#9333EA]/40 text-purple-300'

export default function ConfirmationStep({ looseFiles, imageGroups, rawImages, onConfirm, isPending }: Props) {
    const [looseState, setLooseState] = useState(
        looseFiles.map(f => ({ ...f, subject: f.detectedSubject, topic: f.detectedTopic }))
    )
    const [groupState, setGroupState] = useState(
        imageGroups.map(g => ({ ...g, subject: g.subject, topic: g.topic }))
    )
    const [dragActiveId, setDragActiveId] = useState<string | null>(null)

    // ─── Drag & Drop Logik ─────────────────────────────────────────

    function handleDragStart(e: React.DragEvent, imageId: number, sourceGroupId: string) {
        setDragActiveId(sourceGroupId)
        e.dataTransfer.setData('imageId', imageId.toString())
        e.dataTransfer.setData('sourceGroupId', sourceGroupId)
        e.dataTransfer.effectAllowed = 'move'
    }

    function handleDragOver(e: React.DragEvent) {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
    }

    function handleDrop(e: React.DragEvent, targetGroupId: string) {
        e.preventDefault()
        setDragActiveId(null)
        const imageIdStr = e.dataTransfer.getData('imageId')
        const sourceGroupId = e.dataTransfer.getData('sourceGroupId')

        if (!imageIdStr || !sourceGroupId || sourceGroupId === targetGroupId) return

        const imageId = parseInt(imageIdStr, 10)

        setGroupState(prev => {
            const next = [...prev]
            const sourceIdx = next.findIndex(g => g.id === sourceGroupId)
            const targetIdx = next.findIndex(g => g.id === targetGroupId)

            if (sourceIdx > -1 && targetIdx > -1) {
                // Aus Quelle entfernen
                next[sourceIdx] = {
                    ...next[sourceIdx],
                    imageIndices: next[sourceIdx].imageIndices.filter(id => id !== imageId)
                }
                // In Ziel einfügen
                next[targetIdx] = {
                    ...next[targetIdx],
                    imageIndices: [...next[targetIdx].imageIndices, imageId]
                }
            }
            // Leere Gruppen entfernen
            return next.filter(g => g.imageIndices.length > 0)
        })
    }

    // ─── Input Handlers ────────────────────────────────────────────

    function updateLoose(idx: number, field: 'subject' | 'topic', value: string) {
        setLooseState(prev => prev.map((e, i) => i === idx ? { ...e, [field]: value } : e))
    }

    function updateGroup(id: string, field: 'title' | 'subject' | 'topic', value: string) {
        setGroupState(prev => prev.map(g => g.id === id ? { ...g, [field]: value } : g))
    }

    // ─── Speichern ─────────────────────────────────────────────────

    function handleConfirm() {
        const confirmed: ConfirmedFile[] = []

        // Einzel-PDFs/Docs
        looseState.forEach(f => {
            confirmed.push({
                storagePath: f.storagePath,
                title: f.title,
                mimeType: f.mimeType,
                fileType: f.fileType,
                subject: f.subject.trim() || 'Sonstiges',
                topic: f.topic.trim() || 'Allgemein',
            })
        })

        // Bild-Gruppen
        groupState.forEach(g => {
            if (g.imageIndices.length === 1) {
                // Nur 1 Bild -> Als normales IMAGE abspeichern
                const img = rawImages[g.imageIndices[0]]
                confirmed.push({
                    storagePath: img.storagePath,
                    title: img.title || g.title,
                    mimeType: img.mimeType,
                    fileType: 'IMAGE',
                    subject: g.subject.trim() || 'Sonstiges',
                    topic: g.topic.trim() || 'Allgemein',
                })
            } else if (g.imageIndices.length > 1) {
                // Mehrere Bilder -> Als COLLECTION abspeichern
                const paths = g.imageIndices.map(idx => rawImages[idx].storagePath)
                confirmed.push({
                    storagePath: JSON.stringify(paths), // Array als String in DB
                    title: g.title,
                    mimeType: 'application/json',
                    fileType: 'COLLECTION',
                    subject: g.subject.trim() || 'Sonstiges',
                    topic: g.topic.trim() || 'Allgemein',
                })
            }
        })

        onConfirm(confirmed)
    }

    return (
        <div className="space-y-8">
            <div className="text-center sm:text-left">
                <p className="text-[#9333EA] text-sm font-semibold uppercase tracking-widest mb-2">Schritt 2 von 2</p>
                <h2 className="text-3xl font-extrabold text-white mb-2">KI-Vorschläge prüfen</h2>
                <p className="text-white/50 text-sm max-w-xl hidden sm:block">
                    Die KI hat zusammenhängende Bilder in Gruppen (Ordner) sortiert.
                    Du kannst Bilder per <strong className="text-white/80">Drag & Drop</strong> verschieben, falls etwas nicht passt!
                </p>
                <p className="text-white/50 text-sm sm:hidden">
                    Bitte prüfe die Fächer und Themen der hochgeladenen Dokumente.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* ─── BILDER GRUPPEN ─── */}
                <div className="space-y-4">
                    {groupState.length > 0 && (
                        <h3 className="text-white font-bold flex items-center gap-2 mb-2">
                            <ImageIcon className="w-5 h-5 text-[#9333EA]" />
                            {groupState.length === 1 ? '1 Bild-Gruppe' : `${groupState.length} Bild-Gruppen`}
                        </h3>
                    )}

                    <AnimatePresence>
                        {groupState.map((group, i) => {
                            const colorClass = SUBJECT_COLORS[group.subject] ?? DEFAULT_COLOR
                            const isDropTarget = dragActiveId !== null && dragActiveId !== group.id

                            return (
                                <motion.div
                                    layout
                                    key={group.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, group.id)}
                                    className={`relative bg-white/[0.04] border-2 rounded-3xl p-5 transition-colors duration-300 ${isDropTarget ? 'border-[#9333EA] bg-[#9333EA]/10 shadow-[0_0_20px_rgba(147,51,234,0.3)]' : 'border-white/10'}`}
                                >
                                    {/* Titel & Begründung */}
                                    <div className="mb-4">
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <input
                                                type="text"
                                                value={group.title}
                                                onChange={e => updateGroup(group.id, 'title', e.target.value)}
                                                className="text-lg font-bold text-white bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-[#9333EA]/50 rounded-md px-1 w-full truncate"
                                            />
                                            <span className="shrink-0 bg-white/10 text-white/50 text-xs font-bold px-2 py-1 rounded-lg">
                                                {group.imageIndices.length} {group.imageIndices.length === 1 ? 'Bild' : 'Bilder'}
                                            </span>
                                        </div>
                                        <div className="flex items-start gap-1.5 text-white/40 text-xs px-1">
                                            <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5 text-yellow-500/70" />
                                            <p className="line-clamp-2">{group.reasoning}</p>
                                        </div>
                                    </div>

                                    {/* Thumbnails (Drag & Drop) */}
                                    <div className="flex flex-wrap gap-3 mb-5 p-3 bg-black/20 rounded-2xl min-h-[90px] items-center">
                                        <AnimatePresence>
                                            {group.imageIndices.map(imgIdx => {
                                                const img = rawImages[imgIdx]
                                                if (!img) return null
                                                return (
                                                    <motion.div
                                                        layout
                                                        key={img.id}
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.8 }}
                                                        draggable
                                                        onDragStart={(e: any) => handleDragStart(e, img.id, group.id)}
                                                        onDragEnd={() => setDragActiveId(null)}
                                                        className="group relative w-20 h-20 rounded-xl overflow-hidden cursor-grab active:cursor-grabbing border-2 border-white/10 hover:border-[#9333EA] transition-colors"
                                                    >
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img src={img.previewUrl} alt={img.title} className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <GripVertical className="text-white w-5 h-5" />
                                                        </div>
                                                    </motion.div>
                                                )
                                            })}
                                        </AnimatePresence>
                                        {group.imageIndices.length === 0 && (
                                            <p className="text-white/20 text-xs w-full text-center">Keine Bilder mehr in dieser Gruppe.</p>
                                        )}
                                    </div>

                                    {/* Eingabefelder Fach/Thema */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`flex items-center gap-1.5 border px-3 py-1.5 rounded-full text-xs font-semibold w-24 justify-center ${colorClass}`}>
                                                <BookOpen className="w-3.5 h-3.5" /> Fach
                                            </div>
                                            <input
                                                type="text" value={group.subject} onChange={e => updateGroup(group.id, 'subject', e.target.value)}
                                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-white text-sm focus:outline-none focus:border-[#9333EA]/60 transition-all font-medium"
                                                placeholder="Fach (z.B. Geografie)"
                                            />
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1.5 border border-white/10 bg-white/5 text-white/50 px-3 py-1.5 rounded-full text-xs font-semibold w-24 justify-center">
                                                <Tag className="w-3.5 h-3.5" /> Thema
                                            </div>
                                            <input
                                                type="text" value={group.topic} onChange={e => updateGroup(group.id, 'topic', e.target.value)}
                                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-white text-sm focus:outline-none focus:border-[#9333EA]/60 transition-all font-medium"
                                                placeholder="Thema (z.B. Südamerika)"
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </AnimatePresence>
                </div>

                {/* ─── LOOSE FILES (PDFs/Words) ─── */}
                <div className="space-y-4">
                    {looseState.length > 0 && (
                        <h3 className="text-white font-bold flex items-center gap-2 mb-2 lg:mt-0 mt-8">
                            <FileText className="w-5 h-5 text-red-400" />
                            {looseState.length === 1 ? '1 Text-Dokument' : `${looseState.length} Text-Dokumente`}
                        </h3>
                    )}

                    {looseState.map((file, i) => {
                        const colorClass = SUBJECT_COLORS[file.subject] ?? DEFAULT_COLOR

                        return (
                            <motion.div
                                key={file.storagePath}
                                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                                className="bg-white/[0.04] border border-white/10 rounded-3xl p-5"
                            >
                                <div className="flex items-center gap-2 mb-5">
                                    <FileText className="w-5 h-5 text-red-400/70" />
                                    <span className="text-white font-semibold truncate flex-1">{file.title}</span>
                                    {file.confidence === 'low' && (
                                        <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold shrink-0">
                                            Unsichere Erkennung
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`flex items-center gap-1.5 border px-3 py-1.5 rounded-full text-xs font-semibold w-24 justify-center ${colorClass}`}>
                                            <BookOpen className="w-3.5 h-3.5" /> Fach
                                        </div>
                                        <input
                                            type="text" value={file.subject} onChange={e => updateLoose(i, 'subject', e.target.value)}
                                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-white text-sm focus:outline-none focus:border-[#9333EA]/60 transition-all font-medium"
                                        />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1.5 border border-white/10 bg-white/5 text-white/50 px-3 py-1.5 rounded-full text-xs font-semibold w-24 justify-center">
                                            <Tag className="w-3.5 h-3.5" /> Thema
                                        </div>
                                        <input
                                            type="text" value={file.topic} onChange={e => updateLoose(i, 'topic', e.target.value)}
                                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-white text-sm focus:outline-none focus:border-[#9333EA]/60 transition-all font-medium"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}

                    <button
                        onClick={handleConfirm}
                        disabled={isPending || (groupState.length === 0 && looseState.length === 0) || groupState.some(g => g.imageIndices.length === 0)}
                        className="w-full flex items-center justify-center gap-2 bg-[#9333EA] hover:bg-[#a855f7] disabled:bg-white/10 disabled:text-white/30 disabled:cursor-not-allowed text-white px-6 py-5 rounded-3xl font-bold text-lg transition-all hover:shadow-[0_0_30px_rgba(147,51,234,0.4)] hover:-translate-y-0.5 mt-8"
                    >
                        {isPending ? (
                            <><Loader2 className="w-5 h-5 animate-spin" /> Verarbeiten...</>
                        ) : (
                            <><CheckCircle2 className="w-5 h-5" /> Speichern & Weiter <ArrowRight className="w-5 h-5" /></>
                        )}
                    </button>
                    {groupState.some(g => g.imageIndices.length === 0) && (
                        <p className="text-red-400 text-xs text-center mt-2">Leere Gruppen sind nicht erlaubt. Verteile alle Bilder.</p>
                    )}
                </div>
            </div>
        </div>
    )
}
