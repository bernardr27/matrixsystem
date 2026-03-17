const { createSupabaseFromEnv } = require('./_supabase_client.cjs');
const supabase = createSupabaseFromEnv();

async function sendHeartbeat() {
    console.log('[SIM] Sending heartbeat...');
    const now = Date.now();
    const { error } = await supabase
        .from('ghost_bridge')
        .insert({
            command: 'sys:heartbeat',
            status: 'pending',
            source: 'nexus_sentinel',
            output: JSON.stringify({
                uptime: 60,
                launchTime: now - 60000,
                status: 'online'
            })
        });
    if (error) console.error('[SIM_ERROR]', error);
}

async function runSimulation() {
    console.log('--- STARTING SIMULATION ---');
    console.log('Phase 1: 6s Initial Delay...');
    await new Promise(r => setTimeout(r, 6000));

    console.log('Phase 2: 20s Online Period...');
    const startTime = Date.now();
    const interval = setInterval(sendHeartbeat, 4000); // Heartbeat every 4s

    await new Promise(r => setTimeout(r, 20000));
    clearInterval(interval);

    console.log('Phase 3: Entering Offline state (stopped heartbeats).');
    console.log('Note: The UI watchdog takes 45s of silence to mark as OFFLINE.');
    console.log('--- SIMULATION COMPLETE ---');
}

runSimulation();
