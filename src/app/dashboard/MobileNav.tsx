'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Upload, BarChart3, LogOut } from 'lucide-react'
import { logout } from '@/app/auth/actions'

export default function MobileNav({ isAdmin }: { isAdmin: boolean }) {
    const pathname = usePathname()

    // Hilfsfunktion für Active-Styles
    const getStyles = (path: string, activeColor: string = 'text-white') => {
        const isActive = pathname === path
        return {
            link: `flex flex-col items-center gap-1 p-1 transition-all ${isActive ? activeColor : 'text-white/40 hover:text-white/70'}`,
            icon: isActive ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : ''
        }
    }

    return (
        <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[#060406]/95 backdrop-blur-md border-t border-white/10 px-1 py-3 z-50 flex items-center justify-around pb-safe">
            {/* Dashboard */}
            <Link href="/dashboard" className={getStyles('/dashboard').link}>
                <LayoutDashboard className={`w-5 h-5 ${getStyles('/dashboard').icon}`} />
                <span className="text-[10px] font-bold tracking-wide">Dashboard</span>
            </Link>

            {/* Hochladen (Highlight Farbe) */}
            <Link href="/upload" className={getStyles('/upload', 'text-[#A855F7]').link}>
                <Upload className={`w-5 h-5 ${pathname === '/upload' ? 'drop-shadow-[0_0_8px_rgba(168,85,247,0.7)]' : ''}`} />
                <span className="text-[10px] font-bold tracking-wide">Hochladen</span>
            </Link>

            {/* Kosten (Nur für Admin) */}
            {isAdmin && (
                <Link href="/dashboard/admin/stats" className={getStyles('/dashboard/admin/stats', 'text-indigo-400').link}>
                    <BarChart3 className={`w-5 h-5 ${getStyles('/dashboard/admin/stats').icon}`} />
                    <span className="text-[10px] font-bold tracking-wide">Kosten</span>
                </Link>
            )}

            {/* Legal */}
            <Link href="/impressum" className={getStyles('/impressum').link}>
                <span className={`text-xl h-5 leading-none flex items-center justify-center ${getStyles('/impressum').icon}`}>§</span>
                <span className="text-[10px] font-bold tracking-wide">Legal</span>
            </Link>

            {/* Exit (Logout) */}
            <form action={logout}>
                <button type="submit" className="flex flex-col items-center gap-1 p-1 text-white/40 hover:text-red-400 transition-colors">
                    <LogOut className="w-5 h-5" />
                    <span className="text-[10px] font-bold tracking-wide">Exit</span>
                </button>
            </form>
        </nav>
    )
}
