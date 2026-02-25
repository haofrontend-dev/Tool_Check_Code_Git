'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
    Search,
    RefreshCw,
    Download,
    Calendar,
    Users,
    GitBranch,
    Zap,
    RefreshCcw
} from 'lucide-react';
import FileList from '@/components/FileList';
import DiffViewer from '@/components/DiffViewer';
import CustomSelect from '@/components/CustomSelect';
import CustomDatePicker from '@/components/CustomDatePicker';

export default function ComparePage() {
    return (
        <Suspense fallback={<div className="flex-1 flex items-center justify-center"><RefreshCw className="w-8 h-8 animate-spin text-emerald-500" /></div>}>
            <CompareStudio />
        </Suspense>
    );
}

function CompareStudio() {
    const searchParams = useSearchParams();
    const projectPath = searchParams.get('project');

    const [selectedProject, setSelectedProject] = useState<any>(null);
    const [repoInfo, setRepoInfo] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Filtering State
    const [fromBranch, setFromBranch] = useState('');
    const [toBranch, setToBranch] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [availableAuthors, setAvailableAuthors] = useState<string[]>([]);
    const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);

    const [diffResults, setDiffResults] = useState<any[]>([]);
    const [selectedFile, setSelectedFile] = useState<any>(null);
    const [selectedFilesForExport, setSelectedFilesForExport] = useState<string[]>([]);
    const [exporting, setExporting] = useState(false);
    const [swapping, setSwapping] = useState(false);

    useEffect(() => {
        if (projectPath) {
            handleSelectProject(projectPath);
        }
    }, [projectPath]);

    const handleSelectProject = async (path: string) => {
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
            setFromBranch(data.branches.includes('main') ? 'main' : data.branches[0]);
            setToBranch(data.current);
            setSelectedProject({ name: path.split('/').pop(), path });
            fetchAuthors(path);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchAuthors = async (path: string) => {
        try {
            const res = await fetch('/api/git/authors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectPath: path, startDate, endDate })
            });
            const data = await res.json();
            if (data.authors) {
                setAvailableAuthors(data.authors);
                setSelectedAuthors(data.authors);
            }
        } catch (err) {
            console.error('Failed to fetch authors', err);
        }
    };

    const handleCompare = async () => {
        if (!projectPath) return;
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/git/diff', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectPath,
                    from: fromBranch,
                    to: toBranch,
                    startDate,
                    endDate,
                    authors: selectedAuthors
                })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setDiffResults(data.files);
            setSelectedFilesForExport(data.files.map((f: any) => f.file));
            if (data.files.length > 0) setSelectedFile(data.files[0]);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        if (selectedFilesForExport.length === 0 || !projectPath) return;
        setExporting(true);
        try {
            const res = await fetch('/api/git/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectPath,
                    to: toBranch,
                    selectedFiles: selectedFilesForExport
                })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            const link = document.createElement('a');
            link.href = `data:application/zip;base64,${data.zip}`;
            link.download = `changes_${selectedProject.name}_${new Date().toISOString().split('T')[0]}.zip`;
            link.click();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setExporting(false);
        }
    };

    const handleSwapComment = async () => {
        if (!projectPath || !selectedFile) return;
        setSwapping(true);
        try {
            const res = await fetch('/api/git/swap-comment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectPath,
                    filePath: selectedFile.file
                })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            handleCompare();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSwapping(false);
        }
    };

    const toggleFileSelection = (filePath: string) => {
        setSelectedFilesForExport(prev =>
            prev.includes(filePath)
                ? prev.filter(f => f !== filePath)
                : [...prev, filePath]
        );
    };

    if (!projectPath) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-600 gap-6">
                <Search className="w-16 h-16 opacity-10" />
                <p className="text-sm font-black uppercase tracking-[0.2em]">Please select a project from the Dashboard first</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col p-8 gap-8 overflow-hidden">
            <header className="flex items-center justify-between border-b border-slate-800/50 pb-6 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                        <Search className="text-emerald-400 w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight uppercase">Compare Studio</h1>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{selectedProject?.name}</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={handleCompare}
                        disabled={loading}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-3 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                    >
                        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
                        Run Comparison
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={exporting || diffResults.length === 0}
                        className="bg-slate-900 hover:bg-slate-800 text-emerald-400 px-6 py-3.5 rounded-2xl border border-slate-800 font-black text-[10px] uppercase tracking-widest flex items-center gap-3 transition-all active:scale-95"
                    >
                        {exporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        Export ZIP
                    </button>
                </div>
            </header>

            <div className="flex-1 grid grid-cols-12 gap-8 min-h-0">
                {/* Filters sidebar */}
                <aside className="col-span-3 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">
                    <div className="glass-panel p-6 rounded-[32px] flex flex-col gap-6 shadow-sm border-slate-800/40">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-500 uppercase border-b border-slate-800/50 pb-2">
                                <GitBranch className="w-3.5 h-3.5 text-emerald-400" /> References
                            </div>
                            <div className="flex flex-col gap-4">
                                <CustomSelect label="From Base" value={fromBranch} options={repoInfo?.branches || []} onChange={setFromBranch} />
                                <CustomSelect label="To Target" value={toBranch} options={repoInfo?.branches || []} onChange={setToBranch} />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-500 uppercase border-b border-slate-800/50 pb-2">
                                <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Commits Timeline
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                <CustomDatePicker label="Since" value={startDate} onChange={setStartDate} />
                                <CustomDatePicker label="Until" value={endDate} onChange={setEndDate} />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center border-b border-slate-800/50 pb-2">
                                <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                                    <Users className="w-3.5 h-3.5 text-emerald-400" /> Authors
                                </div>
                                <button onClick={() => setSelectedAuthors(availableAuthors)} className="text-[10px] font-black text-emerald-500 hover:text-emerald-400 transition-colors uppercase">All</button>
                            </div>
                            <div className="bg-slate-950/40 border border-slate-800/50 rounded-2xl max-h-[200px] overflow-y-auto p-2 custom-scrollbar">
                                {availableAuthors.map(author => (
                                    <label key={author} className="flex items-center gap-3 p-2.5 hover:bg-slate-800/50 rounded-xl cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={selectedAuthors.includes(author)}
                                            onChange={() => setSelectedAuthors(prev => prev.includes(author) ? prev.filter(a => a !== author) : [...prev, author])}
                                            className="w-4 h-4 rounded-md bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer"
                                        />
                                        <span className="text-xs text-slate-400 truncate group-hover:text-slate-200 transition-colors">{author}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Diff Viewer Area */}
                <div className="col-span-9 grid grid-cols-12 gap-6 min-h-0">
                    <div className="col-span-4 flex flex-col min-h-0 bg-slate-900/20 rounded-[32px] border border-slate-800/50 overflow-hidden shadow-inner backdrop-blur-sm">
                        <FileList
                            files={diffResults}
                            selectedFiles={selectedFilesForExport}
                            onToggleFile={toggleFileSelection}
                            onViewDiff={(file: any) => setSelectedFile(file)}
                        />
                    </div>
                    <div className="col-span-8 flex flex-col min-h-0 glass-panel rounded-[32px] border-slate-800/60 overflow-hidden shadow-2xl relative">
                        {selectedFile && (
                            <div className="absolute top-4 right-4 z-20">
                                <button
                                    onClick={handleSwapComment}
                                    disabled={swapping}
                                    className="bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white px-4 py-2 rounded-xl border border-indigo-500/20 text-[10px] font-black tracking-widest uppercase flex items-center gap-2 transition-all shadow-lg active:scale-95"
                                >
                                    {swapping ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                                    Swap Comments
                                </button>
                            </div>
                        )}
                        <DiffViewer
                            fileName={selectedFile?.file || ''}
                            diff={selectedFile?.diff || ''}
                        />
                        {!selectedFile && diffResults.length === 0 && (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-700 gap-4">
                                <Search className="w-12 h-12 opacity-10" />
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-40 italic underline decoration-slate-800 underline-offset-8">Configure filters and run comparison</p>
                            </div>
                        )}
                    </div>
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
