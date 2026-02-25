'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    FolderSearch,
    RefreshCw,
    Zap,
    HardDrive,
    ChevronRight,
    Search,
    LayoutDashboard,
    GitBranch,
    Users
} from 'lucide-react';

export default function Home() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const projectFromUrl = searchParams.get('project');

    const [workspacePath, setWorkspacePath] = useState('/workspace/Project_Web');
    const [projects, setProjects] = useState<any[]>([]);
    const [selectedProject, setSelectedProject] = useState<any>(null);
    const [projectStats, setProjectStats] = useState<any>(null);
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        handleScanWorkspace();
    }, []);

    const handleScanWorkspace = async () => {
        setScanning(true);
        setError('');
        try {
            const res = await fetch('/api/git/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ workspacePath })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setProjects(data.projects);

            if (projectFromUrl) {
                const found = data.projects.find((p: any) => p.path === projectFromUrl);
                if (found) setSelectedProject(found);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setScanning(false);
        }
    };

    const handleSelectProject = async (project: any) => {
        setSelectedProject(project);
        setProjectStats(null); // Clear previous stats
        router.push(`/?project=${encodeURIComponent(project.path)}`);

        try {
            const res = await fetch('/api/git/repo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectPath: project.path })
            });
            const data = await res.json();
            if (data.stats) setProjectStats(data.stats);
        } catch (err) {
            console.error('Failed to fetch project stats', err);
        }
    };

    return (
        <div className="flex-1 flex flex-col p-8 overflow-hidden gap-8">
            <header className="glass-panel p-6 rounded-3xl flex items-center justify-between shrink-0 shadow-lg border-indigo-500/5">
                <div className="flex items-center gap-4">
                    <div className="bg-indigo-500/10 p-4 rounded-2xl border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.15)]">
                        <LayoutDashboard className="text-indigo-400 w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-white uppercase">Project Hub</h1>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            Workspace Management & Statistics
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 w-1/2">
                    <div className="flex-1 relative group">
                        <HardDrive className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                        <input
                            type="text"
                            value={workspacePath}
                            onChange={(e) => setWorkspacePath(e.target.value)}
                            placeholder="Enter workspace absolute path..."
                            className="w-full bg-slate-950/40 border border-slate-800/50 rounded-2xl pl-11 pr-4 py-3.5 text-sm outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all text-slate-200"
                        />
                    </div>
                    <button
                        onClick={handleScanWorkspace}
                        disabled={scanning}
                        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-8 py-3.5 rounded-2xl text-sm font-black transition-all flex items-center gap-3 shadow-lg shadow-indigo-500/20 active:scale-95 uppercase tracking-widest"
                    >
                        {scanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FolderSearch className="w-4 h-4" />}
                        Scan
                    </button>
                </div>
            </header>

            <div className="flex-1 grid grid-cols-12 gap-8 min-h-0">
                {/* Project List */}
                <div className="col-span-4 flex flex-col gap-4 min-h-0">
                    <div className="glass-panel border-slate-800/40 rounded-3xl flex flex-col flex-1 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-800/50 flex items-center justify-between bg-slate-900/20">
                            <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-3">
                                <Search className="w-4 h-4 text-indigo-400" /> Active Projects
                            </span>
                            <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black text-indigo-400">{projects.length} Found</span>
                        </div>
                        <div className="overflow-y-auto p-4 space-y-2 flex-1 custom-scrollbar">
                            {projects.map(p => (
                                <button
                                    key={p.path}
                                    onClick={() => handleSelectProject(p)}
                                    className={`w-full text-left px-5 py-4 rounded-2xl text-sm transition-all flex items-center justify-between group ${selectedProject?.path === p.path ? 'bg-indigo-500/10 text-indigo-300 ring-2 ring-indigo-500/20 shadow-xl' : 'hover:bg-slate-800/40 text-slate-400'}`}
                                >
                                    <div className="flex flex-col">
                                        <span className="font-bold tracking-tight">{p.name}</span>
                                        <span className="text-[10px] opacity-40 truncate max-w-[200px]">{p.path}</span>
                                    </div>
                                    <ChevronRight className={`w-5 h-5 transition-transform ${selectedProject?.path === p.path ? 'rotate-90 text-indigo-400' : 'opacity-0 group-hover:opacity-100'}`} />
                                </button>
                            ))}
                            {projects.length === 0 && !scanning && (
                                <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-4 py-20">
                                    <Search className="w-12 h-12 opacity-20" />
                                    <p className="text-xs font-bold uppercase tracking-widest italic">No projects detected</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Project Details / Quick Nav */}
                <div className="col-span-8 flex flex-col gap-6 min-h-0 overflow-y-auto custom-scrollbar pr-2 pb-8">
                    {selectedProject ? (
                        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-10 duration-500">
                            <div className="glass-panel p-8 rounded-[40px] border-indigo-500/10 bg-linear-to-br from-indigo-500/3 to-transparent flex flex-col gap-6 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 -mr-32 -mt-32 rounded-full blur-[80px] group-hover:bg-indigo-500/10 transition-colors"></div>

                                <div className="flex items-end justify-between border-b border-slate-800/50 pb-6">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-3">
                                            <Zap className="w-5 h-5 text-indigo-400 fill-indigo-400/20" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500/60">Selected Project</span>
                                        </div>
                                        <h2 className="text-5xl font-black text-white tracking-tighter">{selectedProject.name}</h2>
                                    </div>
                                    <div className="flex items-center gap-8">
                                        {projectStats && (
                                            <div className="flex gap-10 mr-8 border-r border-slate-800/50 pr-8">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Commits</span>
                                                    <span className="text-xl font-black text-white">{projectStats.totalCommits}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Authors</span>
                                                    <span className="text-xl font-black text-white">{projectStats.authorsCount}</span>
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">Git Root</span>
                                            <span className="text-xs font-mono text-indigo-400/80">{selectedProject.path}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-6">
                                    <QuickNavCard
                                        title="Git Hub"
                                        desc="Manage branches & sync"
                                        icon={GitBranch}
                                        href={`/git?project=${encodeURIComponent(selectedProject.path)}`}
                                        color="text-indigo-400"
                                        bgColor="bg-indigo-400/10"
                                    />
                                    <QuickNavCard
                                        title="Compare Studio"
                                        desc="Diff review & filters"
                                        icon={Search}
                                        href={`/compare?project=${encodeURIComponent(selectedProject.path)}`}
                                        color="text-emerald-400"
                                        bgColor="bg-emerald-400/10"
                                    />
                                    <QuickNavCard
                                        title="Senior Audit"
                                        desc="Advanced log analysis"
                                        icon={Users}
                                        href={`/audit?project=${encodeURIComponent(selectedProject.path)}`}
                                        color="text-amber-400"
                                        bgColor="bg-amber-400/10"
                                    />
                                </div>
                            </div>

                            {/* Stats or placeholder for more dashboard info */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="glass-panel p-6 rounded-3xl border-slate-800/50 flex flex-col gap-4">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-800/40 pb-2">Recent Activity</h3>
                                    <div className="flex-1 flex flex-col gap-3 min-h-0 overflow-y-auto custom-scrollbar">
                                        {projectStats?.activity?.map((log: any) => (
                                            <div key={log.hash} className="bg-slate-900/40 p-3 rounded-2xl border border-white/5 flex flex-col gap-1 group hover:border-indigo-500/20 transition-all">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[9px] font-black text-indigo-400/60 truncate max-w-[100px]">{log.author_name}</span>
                                                    <span className="text-[8px] font-mono text-slate-600">{log.hash.slice(0, 7)}</span>
                                                </div>
                                                <p className="text-[11px] text-slate-300 font-bold truncate">{log.message}</p>
                                            </div>
                                        ))}
                                        {!projectStats && (
                                            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-600 italic py-8">
                                                <RefreshCw className="w-6 h-6 opacity-20 animate-spin" />
                                                <p className="text-[9px] font-bold uppercase tracking-widest">Loading intelligence...</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="glass-panel p-6 rounded-3xl border-slate-800/50 flex flex-col gap-4">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-800/40 pb-2">Health Status</h3>
                                    <div className="flex-1 flex flex-col justify-center gap-4 py-4">
                                        <div className="flex items-center justify-between bg-slate-900/40 p-3 rounded-2xl border border-white/5">
                                            <span className="text-xs font-bold text-slate-400 group-hover:text-slate-200 transition-colors">Workspace Status</span>
                                            {projectStats?.isDirty ? (
                                                <span className="text-[10px] font-black uppercase px-2 py-1 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div> Dirty
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-black uppercase px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Clean
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between bg-slate-900/40 p-3 rounded-2xl border border-white/5">
                                            <span className="text-xs font-bold text-slate-400">Git Connectivity</span>
                                            <span className="text-[10px] font-black uppercase px-2 py-1 rounded-lg bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">Active</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-600 gap-6 border-2 border-dashed border-slate-800/50 rounded-[40px] animate-pulse">
                            <div className="bg-slate-800/20 p-8 rounded-full">
                                <Zap className="w-16 h-16 opacity-10" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-black text-slate-500 uppercase tracking-tighter">No Project Active</h3>
                                <p className="text-xs font-bold uppercase tracking-widest opacity-40 mt-1">Select a project from the left panel to begin</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {error && (
                <div className="fixed bottom-8 right-8 p-5 bg-rose-500/20 backdrop-blur-2xl border border-rose-500/30 text-rose-100 rounded-3xl flex items-center gap-4 shadow-2xl animate-in slide-in-from-bottom-5 duration-500 z-50">
                    <div className="bg-rose-500 p-2 rounded-full shadow-lg shadow-rose-500/20">
                        <Zap className="w-4 h-4 fill-white text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">System Warning</span>
                        <span className="text-sm font-semibold">{error}</span>
                    </div>
                    <button onClick={() => setError('')} className="ml-4 hover:scale-110 transition-transform p-1 bg-rose-500/10 rounded-lg">&times;</button>
                </div>
            )}
        </div>
    );
}

function QuickNavCard({ title, desc, icon: Icon, href, color, bgColor }: any) {
    const router = useRouter();
    return (
        <button
            onClick={() => router.push(href)}
            className="flex flex-col p-6 rounded-[32px] bg-slate-900/40 border border-white/5 hover:border-indigo-500/30 hover:bg-slate-900 transition-all text-left group shadow-sm hover:shadow-indigo-500/10"
        >
            <div className={`p-3 rounded-2xl ${bgColor} ${color} w-fit mb-4 group-hover:scale-110 transition-transform`}>
                <Icon className="w-6 h-6" />
            </div>
            <h4 className="font-black text-white tracking-tight uppercase group-hover:text-indigo-400 transition-colors">{title}</h4>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{desc}</p>
        </button>
    );
}
