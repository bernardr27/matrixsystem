'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, GHOST_BRIDGE_TABLE } from '@/lib/supabase';
import { useSensory } from '@/hooks/useSensory';

interface Message {
    id: string;
    role: 'user' | 'ai' | 'system';
    content: string;
    timestamp: number;
    status?: 'pending' | 'executing' | 'executed' | 'failed';
    agent?: 'sage' | 'ralph';
}

interface SageState {
    status: 'idle' | 'thinking' | 'executing' | 'error';
    lastResponse: string | null;
    messages: Message[];
    archivedMessages: Message[];
    sageExecuting: boolean;
    ralphExecuting: boolean;
}

interface HeartbeatPayload {
    ram: string;
    cpu: string;
    uptime?: number;
    ai_status: string;
    models?: number;
    services?: Record<string, string>;
}

interface SageContextType extends SageState {
    sendCommand: (command: string, options?: { silent?: boolean }) => Promise<void>;
    reportNeuralFault: (error: string, metadata?: Record<string, any>) => Promise<void>;
    clearHistory: () => void;
    sageExecuting: boolean;
    ralphExecuting: boolean;
    currentProcess: string | null;
    systemHealth: {
        online: boolean;
        lastHeartbeat: number;
        ram: string;
        cpu: string;
        uptime: number;
        ai_status: string;
        models: number;
        services: Record<string, string>;
        networkLatency: number;
    };
    secureHash: string;
    lastLog: Message | null;
}

const SageContext = createContext<SageContextType | undefined>(undefined);

