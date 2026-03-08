import { createClient } from '@/utils/supabase/server'
import { logout } from '@/app/auth/actions'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Sparkles, LayoutDashboard, Upload, LogOut } from 'lucide-react'

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
        <div className="min-h-screen bg-[#060406] flex font-manrope">
            {/* Sidebar */}
            <aside className="fixed top-0 left-0 h-full w-64 bg-white/[0.03] border-r border-white/10 flex flex-col p-6 z-40">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 mb-10">
                    <div className="w-9 h-9 bg-[#9333EA] rounded-xl flex items-center justify-center shrink-0">
                        <Sparkles className="text-white w-5 h-5" />
                    </div>
                    <span className="text-xl font-bold text-white tracking-tight">Kognitify</span>
                </Link>

                {/* Navigation */}
                <nav className="flex-1 space-y-1">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-all text-sm font-medium group"
                    >
                        <LayoutDashboard className="w-4 h-4 group-hover:text-[#9333EA] transition-colors" />
                        Mein Dashboard
                    </Link>
                    <Link
                        href="/upload"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-all text-sm font-medium group"
                    >
                        <Upload className="w-4 h-4 group-hover:text-[#9333EA] transition-colors" />
                        Hochladen
                    </Link>
                </nav>

                {/* User + Logout */}
                <div className="border-t border-white/10 pt-4 space-y-3">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-8 h-8 rounded-full bg-[#9333EA]/30 border border-[#9333EA]/40 flex items-center justify-center text-xs font-bold text-[#9333EA]">
                            {initial}
                        </div>
                        <span className="text-xs text-white/50 truncate">{email}</span>
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
            <main className="ml-64 flex-1 p-10">
                {children}
            </main>
        </div>
    )
}
