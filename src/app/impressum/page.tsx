'use client'

import { motion } from 'framer-motion'
import { Rocket, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function ImpressumPage() {
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  }

  return (
    <main className="min-h-screen bg-[#060406] text-white font-manrope">
      {/* Navigation Bar */}
      <nav className="fixed w-full z-50 top-0 bg-[#060406]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-[#9333EA] rounded-xl flex items-center justify-center shrink-0 group-hover:shadow-[0_0_20px_rgba(147,51,234,0.4)] transition-all">
              <Rocket className="text-white w-5 h-5" />
            </div>
            <span className="text-xl sm:text-2xl font-bold tracking-tight">Pocklio</span>
          </Link>
          <Link href="/" className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Zurück zur Startseite
          </Link>
        </div>
      </nav>

      <section className="pt-40 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-12">Impressum</h1>

            <div className="space-y-12 text-white/70">
              <section>
                <h2 className="text-xl font-bold text-white mb-4">Angaben gemäß § 5 TMG</h2>
                <p className="text-lg leading-relaxed">
                  Marcus Wieseckel<br />
                  Vorwerkstraße 18c<br />
                  85139 Wettstetten
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-4">Kontakt</h2>
                <p className="text-lg leading-relaxed">
                  E-Mail: <a href="mailto:bonduell232@gmail.com" className="text-[#9333EA] hover:underline">bonduell232@gmail.com</a>
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-4">Haftung für Inhalte</h2>
                <p className="leading-relaxed">
                  Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
                </p>
              </section>

              <div className="pt-8 border-t border-white/10">
                <p className="text-sm text-white/40 italic">
                  Diese Seite wird privat betrieben.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer (Simplified) */}
      <footer className="py-12 px-6 border-t border-white/10 bg-[#0a070a]">
        <div className="max-w-7xl mx-auto text-center text-white/40 text-sm">
          <p>© {new Date().getFullYear()} Pocklio. Alle Rechte vorbehalten.</p>
        </div>
      </footer>
    </main>
  )
}
