'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
    GitBranch,
    RefreshCw,
    Plus,
    Trash2,
    CheckSquare,
    Zap,
    MessageSquare,
    Tag,
    Layers,
    X,
    Code,
    ChevronDown,
    Map,
    ArrowRight,
    ExternalLink
} from 'lucide-react';
import CustomSelect from '@/components/CustomSelect';
import FileTree from '@/components/FileTree';

export default function GitPage() {
    return (
        <Suspense fallback={<div className="flex-1 flex items-center justify-center"><RefreshCw className="w-8 h-8 animate-spin text-indigo-500" /></div>}>
            <GitOperations />
        </Suspense>
    );
}

function GitOperations() {
    const searchParams = useSearchParams();
    const projectPath = searchParams.get('project');

    const [selectedProject, setSelectedProject] = useState<any>(null);
    const [repoInfo, setRepoInfo] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Git State
    const [toBranch, setToBranch] = useState('');
    const [mergeFrom, setMergeFrom] = useState('');
    const [conflicts, setConflicts] = useState<string[]>([]);
    const [branchPrefix, setBranchPrefix] = useState('feature/');
    const [commitType, setCommitType] = useState('feat:');
    const [commitMessage, setCommitMessage] = useState('');
    const [autoPush, setAutoPush] = useState(true);
    const [delivering, setDelivering] = useState(false);

    // Diff Modal State
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [fileDiff, setFileDiff] = useState<string | null>(null);
    const [diffLoading, setDiffLoading] = useState(false);

    // PR Review State
    const [isReviewingPR, setIsReviewingPR] = useState(false);
    const [prComparison, setPrComparison] = useState<any>(null);
    const [compareLoading, setCompareLoading] = useState(false);

    useEffect(() => {
        if (projectPath) {
            fetchRepoInfo(projectPath);
        }
    }, [projectPath]);

    const fetchRepoInfo = async (path: string) => {
        setLoading(true);
        try {
            const res = await fetch('/api/git/repo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectPath: path })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setRepoInfo(data);
            setToBranch(data.current);
            setSelectedProject({ name: path.split('/').pop(), path });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGitOp = async (action: string, data: any = {}) => {
        if (!projectPath) return;
        setLoading(true);
        try {
            const res = await fetch('/api/git/ops', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectPath, action, data })
            });
            const result = await res.json();

            if (result.conflict) {
                setConflicts(result.files || []);
                setError('Merge Conflict! Please resolve files below.');
                return;
            }

            if (result.error) throw new Error(result.error);
            setSuccessMsg(result.message || 'Operation successful');

            if (action === 'resolve-conflict') {
                const statusRes = await fetch('/api/git/ops', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ projectPath, action: 'status' })
                });
                const status = await statusRes.json();
                setConflicts(status.conflicted || []);
                if (status.conflicted.length === 0) setSuccessMsg('All conflicts resolved!');
            }

            fetchRepoInfo(projectPath);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCommitPush = async () => {
        if (!projectPath || !commitMessage) {
            setError('Please enter a commit message');
            return;
        }
        setDelivering(true);
        setError('');
        try {
            const res = await fetch('/api/git/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectPath,
                    message: `${commitType} ${commitMessage}`,
                    push: autoPush
                })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setSuccessMsg(`Successfully ${autoPush ? 'delivered' : 'committed'}: ${data.commit.slice(0, 7)}`);
            setCommitMessage('');
            fetchRepoInfo(projectPath); // Refresh tree after commit
        } catch (err: any) {
            setError(err.message);
        } finally {
            setDelivering(false);
        }
    };

    const handleFileClick = async (path: string) => {
        setSelectedFile(path);
        setDiffLoading(true);
        setFileDiff(null);
        try {
            const res = await fetch('/api/git/file-diff', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectPath, filePath: path })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setFileDiff(data.diff);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setDiffLoading(false);
        }
    };

    const handleProposePR = async () => {
        if (!mergeFrom || !toBranch) return;
        setCompareLoading(true);
        setIsReviewingPR(true);
        try {
            const res = await fetch('/api/git/compare', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectPath,
                    base: toBranch,
                    head: mergeFrom
                })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setPrComparison(data);
        } catch (err: any) {
            setError(err.message);
            setIsReviewingPR(false);
        } finally {
            setCompareLoading(false);
        }
    };

    if (!projectPath) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-600 gap-6">
                <GitBranch className="w-16 h-16 opacity-10" />
                <p className="text-sm font-black uppercase tracking-[0.2em]">Please select a project from the Dashboard first</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col p-8 gap-8 overflow-y-auto custom-scrollbar">
            <header className="flex items-center justify-between border-b border-slate-800/50 pb-6 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="bg-indigo-500/10 p-4 rounded-2xl border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
                        <GitBranch className="text-indigo-400 w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight uppercase">Git Workspace</h1>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{selectedProject?.name} • Branch: {toBranch}</p>
                    </div>
                </div>
                <button
                    onClick={() => handleGitOp('pull')}
                    className="bg-slate-900 hover:bg-slate-800 text-indigo-400 px-6 py-3 rounded-2xl border border-slate-800 font-black text-[10px] uppercase tracking-widest flex items-center gap-3 transition-all"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Pull Latest
                </button>
            </header>

            <div className="flex-1 grid grid-cols-12 gap-8 min-h-0">
                {/* Branch Management */}
                <div className="col-span-8 flex flex-col gap-6 pb-20">
                    <div className="glass-panel p-8 rounded-[40px] z-50 flex flex-col gap-8 shadow-sm border-slate-800/40 relative group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 -mr-16 -mt-16 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-colors"></div>

                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black text-white tracking-tight uppercase flex items-center gap-3">
                                <Zap className="w-5 h-5 text-indigo-400 fill-indigo-400/20" /> Branch Controller
                            </h2>
                            <div className="flex gap-4 items-end">
                                <CustomSelect
                                    label="Branch Type"
                                    value={branchPrefix}
                                    options={['feature/', 'fix/', 'update/']}
                                    onChange={setBranchPrefix}
                                    showSearch={false}
                                    icon={<Tag className="w-3.5 h-3.5" />}
                                    className="max-w-[150px]"
                                />
                                <div className="flex-1 relative group">
                                    <label className="text-[9px] font-black text-slate-500 uppercase ml-1 tracking-[0.2em]">Name</label>
                                    <input
                                        id="new-branch-name"
                                        type="text"
                                        placeholder="branch-name"
                                        className="w-full bg-slate-950/40 border border-slate-800/50 rounded-2xl px-5 py-[14px] text-xs outline-none focus:border-indigo-500/50 text-slate-300 transition-all mt-1.5"
                                    />
                                </div>
                                <button
                                    onClick={() => {
                                        const input = document.getElementById('new-branch-name') as HTMLInputElement;
                                        if (input.value) {
                                            handleGitOp('create-branch', { name: `${branchPrefix}${input.value.toLowerCase().replace(/\s+/g, '-')}` });
                                            input.value = '';
                                        }
                                    }}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-3 text-xs font-black uppercase tracking-widest active:scale-95"
                                >
                                    <Plus className="w-4 h-4" /> Create
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 overflow-y-auto custom-scrollbar pr-2 max-h-[500px]">
                            {repoInfo?.branches?.map((b: string) => (
                                <button
                                    key={b}
                                    onClick={() => handleGitOp('switch-branch', { name: b })}
                                    className={`px-6 py-4 rounded-3xl text-sm font-bold border transition-all flex items-center justify-between group ${toBranch === b ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-300 ring-4 ring-indigo-500/5' : 'bg-slate-900/40 border-slate-800/50 text-slate-500 hover:text-slate-300 hover:border-slate-700'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <GitBranch className={`w-4 h-4 ${toBranch === b ? 'text-indigo-400' : 'text-slate-700 group-hover:text-slate-500'}`} />
                                        <span>{b}</span>
                                    </div>
                                    {toBranch === b && <Zap className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />}
                                </button>
                            ))}
                        </div>

                        <div className="pt-6 border-t border-slate-800/50 flex flex-col gap-4">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Merge Studio</h3>
                            <div className="flex gap-3 items-end">
                                <CustomSelect
                                    label="Source Branch"
                                    value={mergeFrom}
                                    options={repoInfo?.branches?.filter((b: string) => b !== toBranch) || []}
                                    onChange={setMergeFrom}
                                    placeholder="Select source branch..."
                                    icon={<GitBranch className="w-3.5 h-3.5" />}
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleProposePR}
                                        disabled={loading || !mergeFrom}
                                        className="bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white px-6 py-4 rounded-2xl border border-indigo-500/20 transition-all text-[10px] font-black uppercase tracking-[0.1em] shadow-lg active:scale-95 disabled:opacity-50"
                                    >
                                        Propose & Review
                                    </button>
                                    <button
                                        onClick={() => mergeFrom && handleGitOp('merge', { from: mergeFrom })}
                                        disabled={loading || !mergeFrom}
                                        className="bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white px-6 py-4 rounded-2xl border border-emerald-500/20 transition-all text-[10px] font-black uppercase tracking-[0.1em] shadow-lg active:scale-95 disabled:opacity-50"
                                    >
                                        Quick Merge
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pending Changes Tree */}
                    <div className="glass-panel p-8 rounded-[40px] flex flex-col gap-6 shadow-sm border-slate-800/40 relative group">
                        <div className="flex items-center gap-3 border-b border-slate-800/50 pb-4 shrink-0">
                            <Layers className="w-4 h-4 text-indigo-400" />
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Pending Changes</h3>
                        </div>
                        <div className="shrink-0">
                            {repoInfo?.stats?.files?.length > 0 ? (
                                <FileTree files={repoInfo.stats.files} onFileClick={handleFileClick} />
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 opacity-20">
                                    <CheckSquare className="w-8 h-8 mb-3" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-center">No pending changes</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Conflict Resolver & Delivery Hub */}
                <div className="col-span-4 flex flex-col gap-8 pb-20">
                    {/* Delivery Hub */}
                    <div className="glass-panel p-8 rounded-[40px] flex flex-col gap-6 shadow-lg border-emerald-500/10 relative group grow-0">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 -mr-16 -mt-16 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors"></div>
                        <div className="flex items-center justify-between border-b border-slate-800/50 pb-4">
                            <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-emerald-500/80 uppercase">
                                <Zap className="w-4 h-4 fill-emerald-500/20" /> Delivery Hub
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <span className="text-[10px] font-bold text-slate-500">AUTO-PUSH</span>
                                <input
                                    type="checkbox"
                                    checked={autoPush}
                                    onChange={(e) => setAutoPush(e.target.checked)}
                                    className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer"
                                />
                            </label>
                        </div>
                        <div className="space-y-4">
                            <CustomSelect
                                label="Commit Type"
                                value={commitType}
                                options={['feat:', 'fix:', 'update:', 'docs:', 'refactor:', 'test:', 'chore:']}
                                onChange={setCommitType}
                                showSearch={false}
                                icon={<MessageSquare className="w-3.5 h-3.5" />}
                            />
                            <textarea
                                value={commitMessage}
                                onChange={(e) => setCommitMessage(e.target.value)}
                                placeholder="Describe your changes..."
                                className="w-full bg-slate-950/60 border border-slate-800/50 rounded-[28px] p-6 text-sm outline-none focus:border-emerald-500/30 text-slate-300 min-h-[140px] resize-none transition-all placeholder:text-slate-700 shadow-inner"
                            />
                            <button
                                onClick={handleCommitPush}
                                disabled={loading || delivering || !commitMessage}
                                className="w-full bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20 py-4 rounded-[24px] text-xs font-black tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95"
                            >
                                {delivering ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckSquare className="w-4 h-4" />}
                                Complete Delivery
                            </button>
                        </div>
                    </div>


                    {/* Conflict Resolver (Conditional) */}
                    {conflicts.length > 0 && (
                        <div className="glass-panel p-8 rounded-[40px] bg-rose-950/30 border-rose-500/20 shadow-2xl animate-in slide-in-from-bottom-10 duration-500">
                            <div className="flex items-center gap-4 mb-6 border-b border-rose-500/30 pb-4">
                                <div className="bg-rose-500/20 p-3 rounded-2xl border border-rose-500/30">
                                    <Zap className="text-rose-400 w-6 h-6 animate-pulse" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-white tracking-tight uppercase">Conflict Resolver</h2>
                                    <p className="text-[10px] font-bold text-rose-300/60 uppercase tracking-widest">{conflicts.length} Files Mismatched</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                {conflicts.map(file => (
                                    <div key={file} className="bg-slate-950/40 p-5 rounded-3xl border border-rose-500/10 flex flex-col gap-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-white truncate">{file}</span>
                                            <span className="text-[9px] text-rose-300/30 uppercase font-black mt-1">Status: Unresolved</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleGitOp('resolve-conflict', { file, strategy: 'ours' })}
                                                className="flex-1 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white py-2.5 rounded-xl border border-indigo-500/20 text-[10px] font-black uppercase transition-all"
                                            > Accept Ours </button>
                                            <button
                                                onClick={() => handleGitOp('resolve-conflict', { file, strategy: 'theirs' })}
                                                className="flex-1 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white py-2.5 rounded-xl border border-emerald-500/20 text-[10px] font-black uppercase transition-all"
                                            > Accept Theirs </button>
                                        </div>
                                    </div>
                                ))}
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

            {successMsg && (
                <div className="fixed bottom-8 right-8 p-5 bg-emerald-500/20 backdrop-blur-2xl border border-emerald-500/30 text-emerald-100 rounded-3xl flex items-center gap-4 shadow-2xl animate-in slide-in-from-bottom-5 duration-500 z-50">
                    <div className="bg-emerald-500 p-2 rounded-full shadow-lg shadow-emerald-500/20">
                        <CheckSquare className="w-4 h-4 fill-white text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Action Successful</span>
                        <span className="text-sm font-semibold">{successMsg}</span>
                    </div>
                    <button onClick={() => setSuccessMsg('')} className="ml-4 hover:scale-110 transition-transform p-1 bg-emerald-500/10 rounded-lg">&times;</button>
                </div>
            )}
            {/* Diff Modal */}
            {selectedFile && (
                <div className="fixed inset-0 z-200 flex items-center justify-center p-8 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="glass-panel w-full max-w-5xl max-h-[85vh] rounded-[40px] shadow-2xl border-indigo-500/20 flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
                        <div className="flex items-center justify-between p-8 border-b border-slate-800/50">
                            <div className="flex items-center gap-4">
                                <div className="bg-indigo-500/10 p-3 rounded-2xl">
                                    <Code className="w-5 h-5 text-indigo-400" />
                                </div>
                                <div className="flex flex-col">
                                    <h3 className="text-xl font-black text-white tracking-tight">{selectedFile.split('/').pop()}</h3>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{selectedFile}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedFile(null)}
                                className="p-3 rounded-2xl hover:bg-white/5 text-slate-500 hover:text-white transition-all active:scale-95"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-950/40">
                            {diffLoading ? (
                                <div className="h-full flex flex-col items-center justify-center gap-4 py-20">
                                    <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Analyzing changes...</p>
                                </div>
                            ) : fileDiff ? (
                                <div className="font-mono text-xs whitespace-pre leading-relaxed">
                                    {fileDiff.split('\n').map((line, i) => {
                                        const isAdd = line.startsWith('+');
                                        const isDel = line.startsWith('-');
                                        const isMeta = line.startsWith('@@') || line.startsWith('diff') || line.startsWith('index') || line.startsWith('---') || line.startsWith('+++');

                                        return (
                                            <div
                                                key={i}
                                                className={`px-4 py-0.5 -mx-4 rounded-sm transition-colors ${isAdd ? 'bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500/50' :
                                                    isDel ? 'bg-rose-500/10 text-rose-400 border-l-2 border-rose-500/50' :
                                                        isMeta ? 'text-indigo-400 opacity-60 font-black tracking-tighter' :
                                                            'text-slate-400'
                                                    }`}
                                            >
                                                {line}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center py-20 opacity-20">
                                    <Map className="w-12 h-12 mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Unable to parse diff</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* PR Review Modal */}
            {isReviewingPR && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="glass-panel w-full max-w-6xl max-h-[90vh] rounded-[40px] shadow-2xl border-indigo-500/20 flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
                        <div className="flex items-center justify-between p-8 border-b border-slate-800/50 bg-slate-900/40">
                            <div className="flex items-center gap-6">
                                <div className="bg-indigo-500/10 p-4 rounded-3xl">
                                    <GitBranch className="w-6 h-6 text-indigo-400" />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-3">
                                        <span className="bg-slate-800 px-3 py-1 rounded-lg text-xs font-bold text-slate-300">{toBranch}</span>
                                        <ArrowRight className="w-4 h-4 text-slate-600" />
                                        <span className="bg-indigo-500/20 px-3 py-1 rounded-lg text-xs font-bold text-indigo-300 border border-indigo-500/30">{mergeFrom}</span>
                                    </div>
                                    <h3 className="text-xl font-black text-white tracking-tight">Propose Code Integration</h3>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsReviewingPR(false)}
                                className="p-3 rounded-2xl hover:bg-white/5 text-slate-500 hover:text-white transition-all"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-slate-950/20">
                            {compareLoading ? (
                                <div className="h-full flex flex-col items-center justify-center gap-6 py-20">
                                    <RefreshCw className="w-10 h-10 animate-spin text-indigo-500" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Analyzing Branch Delta...</p>
                                </div>
                            ) : prComparison ? (
                                <div className="flex flex-col gap-10">
                                    {/* Stats */}
                                    <div className="grid grid-cols-4 gap-6">
                                        <div className="bg-slate-900/40 p-6 rounded-[32px] border border-slate-800/50">
                                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-1">Files Changed</span>
                                            <span className="text-2xl font-black text-white">{prComparison.summary.files.length}</span>
                                        </div>
                                        <div className="bg-emerald-500/5 p-6 rounded-[32px] border border-emerald-500/10">
                                            <span className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest block mb-1">Insertions</span>
                                            <span className="text-2xl font-black text-emerald-400">+{prComparison.summary.insertions}</span>
                                        </div>
                                        <div className="bg-rose-500/5 p-6 rounded-[32px] border border-rose-500/10">
                                            <span className="text-[10px] font-black text-rose-600/60 uppercase tracking-widest block mb-1">Deletions</span>
                                            <span className="text-2xl font-black text-rose-400">-{prComparison.summary.deletions}</span>
                                        </div>
                                        <div className="bg-indigo-500/5 p-6 rounded-[32px] border border-indigo-500/10">
                                            <span className="text-[10px] font-black text-indigo-600/60 uppercase tracking-widest block mb-1">Status</span>
                                            <span className="text-2xl font-black text-indigo-400">Ready</span>
                                        </div>
                                    </div>

                                    {/* Full Diff */}
                                    <div className="flex flex-col gap-4">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                                            <Code className="w-4 h-4" /> Comparison Diff
                                        </h4>
                                        <div className="bg-slate-950/60 border border-slate-800/50 rounded-[32px] p-8 font-mono text-xs overflow-x-auto whitespace-pre custom-scrollbar">
                                            {prComparison.diff.split('\n').map((line: string, i: number) => {
                                                const isAdd = line.startsWith('+');
                                                const isDel = line.startsWith('-');
                                                const isMeta = line.startsWith('@@') || line.startsWith('diff') || line.startsWith('index') || line.startsWith('---') || line.startsWith('+++');
                                                return (
                                                    <div
                                                        key={i}
                                                        className={`px-4 py-0.5 -mx-4 rounded-sm ${isAdd ? 'bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500/50' :
                                                                isDel ? 'bg-rose-500/10 text-rose-400 border-l-2 border-rose-500/50' :
                                                                    isMeta ? 'text-indigo-400 opacity-60 font-black tracking-tighter' :
                                                                        'text-slate-400'
                                                            }`}
                                                    >
                                                        {line}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        <div className="p-8 border-t border-slate-800/50 bg-slate-900/40 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                {prComparison?.githubUrl && (
                                    <a
                                        href={prComparison.githubUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 py-4 rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest"
                                    >
                                        <ExternalLink className="w-4 h-4" /> Open GitHub PR
                                    </a>
                                )}
                            </div>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setIsReviewingPR(false)}
                                    className="px-8 py-4 rounded-2xl text-slate-500 hover:text-slate-300 text-[10px] font-black uppercase tracking-widest transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        setIsReviewingPR(false);
                                        handleGitOp('merge', { from: mergeFrom });
                                    }}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-4 rounded-2xl transition-all shadow-lg shadow-emerald-500/20 text-[10px] font-black uppercase tracking-widest active:scale-95"
                                >
                                    Confirm Integration
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
