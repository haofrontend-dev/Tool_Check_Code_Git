'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, GitBranch } from 'lucide-react';

interface CustomSelectProps {
    label: string;
    value: string;
    options: string[];
    onChange: (value: string) => void;
    icon?: React.ReactNode;
    placeholder?: string;
    showSearch?: boolean;
    className?: string;
}

export default function CustomSelect({
    label,
    value,
    options,
    onChange,
    icon,
    placeholder = 'Select...',
    showSearch = true,
    className = ""
}: CustomSelectProps) {
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
        <div className={`flex flex-col gap-1.5 flex-1 relative ${isOpen ? 'z-50' : ''} ${className}`} ref={containerRef}>
            <label className="text-[9px] font-black text-slate-500 uppercase ml-1 tracking-[0.2em]">{label}</label>

            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full bg-slate-950/50 border border-slate-800/50 rounded-2xl px-5 py-4 text-xs text-slate-300 hover:border-indigo-500/30 transition-all group shadow-sm backdrop-blur-sm active:scale-[0.98]"
            >
                <div className="flex items-center gap-3 truncate">
                    <div className="text-indigo-400/60 group-hover:text-indigo-400 group-hover:scale-110 transition-all">
                        {icon || <GitBranch className="w-3.5 h-3.5" />}
                    </div>
                    <span className="truncate font-bold tracking-tight">{value || placeholder}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-600 transition-transform duration-500 ${isOpen ? 'rotate-180 text-indigo-400' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-[calc(100%+8px)] left-0 min-w-full bg-slate-950 border border-slate-800/40 rounded-3xl p-2 z-50 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                    {showSearch && (
                        <div className="relative mb-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-900/60 border border-slate-800/50 rounded-2xl pl-9 pr-4 py-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500/30 transition-colors"
                                autoFocus
                            />
                        </div>
                    )}
                    <div className="max-h-[240px] overflow-y-auto custom-scrollbar p-1 space-y-1">
                        {filteredOptions.length === 0 ? (
                            <div className="text-[10px] text-slate-600 italic py-6 text-center">No results found</div>
                        ) : (
                            filteredOptions.map(opt => (
                                <button
                                    key={opt}
                                    onClick={() => {
                                        onChange(opt);
                                        setIsOpen(false);
                                        setSearchTerm('');
                                    }}
                                    className={`w-full text-left px-4 py-3 rounded-2xl text-xs transition-all flex items-center justify-between group ${opt === value ? 'bg-indigo-500/10 text-indigo-300 ring-1 ring-indigo-500/20' : 'hover:bg-slate-800/40 text-slate-500 hover:text-slate-300'}`}
                                >
                                    <span className="truncate flex-1 font-bold">{opt}</span>
                                    {opt === value && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
