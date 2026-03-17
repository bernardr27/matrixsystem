const { createSupabaseFromEnv } = require('../../scripts/tools/_supabase_client.cjs');
const supabase = createSupabaseFromEnv();

async function runTest() {
    console.log("--- NEURAL UPLINK SELF-TEST ---");
    console.log("[1/3] Connecting to Cloud Node...");

    // 1. Insert Test Command
    const { data, error } = await supabase
        .from('ghost_bridge')
        .insert([{
            command: 'test_echo',
            status: 'pending',
            output: 'Uplink Test Initialization'
        }])
        .select()
        .single();

    if (error) {
        console.error("❌ CLOUD CONNECT FAILED:", error.message);
        process.exit(1);
    }

    console.log(`[2/3] Command Injection Successful (ID: ${data.id})`);
    console.log("      Waiting for Ghost Runner to intercept...");

    // 2. Poll for Completion (Max 10s)
    let attempts = 0;
    const maxAttempts = 20;

    const interval = setInterval(async () => {
        attempts++;
        const { data: check } = await supabase
            .from('ghost_bridge')
            .select('status, output')
            .eq('id', data.id)
            .single();

        if (check.status === 'executed' || check.status === 'failed') {
            clearInterval(interval);
            if (check.status === 'executed') {
                console.log("✅ [3/3] GHOST RUNNER CONFIRMED EXECUTION.");
                console.log("      The Desktop Link is ACTIVE.");
                process.exit(0);
            } else {
                console.error("❌ EXPLOSION: Runner marked task as FAILED.");
                process.exit(1);
            }
        }

        if (attempts >= maxAttempts) {
            clearInterval(interval);
            console.error("❌ TIMEOUT: Ghost Runner did not respond in 10s.");
            console.error("      Possible cause: ghost-runner.cjs is not running or crashed.");
            process.exit(1);
        }

        process.stdout.write(".");
    }, 500);
}

runTest();
