import { FileCode, FilePlus, FileEdit, FileX, Layers } from 'lucide-react';

interface FileListProps {
    files: any[];
    selectedFiles: string[];
    onToggleFile: (file: string) => void;
    onViewDiff: (file: any) => void;
}

export default function FileList({ files, selectedFiles, onToggleFile, onViewDiff }: FileListProps) {
    const getIcon = (status: string) => {
        switch (status) {
            case 'added': return <FilePlus className="w-3.5 h-3.5 text-emerald-400" />;
            case 'deleted': return <FileX className="w-3.5 h-3.5 text-rose-400" />;
            case 'modified': return <FileEdit className="w-3.5 h-3.5 text-amber-400" />;
            default: return <FileCode className="w-3.5 h-3.5 text-indigo-400" />;
        }
    };

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="p-5 border-b border-slate-800/50 flex justify-between items-center bg-slate-900/40 sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Analysis Results</h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-950/50 border border-slate-800 text-[10px] font-bold text-slate-500">{files.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
                {files.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-20 select-none grayscale">
                        <Layers className="w-12 h-12 mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em]">No Changes Found</p>
                    </div>
                ) : (
                    files.map((file) => (
                        <div
                            key={file.file}
                            className={`flex items-center p-3 rounded-2xl transition-all cursor-pointer group border relative overflow-hidden ${selectedFiles.includes(file.file) ? 'bg-indigo-500/10 border-indigo-500/20 text-white shadow-sm ring-1 ring-indigo-500/10' : 'hover:bg-slate-800/30 text-slate-400 border-transparent hover:border-slate-800/50'}`}
                            onClick={() => onViewDiff(file)}
                        >
                            <div className="relative z-10 flex items-center justify-center mr-4 bg-slate-950/60 p-2.5 rounded-xl group-hover:scale-110 transition-transform shadow-inner">
                                {getIcon('modified')}
                            </div>
                            <div className="relative z-10 flex-1 min-w-0">
                                <p className="text-xs font-bold truncate group-hover:text-white transition-colors tracking-tight uppercase">{file.file.split('/').pop()}</p>
                                <p className="text-[9px] text-slate-500 truncate mt-1 opacity-50 font-mono tracking-tighter">{file.file}</p>
                            </div>
                            <div className="relative z-10 flex flex-col items-end gap-1.5 ml-4">
                                <input
                                    type="checkbox"
                                    checked={selectedFiles.includes(file.file)}
                                    onChange={(e) => {
                                        e.stopPropagation();
                                        onToggleFile(file.file);
                                    }}
                                    className="w-4 h-4 rounded-md bg-slate-800 border-slate-700 text-indigo-500 focus:ring-0 cursor-pointer checked:bg-indigo-500"
                                />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
