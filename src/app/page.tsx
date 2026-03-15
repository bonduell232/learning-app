'use client'

import { motion } from 'framer-motion'
import { ArrowRight, BookOpen, Brain, Sparkles, Upload, Zap } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function Home() {
  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } }
  }

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  }

  return (
    <main className="min-h-screen bg-[#060406] text-white overflow-hidden font-manrope">

      {/* Navigation Bar */}
      <nav className="fixed w-full z-50 top-0 bg-[#060406]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#9333EA] rounded-xl flex items-center justify-center">
              <Sparkles className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Kognitify</span>
          </div>
          <div className="hidden md:flex gap-8 text-sm font-medium text-white/70">
            <Link href="#features" className="hover:text-white transition-colors">Features</Link>
            <Link href="#how-it-works" className="hover:text-white transition-colors">So funktioniert's</Link>
            <Link href="#pricing" className="hover:text-white transition-colors">Preise</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium hover:text-[#9333EA] transition-colors">
              Anmelden
            </Link>
            <Link href="/register" className="bg-[#9333EA] hover:bg-[#a855f7] text-white px-6 py-2.5 rounded-full text-sm font-bold transition-all hover:shadow-[0_0_20px_rgba(147,51,234,0.4)]">
              Kostenlos starten
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6 flex items-center justify-center min-h-[90vh]">
        {/* Abstract Background Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#9333EA]/20 blur-[120px] rounded-full pointer-events-none" />

        <motion.div
          className="max-w-4xl mx-auto text-center relative z-10"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-[#9333EA]" />
            <span className="text-sm font-medium text-white/80">Die Zukunft des Lernens ist da</span>
          </motion.div>

          <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]">
            Schulstoff <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9333EA] to-[#c084fc]">clever</span> lernen. <br className="hidden md:block" />
            Einfacher. Schneller.
          </motion.h1>

          <motion.p variants={fadeInUp} className="text-xl md:text-2xl text-white/60 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
            Lade deine Schulunterlagen hoch und unsere KI verwandelt sie in interaktive Lernkarten, Zusammenfassungen und Quizzes. Speziell für dich.
          </motion.p>

          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="group flex items-center justify-center gap-2 bg-[#9333EA] hover:bg-[#a855f7] text-white px-8 py-4 rounded-full text-lg font-bold transition-all w-full sm:w-auto hover:shadow-[0_0_30px_rgba(147,51,234,0.5)] hover:-translate-y-1">
              Jetzt ausprobieren
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Interactive Features Section */}
      <section id="features" className="py-32 px-6 bg-[#0a070a] relative border-t border-white/5 overflow-hidden">
        {/* Decorative Grid Background */}
        <div className="absolute inset-0 bg-[url('/bg-grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-5 pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Dein persönlicher <span className="text-[#9333EA]">KI-Nachhilfelehrer</span></h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">Vier magische Werkzeuge, die schweres Büffeln in spielend leichten Erfolg verwandeln – für clevere Kids und entspannte Eltern.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Feature 1: Upload */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.5 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="relative bg-white/5 border border-white/10 p-8 md:p-10 rounded-[2.5rem] backdrop-blur-sm group overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#9333EA]/10 blur-[80px] rounded-full group-hover:bg-[#9333EA]/20 transition-all" />
              <div className="w-16 h-16 bg-[#9333EA]/20 border border-[#9333EA]/30 rounded-2xl flex items-center justify-center mb-8 shadow-[0_0_20px_rgba(147,51,234,0.3)] group-hover:shadow-[0_0_30px_rgba(147,51,234,0.5)] transition-all">
                <Upload className="w-8 h-8 text-[#9333EA]" />
              </div>
              <h3 className="text-3xl font-bold mb-4">Material-Sammelmappe</h3>
              <p className="text-lg text-white/60 leading-relaxed mb-6">
                Abfotografieren. Hochladen. Fertig. Egal ob Arbeitsblätter, Tafelbilder oder Buchseiten – das schwere Schleppen hat ein Ende und alles ist an einem Ort.
              </p>
              <div className="text-sm font-semibold text-[#9333EA] bg-[#9333EA]/10 px-4 py-2 rounded-full w-max">Statt Chaos im Ranzen</div>
            </motion.div>

            {/* Feature 2: Flashcards */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="relative bg-white/5 border border-white/10 p-8 md:p-10 rounded-[2.5rem] backdrop-blur-sm group overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#c084fc]/10 blur-[80px] rounded-full group-hover:bg-[#c084fc]/20 transition-all" />
              <div className="w-16 h-16 bg-[#c084fc]/20 border border-[#c084fc]/30 rounded-2xl flex items-center justify-center mb-8 shadow-[0_0_20px_rgba(192,132,252,0.3)] group-hover:shadow-[0_0_30px_rgba(192,132,252,0.5)] transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#c084fc]"><path d="m16.02 12 5.4 5.4a2.828 2.828 0 1 1-4 4L12 16.02" /><path d="M7 16V4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10" /><path d="M11 20H4a2 2 0 0 1-2-2V8" /><path d="m15 2 7 7" /></svg>
              </div>
              <h3 className="text-3xl font-bold mb-4">Magische Lernkarten</h3>
              <p className="text-lg text-white/60 leading-relaxed mb-6">
                Die KI erstellt aus deinen Unterlagen automatisch perfekte Karteikarten für Vokabeln und Fakten. Einfach per Knopfdruck umdrehen und einprägen.
              </p>
              <div className="text-sm font-semibold text-[#c084fc] bg-[#c084fc]/10 px-4 py-2 rounded-full w-max">Statt stundenlangem Abfragen</div>
            </motion.div>

            {/* Feature 3: Quiz */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.5 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="relative bg-white/5 border border-white/10 p-8 md:p-10 rounded-[2.5rem] backdrop-blur-sm group overflow-hidden"
            >
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 blur-[80px] rounded-full group-hover:bg-amber-500/20 transition-all" />
              <div className="w-16 h-16 bg-amber-500/20 border border-amber-500/30 rounded-2xl flex items-center justify-center mb-8 shadow-[0_0_20px_rgba(245,158,11,0.3)] group-hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] transition-all">
                <Zap className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="text-3xl font-bold mb-4">Punkte-Quiz Arena</h3>
              <p className="text-lg text-white/60 leading-relaxed mb-6">
                Stelle in kniffligen Multiple-Choice Aufgaben dein Wissen unter Beweis. Sammle Punkte für richtige Antworten – Lernen, das sich wie ein echtes Videospiel anfühlt!
              </p>
              <div className="text-sm font-semibold text-amber-500 bg-amber-500/10 px-4 py-2 rounded-full w-max">Statt langweiligen Tests</div>
            </motion.div>

            {/* Feature 4: Audio */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.5 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="relative bg-white/5 border border-white/10 p-8 md:p-10 rounded-[2.5rem] backdrop-blur-sm group overflow-hidden"
            >
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full group-hover:bg-blue-500/20 transition-all" />
              <div className="w-16 h-16 bg-blue-500/20 border border-blue-500/30 rounded-2xl flex items-center justify-center mb-8 shadow-[0_0_20px_rgba(59,130,246,0.3)] group-hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M3 18v-6a9 9 0 0 1 18 0v6" /><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" /></svg>
              </div>
              <h3 className="text-3xl font-bold mb-4">Dein eigener Lern-Podcast</h3>
              <p className="text-lg text-white/60 leading-relaxed mb-6">
                Vorgelesen bekommen statt selber lesen müssen. Die KI fasst Arbeitsblätter für den Schulweg auf die Ohren zusammen. Einfach Player starten und zurücklehnen.
              </p>
              <div className="text-sm font-semibold text-blue-500 bg-blue-500/10 px-4 py-2 rounded-full w-max">Statt dicken Büchern</div>
            </motion.div>
          </div>
        </div>
      </section>

    </main>
  )
}
