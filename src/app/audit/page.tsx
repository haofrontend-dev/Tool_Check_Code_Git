'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
    Users,
    RefreshCw,
    Zap,
    ChevronRight,
    Search,
    Clock,
    User
} from 'lucide-react';

export default function AuditPage() {
    return (
        <Suspense fallback={<div className="flex-1 flex items-center justify-center"><RefreshCw className="w-8 h-8 animate-spin text-amber-500" /></div>}>
            <SeniorAudit />
        </Suspense>
    );
}

function SeniorAudit() {
    const searchParams = useSearchParams();
    const projectPath = searchParams.get('project');

    const [selectedProject, setSelectedProject] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [advancedLogs, setAdvancedLogs] = useState<any>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (projectPath) {
            handleFetchRepo(projectPath);
        }
    }, [projectPath]);

    const handleFetchRepo = async (path: string) => {
        setLoading(true);
        try {
            const res = await fetch('/api/git/repo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectPath: path })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setSelectedProject({ name: path.split('/').pop(), path, current: data.current, branches: data.branches });
            // Initial log fetch for current branch vs main
            handleFetchAdvancedLogs(path, 'main', data.current);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFetchAdvancedLogs = async (path: string, from: string, to: string) => {
        setLoading(true);
        try {
            const res = await fetch('/api/git/logs-advanced', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectPath: path, from, to })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setAdvancedLogs(data.grouped);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!projectPath) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-600 gap-6">
                <Users className="w-16 h-16 opacity-10" />
                <p className="text-sm font-black uppercase tracking-[0.2em]">Please select a project from the Dashboard first</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col p-8 gap-8 overflow-hidden">
            <header className="flex items-center justify-between border-b border-slate-800/50 pb-6 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="bg-amber-500/10 p-4 rounded-2xl border border-amber-500/20 shadow-lg shadow-amber-500/5">
                        <Users className="text-amber-400 w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight uppercase">Senior Audit</h1>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{selectedProject?.name} • Logic Analytics</p>
                    </div>
                </div>
                <button
                    onClick={() => handleFetchRepo(projectPath)}
                    className="bg-slate-900 hover:bg-slate-800 text-amber-400 px-6 py-3 rounded-2xl border border-slate-800 font-black text-[10px] uppercase tracking-widest flex items-center gap-3 transition-all"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Feed
                </button>
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                {advancedLogs ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 pb-8">
                        {Object.entries(advancedLogs).map(([category, commits]: [string, any]) => (
                            commits.length > 0 && (
                                <div key={category} className="glass-panel p-8 rounded-[40px] flex flex-col gap-6 shadow-sm border-slate-800/40 relative overflow-hidden group">
                                    <div className={`absolute top-0 right-0 w-32 h-32 opacity-5 -mr-16 -mt-16 rounded-full blur-3xl transition-colors ${category === 'Features' ? 'bg-indigo-500' :
                                        category === 'Bug Fixes' ? 'bg-rose-500' :
                                            category === 'Refactoring' ? 'bg-amber-500' : 'bg-slate-500'
                                        }`}></div>

                                    <div className="flex items-center justify-between border-b border-slate-800/40 pb-4">
                                        <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${category === 'Features' ? 'bg-indigo-500' :
                                                category === 'Bug Fixes' ? 'bg-rose-500' :
                                                    category === 'Refactoring' ? 'bg-amber-500' : 'bg-slate-500'
                                                }`}></div>
                                            {category}
                                        </h3>
                                        <span className="text-[10px] font-bold text-slate-500 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">{commits.length} ENTRIES</span>
                                    </div>

                                    <div className="space-y-4">
                                        {commits.map((c: any) => (
                                            <div key={c.hash} className="bg-slate-950/40 p-5 rounded-3xl border border-white/3 hover:border-indigo-500/20 transition-all group relative overflow-hidden">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-slate-900 border border-slate-800 p-2 rounded-xl">
                                                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                                                        </div>
                                                        <span className="text-[10px] font-mono text-slate-500 tracking-tighter group-hover:text-indigo-400 transition-colors uppercase">{c.hash.slice(0, 8)}</span>
                                                    </div>
                                                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{new Date(c.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                </div>
                                                <p className="text-sm text-slate-200 font-bold tracking-tight leading-relaxed mb-4">{c.message}</p>
                                                <div className="flex items-center gap-2 pt-4 border-t border-slate-800/20">
                                                    <div className="w-6 h-6 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                                                        <User className="w-3 h-3 text-indigo-400" />
                                                    </div>
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{c.author_name || c.authorName}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        ))}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center py-40 gap-6 opacity-30 italic">
                        <Zap className="w-12 h-12 text-amber-400 animate-pulse" />
                        <p className="text-sm font-black uppercase tracking-[0.2em]">Analyzing project intelligence data...</p>
                    </div>
                )}
            </div>

            {error && (
                <div className="fixed bottom-8 right-8 p-5 bg-rose-500/20 backdrop-blur-2xl border border-rose-500/30 text-rose-100 rounded-3xl flex items-center gap-4 shadow-2xl animate-in slide-in-from-bottom-5 duration-500 z-50">
                    <div className="bg-rose-500 p-2 rounded-full shadow-lg shadow-rose-500/20">
                        <Zap className="w-4 h-4 fill-white text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Audit Interruption</span>
                        <span className="text-sm font-semibold">{error}</span>
                    </div>
                    <button onClick={() => setError('')} className="ml-4 hover:scale-110 transition-transform p-1 bg-rose-500/10 rounded-lg">&times;</button>
                </div>
            )}
        </div>
    );
}
