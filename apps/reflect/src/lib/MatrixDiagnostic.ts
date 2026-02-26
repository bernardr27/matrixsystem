/**
 * Matrix Diagnostic System
 * 
 * Cross-app diagnostic and improvement analysis framework.
 * Logs actions, analyzes performance, and generates improvement suggestions.
 */

import { createClient } from '@/lib/supabase/client';
let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) _supabase = createClient();
  return _supabase;
}

export type AppName = 'reflect' | 'ghost' | 'nexus' | 'runner' | 'sentinel';
export type DiagnosticCategory = 'action' | 'error' | 'performance' | 'navigation' | 'api' | 'render';
export type SeverityLevel = 'info' | 'warning' | 'critical';

export interface DiagnosticEntry {
    id: string;
    timestamp: number;
    app: AppName;
    category: DiagnosticCategory;
    severity: SeverityLevel;
    action: string;
    duration?: number;  // ms
    metadata?: Record<string, any>;
    userAgent?: string;
    sessionId?: string;
}

export interface PerformanceMetric {
    app: AppName;
    averageResponseTime: number;
    errorRate: number;
    totalActions: number;
    slowOperations: number;
}

export interface ImprovementSuggestion {
    priority: 'high' | 'medium' | 'low';
    category: 'performance' | 'ui' | 'ux' | 'feature' | 'bug';
    title: string;
    description: string;
    affectedApp: AppName;
    evidence: string[];
}

// In-memory buffer for batching writes
const diagnosticBuffer: DiagnosticEntry[] = [];
const FLUSH_INTERVAL = 5000; // 5s
const MAX_BUFFER_SIZE = 50;

// Session ID for tracking
const SESSION_ID = Math.random().toString(36).substring(7);

// Performance tracking
const performanceStart: Record<string, number> = {};

const safeRandomUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback: RFC4122 v4 compliant UUID generator
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};

/**
 * MatrixDiagnostic - Core diagnostic and analytics system
 */
