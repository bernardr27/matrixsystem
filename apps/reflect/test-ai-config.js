const { createSupabaseFromEnv } = require('../../scripts/tools/_supabase_client.cjs');
const supabase = createSupabaseFromEnv();

async function runTests() {
    console.log("--- TESTING GHOST RUNNER AI CONFIG ---");

    const commands = [
        { cmd: 'sage:status', desc: 'Checking AI Status' },
        { cmd: 'sage:models', desc: 'Listing AI Models' },
        { cmd: 'sage:hello', desc: 'Testing AI Chat (Expected Fail/Offline)' }
    ];

    for (const test of commands) {
        console.log(`\n[TEST] ${test.desc} ('${test.cmd}')`);

        // 1. Insert Command
        const { data, error } = await supabase
            .from('ghost_bridge')
            .insert([{ command: test.cmd, status: 'pending' }])
            .select()
            .single();

        if (error) {
            console.error("❌ Failed to insert command:", error.message);
            continue;
        }

        console.log(`      Command ID: ${data.id} - Waiting for execution...`);

        // 2. Poll for result
        let attempts = 0;
        let done = false;
        while (!done && attempts < 10) { // 5s timeout
            await new Promise(r => setTimeout(r, 500));
            attempts++;

            const { data: res } = await supabase
                .from('ghost_bridge')
                .select('status, output')
                .eq('id', data.id)
                .single();

            if (res.status === 'executed' || res.status === 'failed') {
                done = true;
                const icon = res.status === 'executed' ? '✅' : '⚠️'; // Failed is okay if it's a handled offline error
                console.log(`${icon} [${res.status.toUpperCase()}] Content:`);
                console.log(`      ${res.output}`);
            }
        }

        if (!done) console.error("❌ TIMEOUT: Ghost Runner did not pick up the command.");
    }

    console.log("\n--- TEST SEQUENCE COMPLETE ---");
    process.exit(0);
}

runTests();
