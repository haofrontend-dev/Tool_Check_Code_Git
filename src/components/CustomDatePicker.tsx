'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface CustomDatePickerProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
}

export default function CustomDatePicker({ label, value, onChange }: CustomDatePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const [currentMonth, setCurrentMonth] = useState(new Date());

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const startDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const handleDateSelect = (day: number) => {
        const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day + 1);
        onChange(selectedDate.toISOString().split('T')[0]);
        setIsOpen(false);
    };

    const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));

    const days = [];
    const totalDays = daysInMonth(currentMonth.getFullYear(), currentMonth.getMonth());
    const startDay = startDayOfMonth(currentMonth.getFullYear(), currentMonth.getMonth());

    // Fill empty spaces
    for (let i = 0; i < startDay; i++) {
        days.push(null);
    }
    for (let i = 1; i <= totalDays; i++) {
        days.push(i);
    }

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    return (
        <div className="flex flex-col gap-1.5 flex-1 relative" ref={containerRef}>
            <label className="text-[9px] font-bold text-slate-600 uppercase ml-1 tracking-widest">{label}</label>

            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-300 hover:border-indigo-500/30 transition-all group shadow-sm backdrop-blur-sm"
            >
                <CalendarIcon className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
                <span className="font-medium">{value || 'Select Date...'}</span>
            </button>

            {isOpen && (
                <div className="absolute top-[calc(100%+8px)] left-0 w-64 bg-slate-950 border border-slate-800 rounded-2xl p-4 z-[60] shadow-2xl border-indigo-500/10 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={prevMonth} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-200">
                            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                        </span>
                        <button onClick={nextMonth} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center mb-1">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                            <span key={`${d}-${i}`} className="text-[8px] font-bold text-slate-600">{d}</span>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                        {days.map((day, i) => (
                            <button
                                key={i}
                                disabled={!day}
                                onClick={() => day && handleDateSelect(day)}
                                className={`
                  h-7 rounded-lg text-[10px] transition-all flex items-center justify-center
                  ${!day ? 'invisible' : 'hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-200'}
                  ${day && value === new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day + 1).toISOString().split('T')[0] ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/20' : ''}
                `}
                            >
                                {day}
                            </button>
                        ))}
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-800/50 flex justify-between">
                        <button
                            onClick={() => { onChange(''); setIsOpen(false); }}
                            className="text-[9px] font-bold text-slate-600 hover:text-rose-400 uppercase tracking-tight transition-colors"
                        >
                            Clear
                        </button>
                        <button
                            onClick={() => {
                                const today = new Date().toISOString().split('T')[0];
                                onChange(today);
                                setIsOpen(false);
                            }}
                            className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-tight transition-colors"
                        >
                            Today
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
