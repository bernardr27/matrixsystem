'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, Folder, Search, Download, Trash2,
    RefreshCw, ChevronRight, HardDrive,
    Eye, ArrowUp, Home,
    MoreVertical, LayoutGrid, List, File,
    Code, Image, FileJson, FileType, Settings,
    Database, Archive, FileCode
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MatrixFile {
    name: string;
    isFile: boolean;
    size: number | null;
    modified: string | null;
    path: string;  // always relative to matrix root
}

// File type detection for icons and labels
function getFileType(name: string): { icon: React.ElementType; label: string; color: string } {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    const map: Record<string, { icon: React.ElementType; label: string; color: string }> = {
        'tsx': { icon: Code, label: 'TypeScript JSX', color: 'text-blue-400' },
        'ts': { icon: Code, label: 'TypeScript', color: 'text-blue-400' },
        'jsx': { icon: Code, label: 'React JSX', color: 'text-cyan-400' },
        'js': { icon: FileCode, label: 'JavaScript', color: 'text-yellow-400' },
        'cjs': { icon: FileCode, label: 'CommonJS', color: 'text-yellow-400' },
        'mjs': { icon: FileCode, label: 'ES Module', color: 'text-yellow-400' },
        'json': { icon: FileJson, label: 'JSON', color: 'text-amber-400' },
        'css': { icon: FileType, label: 'Stylesheet', color: 'text-pink-400' },
        'md': { icon: FileText, label: 'Markdown', color: 'text-slate-300' },
        'txt': { icon: FileText, label: 'Text', color: 'text-slate-400' },
        'html': { icon: Code, label: 'HTML', color: 'text-orange-400' },
        'svg': { icon: Image, label: 'SVG', color: 'text-green-400' },
        'png': { icon: Image, label: 'PNG Image', color: 'text-purple-400' },
        'jpg': { icon: Image, label: 'JPEG Image', color: 'text-purple-400' },
        'jpeg': { icon: Image, label: 'JPEG Image', color: 'text-purple-400' },
        'gif': { icon: Image, label: 'GIF Image', color: 'text-purple-400' },
        'ico': { icon: Image, label: 'Icon', color: 'text-purple-400' },
        'env': { icon: Settings, label: 'Environment', color: 'text-red-400' },
        'sql': { icon: Database, label: 'SQL', color: 'text-emerald-400' },
        'bat': { icon: FileCode, label: 'Batch Script', color: 'text-green-300' },
        'ps1': { icon: FileCode, label: 'PowerShell', color: 'text-blue-300' },
        'sh': { icon: FileCode, label: 'Shell Script', color: 'text-green-300' },
        'zip': { icon: Archive, label: 'Archive', color: 'text-amber-300' },
        'gz': { icon: Archive, label: 'Archive', color: 'text-amber-300' },
        'lock': { icon: File, label: 'Lock File', color: 'text-slate-500' },
    };
    if (name.startsWith('.env')) return map['env'];
    return map[ext] || { icon: File, label: ext.toUpperCase() || 'File', color: 'text-white/30' };
}

