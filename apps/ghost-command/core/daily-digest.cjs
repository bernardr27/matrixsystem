/**
 * Phase 29: Daily Digest Scheduler
 * 
 * Runs alongside Ghost Brain. At a configurable hour each day,
 * sends a comprehensive system report to Telegram.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

const DIGEST_HOUR = 8; // 8 AM local time
const CHECK_INTERVAL = 15 * 60 * 1000; // Check every 15 minutes
let lastDigestDate = null;

async function sendDigest() {
    const today = new Date().toISOString().split('T')[0];
    if (lastDigestDate === today) return; // Already sent today

    const currentHour = new Date().getHours();
    if (currentHour < DIGEST_HOUR) return; // Not time yet

    console.log('[DAILY_DIGEST] 📋 Generating daily digest...');
    lastDigestDate = today;

    try {
        const os = require('os');
        const net = require('net');

        // Gather 24h metrics
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        // Uptime snapshots
        const { data: snapshots } = await supabase
            .from('uptime_log')
            .select('*')
            .gte('timestamp', yesterday)
            .order('timestamp', { ascending: true });

        // System events
        const { count: errorCount } = await supabase
            .from('system_events')
            .select('id', { count: 'exact', head: true })
            .eq('severity', 'error')
            .gte('timestamp', yesterday);

        const { count: warningCount } = await supabase
            .from('system_events')
            .select('id', { count: 'exact', head: true })
            .eq('severity', 'warning')
            .gte('timestamp', yesterday);

        const { count: totalEvents } = await supabase
            .from('system_events')
            .select('id', { count: 'exact', head: true })
            .gte('timestamp', yesterday);

        // Ghost Bridge activity
        const { count: commandCount } = await supabase
            .from('ghost_bridge')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', yesterday);

        const { count: failedCount } = await supabase
            .from('ghost_bridge')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'failed')
            .gte('created_at', yesterday);

        // Calculate uptime stats
        let avgRam = 0, avgCpu = 0, healthyPct = 0;
        if (snapshots && snapshots.length > 0) {
            avgRam = (snapshots.reduce((a, s) => a + (s.ram_usage || 0), 0) / snapshots.length).toFixed(0);
            avgCpu = (snapshots.reduce((a, s) => a + (s.cpu_load || 0), 0) / snapshots.length).toFixed(1);
            healthyPct = ((snapshots.filter(s => s.all_healthy).length / snapshots.length) * 100).toFixed(0);
        }

        // Current vitals
        const cpuNow = os.loadavg()[0].toFixed(2);
        const ramNow = Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100);
        const uptimeH = (os.uptime() / 3600).toFixed(0);

        // Check services
        const checkPort = (port) => new Promise((resolve) => {
            const s = new net.Socket();
            s.setTimeout(2000);
            s.on('connect', () => { s.destroy(); resolve(true); });
            s.on('error', () => { s.destroy(); resolve(false); });
            s.on('timeout', () => { s.destroy(); resolve(false); });
            s.connect(port, '127.0.0.1');
        });

        const [reflect, nexus, ollama] = await Promise.all([
            checkPort(3000), checkPort(3001), checkPort(11434)
        ]);

        // Build digest
        const digest =
            `📋 *MATRIX DAILY DIGEST*\n` +
            `📅 ${today}\n\n` +
            `*📊 24h System Stats:*\n` +
            `  RAM: avg ${avgRam}% | now ${ramNow}%\n` +
            `  CPU: avg ${avgCpu} | now ${cpuNow}\n` +
            `  Health Score: ${healthyPct}%\n` +
            `  Uptime: ${uptimeH}h\n\n` +
            `*📡 Activity:*\n` +
            `  Commands: ${commandCount || 0} (${failedCount || 0} failed)\n` +
            `  Events: ${totalEvents || 0} total\n` +
            `  ⚠️ Warnings: ${warningCount || 0}\n` +
            `  ❌ Errors: ${errorCount || 0}\n\n` +
            `*🔌 Services Now:*\n` +
            `  ${reflect ? '✅' : '❌'} Reflect\n` +
            `  ${nexus ? '✅' : '❌'} Matrix Hub\n` +
            `  ${ollama ? '✅' : '❌'} Ollama\n\n` +
            `_Automated by Ghost Brain_`;

        // Send via Telegram
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;

        if (botToken && chatId) {
            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: digest,
                    parse_mode: 'Markdown'
                })
            });
            console.log('[DAILY_DIGEST] ✅ Sent to Telegram.');
        } else {
            console.log('\x1b[2m[DAILY_DIGEST] Skip Telegram (missing Chat ID/Token)\x1b[0m');
        }

        // Also log as system event
        const EventLogger = require('./event-logger.cjs');
        EventLogger.info('daily_digest', 'digest_sent', `Daily digest sent for ${today}`);

    } catch (err) {
        console.error('[DAILY_DIGEST] ❌ Failed:', err.message);
    }
}

function start() {
    console.log(`📋 [DAILY_DIGEST] Scheduler active — sends at ${DIGEST_HOUR}:00 daily`);
    setInterval(sendDigest, CHECK_INTERVAL);
    // Run initial check in 30s
    setTimeout(sendDigest, 30000);
}

module.exports = { start, sendDigest };
