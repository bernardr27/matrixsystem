/**
 * Phase 39 Verification Script
 */
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function runVerification() {
    console.log('🧪 Starting Phase 39: The Mind Matrix Verification...\n');

    // TEST 1: Graph API Metadata
    console.log('--- TEST 1: Graph API Metadata ---');
    try {
        const res = await fetch('http://localhost:3000/api/graph');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const sessionNode = data.nodes.find(n => n.type === 'session');
        if (sessionNode) {
            console.log('✅ Session Nodes found.');
            const hasMetadata = 'emotion' in sessionNode || 'mood_score' in sessionNode;
            console.log(`📊 Metadata Check: ${hasMetadata ? 'PASSED' : 'FAILED (Emotion/Mood missing)'}`);
            console.log(`🧠 Embedding Check: ${sessionNode.embedding ? 'PASSED' : 'FAILED (No vector data)'}`);
        } else {
            console.warn('⚠️ No sessions found to verify metadata.');
        }
    } catch (e) {
        console.error('❌ API Test Failed:', e.message);
    }

    // TEST 2: Swarm Weave Command
    console.log('\n--- TEST 2: Swarm Weave Integration ---');
    try {
        const { data: cmd, error } = await supabase.from('ghost_bridge').insert({
            command: 'swarm:weave',
            source: 'verification_script',
            status: 'pending'
        }).select().single();

        if (error) throw error;
        console.log(`📡 Weave command dispatched (ID: ${cmd.id}). Waiting for runner...`);

        // Poll for completion
        let attempts = 0;
        while (attempts < 20) {
            await new Promise(r => setTimeout(r, 3000));
            const { data: updated } = await supabase.from('ghost_bridge').select('*').eq('id', cmd.id).single();

            if (updated.status === 'executed') {
                console.log('✅ Swarm Weave executed successfully.');
                console.log('Output:', updated.output);
                break;
            } else if (updated.status === 'failed') {
                console.error('❌ Swarm Weave failed:', updated.output);
                break;
            }
            attempts++;
            process.stdout.write('.');
        }
        if (attempts >= 20) console.error('❌ Swarm Weave timed out.');
    } catch (e) {
        console.error('❌ Weave Test Failed:', e.message);
    }

    console.log('\n🧪 Verification Complete.');
}

runVerification();