function formatSize(bytes: number | null) {
    if (bytes === null || bytes === undefined) return '-';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDate(iso: string | null) {
    if (!iso) return '-';
    try {
        return new Date(iso).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    } catch { return '-'; }
}

export function MatrixExplorer({ isActive = false, forcedPath }: { isActive?: boolean; forcedPath?: string }) {
    // Path is always RELATIVE to matrix root. Empty string = root.
    const [currentPath, setCurrentPath] = useState('');
    const [files, setFiles] = useState<MatrixFile[]>([]);
    const [filter, setFilter] = useState('');
    const [selectedFile, setSelectedFile] = useState<MatrixFile | null>(null);
    const [fileContent, setFileContent] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [rootLabel, setRootLabel] = useState('MATRIX');
    const abortRef = useRef<AbortController | null>(null);

    // Fetch directory listing from local API
    const fetchDir = useCallback(async (dirPath: string) => {
        // Cancel any in-flight request
        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setIsLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({ action: 'list', path: dirPath });
            const res = await fetch(`/api/fs?${params}`, { signal: controller.signal });
            const data = await res.json();

            if (!res.ok) {
                setError(data.message || data.error || 'Failed to list directory');
                setFiles([]);
                return;
            }

            setFiles(data.files || []);
            setCurrentPath(data.currentPath || '');
            if (data.root) setRootLabel(data.root.split('/').pop() || 'MATRIX');
        } catch (err: unknown) {
            if (err instanceof Error && err.name !== 'AbortError') {
                setError(err.message || 'Connection failed');
                setFiles([]);
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Read file content
    const fetchFile = useCallback(async (filePath: string) => {
        setFileContent(null);
        try {
            const params = new URLSearchParams({ action: 'read', path: filePath });
            const res = await fetch(`/api/fs?${params}`);
            const data = await res.json();

            if (!res.ok) {
                setFileContent(`[Error: ${data.error}${data.message ? ' - ' + data.message : ''}]`);
                return;
            }

            setFileContent(data.content);
        } catch (err: unknown) {
            setFileContent(`[Connection Error: ${err instanceof Error ? err.message : String(err)}]`);
        }
    }, []);

    // Navigate to a relative path (always within matrix root)
    const navigate = useCallback((newPath: string) => {
        setSelectedFile(null);
        setFileContent(null);
        setFilter('');
        setCurrentPath(newPath);
    }, []);

    // Navigate up one level (bounded at matrix root)
    const navigateUp = useCallback(() => {
        if (!currentPath) return; // already at root
        const parts = currentPath.split('/').filter(Boolean);
        parts.pop();
        navigate(parts.join('/'));
    }, [currentPath, navigate]);

    // Navigate to root
    const navigateHome = useCallback(() => {
        navigate('');
    }, [navigate]);

    // Handle forced path from parent
    useEffect(() => {
        if (forcedPath !== undefined && forcedPath !== null) {
            // Normalize: strip leading slashes, "g:/matrix", "/root", etc.
            let clean = forcedPath
                .replace(/^[a-zA-Z]:[\\/]matrix[\\/]?/i, '') // strip "g:/matrix/" or "G:\matrix\"
                .replace(/^\/root\/?/i, '')                   // strip "/root"
                .replace(/^[\\/]+/, '');                       // strip leading slashes
            navigate(clean);
        }
    }, [forcedPath, navigate]);

    // Fetch on path change or activation
    useEffect(() => {
        if (isActive) {
            fetchDir(currentPath);
        }
    }, [isActive, currentPath, fetchDir]);

    // Cleanup on unmount
    useEffect(() => {
        return () => { if (abortRef.current) abortRef.current.abort(); };
    }, []);

    // Download file
    const handleDownload = (file: MatrixFile) => {
        if (!file.isFile || !fileContent) return;
        const blob = new Blob([fileContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Build breadcrumb segments
    const breadcrumbs = currentPath ? currentPath.split('/').filter(Boolean) : [];

    const filteredFiles = files.filter(f =>
        f.name.toLowerCase().includes(filter.toLowerCase())
    );

    const isAtRoot = currentPath === '';

    return (
        <div className="flex flex-col h-full bg-[#0a0f1a] overflow-hidden">
            {/* TOP BAR: Navigation + Search */}
            <div className="px-4 sm:px-6 py-3 border-b border-slate-700/20 flex items-center gap-3 shrink-0 bg-[#0a0f1a]/80 backdrop-blur-xl">
                {/* Nav buttons */}
                <div className="flex items-center gap-1.5">
                    <button type="button"
                        onClick={navigateUp}
                        disabled={isAtRoot}
                        className={cn(
                            "p-2 rounded-xl border transition-all active:scale-95",
                            isAtRoot
                                ? "border-slate-700/10 text-slate-700 cursor-not-allowed"
                                : "border-slate-700/30 text-slate-400 hover:text-white hover:border-slate-500/40 bg-slate-800/30"
                        )}
                        title="Go up"
                    >
                        <ArrowUp size={16} />
                    </button>
                    <button type="button"
                        onClick={navigateHome}
                        className={cn(
                            "p-2 rounded-xl border transition-all active:scale-95",
                            isAtRoot
                                ? "border-blue-500/20 text-blue-400 bg-blue-500/10"
                                : "border-slate-700/30 text-slate-400 hover:text-white hover:border-slate-500/40 bg-slate-800/30"
                        )}
                        title="Matrix root"
                    >
                        <Home size={16} />
                    </button>
                </div>

                {/* Breadcrumb bar */}
                <div className="flex-1 min-w-0 px-3 py-2 bg-slate-800/40 border border-slate-700/20 rounded-xl flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                    <span className="text-[10px] font-bold text-blue-400/60 uppercase tracking-widest shrink-0">matrix</span>
                    {breadcrumbs.length > 0 && <ChevronRight size={12} className="text-slate-700 shrink-0" />}
                    {breadcrumbs.map((part, i) => {
                        const segmentPath = breadcrumbs.slice(0, i + 1).join('/');
                        const isLast = i === breadcrumbs.length - 1;
                        return (
                            <React.Fragment key={i}>
                                <button type="button"
                                    onClick={() => navigate(segmentPath)}
                                    className={cn(
                                        "text-[12px] font-medium whitespace-nowrap transition-colors shrink-0",
                                        isLast ? "text-white" : "text-slate-500 hover:text-blue-400"
                                    )}
                                >
                                    {part}
                                </button>
                                {!isLast && <ChevronRight size={12} className="text-slate-700 shrink-0" />}
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* Search + View Toggle + Refresh */}
                <div className="flex items-center gap-2 shrink-0">
                    <div className="relative group hidden sm:block">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="Filter..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="w-40 lg:w-56 bg-slate-800/40 border border-slate-700/20 rounded-xl pl-9 pr-3 py-2 text-[12px] text-white focus:border-blue-500/30 transition-all outline-none placeholder:text-slate-600"
                        />
                    </div>

                    <div className="flex p-0.5 bg-slate-800/40 rounded-lg border border-slate-700/20">
                        <button type="button" onClick={() => setViewMode('list')} className={cn("p-1.5 rounded-md transition-all", viewMode === 'list' ? "bg-slate-700/50 text-white" : "text-slate-600 hover:text-slate-300")}>
                            <List size={14} />
                        </button>
                        <button type="button" onClick={() => setViewMode('grid')} className={cn("p-1.5 rounded-md transition-all", viewMode === 'grid' ? "bg-slate-700/50 text-white" : "text-slate-600 hover:text-slate-300")}>
                            <LayoutGrid size={14} />
                        </button>
                    </div>

                    <button type="button"
                        onClick={() => fetchDir(currentPath)}
                        className={cn(
                            "p-2 rounded-xl border transition-all active:scale-95",
                            isLoading
                                ? "border-blue-500/30 text-blue-400 bg-blue-500/10"
                                : "border-slate-700/30 text-slate-400 hover:text-white bg-slate-800/30"
                        )}
                    >
                        <RefreshCw size={16} className={cn(isLoading && "animate-spin")} />
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex-1 flex overflow-hidden">
                {/* FILE LIST */}
                <div className={cn(
                    "flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6",
                    selectedFile ? "hidden xl:block" : "w-full"
                )}>
                    {/* Error state */}
                    {error && !isLoading && (
                        <div className="flex flex-col items-center justify-center h-full text-center gap-4 opacity-60">
                            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                                <Folder size={32} className="text-red-400/40" />
                            </div>
                            <div>
                                <p className="text-[13px] font-semibold text-red-300">{error}</p>
                                <p className="text-[11px] text-slate-500 mt-1">Path: {currentPath || '/'}</p>
                            </div>
                            <button type="button" onClick={() => fetchDir(currentPath)} className="px-6 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] font-semibold text-blue-400 hover:bg-blue-500/20 transition-all">
                                Retry
                            </button>
                        </div>
                    )}

                    {/* Empty state */}
                    {!error && filteredFiles.length === 0 && !isLoading && (
                        <div className="flex flex-col items-center justify-center h-full text-center gap-4 opacity-40">
                            <Folder size={48} className="text-slate-600" />
                            <p className="text-[13px] font-medium text-slate-500">
                                {filter ? 'No matching files' : 'Empty directory'}
                            </p>
                        </div>
                    )}

                    {/* File list */}
                    {!error && filteredFiles.length > 0 && (
                        <div className={cn(
                            "grid gap-1.5",
                            viewMode === 'list'
                                ? "grid-cols-1"
                                : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3"
                        )}>
                            <AnimatePresence mode="popLayout">
                                {filteredFiles.map((file) => {
                                    const ft = file.isFile ? getFileType(file.name) : null;
                                    const FileIcon = ft?.icon || Folder;
                                    const isSelected = selectedFile?.path === file.path;

                                    return (
                                        <motion.div
                                            layout
                                            initial={{ opacity: 0, y: 4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            key={file.path}
                                            onClick={() => {
                                                if (file.isFile) {
                                                    setSelectedFile(file);
                                                    fetchFile(file.path);
                                                } else {
                                                    navigate(file.path);
                                                }
                                            }}
                                            className={cn(
                                                "group cursor-pointer rounded-xl border transition-all duration-200 relative",
                                                viewMode === 'list'
                                                    ? "flex items-center px-3 py-2.5 gap-3"
                                                    : "flex flex-col items-center p-4 gap-2 text-center",
                                                isSelected
                                                    ? "bg-blue-500/10 border-blue-500/25"
                                                    : "bg-transparent border-transparent hover:bg-slate-800/40 hover:border-slate-700/20"
                                            )}
                                        >
                                            {/* Icon */}
                                            <div className={cn(
                                                "rounded-lg flex items-center justify-center shrink-0 transition-all",
                                                viewMode === 'list' ? "w-8 h-8" : "w-12 h-12",
                                                file.isFile
                                                    ? `bg-slate-800/40 ${ft?.color || 'text-slate-500'}`
                                                    : "bg-blue-500/10 text-blue-400"
                                            )}>
                                                {file.isFile
                                                    ? <FileIcon size={viewMode === 'list' ? 16 : 20} />
                                                    : <Folder size={viewMode === 'list' ? 16 : 20} />
                                                }
                                            </div>

                                            {/* Name + meta */}
                                            <div className={cn("min-w-0", viewMode === 'list' ? "flex-1 flex items-center gap-4" : "w-full")}>
                                                <span className={cn(
                                                    "text-[13px] font-medium truncate block transition-colors",
                                                    isSelected ? "text-blue-300" : "text-slate-300 group-hover:text-white"
                                                )}>
                                                    {file.name}
                                                </span>

                                                {viewMode === 'list' && (
                                                    <div className="hidden sm:flex items-center gap-4 ml-auto shrink-0 text-[11px] text-slate-600">
                                                        {file.isFile && ft && (
                                                            <span className="w-20 text-right">{ft.label}</span>
                                                        )}
                                                        {!file.isFile && <span className="w-20 text-right text-slate-700">Folder</span>}
                                                        <span className="w-16 text-right font-mono">{formatSize(file.size)}</span>
                                                        <span className="w-28 text-right">{formatDate(file.modified)}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {viewMode === 'grid' && (
                                                <span className="text-[10px] text-slate-600 font-mono">{file.isFile ? formatSize(file.size) : 'Folder'}</span>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

                {/* FILE PREVIEW PANEL */}
                <AnimatePresence>
                    {selectedFile && (
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="w-full xl:w-[550px] flex flex-col bg-[#070b14] border-l border-slate-700/20 z-20"
                        >
                            {/* Preview header */}
                            <div className="px-4 py-3 border-b border-slate-700/20 flex items-center gap-3 shrink-0">
                                <button type="button"
                                    onClick={() => { setSelectedFile(null); setFileContent(null); }}
                                    className="p-2 rounded-lg bg-slate-800/40 text-slate-400 hover:text-white transition-all xl:hidden"
                                >
                                    <ChevronRight size={16} className="rotate-180" />
                                </button>

                                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", getFileType(selectedFile.name).color, "bg-slate-800/40")}>
                                    {React.createElement(getFileType(selectedFile.name).icon, { size: 18 })}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h3 className="text-[14px] font-semibold text-white truncate">{selectedFile.name}</h3>
                                    <p className="text-[10px] text-slate-600 font-mono truncate">{selectedFile.path}</p>
                                </div>

                                <button type="button"
                                    onClick={() => handleDownload(selectedFile)}
                                    disabled={!fileContent}
                                    className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all disabled:opacity-30"
                                    title="Download"
                                >
                                    <Download size={16} />
                                </button>
                                <button type="button"
                                    onClick={() => { setSelectedFile(null); setFileContent(null); }}
                                    className="p-2 rounded-lg bg-slate-800/40 text-slate-500 hover:text-white transition-all hidden xl:flex"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>

                            {/* File content */}
                            <div className="flex-1 overflow-auto p-4 font-mono text-[12px] leading-relaxed custom-scrollbar bg-[#050810]">
                                {fileContent ? (
                                    <pre className="text-slate-400 whitespace-pre-wrap break-words">{fileContent}</pre>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center gap-3 opacity-30">
                                        <RefreshCw size={24} className="animate-spin text-slate-500" />
                                        <span className="text-[11px] text-slate-600">Loading...</span>
                                    </div>
                                )}
                            </div>

                            {/* File metadata */}
                            <div className="px-4 py-3 border-t border-slate-700/20 bg-[#070b14]">
                                <div className="flex items-center gap-4 text-[10px] text-slate-600">
                                    <span>{getFileType(selectedFile.name).label}</span>
                                    <span className="font-mono">{formatSize(selectedFile.size)}</span>
                                    {selectedFile.modified && <span>{formatDate(selectedFile.modified)}</span>}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* STATUS BAR */}
            <div className="px-4 py-2 border-t border-slate-700/20 bg-[#070b14] flex items-center justify-between text-[10px] text-slate-600 shrink-0">
                <div className="flex items-center gap-4">
                    <span>{filteredFiles.length} items</span>
                    {filter && <span className="text-blue-400/60">filtered from {files.length}</span>}
                </div>
                <div className="flex items-center gap-2">
                    <div className={cn(
                        "w-1.5 h-1.5 rounded-full transition-colors",
                        isLoading ? "bg-amber-500 animate-pulse" : error ? "bg-red-500" : "bg-emerald-500"
                    )} />
                    <span className={cn(
                        isLoading ? "text-amber-400" : error ? "text-red-400" : "text-emerald-400/60"
                    )}>
                        {isLoading ? 'Loading' : error ? 'Error' : 'Ready'}
                    </span>
                </div>
            </div>
        </div>
    );
}
