const { execSync } = require('child_process');
const { createSupabaseFromEnv } = require('./_supabase_client.cjs');
const supabase = createSupabaseFromEnv();

async function runTest() {
    console.log('\x1b[36m--- NEXUS ULTIMATE VALIDATION (E2E STRESS TEST) ---\x1b[0m\n');

    // 1. Connection Check
    console.log('[1/4] Verifying Supabase Uplink...');
    const { data: connection, error: cErr } = await supabase.from('ghost_bridge').select('id').limit(1);
    if (cErr) throw new Error('Supabase Connection Failed: ' + cErr.message);
    console.log('\x1b[32m[PASS]\x1b[0m Uplink Established.\n');

    // 2. Pulse Check (Recent Heartbeat)
    console.log('[2/4] Verifying Sentinel Heartbeat...');
    const { data: heartbeats, error: hErr } = await supabase
        .from('ghost_bridge')
        .select('*')
        .eq('command', 'sys:heartbeat')
        .eq('source', 'ghost_runner')
        .order('created_at', { ascending: false })
        .limit(1);

    if (hErr || !heartbeats.length) throw new Error('Sentinel Pulse Not Found');
    const lastPulse = new Date(heartbeats[0].created_at).getTime();
    const age = Date.now() - lastPulse;
    if (age > 15000) throw new Error(`Sentinel Pulse Stale (${(age / 1000).toFixed(1)}s age)`);
    console.log('\x1b[32m[PASS]\x1b[0m Sentinel Pulse healthy (Age: ' + (age / 1000).toFixed(1) + 's)\n');

    // 3. Command Lifecycle Test (Sync)
    console.log('[3/4] Testing Command Lifecycle (sys:sync)...');
    const crypto = require('crypto');
    const testId = crypto.randomUUID();
    const { error: iErr } = await supabase.from('ghost_bridge').insert({
        id: testId,
        command: 'sys:sync',
        source: 'ultimate_verify',
        status: 'pending'
    });
    if (iErr) throw iErr;

    console.log(' - Command Dispatched. Waiting for Sentinel Acknowledgement...');
    let acknowledged = false;
    for (let i = 0; i < 10; i++) {
        await new Promise(r => setTimeout(r, 1000));
        const { data: ackData } = await supabase.from('ghost_bridge').select('status, output').eq('id', testId).single();
        if (ackData && (ackData.status === 'executed' || ackData.status === 'executing')) {
            acknowledged = true;
            console.log(` - Sentinel ACK (Status: ${ackData.status})`);
            break;
        }
    }
    if (!acknowledged) throw new Error('Sentinel failed to acknowledge command within 10s');
    console.log('\x1b[32m[PASS]\x1b[0m Command Pipeline operational.\n');

    // 4. Ecosystem Infrastructure Audit
    console.log('[4/4] Auditing Ecosystem Infrastructure & Ports...');

    // Give services a moment to stabilize if sys:sync triggered an ignition
    await new Promise(r => setTimeout(r, 3000));

    const services = [
        { name: 'reflect', path: 'apps/reflect', port: 3000 },
        { name: 'nexus', path: 'apps/nexus', port: 3001 },
        { name: 'ghost-command', path: 'apps/ghost-command', port: 5173 }
    ];
    const fs = require('fs');

    for (const s of services) {
        const fullPath = path.join(__dirname, '..', '..', s.path);
        const exists = fs.existsSync(fullPath);

        let portStatus = '\x1b[31mOFFLINE\x1b[0m';
        try {
            const stdout = execSync(`netstat -ano | findstr LISTENING | findstr :${s.port}`, { encoding: 'utf8' });
            if (stdout) portStatus = '\x1b[32mONLINE\x1b[0m';
        } catch (e) { }

        console.log(` - ${s.name.toUpperCase()}: [Path: ${exists ? '\x1b[32mOK\x1b[0m' : '\x1b[31mFAIL\x1b[0m'}, Port: ${portStatus}]`);
        if (!exists) throw new Error(`Critical Directory Missing: ${s.path}`);
        if (portStatus.includes('OFFLINE')) throw new Error(`Critical Service Offline: ${s.name} (Port ${s.port})`);
    }

    console.log('\n\x1b[36m--- NEXUS CERTIFICATION: [APPROVED] ---\x1b[0m');
    console.log('\x1b[35m[STATUS] System is in "v3.0 Golden State" Nominal Operation.\x1b[0m');
    process.exit(0);
}

runTest().catch(err => {
    console.error(`\n\x1b[31m[CERTIFICATION FAILED]:\x1b[0m ${err.message}`);
    process.exit(1);
});
