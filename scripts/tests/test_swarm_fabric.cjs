/**
 * Verification Test for Phase 38: Neural Swarm & Fabric
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const { createClient } = require('@supabase/supabase-js');

const SwarmAgent = require('../../apps/ghost-command/core/swarm-agent.cjs');
const FabricAgent = require('../../apps/ghost-command/core/fabric-agent.cjs');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const config = {
    ollama: { url: process.env.AI_BASE_URL },
    citadelUrl: 'http://127.0.0.1:3005'
};

async function runTests() {
    console.log('🧪 Starting Neural Swarm & Fabric Verification...\n');

    const swarm = new SwarmAgent(supabase, config);
    const fabric = new FabricAgent(supabase, config);

    // 1. Test Fabric Patterns List
    console.log('--- TEST 1: Fabric Patterns List ---');
    const patterns = fabric.listPatterns();
    console.log('Found patterns:', patterns);
    if (patterns.length >= 3) {
        console.log('✅ Found all promised patterns.\n');
    } else {
        console.log('❌ Missing some patterns.\n');
    }

    // 2. Test Fabric Execution (Summarize Logs)
    console.log('--- TEST 2: Fabric Execution (summarize_logs) ---');
    try {
        const logInput = "[ERROR] 2026-02-22 15:30:00 - GhostRunner: Connection failed to Supabase.\n[WARN] 2026-02-22 15:31:00 - Sentinel: High RAM detected (92%).";
        const logSummary = await fabric.executePattern('summarize_logs', logInput);
        console.log('Log Summary Output:\n', logSummary);
        console.log('✅ Fabric Execution successful.\n');
    } catch (e) {
        console.log('❌ Fabric Execution failed:', e.message, '\n');
    }

    // 3. Test Swarm Consensus (Mock Verification)
    console.log('--- TEST 3: Swarm Consensus (Mock Code Verification) ---');
    try {
        const taskPrompt = "Review this code for potential security flaws: \n```javascript\napp.get('/api/user', (req, res) => {\n  const id = req.query.id;\n  db.execute(`SELECT * FROM users WHERE id = ${id}`);\n});\n```";
        const swarmResult = await swarm.executeWithConsensus('Security Code Review', taskPrompt, 3);
        console.log('Swarm Consensus Output:\n', swarmResult.consensus);
        console.log(`✅ Swarm Consensus successful (Workers: ${swarmResult.workers}/${swarmResult.poolTotal}).\n`);
    } catch (e) {
        console.log('❌ Swarm Consensus failed:', e.message, '\n');
    }

    console.log('🧪 Verification Suite Complete.');
}

runTests();
