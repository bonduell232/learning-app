import { createClient } from '@/utils/supabase/server'
import { logout } from '@/app/auth/actions'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Rocket, LayoutDashboard, Upload, LogOut, Folders, BookOpen } from 'lucide-react'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const email = user.email ?? ''
    const initial = email[0]?.toUpperCase() ?? '?'

    return (
        <div className="min-h-screen bg-[#060406] flex font-manrope pb-20 md:pb-0">
            {/* Sidebar (Desktop) */}
            <aside className="hidden md:flex fixed top-0 left-0 h-full w-64 bg-white/[0.03] border-r border-white/10 flex-col p-6 z-40">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 mb-10">
                    <div className="w-9 h-9 bg-[#9333EA] rounded-xl flex items-center justify-center shrink-0">
                        <Rocket className="text-white w-5 h-5" />
                    </div>
                    <span className="text-xl font-bold text-white tracking-tight">Pocklio</span>
                </Link>

                {/* Navigation */}
                <nav className="flex-1 space-y-1">
                    <div className="space-y-1 pb-4">
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-all text-sm font-medium group"
                        >
                            <LayoutDashboard className="w-4 h-4 group-hover:text-[#9333EA] transition-colors" />
                            Mein Dashboard
                        </Link>
                        {/* SUB-MENU */}
                        <div className="ml-9 space-y-1">
                            <Link href="/dashboard?tab=material" className="flex items-center gap-2 py-2 text-xs text-white/40 hover:text-white/80 transition-all group">
                                <Folders className="w-3 h-3 group-hover:text-[#9333EA]" /> Material & Quellen
                            </Link>
                            <Link href="/dashboard?tab=learn" className="flex items-center gap-2 py-2 text-xs text-white/40 hover:text-white/80 transition-all group">
                                <BookOpen className="w-3 h-3 group-hover:text-amber-500" /> Mein Lernraum
                            </Link>
                        </div>
                    </div>

                    <Link
                        href="/upload"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-all text-sm font-medium group"
                    >
                        <Upload className="w-4 h-4 group-hover:text-[#9333EA] transition-colors" />
                        Hochladen
                    </Link>
                </nav>

                {/* User + Logout */}
                <div className="border-t border-white/10 pt-4 space-y-2">
                    {/* IMPRESSUM (Less prominent) */}
                    <Link
                        href="/impressum"
                        className="flex items-center gap-3 px-4 py-2 rounded-xl text-white/30 hover:text-white/60 hover:bg-white/[0.02] transition-all text-[11px] font-medium group mb-2"
                    >
                        <span className="w-4 text-center group-hover:text-white/50 transition-colors font-bold">§</span>
                        Impressum & Rechtliches
                    </Link>

                    <div className="flex items-center gap-3 px-2">
                        <div className="w-8 h-8 rounded-full bg-[#9333EA]/30 border border-[#9333EA]/40 flex items-center justify-center text-xs font-bold text-[#9333EA]">
                            {initial}
                        </div>
                        <span className="text-xs text-white/50 truncate w-32">{email}</span>
                    </div>
                    <form action={logout}>
                        <button
                            type="submit"
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-all text-sm font-medium group"
                        >
                            <LogOut className="w-4 h-4" />
                            Abmelden
                        </button>
                    </form>
                </div>
            </aside>

            {/* Main Content */}
            <main className="md:ml-64 flex-1 p-4 sm:p-6 md:p-10 w-full overflow-x-hidden">
                {children}
            </main>

            {/* Bottom Nav (Mobile) */}
            <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[#060406]/95 backdrop-blur-md border-t border-white/10 p-3 z-50 flex items-center justify-around pb-safe">
                <Link href="/dashboard" className="flex flex-col items-center gap-1.5 p-2 text-white/70 hover:text-white transition-colors">
                    <LayoutDashboard className="w-5 h-5" />
                    <span className="text-[10px] font-bold tracking-wide">Dashboard</span>
                </Link>
                <div className="-mt-8 relative z-10">
                    <Link href="/upload" className="flex items-center justify-center w-14 h-14 bg-[#9333EA] hover:bg-[#a855f7] rounded-full text-white shadow-[0_0_20px_rgba(147,51,234,0.4)] transition-all">
                        <Upload className="w-6 h-6 ml-0.5" />
                    </Link>
                </div>
                <Link href="/impressum" className="flex flex-col items-center gap-1.5 p-2 text-white/50 hover:text-white transition-colors">
                    <span className="text-xl h-5 leading-none">§</span>
                    <span className="text-[10px] font-bold tracking-wide">Legal</span>
                </Link>
                <form action={logout}>
                    <button type="submit" className="flex flex-col items-center gap-1.5 p-2 text-white/50 hover:text-red-400 transition-colors">
                        <LogOut className="w-5 h-5" />
                        <span className="text-[10px] font-bold tracking-wide">Abmelden</span>
                    </button>
                </form>
            </nav>
        </div>
    )
}
