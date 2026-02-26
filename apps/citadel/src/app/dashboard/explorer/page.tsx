'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, AuthProvider } from '@/components/providers/AuthProvider';
import {
    Folder, File, ChevronRight, ChevronDown, Save, ArrowLeft, Loader2,
    HardDrive, AlertCircle, CheckCircle2, FileText, Code, FileJson
} from 'lucide-react';
import { cn } from '@matrix-lib/utils';

interface FSNode {
    name: string;
    isDirectory: boolean;
    path: string;
    children?: FSNode[];
    isOpen?: boolean;
}

function ExplorerContent() {
    const router = useRouter();
    const { authenticated, loading: authLoading } = useAuth();

    const [files, setFiles] = useState<FSNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedFile, setSelectedFile] = useState<FSNode | null>(null);
    const [fileContent, setFileContent] = useState('');
    const [originalContent, setOriginalContent] = useState('');
    const [loadingContent, setLoadingContent] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const fetchDir = async (targetPath: string = '') => {
        try {
            const res = await fetch('/api/fs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'read_dir', targetPath })
            });
            if (res.ok) {
                const data = await res.json();
                return data.items as FSNode[];
            }
        } catch { }
        return [];
    };

    useEffect(() => {
        if (!authLoading && !authenticated) {
            router.push('/');
        } else if (authenticated) {
            fetchDir('').then(items => {
                setFiles(items);
                setLoading(false);
            });
        }
    }, [authenticated, authLoading, router]);

    const toggleFolder = async (node: FSNode, parentNodes: FSNode[] = files, setNodes = setFiles) => {
        // Deep clone or functional update would be ideal. Let's write a simple recursive update.
        const toggleRecursive = (items: FSNode[]): FSNode[] => {
            return items.map(item => {
                if (item.path === node.path) {
                    return { ...item, isOpen: !item.isOpen };
                }
                if (item.children) {
                    return { ...item, children: toggleRecursive(item.children) };
                }
                return item;
            });
        };

        if (!node.isOpen && !node.children) {
            // Fetch children
            const children = await fetchDir(node.path);
            const updateWithChildren = (items: FSNode[]): FSNode[] => {
                return items.map(item => {
                    if (item.path === node.path) return { ...item, children, isOpen: true };
                    if (item.children) return { ...item, children: updateWithChildren(item.children) };
                    return item;
                });
            };
            setNodes(updateWithChildren(parentNodes));
        } else {
            setNodes(toggleRecursive(parentNodes));
        }
    };

    const handleFileClick = async (node: FSNode) => {
        setSelectedFile(node);
        setLoadingContent(true);
        setSaveStatus('idle');
        try {
            const res = await fetch('/api/fs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'read_file', targetPath: node.path })
            });
            const data = await res.json();
            if (res.ok) {
                setFileContent(data.content);
                setOriginalContent(data.content);
            } else {
                setFileContent(`Error: ${data.error}`);
            }
        } catch {
            setFileContent('Error loading file.');
        }
        setLoadingContent(false);
    };

    const handleSave = async () => {
        if (!selectedFile) return;
        setSaving(true);
        setSaveStatus('idle');
        try {
            const res = await fetch('/api/fs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'write_file', targetPath: selectedFile.path, content: fileContent })
            });
            if (res.ok) {
                setOriginalContent(fileContent);
                setSaveStatus('success');
                setTimeout(() => setSaveStatus('idle'), 3000);
            } else {
                setSaveStatus('error');
            }
        } catch {
            setSaveStatus('error');
        }
        setSaving(false);
    };

    // Recursive Tree Renderer
    const renderTree = (items: FSNode[], level = 0) => {
        return items.map(node => (
            <div key={node.path}>
                <div
                    className={cn(
                        "flex items-center gap-2 px-2 py-1 hover:bg-white/5 cursor-pointer rounded-md transition-colors",
                        selectedFile?.path === node.path && "bg-white/10 text-gold-400"
                    )}
                    style={{ paddingLeft: `${level * 12 + 8}px` }}
                    onClick={() => node.isDirectory ? toggleFolder(node) : handleFileClick(node)}
                >
                    {node.isDirectory ? (
                        <>
                            {node.isOpen ? <ChevronDown className="w-3.5 h-3.5 text-white/40" /> : <ChevronRight className="w-3.5 h-3.5 text-white/40" />}
                            <Folder className="w-4 h-4 text-gold-400/80" />
                        </>
                    ) : (
                        <>
                            <div className="w-3.5 h-3.5" />
                            {node.name.endsWith('.ts') || node.name.endsWith('.tsx') || node.name.endsWith('.js') ? (
                                <Code className="w-4 h-4 text-blue-400/80" />
                            ) : node.name.endsWith('.json') ? (
                                <FileJson className="w-4 h-4 text-emerald-400/80" />
                            ) : (
                                <FileText className="w-4 h-4 text-white/50" />
                            )}
                        </>
                    )}
                    <span className="text-xs font-mono select-none truncate">
                        {node.name}
                    </span>
                </div>
                {node.isDirectory && node.isOpen && node.children && (
                    <div className="border-l border-white/10 ml-[23px]">
                        {renderTree(node.children, level + 1)}
                    </div>
                )}
            </div>
        ));
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#06060f]">
                <Loader2 className="w-8 h-8 text-gold-400 animate-spin" />
            </div>
        );
    }

    const hasChanges = fileContent !== originalContent;

    return (
        <div className="min-h-screen bg-[#06060f] text-white flex flex-col relative overflow-hidden">
            {/* Background */}
            <div className="fixed inset-0 citadel-mesh pointer-events-none" />

            {/* Header */}
            <header className="h-16 border-b border-white/5 glass-panel flex items-center px-6 relative z-10 shrink-0">
                <button
                    onClick={() => router.push('/dashboard')}
                    className="flex items-center gap-2 text-white/40 hover:text-white transition-colors mr-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-xs font-display tracking-widest uppercase">Citadel</span>
                </button>
                <div className="h-8 w-[1px] bg-white/10 mx-2" />
                <div className="flex flex-col ml-4">
                    <h1 className="text-sm font-display font-bold text-gold-400 tracking-[0.2em] uppercase flex items-center gap-2">
                        <HardDrive className="w-4 h-4" />
                        Explorer
                    </h1>
                    <span className="text-[10px] text-white/30 font-mono tracking-widest">ROOT_ACCESS: g:\matrix</span>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex overflow-hidden relative z-10 m-6 mb-8 gap-6 max-h-[calc(100vh-120px)]">

                {/* Sidebar - File Tree */}
                <div className="w-[300px] shrink-0 glass-panel border border-white/5 rounded-2xl flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-white/5 bg-white/[0.02]">
                        <h2 className="text-xs font-mono text-white/40 tracking-widest uppercase">File System</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                        {renderTree(files)}
                    </div>
                </div>

                {/* Editor Pane */}
                <div className="flex-1 glass-panel border border-white/5 rounded-2xl flex flex-col overflow-hidden relative group">
                    {/* Editor Header */}
                    <div className="h-12 border-b border-white/5 bg-white/[0.02] flex items-center justify-between px-4">
                        <div className="flex items-center gap-2 truncate">
                            {selectedFile ? (
                                <>
                                    <File className="w-4 h-4 text-white/30" />
                                    <span className="text-xs font-mono text-white/70">{selectedFile.path}</span>
                                    {hasChanges && <span className="w-2 h-2 rounded-full bg-amber-400" />}
                                </>
                            ) : (
                                <span className="text-xs font-mono text-white/30 italic">No file selected</span>
                            )}
                        </div>

                        {selectedFile && (
                            <div className="flex items-center gap-3">
                                {saveStatus === 'success' && <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono animate-fade-in"><CheckCircle2 className="w-3 h-3" /> Saved</span>}
                                {saveStatus === 'error' && <span className="text-[10px] text-red-400 flex items-center gap-1 font-mono animate-fade-in"><AlertCircle className="w-3 h-3" /> Failed</span>}
                                <button
                                    onClick={handleSave}
                                    disabled={!hasChanges || saving}
                                    className="btn-gold px-4 py-1.5 rounded-lg text-xs font-bold tracking-widest uppercase flex items-center gap-2 disabled:opacity-50"
                                >
                                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                    Save
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Editor Body */}
                    <div className="flex-1 relative overflow-hidden bg-black/40">
                        {loadingContent ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
                            </div>
                        ) : selectedFile ? (
                            <textarea
                                value={fileContent}
                                onChange={(e) => setFileContent(e.target.value)}
                                className="absolute inset-0 w-full h-full bg-transparent text-white/80 font-mono text-[13px] leading-relaxed p-4 resize-none outline-none custom-scrollbar"
                                spellCheck={false}
                            />
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/20">
                                <Code className="w-16 h-16 mb-4 opacity-50" />
                                <p className="text-sm font-mono tracking-widest">SELECT A FILE TO EDIT</p>
                            </div>
                        )}
                    </div>
                </div>

            </main>
        </div>
    );
}

export default function ExplorerPage() {
    return (
        <AuthProvider>
            <ExplorerContent />
        </AuthProvider>
    );
}