export const SageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<SageState>({
        status: 'idle',
        lastResponse: null,
        messages: [],
        archivedMessages: [],
        sageExecuting: false,
        ralphExecuting: false
    });

    const [currentProcess, setCurrentProcess] = useState<string | null>(null);

    const [systemHealth, setSystemHealth] = useState({
        online: false,
        lastHeartbeat: 0,
        ram: '0',
        cpu: '0%',
        uptime: 0,
        ai_status: 'OFF',
        models: 0,
        services: {} as Record<string, string>,
        networkLatency: 0
    });

    const [secureHash, setSecureHash] = useState('OFFLINE');

    const sensory = useSensory();
    const processedIds = React.useRef(new Set<string>());
    const lastCommandRef = React.useRef<{ time: number; cmd: string }>({ time: 0, cmd: '' });
    const activeCommandId = React.useRef<string | null>(null);

    useEffect(() => {
        const channel = supabase
            .channel('ghost_bridge_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: GHOST_BRIDGE_TABLE }, (payload: any) => {
                const newRow = payload.new as any;
                const msgId = newRow?.id;
                if (!msgId || processedIds.current.has(msgId)) return;

                const newStatus = newRow.status;
                const command = newRow.command || '';
                const output = newRow.output || '';
                const cleanOutput = output.startsWith('SAGE: ') ? output.replace('SAGE: ', '') : output;

                if (newStatus === 'executing') {
                    // Only update execution flags if this is OUR active command
                    if (activeCommandId.current && msgId === activeCommandId.current) {
                        setState(prev => ({
                            ...prev,
                            status: 'executing',
                            sageExecuting: prev.sageExecuting || command.startsWith('sage:'),
                            ralphExecuting: prev.ralphExecuting || command.startsWith('ralph:')
                        }));

                        // SAFETY: Auto-reset state if command hangs for > 30s
                        setTimeout(() => {
                            if (activeCommandId.current === msgId) {
                                setState(prev => ({
                                    ...prev,
                                    status: prev.status === 'executing' ? 'idle' : prev.status,
                                    sageExecuting: false,
                                    ralphExecuting: false
                                }));
                                activeCommandId.current = null;
                            }
                        }, 30000);
                    }
                    sensory.pulse();
                } else if (newStatus === 'executed') {
                    processedIds.current.add(msgId);

                    const isTechnical =
                        command.startsWith('fs:') ||
                        command.startsWith('triage:') ||
                        command.startsWith('mission:') ||
                        command.startsWith('sys:') ||
                        command.includes('heartbeat') ||
                        command.startsWith('[NEURAL_REFLEX]') ||
                        cleanOutput.startsWith('DIR_LIST:') ||
                        cleanOutput.startsWith('FILE_CONTENT:') ||
                        cleanOutput.includes('complete sys:heartbeat');

                    const newMsg: Message = {
                        id: msgId,
                        role: isTechnical ? 'system' : 'ai',
                        content: cleanOutput,
                        timestamp: Date.now(),
                        status: 'executed',
                        isTechnical,
                        agent: command.startsWith('ralph:') ? 'ralph' : 'sage'
                    } as any;

                    // Only clear execution flags if this is our active command
                    const isActiveCmd = activeCommandId.current === msgId;
                    if (isActiveCmd) activeCommandId.current = null;

                    setState(prev => {
                        if (prev.messages.some(m => m.id === msgId)) {
                            // If strictly our command, clear process
                            if (isActiveCmd) setCurrentProcess(null);
                            return isActiveCmd
                                ? { ...prev, status: 'idle', sageExecuting: false, ralphExecuting: false }
                                : prev;
                        }

                        const updatedMessages = prev.messages.map(m =>
                            (m.role === 'user' && m.status === 'pending') ? { ...m, status: 'executed' as const } : m
                        );

                        if (isActiveCmd) setCurrentProcess(null);

                        return {
                            ...prev,
                            status: isActiveCmd ? 'idle' : prev.status,
                            sageExecuting: isActiveCmd ? false : prev.sageExecuting,
                            ralphExecuting: isActiveCmd ? false : prev.ralphExecuting,
                            lastResponse: isTechnical ? prev.lastResponse : cleanOutput,
                            messages: [...updatedMessages, newMsg].slice(-50)
                        };
                    });

                    if (!isTechnical) sensory.success();
                } else if (newStatus === 'failed') {
                    processedIds.current.add(msgId);
                    const errorMsg: Message = {
                        id: msgId,
                        role: 'system',
                        content: `COMMAND_FAILURE: ${output || 'Unknown Error'}`,
                        timestamp: Date.now(),
                        status: 'failed'
                    };
                    const isActiveFail = activeCommandId.current === msgId;
                    if (isActiveFail) {
                        activeCommandId.current = null;
                        setCurrentProcess(null);
                    }

                    setState(prev => ({
                        ...prev,
                        status: isActiveFail ? 'error' : prev.status,
                        sageExecuting: isActiveFail ? false : prev.sageExecuting,
                        ralphExecuting: isActiveFail ? false : prev.ralphExecuting,
                        messages: [...prev.messages, errorMsg].slice(-50)
                    }));
                    sensory.error();
                }
            })
            .subscribe();

        // HEARTBEAT (Real-time System Status)
        const healthChannel = supabase
            .channel('system_health')
            .on('broadcast', { event: 'heartbeat' }, (payload: any) => {
                const data = payload.payload;
                setSystemHealth(prev => {
                    const hasChanged =
                        prev.online !== true ||
                        (data.ram && data.ram !== '0' && data.ram !== '0%' && prev.ram !== data.ram) ||
                        (data.cpu && data.cpu !== '0' && data.cpu !== '0%' && prev.cpu !== data.cpu) ||
                        (data.ai_status && prev.ai_status !== data.ai_status) ||
                        (data.models !== undefined && prev.models !== data.models);

                    if (!hasChanged && Date.now() - prev.lastHeartbeat < 5000) return prev;

                    return {
                        ...prev,
                        online: true,
                        lastHeartbeat: Date.now(),
                        ram: (data.ram && data.ram !== '0' && data.ram !== '0%') ? data.ram : prev.ram,
                        cpu: (data.cpu && data.cpu !== '0' && data.cpu !== '0%') ? data.cpu : prev.cpu,
                        uptime: data.uptime || prev.uptime,
                        ai_status: data.ai_status || prev.ai_status,
                        models: data.models !== undefined ? data.models : prev.models,
                        services: data.services || prev.services,
                        ...(data.services?.runner === 'offline' && { ai_status: 'OFFLINE' })
                    };
                });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
            supabase.removeChannel(healthChannel);
        };
    }, [
        sensory,
        secureHash,
        systemHealth.ai_status,
        systemHealth.cpu,
        systemHealth.lastHeartbeat,
        systemHealth.models,
        systemHealth.ram,
        systemHealth.uptime
    ]);

    // HYBRID CONNECTIVITY: Local Polling (Primary) + Cloud Fallback
    useEffect(() => {
        let failureCount = 0;
        let interval: NodeJS.Timeout;

        const fetchLocalStatus = async () => {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 1000);

                const startTime = Date.now();
                const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
                const runnerUrl = process.env.NEXT_PUBLIC_RUNNER_URL || `http://${host}:3333`;
                const res = await fetch(`${runnerUrl}/status`, {
                    signal: controller.signal,
                    cache: 'no-store'
                });
                const networkLatency = Date.now() - startTime;
                clearTimeout(timeoutId);

                if (res.ok) {
                    failureCount = 0;
                    const data = await res.json();
                    if (data.status === 'initializing') return;

                    setSystemHealth(prev => ({
                        ...prev,
                        online: true,
                        lastHeartbeat: Date.now(),
                        ram: (data.ram && data.ram !== '0' && data.ram !== '0%') ? data.ram : prev.ram,
                        cpu: (data.cpu && data.cpu !== '0' && data.cpu !== '0%') ? data.cpu : prev.cpu,
                        uptime: data.uptime || prev.uptime,
                        ai_status: data.ai_status || prev.ai_status,
                        models: data.models !== undefined ? data.models : prev.models,
                        services: data.services || prev.services,
                        networkLatency,
                        ...(data.services?.runner === 'offline' && { ai_status: 'OFFLINE' })
                    }));

                    if (secureHash === 'OFFLINE' && data.services?.runner) {
                        const hash = btoa(data.services.runner).substring(0, 8).toUpperCase();
                        setSecureHash(hash);
                    }
                }
            } catch (e) {
                failureCount++;
            }
        };

        interval = setInterval(fetchLocalStatus, 5000);
        return () => clearInterval(interval);
    }, [secureHash]);

    // Check for offline status (no heartbeat > 30s)
    useEffect(() => {
        const interval = setInterval(() => {
            setSystemHealth(prev => {
                if (Date.now() - prev.lastHeartbeat > 30000 && prev.lastHeartbeat !== 0 && prev.online) {
                    return { ...prev, online: false };
                }
                return prev;
            });
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const sendCommand = React.useCallback(async (command: string, options: { silent?: boolean } = {}) => {
        const now = Date.now();

        // Robust protocol detection: Only skip 'sage:' if it starts with a known technical protocol
        const knownProtocols = ['sys:', 'fs:', 'triage:', 'ralph:', 'mission:', 'vision:', 'hand:', 'transfer:', 'sage:', 'git:', 'npm:', 'clip:'];
        const lowerCmd = command.toLowerCase().trim();
        const hasProtocol = knownProtocols.some(p => lowerCmd.startsWith(p));

        const finalCommand = hasProtocol ? command : `sage:${command}`;

        if (finalCommand === lastCommandRef.current.cmd && now - lastCommandRef.current.time < 1000) return;
        lastCommandRef.current = { time: now, cmd: finalCommand };

        if (!options.silent) sensory.pulse();

        const cleanDisplay = finalCommand.startsWith('sage:') ? finalCommand.replace('sage:', '') : finalCommand;

        // INTERCEPT: sage:status (Instant Local Report)
        if (cleanDisplay === 'status' || cleanDisplay === 'system status' || cleanDisplay === 'check system') {
            const now = Date.now();
            const uptime = Math.floor((now - (systemHealth.lastHeartbeat - (systemHealth.uptime * 1000))) / 1000); // Approximate
            const hours = Math.floor(uptime / 3600);
            const mins = Math.floor((uptime % 3600) / 60);

            const statusMsg = `
⚡ **SYSTEM STATUS REPORT**
━━━━━━━━━━━━━━━━━━━━━━
🟢 **CORE ONLINE** (Latency: ${Date.now() - systemHealth.lastHeartbeat}ms)
🧠 **AI CORTEX**: ${systemHealth.ai_status} (${systemHealth.models} Active Models)
💾 **MEMORY**: ${systemHealth.ram}
⚙️ **CPU**: ${systemHealth.cpu}
⏱️ **UPTIME**: ${hours}h ${mins}m
🔗 **SECURE HASH**: ${secureHash}
            `.trim();

            const userMsg: Message = {
                id: Math.random().toString(36).substring(7),
                role: 'user',
                content: cleanDisplay,
                timestamp: now,
                status: 'executed'
            };

            const sageMsg: Message = {
                id: Math.random().toString(36).substring(7),
                role: 'ai',
                content: statusMsg,
                timestamp: now + 500, // Slight delay for realism
                status: 'executed',
                agent: 'sage'
            };

            setState(prev => ({
                ...prev,
                status: 'idle',
                lastResponse: statusMsg,
                messages: [...prev.messages, userMsg, sageMsg].slice(-50)
            }));

            sensory.success();
            return null; // Local only
        }

        const isRalphCmd = finalCommand.toLowerCase().startsWith('ralph:');
        const isSageCmd = !isRalphCmd;

        if (!options.silent) {
            const userMsg: Message = {
                id: Math.random().toString(36).substring(7),
                role: 'user',
                content: cleanDisplay,
                timestamp: Date.now(),
                status: 'pending'
            };

            // Set Process Name based on command context
            let processName = 'PROCESSING';
            if (isRalphCmd) {
                if (finalCommand.includes('scan')) processName = 'SYSTEM SCAN';
                else if (finalCommand.includes('index')) processName = 'INDEXING';
                else processName = 'EXECUTING';
            } else {
                if (finalCommand.includes('status')) processName = 'DIAGNOSTIC';
                else if (finalCommand.includes('fs:')) processName = 'I/O OPERATION';
                else processName = 'THINKING';
            }
            setCurrentProcess(processName);

            setState(prev => ({
                ...prev,
                status: 'executing',
                sageExecuting: isSageCmd,
                ralphExecuting: isRalphCmd,
                messages: [...prev.messages, userMsg].slice(-50)
            }));
        } else {
            setState(prev => ({
                ...prev,
                status: 'executing',
                sageExecuting: isSageCmd,
                ralphExecuting: isRalphCmd
            }));
        }

        const { data, error } = await supabase.from(GHOST_BRIDGE_TABLE).insert({
            command: finalCommand,
            status: 'pending'
        }).select('id').single();

        if (error) {
            sensory.error();
            activeCommandId.current = null;
            setState(prev => ({ ...prev, status: 'error', sageExecuting: false, ralphExecuting: false }));
            console.error('Failed to send command:', error);
        } else if (data?.id) {
            activeCommandId.current = data.id;
        }

        return data?.id;
    }, [
        sensory,
        secureHash,
        systemHealth.ai_status,
        systemHealth.cpu,
        systemHealth.lastHeartbeat,
        systemHealth.models,
        systemHealth.ram,
        systemHealth.uptime
    ]);

    // POLLING FALLBACK: Unified logic with Realtime
    useEffect(() => {
        if (state.status !== 'thinking' && state.status !== 'executing') return;

        const pollInterval = setInterval(async () => {
            const { data, error } = await supabase
                .from(GHOST_BRIDGE_TABLE)
                .select('*')
                .in('status', ['executed', 'failed'])
                .order('created_at', { ascending: false })
                .limit(10);

            if (error || !data) return;

            for (const row of data) {
                if (!processedIds.current.has(row.id)) {
                    const msgId = row.id;
                    const command = row.command || '';
                    const output = row.output || '';
                    const cleanOutput = output.startsWith('SAGE: ') ? output.replace('SAGE: ', '') : output;

                    const isTechnical =
                        command.startsWith('fs:') ||
                        command.startsWith('triage:') ||
                        command.startsWith('mission:') ||
                        command.startsWith('sys:') ||
                        command.includes('heartbeat') ||
                        command.startsWith('[NEURAL_REFLEX]') ||
                        cleanOutput.startsWith('DIR_LIST:') ||
                        cleanOutput.startsWith('FILE_CONTENT:');

                    if (row.status === 'executed') {
                        processedIds.current.add(msgId);
                        const isActiveCmd = activeCommandId.current === msgId;
                        if (isActiveCmd) activeCommandId.current = null;

                        setState(prev => {
                            if (prev.messages.some(m => m.id === msgId)) {
                                return isActiveCmd
                                    ? { ...prev, status: 'idle', sageExecuting: false, ralphExecuting: false }
                                    : prev;
                            }
                            const updatedMessages = prev.messages.map(m =>
                                (m.role === 'user' && m.status === 'pending') ? { ...m, status: 'executed' as const } : m
                            );
                            const newMsg: Message = {
                                id: msgId,
                                role: isTechnical ? 'system' : 'ai',
                                content: cleanOutput,
                                timestamp: Date.now(),
                                status: 'executed',
                                isTechnical,
                                agent: command.startsWith('ralph:') ? 'ralph' : 'sage'
                            } as any;
                            if (!isTechnical) sensory.success();
                            return {
                                ...prev,
                                status: isActiveCmd ? 'idle' : prev.status,
                                sageExecuting: isActiveCmd ? false : prev.sageExecuting,
                                ralphExecuting: isActiveCmd ? false : prev.ralphExecuting,
                                lastResponse: isTechnical ? prev.lastResponse : cleanOutput,
                                messages: [...updatedMessages, newMsg].slice(-50)
                            };
                        });
                    } else if (row.status === 'failed') {
                        processedIds.current.add(msgId);
                        const isActiveFail = activeCommandId.current === msgId;
                        if (isActiveFail) activeCommandId.current = null;

                        setState(prev => {
                            if (prev.messages.some(m => m.id === msgId)) {
                                return isActiveFail
                                    ? { ...prev, status: 'idle', sageExecuting: false, ralphExecuting: false }
                                    : prev;
                            }
                            const errorMsg: Message = {
                                id: msgId,
                                role: 'system',
                                content: `COMMAND_FAILURE: ${cleanOutput || 'Process Terminated'}`,
                                timestamp: Date.now(),
                                status: 'failed'
                            };
                            sensory.error();
                            return {
                                ...prev,
                                status: isActiveFail ? 'idle' : prev.status,
                                sageExecuting: isActiveFail ? false : prev.sageExecuting,
                                ralphExecuting: isActiveFail ? false : prev.ralphExecuting,
                                messages: [...prev.messages, errorMsg].slice(-50)
                            };
                        });
                    }
                }
            }
        }, 2000);

        return () => clearInterval(pollInterval);
    }, [state.status, sensory, secureHash]);

    const reportNeuralFault = React.useCallback(async (errorMessage: string, metadata: any = {}) => {
        try {
            await supabase.from(GHOST_BRIDGE_TABLE).insert({
                command: `[NEURAL_REFLEX] ${errorMessage}`,
                status: 'alert',
                output: JSON.stringify(metadata)
            });
        } catch (e) {
            console.error('Fault reporting failed:', e);
        }
    }, []);

    const clearHistory = React.useCallback(() => {
        setState(prev => {
            if (prev.messages.length === 0) return prev;
            return {
                ...prev,
                archivedMessages: [...prev.archivedMessages, ...prev.messages].slice(-200),
                messages: []
            };
        });
    }, []);

    const value = React.useMemo(() => ({
        ...state,
        sendCommand,
        reportNeuralFault,
        clearHistory,
        systemHealth,
        sageExecuting: state.sageExecuting,
        ralphExecuting: state.ralphExecuting,
        currentProcess,
        secureHash,
        lastLog: state.messages.length > 0 ? state.messages[state.messages.length - 1] : null
    }), [state, currentProcess, sendCommand, reportNeuralFault, clearHistory, systemHealth, secureHash]);

    return (
        <SageContext.Provider value={value}>
            {children}
        </SageContext.Provider>
    );
};

export const useSage = () => {
    const context = useContext(SageContext);
    if (!context) throw new Error('useSage must be used within a SageProvider');
    return context;
};
