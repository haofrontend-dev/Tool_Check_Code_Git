'use client';

import React, { useState, useMemo } from 'react';
import {
    Folder,
    File,
    ChevronRight,
    ChevronDown,
    FilePlus,
    FileEdit,
    FileX,
    FileQuestion
} from 'lucide-react';

interface GitFile {
    path: string;
    index: string;
    working_dir: string;
}

interface TreeNode {
    name: string;
    path: string;
    type: 'file' | 'folder';
    status?: string;
    children?: Record<string, TreeNode>;
}

interface FileTreeProps {
    files: GitFile[];
    onFileClick?: (path: string) => void;
}

const getStatusDetails = (status: string) => {
    switch (status.toUpperCase()) {
        case 'M': return { icon: FileEdit, color: 'text-amber-400', label: 'Modified', bgColor: 'bg-amber-400/10' };
        case 'A': return { icon: FilePlus, color: 'text-emerald-400', label: 'Added', bgColor: 'bg-emerald-400/10' };
        case 'D': return { icon: FileX, color: 'text-rose-400', label: 'Deleted', bgColor: 'bg-rose-400/10' };
        case '?': return { icon: FileQuestion, color: 'text-slate-400', label: 'Untracked', bgColor: 'bg-slate-400/10' };
        default: return { icon: FileEdit, color: 'text-indigo-400', label: 'Modified', bgColor: 'bg-indigo-400/10' };
    }
};

const buildTree = (files: GitFile[]) => {
    const root: Record<string, TreeNode> = {};

    files.forEach(file => {
        const parts = file.path.split('/');
        let current = root;

        parts.forEach((part, index) => {
            const isFile = index === parts.length - 1;
            const fullPath = parts.slice(0, index + 1).join('/');

            if (!current[part]) {
                current[part] = {
                    name: part,
                    path: fullPath,
                    type: isFile ? 'file' : 'folder',
                    children: isFile ? undefined : {},
                    status: isFile ? (file.working_dir !== ' ' ? file.working_dir : file.index) : undefined
                };
            }
            if (!isFile) {
                current = current[part].children!;
            }
        });
    });

    return root;
};

const TreeItem = ({ node, onFileClick }: { node: TreeNode, onFileClick?: (path: string) => void }) => {
    const [isOpen, setIsOpen] = useState(true);
    const isFolder = node.type === 'folder';

    if (isFolder) {
        return (
            <div className="flex flex-col">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 py-1.5 px-3 rounded-xl hover:bg-white/5 transition-colors group text-left w-full"
                >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-600" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-600" />}
                        <Folder className="w-4 h-4 text-indigo-400/60 fill-indigo-400/5" />
                        <span className="text-xs font-bold text-slate-400 truncate">{node.name}</span>
                    </div>
                </button>
                {isOpen && node.children && (
                    <div className="ml-4 border-l border-slate-800/50 pl-2 mt-1 space-y-0.5">
                        {Object.values(node.children)
                            .sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'folder' ? -1 : 1))
                            .map(child => <TreeItem key={child.path} node={child} onFileClick={onFileClick} />)
                        }
                    </div>
                )}
            </div>
        );
    }

    const { icon: StatusIcon, color, bgColor } = getStatusDetails(node.status || 'M');

    return (
        <label
            onClick={() => onFileClick?.(node.path)}
            className="flex items-center gap-2 py-1.5 px-3 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer"
        >
            <div className="flex items-center gap-2 flex-1 min-w-0">
                <File className="w-4 h-4 text-slate-500/50" />
                <span className="text-xs font-medium text-slate-300 truncate">{node.name}</span>
            </div>
            <div className={`${bgColor} ${color} px-2 py-0.5 rounded-lg flex items-center gap-1.5 shrink-0`}>
                <StatusIcon className="w-3 h-3" />
                <span className="text-[8px] font-black uppercase tracking-tighter">{node.status || 'M'}</span>
            </div>
        </label>
    );
};

export default function FileTree({ files, onFileClick }: FileTreeProps) {
    const tree = useMemo(() => buildTree(files), [files]);

    if (files.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 opacity-20">
                <File className="w-8 h-8 mb-3" />
                <p className="text-[10px] font-black uppercase tracking-widest text-center">No workspace changes</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-1">
            {Object.values(tree)
                .sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'folder' ? -1 : 1))
                .map(node => <TreeItem key={node.path} node={node} onFileClick={onFileClick} />)
            }
        </div>
    );
}
