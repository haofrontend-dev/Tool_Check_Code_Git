'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
    LayoutDashboard,
    GitBranch,
    Search,
    Zap,
    Users,
    Settings
} from 'lucide-react';

export default function SidebarNav() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const projectPath = searchParams.get('project');

    const navItems = [
        { name: 'Dashboard', icon: LayoutDashboard, href: '/' },
        { name: 'Git Hub', icon: GitBranch, href: '/git' },
        { name: 'Compare', icon: Search, href: '/compare' },
        { name: 'Audit', icon: Users, href: '/audit' },
    ];

    return (
        <aside className="w-20 bg-slate-950/80 backdrop-blur-3xl border-r border-slate-800/50 flex flex-col items-center py-8 gap-10 shrink-0 z-100">
            <div className="bg-indigo-500/10 p-3 rounded-2xl border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                <Zap className="text-indigo-400 w-6 h-6 fill-indigo-400/20" />
            </div>

            <nav className="flex-1 flex flex-col gap-6">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    // Persist the project search param if it exists
                    const href = projectPath ? `${item.href}?project=${encodeURIComponent(projectPath)}` : item.href;

                    return (
                        <Link
                            key={item.name}
                            href={href}
                            title={item.name}
                            className={`p-3.5 rounded-2xl transition-all group relative ${isActive
                                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900 border border-transparent'
                                }`}
                        >
                            <item.icon className="w-5 h-5" />
                            {isActive && (
                                <span className="absolute left-[-2px] top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></span>
                            )}

                            <span className="absolute left-full ml-4 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 translate-x-[-10px] transition-all whitespace-nowrap z-110 border border-slate-800 shadow-2xl">
                                {item.name}
                            </span>
                        </Link>
                    );
                })}
            </nav>

            <button className="p-3.5 rounded-2xl text-slate-700 hover:text-slate-400 transition-colors">
                <Settings className="w-5 h-5" />
            </button>
        </aside>
    );
}
