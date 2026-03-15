import Link from 'next/link'
import { Crown, Sparkles, Check } from 'lucide-react'

export default function UpgradePage() {
    return (
        <main className="min-h-screen bg-[#060406] flex items-center justify-center px-4 py-12">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#9333EA]/8 blur-[150px] rounded-full pointer-events-none" />

            <div className="relative z-10 w-full max-w-3xl">
                <div className="text-center mb-12">
                    <p className="text-[#9333EA] text-sm font-semibold uppercase tracking-widest mb-3">Preise</p>
                    <h1 className="text-4xl font-extrabold text-white mb-4">
                        Lerne ohne{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9333EA] to-[#c084fc]">
                            Grenzen
                        </span>
                    </h1>
                    <p className="text-white/50">Starte kostenlos – upgrade jederzeit.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* FREE */}
                    <div className="bg-white/[0.04] border border-white/10 rounded-3xl p-8">
                        <p className="text-white/40 text-sm font-semibold uppercase tracking-wide mb-2">Kostenlos</p>
                        <p className="text-4xl font-extrabold text-white mb-1">0 €</p>
                        <p className="text-white/30 text-sm mb-8">für immer</p>
                        <ul className="space-y-3 text-sm text-white/60">
                            {[
                                '1 Dokument hochladen',
                                '1 Lernkarten-Deck',
                                '1 Audio-Zusammenfassung',
                                '1 Quiz',
                                'Alle erstellten Inhalte abrufbar',
                            ].map(f => (
                                <li key={f} className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-white/30 shrink-0" /> {f}
                                </li>
                            ))}
                        </ul>
                        <Link
                            href="/dashboard"
                            className="mt-8 flex items-center justify-center w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white px-5 py-3 rounded-full text-sm font-bold transition-all"
                        >
                            Weiter kostenlos
                        </Link>
                    </div>

                    {/* PREMIUM */}
                    <div className="relative bg-gradient-to-b from-[#9333EA]/20 to-[#6b21a8]/10 border border-[#9333EA]/40 rounded-3xl p-8 hover:shadow-[0_0_40px_rgba(147,51,234,0.25)] transition-all">
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#9333EA] to-[#c084fc] text-white text-xs font-bold px-4 py-1 rounded-full">
                            Empfohlen
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                            <Crown className="w-4 h-4 text-[#c084fc]" />
                            <p className="text-[#c084fc] text-sm font-semibold uppercase tracking-wide">Premium</p>
                        </div>
                        <p className="text-4xl font-extrabold text-white mb-1">4,99 €</p>
                        <p className="text-white/30 text-sm mb-8">pro Monat</p>
                        <ul className="space-y-3 text-sm text-white/80">
                            {[
                                'Unbegrenzte Uploads',
                                'Unbegrenzte Lernkarten-Decks',
                                'Unbegrenzte Audio-Podcasts',
                                'Unbegrenzte Quizze',
                                'Prioritäts-KI (schnellere Antworten)',
                                'Alle zukünftigen Features inklusive',
                            ].map(f => (
                                <li key={f} className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-[#9333EA] shrink-0" /> {f}
                                </li>
                            ))}
                        </ul>
                        <button
                            className="mt-8 flex items-center justify-center gap-2 w-full bg-[#9333EA] hover:bg-[#a855f7] text-white px-5 py-3 rounded-full text-sm font-bold transition-all hover:shadow-[0_0_25px_rgba(147,51,234,0.45)]"
                            onClick={() => alert('Stripe-Integration folgt in Kürze!')}
                        >
                            <Crown className="w-4 h-4" /> Jetzt upgraden
                        </button>
                    </div>
                </div>
            </div>
        </main>
    )
}
