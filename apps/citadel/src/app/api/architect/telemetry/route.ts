import { NextResponse } from 'next/server';
import os from 'os';

export const dynamic = 'force-dynamic';

/**
 * Phase 42: Architect Telemetry
 * Provides structural and performance data for the self-optimizer.
 */
export async function GET() {
    try {
        // Compute CPU Load (1m avg)
        const load = os.loadavg()[0];
        const cpuCount = os.cpus().length;
        const cpuPercentage = (load / cpuCount) * 100;

        // Compute Memory Usage
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const memPercentage = ((totalMem - freeMem) / totalMem) * 100;

        // Mock API Latency (In production, this would be sourced from middleware metrics)
        const mockLatencyP95 = Math.random() * 600; // Simulated latency for V8 demo

        return NextResponse.json({
            node: process.env.MATRIX_INSTANCE_NAME || 'primary-citadel',
            status: 'online',
            performance: {
                cpu: cpuPercentage,
                memory: memPercentage,
                latency_p95: mockLatencyP95,
                up_time: os.uptime()
            },
            timestamp: new Date().toISOString()
        });

    } catch (err: any) {
        console.error('[ARCHITECT_TELEMETRY_ERROR]', err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
