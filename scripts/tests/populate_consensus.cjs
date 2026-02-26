const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function populateConsensus() {
    console.log('🧪 Populating test consensus insights...');

    const insights = [
        {
            insight_type: 'pattern',
            title: 'Synaptic Resonance Optimization',
            description: 'Detected and verified optimal AI inference threshold for the current regional load.',
            effectiveness_score: 0.95,
            verification_status: 'universal',
            consensus_score: 0.98,
            endorsements_count: 5,
            metadata: { node_participation: 'Global' }
        },
        {
            insight_type: 'optimization',
            title: 'Planetary Mesh Latency Reduction',
            description: 'New routing table verified. Cross-continent latency dropped by 150ms.',
            effectiveness_score: 0.88,
            verification_status: 'verified',
            consensus_score: 0.82,
            endorsements_count: 3,
            metadata: { nodes: ['tailscale-alpha', 'local-mesh-beta'] }
        }
    ];

    for (const insight of insights) {
        // Simple insert
        const { data, error } = await supabase
            .from('collective_insights')
            .insert([insight])
            .select();

        if (error) {
            console.error(`❌ Failed to insert insight: ${insight.title}`, error.message);
        } else {
            console.log(`✅ Inserted insight: ${insight.title}`);
        }
    }

    console.log('🧪 Done.');
}

populateConsensus();
