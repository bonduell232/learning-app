'use client'

import { motion } from 'framer-motion'
import { ArrowRight, BookOpen, Brain, Sparkles, Upload } from 'lucide-react'
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
      <section id="features" className="py-32 px-6 bg-[#0a070a] relative border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Dein persönlicher <span className="text-[#9333EA]">KI-Tutor</span></h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">Alles, was du brauchst, um die nächste Klassenarbeit souverän zu meistern.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.5 }}
              whileHover={{ y: -10 }}
              className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-sm group"
            >
              <div className="w-14 h-14 bg-[#9333EA]/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Upload className="w-7 h-7 text-[#9333EA]" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Einfacher Upload</h3>
              <p className="text-white/60 leading-relaxed">
                Egal ob Arbeitsblatt als PDF, Foto von der Tafel oder ein Word-Dokument. Einfach hochladen und wir erledigen den Rest.
              </p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
              whileHover={{ y: -10 }}
              className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-sm group"
            >
              <div className="w-14 h-14 bg-[#9333EA]/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Brain className="w-7 h-7 text-[#9333EA]" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Smarte Lernkarten</h3>
              <p className="text-white/60 leading-relaxed">
                Unsere KI liest deine Dokumente und erstellt automatisch passende Karteikarten, mit denen du den Stoff spielend leicht lernst.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.5 }}
              whileHover={{ y: -10 }}
              className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-sm group"
            >
              <div className="w-14 h-14 bg-[#9333EA]/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BookOpen className="w-7 h-7 text-[#9333EA]" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Interaktive Erklärungen</h3>
              <p className="text-white/60 leading-relaxed">
                Verstehst du etwas nicht? Frag einfach nach! Die KI erklärt dir komplexe Zusammenhänge kindgerecht und verständlich.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

    </main>
  )
}
