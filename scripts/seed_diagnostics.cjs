const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Credentials from .env
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('[SEED_DIAGNOSTICS] Missing SUPABASE_URL or SUPABASE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const SOURCES = ['groq-llama3-70b', 'sage-reasoning-core', 'nexus-telemetry', 'ghost-runner-01'];
const EVENT_TYPES = ['groq_call', 'ai_analysis', 'system_log', 'api_request'];
const COMMANDS = ['sys:heartbeat', 'sage:query "analyze usage"', 'desk:nav /dashboard', 'sys:sync', 'ai:generate_pattern'];

async function seed() {
    console.log('Seeding Matrix Diagnostics Data...');

    // 1. Seed System Events (Groq Usage)
    console.log('Generating 50 system events...');
    const events = [];
    for (let i = 0; i < 50; i++) {
        const source = SOURCES[Math.floor(Math.random() * SOURCES.length)];
        const type = EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)];
        const duration = Math.floor(Math.random() * 2000) + 100; // 100-2100ms
        const isError = Math.random() > 0.95; // 5% error rate

        events.push({
            source,
            event_type: type,
            message: `Mock event ${i} for ${type}`,
            severity: isError ? 'error' : 'info',
            metadata: {
                duration,
                tokens: Math.floor(Math.random() * 500),
                model: 'llama-3.3-70b-versatile'
            },
            timestamp: new Date(Date.now() - Math.floor(Math.random() * 86400000)).toISOString() // Last 24h
        });
    }

    const { error: eventErr } = await supabase.from('system_events').insert(events);
    if (eventErr) console.error('Error inserting events:', eventErr);
    else console.log('✓ System Events inserted.');

    // 2. Seed Ghost Bridge (Command History)
    console.log('Generating 20 ghost commands...');
    const commands = [];
    for (let i = 0; i < 20; i++) {
        const cmd = COMMANDS[Math.floor(Math.random() * COMMANDS.length)];
        const status = Math.random() > 0.8 ? 'failed' : 'completed';

        commands.push({
            command: cmd,
            source: 'admin-console',
            status,
            output: status === 'failed' ? 'Error: Connection timeout' : JSON.stringify({ success: true, timestamp: Date.now() }),
            created_at: new Date(Date.now() - Math.floor(Math.random() * 3600000)).toISOString() // Last 1h
        });
    }

    const { error: cmdErr } = await supabase.from('ghost_bridge').insert(commands);
    if (cmdErr) console.error('Error inserting commands:', cmdErr);
    else console.log('✓ Ghost Commands inserted.');

    console.log('Seeding Complete.');
}

seed().catch(console.error);

