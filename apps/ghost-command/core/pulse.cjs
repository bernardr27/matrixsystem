const net = require('net');

function checkPort(port) {
    return new Promise((resolve) => {
        let finished = false;
        const socket = new net.Socket();

        const finish = (result) => {
            if (finished) return;
            finished = true;
            try { socket.destroy(); } catch (e) { }
            resolve(result);
        };

        socket.setTimeout(1500);
        socket.once('connect', () => finish('ONLINE'));
        socket.once('timeout', () => finish('OFFLINE'));
        socket.once('error', () => finish('OFFLINE'));

        socket.connect(port, '127.0.0.1');
    });
}

async function runPulse() {
    console.log('[PULSE] Starting Stage 1: Native Network Probing...');

    const results = {
        timestamp: new Date().toISOString(),
        network: {},
        cloud: 'pending'
    };

    const ports = [3000, 3001, 5173];
    for (const port of ports) {
        results.network[port] = await checkPort(port);
        console.log(` - Port ${port}: ${results.network[port]}`);
    }

    console.log('[PULSE] Starting Stage 2: Cloud Synchronization...');
    try {
        const { createClient } = require('@supabase/supabase-js');
        const supabaseUrl = 'https://phmnyenltuqxtkadnhpj.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobW55ZW5sdHVxeHRrYWRuaHBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyMTc4ODAsImV4cCI6MjA4NDc5Mzg4MH0.oyEVHSF8iZxvDD4scTmYuUOGrU82DVrPRJ1ABLBnZzM'.trim();
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { error } = await supabase.from('ghost_bridge').select('id').limit(1);
        results.cloud = error ? 'DISCONNECTED' : 'STABLE';

        console.log(`Cloud Bridge: ${results.cloud === 'STABLE' ? '🟢' : '🔴'} ${results.cloud}`);

        await supabase.from('matrix_diagnostics').insert({
            app: 'MATRIX_HUB_PULSE',
            category: 'performance',
            severity: results.cloud === 'STABLE' ? 'info' : 'warning',
            action: 'System Pulse Check',
            metadata: results
        });
        console.log('[PULSE] Logged to persistent memory.');
    } catch (e) {
        console.error('[PULSE] Cloud Sync Failed:', e.message);
    }

    console.log('[PULSE] Complete.');
}

runPulse();
