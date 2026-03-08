'use client'

import { useState, useTransition } from 'react'
import { login } from '@/app/auth/actions'
import Link from 'next/link'
import { Sparkles, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react'

export default function LoginPage() {
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    async function handleSubmit(formData: FormData) {
        setError(null)
        startTransition(async () => {
            const result = await login(formData)
            if (result?.error) setError(result.error)
        })
    }

    return (
        <main className="min-h-screen bg-[#060406] flex items-center justify-center px-4 relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#9333EA]/15 blur-[120px] rounded-full pointer-events-none" />

            <div className="relative z-10 w-full max-w-md">
                {/* Logo */}
                <Link href="/" className="flex items-center justify-center gap-2 mb-10">
                    <div className="w-10 h-10 bg-[#9333EA] rounded-xl flex items-center justify-center">
                        <Sparkles className="text-white w-6 h-6" />
                    </div>
                    <span className="text-2xl font-bold text-white tracking-tight">Kognitify</span>
                </Link>

                {/* Card */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
                    <h1 className="text-2xl font-bold text-white mb-2">Willkommen zurück!</h1>
                    <p className="text-white/50 text-sm mb-8">Melde dich an, um weiter zu lernen.</p>

                    <form action={handleSubmit} className="space-y-5">
                        {/* E-Mail */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-white/70 mb-2">
                                E-Mail-Adresse
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    placeholder="deine@email.de"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-white/25 text-sm focus:outline-none focus:border-[#9333EA]/60 focus:ring-1 focus:ring-[#9333EA]/40 transition-all"
                                />
                            </div>
                        </div>

                        {/* Passwort */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-white/70 mb-2">
                                Passwort
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-white/25 text-sm focus:outline-none focus:border-[#9333EA]/60 focus:ring-1 focus:ring-[#9333EA]/40 transition-all"
                                />
                            </div>
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
                            disabled={isPending}
                            className="w-full flex items-center justify-center gap-2 bg-[#9333EA] hover:bg-[#a855f7] disabled:opacity-60 disabled:cursor-not-allowed text-white px-6 py-3.5 rounded-full font-bold text-sm transition-all hover:shadow-[0_0_25px_rgba(147,51,234,0.45)] hover:-translate-y-0.5"
                        >
                            {isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    Anmelden
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-white/40 text-sm mt-6">
                    Noch kein Konto?{' '}
                    <Link href="/register" className="text-[#9333EA] hover:text-[#c084fc] font-semibold transition-colors">
                        Jetzt registrieren
                    </Link>
                </p>
            </div>
        </main>
    )
}
