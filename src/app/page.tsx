'use client';

import { useState, useEffect } from 'react';
import {
    GitBranch, Download, RefreshCw, Layers, CheckSquare, Square,
    FolderSearch, Calendar, Users, ChevronRight, Search, Zap, HardDrive
} from 'lucide-react';
import FileList from '@/components/FileList';
import DiffViewer from '@/components/DiffViewer';
import CustomSelect from '@/components/CustomSelect';
import CustomDatePicker from '@/components/CustomDatePicker';

export default function Home() {
    const [workspacePath, setWorkspacePath] = useState('/workspace/Project_Web');
    const [projects, setProjects] = useState<any[]>([]);
    const [selectedProject, setSelectedProject] = useState<any>(null);
    const [repoInfo, setRepoInfo] = useState<any>(null);

    const [fromBranch, setFromBranch] = useState('');
    const [toBranch, setToBranch] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [availableAuthors, setAvailableAuthors] = useState<string[]>([]);
    const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);

    const [diffResults, setDiffResults] = useState<any[]>([]);
    const [selectedFile, setSelectedFile] = useState<any>(null);
    const [selectedFilesForExport, setSelectedFilesForExport] = useState<string[]>([]);

    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
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
        } catch (err: any) {
            setError(err.message);
        } finally {
            setScanning(false);
        }
    };

    const handleSelectProject = async (project: any) => {
        setSelectedProject(project);
        setLoading(true);
        setDiffResults([]);
        setAvailableAuthors([]);
        setSelectedAuthors([]);
        try {
            const res = await fetch('/api/git/repo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectPath: project.path })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setRepoInfo(data);
            setFromBranch(data.branches.includes('main') ? 'main' : data.branches[0]);
            setToBranch(data.current);
            fetchAuthors(project.path);
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
        if (!selectedProject) return;
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/git/diff', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectPath: selectedProject.path,
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
        if (selectedFilesForExport.length === 0 || !selectedProject) return;
        setExporting(true);
        try {
            const res = await fetch('/api/git/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectPath: selectedProject.path,
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

    const toggleFileSelection = (filePath: string) => {
        setSelectedFilesForExport(prev =>
            prev.includes(filePath)
                ? prev.filter(f => f !== filePath)
                : [...prev, filePath]
        );
    };

    const selectAll = () => setSelectedFilesForExport(diffResults.map(f => f.file));
    const selectNone = () => setSelectedFilesForExport([]);

    return (
        <main className="max-w-[1600px] mx-auto p-6 flex flex-col h-screen overflow-hidden gap-6 interactive-bg relative">
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20 bg-[radial-gradient(circle_at_50%_-20%,#4f46e5,transparent_50%)]"></div>

            {/* Header section with Workspace Scan */}
            <header className="glass-panel p-5 rounded-3xl flex items-center gap-8 shrink-0 relative z-10 shadow-indigo-500/5">
                <div className="flex items-center gap-4 pr-8 border-r border-slate-800/50">
                    <div className="bg-indigo-500/10 p-3 rounded-2xl border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                        <Zap className="text-indigo-400 w-6 h-6 fill-indigo-400/20" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-white">CODE CHECKER</h1>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> Workspace Engine v1.0
                        </p>
                    </div>
                </div>

                <div className="flex-1 flex items-center gap-4">
                    <div className="flex-1 relative group">
                        <HardDrive className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                        <input
                            type="text"
                            value={workspacePath}
                            onChange={(e) => setWorkspacePath(e.target.value)}
                            placeholder="Enter workspace absolute path..."
                            className="w-full bg-slate-950/40 border border-slate-800/50 rounded-2xl pl-11 pr-4 py-3 text-sm outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all text-slate-200"
                        />
                    </div>
                    <button
                        onClick={handleScanWorkspace}
                        disabled={scanning}
                        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-3 rounded-2xl text-sm font-bold transition-all flex items-center gap-3 shadow-lg shadow-indigo-500/20 active:scale-95"
                    >
                        {scanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FolderSearch className="w-4 h-4" />}
                        Scan Workspace
                    </button>
                </div>
            </header>

            <div className="flex-1 grid grid-cols-12 gap-6 min-h-0 relative z-10">
                {/* Project Selection & Filtering */}
                <aside className="col-span-3 flex flex-col gap-5 min-h-0 overflow-y-auto pr-2 custom-scrollbar">
                    {/* Projects List */}
                    <div className="glass-panel border-slate-800/40 rounded-3xl flex flex-col min-h-0 min-h-[200px] shadow-sm">
                        <div className="p-4 border-b border-slate-800/50 flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                <Search className="w-3.5 h-3.5 text-indigo-400" /> Projects
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-bold text-slate-400">{projects.length}</span>
                        </div>
                        <div className="overflow-y-auto p-3 space-y-1.5 flex-1 custom-scrollbar">
                            {projects.map(p => (
                                <button
                                    key={p.path}
                                    onClick={() => handleSelectProject(p)}
                                    className={`w-full text-left px-4 py-3 rounded-2xl text-sm transition-all flex items-center justify-between group ${selectedProject?.path === p.path ? 'bg-indigo-500/10 text-indigo-300 ring-1 ring-indigo-500/20 shadow-md' : 'hover:bg-slate-800/30 text-slate-400'}`}
                                >
                                    <span className="truncate font-medium">{p.name}</span>
                                    <ChevronRight className={`w-4 h-4 transition-transform ${selectedProject?.path === p.path ? 'rotate-90 text-indigo-400' : 'opacity-0 group-hover:opacity-100'}`} />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Filters Panel */}
                    <div className="glass-panel p-6 rounded-3xl flex flex-col gap-6 shrink-0 shadow-lg border-indigo-500/5 relative z-20">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-500 uppercase border-b border-slate-800/50 pb-2">
                                <GitBranch className="w-3.5 h-3.5 text-indigo-400" /> Reference Selection
                            </div>
                            <div className="flex flex-col gap-4">
                                <CustomSelect
                                    label="From Reference"
                                    value={fromBranch}
                                    options={repoInfo?.branches || []}
                                    onChange={setFromBranch}
                                />
                                <CustomSelect
                                    label="To Reference"
                                    value={toBranch}
                                    options={repoInfo?.branches || []}
                                    onChange={setToBranch}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-500 uppercase border-b border-slate-800/50 pb-2">
                                <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Date Range
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                <CustomDatePicker
                                    label="Since Commits"
                                    value={startDate}
                                    onChange={setStartDate}
                                />
                                <CustomDatePicker
                                    label="Until Commits"
                                    value={endDate}
                                    onChange={setEndDate}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center border-b border-slate-800/50 pb-2">
                                <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                                    <Users className="w-3.5 h-3.5 text-indigo-400" /> Authors
                                </div>
                                <button
                                    onClick={() => setSelectedAuthors(availableAuthors)}
                                    className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                                >
                                    Select All
                                </button>
                            </div>
                            <div className="bg-slate-950/40 border border-slate-800/50 rounded-2xl max-h-[150px] overflow-y-auto p-2">
                                {availableAuthors.length === 0 ? (
                                    <div className="text-[10px] text-slate-600 italic p-4 text-center">Scan workspace and select any project</div>
                                ) : (
                                    availableAuthors.map(author => (
                                        <label key={author} className="flex items-center gap-3 p-2.5 hover:bg-slate-800/50 rounded-xl cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={selectedAuthors.includes(author)}
                                                onChange={() => {
                                                    setSelectedAuthors(prev => prev.includes(author) ? prev.filter(a => a !== author) : [...prev, author])
                                                }}
                                                className="w-4 h-4 rounded-md bg-slate-800 border-slate-700 text-indigo-500 focus:ring-0 cursor-pointer"
                                            />
                                            <span className="text-xs text-slate-400 truncate group-hover:text-slate-200 transition-colors">{author}</span>
                                        </label>
                                    ))
                                )}
                            </div>
                        </div>

                        <button
                            onClick={handleCompare}
                            disabled={!selectedProject || loading}
                            className="bg-indigo-600/10 hover:bg-primary-600 text-indigo-400 hover:text-white border border-indigo-500/20 py-3.5 rounded-2xl text-sm font-black tracking-widest uppercase transition-all flex items-center justify-center gap-3 shadow-sm hover:shadow-indigo-500/10"
                        >
                            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                            Compare Changes
                        </button>
                    </div>

                    <div className="mt-auto pb-4 relative z-10">
                        <button
                            onClick={handleExport}
                            disabled={exporting || diffResults.length === 0}
                            className="w-full relative group"
                        >
                            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl blur opacity-25 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>
                            <div className="relative bg-[#020617] hover:bg-slate-900 border border-emerald-500/20 text-white py-4 rounded-3xl text-sm font-black tracking-[0.2em] uppercase flex items-center justify-center gap-3 shadow-2xl transition-all active:scale-[0.98]">
                                {exporting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5 text-emerald-400" />}
                                Export ZIP ({selectedFilesForExport.length})
                            </div>
                        </button>
                    </div>
                </aside>

                {/* File List & Diff Viewer */}
                <div className="col-span-9 grid grid-cols-12 gap-6 min-h-0">
                    <div className="col-span-4 flex flex-col min-h-0 bg-slate-900/20 rounded-3xl border border-slate-800/50 overflow-hidden shadow-inner backdrop-blur-sm">
                        <FileList
                            files={diffResults}
                            selectedFiles={selectedFilesForExport}
                            onToggleFile={toggleFileSelection}
                            onViewDiff={(file: any) => setSelectedFile(file)}
                        />
                    </div>
                    <div className="col-span-8 flex flex-col min-h-0 glass-panel rounded-3xl border-slate-800/60 overflow-hidden shadow-2xl">
                        <DiffViewer
                            fileName={selectedFile?.file || ''}
                            diff={selectedFile?.diff || ''}
                        />
                    </div>
                </div>
            </div>

            {error && (
                <div className="fixed bottom-8 right-8 p-5 bg-rose-500/20 backdrop-blur-2xl border border-rose-500/30 text-rose-100 rounded-3xl flex items-center gap-4 shadow-2xl animate-in slide-in-from-bottom-5 duration-500 z-50">
                    <div className="bg-rose-500 p-2 rounded-full shadow-lg shadow-rose-500/20">
                        <Zap className="w-4 h-4 fill-white text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">System Notification</span>
                        <span className="text-sm font-semibold">{error}</span>
                    </div>
                    <button onClick={() => setError('')} className="ml-4 hover:scale-110 transition-transform p-1 bg-rose-500/10 rounded-lg">&times;</button>
                </div>
            )}

            <footer className="mt-auto shrink-0 flex justify-between items-center pt-2 text-[9px] font-black uppercase tracking-[0.4em] text-slate-700/60 pointer-events-none">
                <div className="flex items-center gap-8">
                    <span>MMXXVI Antigravity</span>
                    <span className="flex items-center gap-2"><div className="w-1 h-1 bg-slate-800 rounded-full"></div> Sys Status: Active</span>
                </div>
                <span>Workspace Controller Rev 4.0</span>
            </footer>
        </main>
    );
}