export const MatrixDiagnostic = {
    /**
     * Log an action or event
     */
    log(
        app: AppName,
        category: DiagnosticCategory,
        action: string,
        metadata?: Record<string, any>,
        severity: SeverityLevel = 'info'
    ): void {
        const entry: DiagnosticEntry = {
            id: safeRandomUUID(),
            timestamp: Date.now(),
            app,
            category,
            severity,
            action,
            metadata,
            sessionId: SESSION_ID,
            userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
        };

        diagnosticBuffer.push(entry);

        // Console logging for development
        if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
            const color = severity === 'critical' ? '🔴' : severity === 'warning' ? '🟡' : '🔵';
            // console.log(`${color} [${category}] ${action}`, metadata || '');
        }

        // Flush if buffer is full
        if (diagnosticBuffer.length >= MAX_BUFFER_SIZE) {
            this.flush();
        }
    },

    /**
     * Start timing an operation
     */
    startTimer(operationId: string): void {
        performanceStart[operationId] = performance.now();
    },

    /**
     * End timing and log the result
     */
    endTimer(
        app: AppName,
        operationId: string,
        action: string,
        metadata?: Record<string, any>
    ): number {
        const start = performanceStart[operationId];
        if (!start) return 0;

        const duration = Math.round(performance.now() - start);
        delete performanceStart[operationId];

const severity: SeverityLevel = duration > 3000 ? 'critical' : duration > 1000 ? 'warning' : 'info';

        this.log(app, 'performance', action, { ...metadata, duration }, severity);

        return duration;
    },

    /**
     * Log an error
     */
    error(
        app: AppName,
        action: string,
        error: Error | string,
        metadata?: Record<string, any>
    ): void {
        const errorMessage = error instanceof Error ? error.message : error;
        const errorStack = error instanceof Error ? error.stack : undefined;

        this.log(app, 'error', action, {
            ...metadata,
            error: errorMessage,
            stack: errorStack,
        }, 'critical');
    },

    /**
     * Log a navigation event
     */
    navigate(app: AppName, from: string, to: string): void {
        this.log(app, 'navigation', `${from} → ${to}`, { from, to });
    },

    /**
     * Log an API call
     */
    api(
        app: AppName,
        endpoint: string,
        method: string,
        status: number,
        duration: number
    ): void {
        const severity: SeverityLevel = status >= 500 ? 'critical' : status >= 400 ? 'warning' : 'info';
        this.log(app, 'api', `${method} ${endpoint}`, { status, duration }, severity);
    },

    /**
     * Flush buffer to Supabase
     */
    async flush(): Promise<void> {
        if (diagnosticBuffer.length === 0) return;

        const entries = [...diagnosticBuffer];
        diagnosticBuffer.length = 0;

        try {
            await getSupabase().from('matrix_diagnostics').insert(
                entries.map(e => ({
                    id: e.id,
                    timestamp: new Date(e.timestamp).toISOString(),
                    app: e.app,
                    category: e.category,
                    severity: e.severity,
                    action: e.action,
                    duration: e.duration,
                    metadata: e.metadata,
                    session_id: e.sessionId,
                    user_agent: e.userAgent,
                }))
            );
        } catch (error) {
              // Re-add to buffer on failure, but cap to prevent infinite growth
              if (diagnosticBuffer.length < MAX_BUFFER_SIZE * 3) {
                  diagnosticBuffer.push(...entries);
              }
            console.error('[MatrixDiagnostic] Flush failed:', error);
        }
    },

    /**
     * Get recent diagnostics for an app
     */
    async getRecent(app?: AppName, limit = 100): Promise<DiagnosticEntry[]> {
        let query = getSupabase()
            .from('matrix_diagnostics')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(limit);

        if (app) {
            query = query.eq('app', app);
        }

        const { data, error } = await query;
        if (error) throw error;

        return data as DiagnosticEntry[];
    },

    /**
     * Analyze performance metrics
     */
    async analyzePerformance(app: AppName): Promise<PerformanceMetric> {
        const { data, error } = await getSupabase()
            .from('matrix_diagnostics')
            .select('*')
            .eq('app', app)
            .gte('timestamp', new Date(Date.now() - 3600000).toISOString()); // Last hour

        if (error) throw error;

        const entries = data as DiagnosticEntry[];
        const performanceEntries = entries.filter(e => e.category === 'performance' && e.duration);
        const errorEntries = entries.filter(e => e.category === 'error');

        const avgResponseTime = performanceEntries.length > 0
            ? performanceEntries.reduce((sum, e) => sum + (e.duration || 0), 0) / performanceEntries.length
            : 0;

        return {
            app,
            averageResponseTime: Math.round(avgResponseTime),
            errorRate: entries.length > 0 ? (errorEntries.length / entries.length) * 100 : 0,
            totalActions: entries.length,
            slowOperations: performanceEntries.filter(e => (e.duration || 0) > 500).length,
        };
    },

    /**
     * Generate improvement suggestions based on diagnostics
     */
    async suggestImprovements(app?: AppName): Promise<ImprovementSuggestion[]> {
        const suggestions: ImprovementSuggestion[] = [];

        // Get recent data
        const entries = await this.getRecent(app, 500);
        const errors = entries.filter(e => e.category === 'error');
        const slowOps = entries.filter(e => e.category === 'performance' && (e.duration || 0) > 500);

        // Analyze error patterns
        const errorCounts: Record<string, number> = {};
        errors.forEach(e => {
            const key = `${e.app}:${e.action}`;
            errorCounts[key] = (errorCounts[key] || 0) + 1;
        });

        Object.entries(errorCounts).forEach(([key, count]) => {
            if (count >= 3) {
                const [appName, action] = key.split(':');
                suggestions.push({
                    priority: count >= 10 ? 'high' : 'medium',
                    category: 'bug',
                    title: `Frequent Error: ${action}`,
                    description: `This error occurred ${count} times in the last hour.`,
                    affectedApp: appName as AppName,
                    evidence: [`${count} occurrences`, `Last seen: recent`],
                });
            }
        });

        // Analyze slow operations
        if (slowOps.length > 10) {
            const groupedByApp: Record<string, number> = {};
            slowOps.forEach(e => {
                groupedByApp[e.app] = (groupedByApp[e.app] || 0) + 1;
            });

            Object.entries(groupedByApp).forEach(([appName, count]) => {
                suggestions.push({
                    priority: count >= 20 ? 'high' : 'medium',
                    category: 'performance',
                    title: `Slow Operations in ${appName}`,
                    description: `${count} operations took >500ms in the last hour.`,
                    affectedApp: appName as AppName,
                    evidence: [`${count} slow operations`],
                });
            });
        }

        return suggestions;
    },

    /**
     * Phase 16: AI-Powered Diagnostic Analysis
     * Sends recent diagnostics to Groq for intelligent insights
     */
    async analyzeWithAI(app?: AppName): Promise<{ analysis: string; suggestions: string[] }> {
        try {
            const entries = await this.getRecent(app, 100);
            const errors = entries.filter(e => e.category === 'error');
            const slowOps = entries.filter(e => e.category === 'performance' && (e.duration || 0) > 500);

            const snapshot = {
                totalEvents: entries.length,
                errors: errors.length,
                slowOps: slowOps.length,
                errorPatterns: Object.entries(
                    errors.reduce((acc: Record<string, number>, e) => {
                        acc[e.action] = (acc[e.action] || 0) + 1;
                        return acc;
                    }, {})
                ).sort(([, a], [, b]) => b - a).slice(0, 5),
                slowPatterns: Object.entries(
                    slowOps.reduce((acc: Record<string, number>, e) => {
                        acc[e.action] = (acc[e.action] || 0) + 1;
                        return acc;
                    }, {})
                ).sort(([, a], [, b]) => b - a).slice(0, 5),
                apps: [...new Set(entries.map(e => e.app))]
            };

            const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY || ''}`
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        { role: 'system', content: 'You are a system diagnostic AI for the Matrix ecosystem. Analyze the diagnostic data and provide: 1) A brief analysis (2-3 sentences), 2) Up to 3 actionable suggestions. Return as JSON: { "analysis": "...", "suggestions": ["..."] }' },
                        { role: 'user', content: JSON.stringify(snapshot) }
                    ],
                    max_tokens: 300,
                    temperature: 0.3,
                    response_format: { type: 'json_object' }
                })
            });

            if (res.ok) {
                const data = await res.json();
                return JSON.parse(data.choices[0].message.content);
            }
        } catch (e) {
            console.error('[MatrixDiagnostic] AI analysis failed:', e);
        }

        return { analysis: 'AI analysis unavailable.', suggestions: [] };
    },

    /**
     * Get session ID
     */
    getSessionId(): string {
        return SESSION_ID;
    },
};

// Auto-flush on interval
if (typeof window !== 'undefined') {
    setInterval(() => MatrixDiagnostic.flush(), FLUSH_INTERVAL);

    // Flush on page unload
    window.addEventListener('beforeunload', () => MatrixDiagnostic.flush());
}

export default MatrixDiagnostic;
