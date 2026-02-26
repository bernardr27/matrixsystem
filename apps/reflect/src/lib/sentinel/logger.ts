import { createClient } from '../supabase/client';
import { SentinelAI } from './ai-engine';

export type LogSeverity = 'info' | 'warning' | 'critical';

export interface LogEntry {
    error_message: string;
    error_stack?: string | null;
    context: any;
    severity: LogSeverity;
    tags?: string[];
    timestamp?: string; // Client-side timestamp
}

export class SentinelLogger {
    private static buffer: LogEntry[] = [];
    private static FLUSH_INTERVAL = 2000;
    private static MAX_BUFFER_SIZE = 5;
    private static flushTimer: NodeJS.Timeout | null = null;

    /**
     * logs an event to the Sentinel system.
     * Uses buffering for non-critical logs, but immediately flushes critical ones.
     */
    static async log(error: Error | string, context: any = {}, severity: LogSeverity = 'warning') {
        const errorMessage = error instanceof Error ? error.message : error;
        const errorStack = error instanceof Error ? error.stack : null;

        // AI PRE-ANALYSIS: Tag the error before sending
        const aiAnalysis = SentinelAI.analyze(errorMessage);
        const tags = [aiAnalysis.action !== 'none' ? `ACTION:${aiAnalysis.action}` : 'analyzed'];

        const logEntry: LogEntry = {
            error_message: errorMessage,
            error_stack: errorStack,
            context: {
                ...context,
                url: typeof window !== 'undefined' ? window.location.href : 'server',
                userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
                userId: await this.getUserId(),
                ai_insight: aiAnalysis.insight // Attach initial insight
            },
            severity,
            tags,
            timestamp: new Date().toISOString()
        };

        // Critical errors bypass buffer
        if (severity === 'critical') {
            await this.flush([logEntry]);
            return;
        }

        // Add to buffer
        this.buffer.push(logEntry);

        // Check buffer limits
        if (this.buffer.length >= this.MAX_BUFFER_SIZE) {
            this.flushBuffer();
        } else if (!this.flushTimer) {
            this.flushTimer = setTimeout(() => this.flushBuffer(), this.FLUSH_INTERVAL);
        }
    }

    private static async getUserId(): Promise<string> {
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            return user?.id || 'anonymous';
        } catch {
            return 'unknown';
        }
    }

    private static async flushBuffer() {
        if (this.buffer.length === 0) return;

        const logsToFlush = [...this.buffer];
        this.buffer = []; // Clear immediately to prevent double-send

        if (this.flushTimer) {
            clearTimeout(this.flushTimer);
            this.flushTimer = null;
        }

        await this.flush(logsToFlush);
    }

    private static async flush(logs: LogEntry[]) {
        try {
            const supabase = createClient();
            // Bulk insert
            const { error: insertError } = await supabase
                .from('sentinel_logs')
                .insert(logs);

            if (insertError) {
                console.warn("[Sentinel] Internal logging failure:", insertError.message);
            } else {
                if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
                    
                }
            }
        } catch (e) {
            console.warn("[Sentinel] Critical logging failure:", e);
        }
    }
}
