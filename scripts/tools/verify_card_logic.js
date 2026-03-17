
const { createSupabaseFromEnv } = require('./_supabase_client.cjs');
const { execSync } = require('child_process');
const supabase = createSupabaseFromEnv();

function getActualPortStatus(port) {
    try {
        const cmd = `netstat -ano | findstr :${port} | findstr LISTENING`;
        const result = execSync(cmd, { encoding: 'utf8' }).trim();
        return result ? 'online' : 'offline';
    } catch (e) {
        return 'offline';
    }
}

async function verifyCardAccuracy() {
    console.log('--- NEXUS CARD ACCURACY AUDIT ---');

    const actual = {
        reflect: getActualPortStatus(3000),
        nexus: getActualPortStatus(3001),
        ghost: getActualPortStatus(5173),
        runner: 'unknown' // Runner has no port, depends on process
    };

    console.log('\n[1/2] Actual Operational Reality (Port Scan):');
    console.log(actual);

    console.log('\n[2/2] Telemetry Reported (Supabase):');
    const { data: latest } = await supabase.from('ghost_bridge')
        .select('output, source, created_at')
        .eq('command', 'sys:heartbeat')
        .order('created_at', { ascending: false })
        .limit(5);

    if (!latest) {
        console.warn('No heartbeats found.');
        return;
    }

    // We look for the most recent sentinel heartbeat as it's the authority for cards
    const sentinelHeartbeat = latest.find(h => h.source === 'nexus_sentinel');
    const runnerHeartbeat = latest.find(h => h.source === 'ghost_runner');

    if (sentinelHeartbeat) {
        const telemetry = JSON.parse(sentinelHeartbeat.output).services;
        console.log('Sentinel Authority says:', telemetry);

        const keys = ['reflect', 'nexus', 'ghost'];
        let match = true;
        keys.forEach(k => {
            if (actual[k] !== telemetry[k]) {
                console.warn(`❌ MISMATCH detected for ${k}: Actual=${actual[k]}, Telemetry=${telemetry[k]}`);
                match = false;
            }
        });

        if (match) {
            console.log('✅ Telemetry maps perfectly to the Service Cards.');
        }
    } else {
        console.warn('⚠️ No recent Sentinel heartbeat. Telemetry may be stale.');
    }

    if (runnerHeartbeat) {
        console.log('\nGhost Runner secondary telemetry:', JSON.parse(runnerHeartbeat.output).services);
    }
}

verifyCardAccuracy();
