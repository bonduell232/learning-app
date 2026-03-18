'use client'

import Link from 'next/link'
import { Crown, Sparkles, Check, Mail } from 'lucide-react'

export default function UpgradePage() {
    return (
        <main className="min-h-screen bg-[#060406] flex items-center justify-center px-4 py-12">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#9333EA]/8 blur-[150px] rounded-full pointer-events-none" />

            <div className="relative z-10 w-full max-w-4xl">
                <div className="text-center mb-12">
                    <p className="text-[#9333EA] text-sm font-semibold uppercase tracking-widest mb-3">Mitgliedschaften</p>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
                        Wähle deinen{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9333EA] to-[#c084fc]">
                            Lern-Begleiter
                        </span>
                    </h1>
                    <p className="text-white/50 text-lg">Starte jetzt kostenlos mit Pocklio.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 items-start">
                    {/* FREE */}
                    <div className="bg-white/[0.04] border border-white/10 rounded-3xl p-8 h-full">
                        <p className="text-white/40 text-sm font-semibold uppercase tracking-wide mb-2">Basis</p>
                        <p className="text-4xl font-extrabold text-white mb-1">0 €</p>
                        <p className="text-white/30 text-sm mb-8">Aktuell komplett kostenlos</p>

                        <p className="text-white/80 font-medium mb-4">Das ist sofort für dich drin:</p>
                        <ul className="space-y-4 text-sm text-white/60 mb-8">
                            <li className="flex items-start gap-3">
                                <Check className="w-5 h-5 text-[#9333EA] shrink-0 mt-0.5" />
                                <div>
                                    <span className="text-white/90 font-medium block">10 Uploads gesamt</span>
                                    Lade bis zu 10 Dokumente hoch und teste die KI ausgiebig.
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <Check className="w-5 h-5 text-[#9333EA] shrink-0 mt-0.5" />
                                <div>
                                    <span className="text-white/90 font-medium block">Lernkarten & Quizzes</span>
                                    Pro Dokument bis zu 3 Decks und 3 Quizzes generieren.
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <Check className="w-5 h-5 text-[#9333EA] shrink-0 mt-0.5" />
                                <div>
                                    <span className="text-white/90 font-medium block">Audio-Zusammenfassung</span>
                                    Lass dir 1 Dokument von der digitalen Stimme vorlesen.
                                </div>
                            </li>
                        </ul>

                        <Link
                            href="/dashboard"
                            className="mt-auto flex items-center justify-center w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white px-5 py-3.5 rounded-full font-bold transition-all"
                        >
                            Zum Dashboard
                        </Link>
                    </div>

                    {/* PREMIUM - COMING SOON */}
                    <div className="relative bg-gradient-to-b from-[#9333EA]/10 to-[#6b21a8]/5 border border-[#9333EA]/30 rounded-3xl p-8 h-full flex flex-col">
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#9333EA]/20 border border-[#9333EA]/50 text-[#c084fc] text-xs font-bold px-4 py-1 rounded-full backdrop-blur-md">
                            Bald verfügbar (Beta-Phase)
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                            <Crown className="w-5 h-5 text-[#c084fc]" />
                            <p className="text-[#c084fc] text-sm font-semibold uppercase tracking-wide">Premium Erweiterung</p>
                        </div>
                        <p className="text-4xl font-extrabold text-white mb-1 opacity-50">?</p>
                        <p className="text-[#c084fc] text-sm mb-8">Preismodell noch in Entwicklung</p>

                        <p className="text-white/80 font-medium mb-4">Das ist in Planung:</p>
                        <ul className="space-y-4 text-sm text-white/60 mb-8">
                            <li className="flex items-start gap-3">
                                <Sparkles className="w-5 h-5 text-[#c084fc] shrink-0 mt-0.5" />
                                <div>
                                    <span className="text-white/90 font-medium block">Unbegrenzte Materialien</span>
                                    Lade so viele Dateien hoch wie du möchtest und generiere so viele Lernkarten und Quizzes wie du brauchst.
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <Sparkles className="w-5 h-5 text-[#c084fc] shrink-0 mt-0.5" />
                                <div>
                                    <span className="text-white/90 font-medium block">Menschliche Audio-Stimmen</span>
                                    Verabschiede dich vom Roboter! Authentische, natürliche KI-Stimmen lesen dir deine Zusammenfassungen in bester Qualität vor.
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <Sparkles className="w-5 h-5 text-[#c084fc] shrink-0 mt-0.5" />
                                <div>
                                    <span className="text-white/90 font-medium block">KI Chat-Nachhilfe</span>
                                    Ein Tutor, der rund um die Uhr deine Fragen zu jedem hochgeladenen Dokument beantwortet.
                                </div>
                            </li>
                        </ul>

                        <div className="mt-auto">
                            <p className="text-xs text-white/40 text-center mb-4">
                                Dir gefallen die aktuellen Tools, aber du erreichst das Limit? <br />
                                Melde dich gerne bei uns und sichere dir einen Platz für das Premium-Modell!
                            </p>
                            <a
                                href="mailto:bonduell232@gmx.de?subject=Interesse%20an%20Pocklio%20Premium"
                                className="flex items-center justify-center gap-2 w-full bg-[#9333EA]/20 hover:bg-[#9333EA]/40 border border-[#9333EA]/50 text-white px-5 py-3.5 rounded-full font-bold transition-all"
                            >
                                <Mail className="w-4 h-4" /> Interesse anmelden
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}
