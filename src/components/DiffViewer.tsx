import { FileCode, Terminal } from 'lucide-react';

interface DiffViewerProps {
    fileName: string;
    diff: string;
}

export default function DiffViewer({ fileName, diff }: DiffViewerProps) {
    if (!diff) return (
        <div className="h-full flex flex-col items-center justify-center text-slate-700 bg-slate-950/20 backdrop-blur-sm select-none">
            <div className="bg-slate-900 border border-slate-800/50 p-8 rounded-full mb-6 relative group">
                <div className="absolute inset-0 bg-indigo-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <FileCode className="w-16 h-16 opacity-10 relative z-10" />
            </div>
            <div className="flex flex-col items-center gap-2">
                <h4 className="text-[12px] font-black uppercase tracking-[0.4em] text-slate-600 opacity-60">Engine Standby</h4>
                <p className="text-[10px] font-medium text-slate-600/40">Select source artifact to execute diff</p>
            </div>
        </div>
    );

    const lines = diff.split('\n');

    return (
        <div className="flex flex-col h-full overflow-hidden bg-slate-950/40">
            <div className="p-5 border-b border-slate-800/50 bg-slate-900/30 flex justify-between items-center backdrop-blur-lg shrink-0">
                <div className="flex items-center gap-4">
                    <div className="bg-indigo-500/10 p-2.5 rounded-xl border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
                        <Terminal className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div className="flex flex-col">
                        <h3 className="text-xs font-black text-slate-200 tracking-tight uppercase flex items-center gap-2">
                            {fileName.split('/').pop()}
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[8px] font-black border border-emerald-500/10">MODIFIED</span>
                        </h3>
                        <p className="text-[9px] text-slate-500 font-mono tracking-tighter opacity-70 truncate max-w-[500px]">{fileName}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[9px] font-black text-slate-500 tracking-[0.2em] uppercase">
                        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div> Diff-v4
                    </div>
                </div>
            </div>
            <div className="flex-1 overflow-auto p-8 custom-scrollbar bg-[linear-gradient(rgba(15,23,42,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.2)_1px,transparent_1px)] bg-[size:40px_40px]">
                <pre className="font-mono text-[11px] leading-[1.8] select-text">
                    {lines.map((line, i) => {
                        let type = 'normal';
                        if (line.startsWith('+')) type = 'add';
                        if (line.startsWith('-')) type = 'remove';
                        if (line.startsWith('@@')) type = 'meta';

                        return (
                            <div
                                key={i}
                                className={`
                  flex group transition-all duration-200
                  ${type === 'add' ? 'bg-emerald-500/10 text-emerald-300' : ''}
                  ${type === 'remove' ? 'bg-rose-500/10 text-rose-300' : ''}
                  ${type === 'meta' ? 'bg-indigo-500/5 text-indigo-400/80 mt-4 mb-2 first:mt-0 font-black tracking-widest' : ''}
                  ${type === 'normal' ? 'text-slate-500/80 hover:bg-slate-800/20' : ''}
                `}
                            >
                                <div className={`
                    w-12 shrink-0 text-right pr-4 border-r border-slate-800/40 select-none opacity-20 text-[9px] font-bold 
                    ${type === 'add' ? 'border-emerald-500/20' : ''}
                    ${type === 'remove' ? 'border-rose-500/20' : ''}
                `}>
                                    {i + 1}
                                </div>
                                <div className="pl-4 whitespace-pre-wrap flex-1 py-0.5">
                                    {line}
                                </div>
                            </div>
                        );
                    })}
                </pre>
            </div>
        </div>
    );
}
