const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Calculates cosine similarity between two vectors.
 */
function cosineSimilarity(fixed, vector) {
    let dotProduct = 0;
    let mA = 0;
    let mB = 0;
    for (let i = 0; i < fixed.length; i++) {
        dotProduct += fixed[i] * vector[i];
        mA += fixed[i] * fixed[i];
        mB += vector[i] * vector[i];
    }
    return dotProduct / (Math.sqrt(mA) * Math.sqrt(mB));
}

/**
 * Basic K-Means clustering for high-dimensional vectors.
 */
async function clusterSessions(k = 5) {
    console.log(`🌌 [SYNCHRONICITY] Initiating semantic clustering (K=${k})...`);

    // 1. Fetch sessions with embeddings
    const { data: sessions, error } = await supabase
        .from('sessions')
        .select('id, initial_input, embedding')
        .not('embedding', 'is', null);

    if (error || !sessions || sessions.length === 0) {
        console.log('⚠️ No indexed sessions found for clustering.');
        return;
    }

    console.log(`📡 Analyzing ${sessions.length} neural anchors...`);

    // Extract raw vectors
    const sessionVectors = sessions.map(s => JSON.parse(s.embedding));

    // Initialize centroids (Simple random selection)
    let centroids = [];
    for (let i = 0; i < k && i < sessions.length; i++) {
        centroids.push([...sessionVectors[Math.floor(Math.random() * sessionVectors.length)]]);
    }

    let assignments = new Array(sessions.length).fill(-1);
    let iterations = 0;
    let changed = true;

    while (changed && iterations < 20) {
        iterations++;
        changed = false;

        // E-Step: Assign sessions to nearest centroid
        for (let i = 0; i < sessionVectors.length; i++) {
            let maxSim = -Infinity;
            let bestCluster = -1;

            for (let j = 0; j < centroids.length; j++) {
                const sim = cosineSimilarity(centroids[j], sessionVectors[i]);
                if (sim > maxSim) {
                    maxSim = sim;
                    bestCluster = j;
                }
            }

            if (assignments[i] !== bestCluster) {
                assignments[i] = bestCluster;
                changed = true;
            }
        }

        // M-Step: Recalculate centroids
        for (let j = 0; j < centroids.length; j++) {
            const clusterPoints = sessionVectors.filter((_, idx) => assignments[idx] === j);
            if (clusterPoints.length > 0) {
                const newCentroid = new Array(centroids[0].length).fill(0);
                for (const point of clusterPoints) {
                    for (let d = 0; d < point.length; d++) {
                        newCentroid[d] += point[d];
                    }
                }
                centroids[j] = newCentroid.map(val => val / clusterPoints.length);
            }
        }
    }

    console.log(`✨ Converged in ${iterations} iterations.`);

    // 2. Persist to Database
    for (let j = 0; j < centroids.length; j++) {
        const clusterSessions = sessions.filter((_, idx) => assignments[idx] === j);
        if (clusterSessions.length === 0) continue;

        console.log(`📦 Cluster ${j} has ${clusterSessions.length} sessions.`);

        // Insert/Update Cluster
        const { data: cluster, error: cError } = await supabase
            .from('mind_clusters')
            .insert({
                user_id: sessions[0].user_id, // Assume same user for now
                centroid: centroids[j],
                resonance_score: clusterSessions.length / sessions.length,
                title: `Pending Sage Refinement ${j}`
            })
            .select()
            .single();

        if (cError) {
            console.error(`❌ Cluster insertion failed: ${cError.message}`);
            continue;
        }

        // Link Sessions
        const links = clusterSessions.map(s => ({
            session_id: s.id,
            cluster_id: cluster.id,
            distance: 1 - cosineSimilarity(centroids[j], JSON.parse(s.embedding))
        }));

        const { error: lError } = await supabase.from('session_clusters').insert(links);
        if (lError) console.error(`❌ Session linking failed: ${lError.message}`);
    }

    console.log('✅ [SYNCHRONICITY] Pattern scan complete.');
}

module.exports = { clusterSessions };

if (require.main === module) {
    clusterSessions().catch(console.error);
}
