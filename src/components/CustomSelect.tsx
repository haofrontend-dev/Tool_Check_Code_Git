'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, GitBranch } from 'lucide-react';

interface CustomSelectProps {
    label: string;
    value: string;
    options: string[];
    onChange: (value: string) => void;
    icon?: React.ReactNode;
}

export default function CustomSelect({ label, value, options, onChange, icon }: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = options.filter(opt =>
        opt.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-1.5 flex-1 relative" ref={containerRef}>
            <label className="text-[9px] font-bold text-slate-600 uppercase ml-1 tracking-widest">{label}</label>

            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-300 hover:border-indigo-500/30 transition-all group shadow-sm backdrop-blur-sm"
            >
                <div className="flex items-center gap-3 truncate">
                    <div className="text-indigo-400 group-hover:scale-110 transition-transform">
                        {icon || <GitBranch className="w-3.5 h-3.5" />}
                    </div>
                    <span className="truncate font-medium">{value || 'Select Reference...'}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-600 transition-transform duration-300 ${isOpen ? 'rotate-180 text-indigo-400' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-slate-950 border border-slate-800 rounded-2xl p-2 z-[60] shadow-2xl border-indigo-500/10 animate-in fade-in zoom-in-95 duration-200">
                    <div className="relative mb-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
                        <input
                            type="text"
                            placeholder="Filter..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800/50 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500/30 transition-colors"
                            autoFocus
                        />
                    </div>
                    <div className="max-h-[200px] overflow-y-auto custom-scrollbar p-1 space-y-1">
                        {filteredOptions.length === 0 ? (
                            <div className="text-[10px] text-slate-600 italic py-6 text-center">No matches found</div>
                        ) : (
                            filteredOptions.map(opt => (
                                <button
                                    key={opt}
                                    onClick={() => {
                                        onChange(opt);
                                        setIsOpen(false);
                                        setSearchTerm('');
                                    }}
                                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all flex items-center gap-3 ${opt === value ? 'bg-indigo-500/10 text-indigo-300' : 'hover:bg-slate-800/50 text-slate-400'}`}
                                >
                                    <GitBranch className={`w-3 h-3 ${opt === value ? 'text-indigo-400' : 'opacity-20'}`} />
                                    <span className="truncate">{opt}</span>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
