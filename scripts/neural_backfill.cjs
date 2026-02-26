const { createClient } = require('@supabase/supabase-js');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
require('dotenv').config();

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OLLAMA_URL = 'http://localhost:11434';
const EMBED_MODEL = 'nomic-embed-text:latest';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function generateEmbedding(text) {
    try {
        const response = await fetch(`${OLLAMA_URL}/api/embeddings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: EMBED_MODEL,
                prompt: text
            })
        });

        if (!response.ok) throw new Error(`Embedding failed: ${response.statusText}`);
        const data = await response.json();
        return data.embedding;
    } catch (err) {
        console.error(`  - [ERROR] ${err.message}`);
        return null;
    }
}

async function startBackfill() {
    console.log('🧠 [NEURAL_BACKFILL] Initiating historical indexing...');

    // 1. Fetch sessions without embeddings
    const { data: sessions, error } = await supabase
        .from('sessions')
        .select('id, initial_input')
        .is('embedding', null);

    if (error) {
        console.error('❌ Database error:', error.message);
        return;
    }

    if (!sessions || sessions.length === 0) {
        console.log('✅ All sessions are already indexed.');
        return;
    }

    console.log(`📦 Found ${sessions.length} sessions requiring neural anchoring.`);

    for (const session of sessions) {
        process.stdout.write(`⚡ Indexing ${session.id}... `);

        const embedding = await generateEmbedding(session.initial_input);

        if (embedding) {
            const { error: updateError } = await supabase
                .from('sessions')
                .update({ embedding })
                .eq('id', session.id);

            if (updateError) {
                console.log(`❌ Update failed: ${updateError.message}`);
            } else {
                console.log('✅ Done.');
            }
        } else {
            console.log('⚠️ Skipped (No embedding generated).');
        }

        // Brief pause to prevent overloading 
        await new Promise(r => setTimeout(r, 100));
    }

    console.log('🎊 [NEURAL_BACKFILL] Sequence complete. Sage memory is now current.');
}

startBackfill();
