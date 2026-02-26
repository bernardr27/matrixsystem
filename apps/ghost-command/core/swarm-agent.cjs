/**
 * Swarm Consensus Engine — Multi-Agent Verification Logic
 * 
 * This agent manages a pool of virtual workers to perform redundant evaluation
 * and a conciliator to produce a finalized, verified consensus.
 * 
 * Part of Matrix Phase 38: Neural Swarm Optimization
 */

const EventLogger = require('./event-logger.cjs');

class SwarmAgent {
    constructor(supabase, config = {}) {
        this.supabase = supabase;
        this.config = config;
        this.citadelUrl = process.env.CITADEL_URL || 'http://localhost:3005';
        this.messenger = null;
    }

    setMessenger(messenger) {
        this.messenger = messenger;
    }

    /**
     * Internal: Call Matrix Neural Mesh
     */
    async meshCall(messages, options = {}) {
        try {
            const response = await fetch(`${this.citadelUrl}/api/neural`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'chat',
                    messages,
                    options
                })
            });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`Neural Mesh Error: ${response.status} - ${errorBody}`);
            }
            const data = await response.json();
            return data.response;
        } catch (err) {
            console.error('[SWARM_AGENT] Mesh call failed:', err.message);
            return null;
        }
    }

    /**
     * Execute a task using a Swarm of agents for consensus.
     * Supports distributed execution if peer nodes are available.
     */
    async executeWithConsensus(taskTitle, prompt, poolSize = 3) {
        console.log(`🐝 [SWARM] Initiating '${taskTitle}' with ${poolSize} workers...`);

        // 1. Get Peer Nodes for Distributed Execution
        let activePeers = [];
        if (this.messenger && this.messenger.registry) {
            const allNodes = await this.messenger.registry.getInstances();
            activePeers = allNodes.filter(n => n.isOnline && n.id !== this.messenger.instanceId);
            console.log(`🐝 [SWARM] Distributed swarm capacity: ${activePeers.length} peer nodes online.`);
        }

        // 2. PHASE ONE: WORKER POOL (Multiplexed/Distributed Inference)
        const workerTasks = [];
        for (let i = 0; i < poolSize; i++) {
            const temperature = 0.2 + (i * 0.3);

            // Delegate to peer if available and we're not over-delegating
            if (activePeers.length > 0 && i < activePeers.length) {
                const peer = activePeers[i];
                console.log(`🐝 [SWARM] Delegating worker ${i + 1} to node '${peer.instance_name}'`);

                workerTasks.push(this.messenger.send(peer.id, 'RESEARCH_DELEGATION', {
                    taskTitle,
                    prompt,
                    temperature,
                    workerId: i + 1
                }).then(msgId => this.messenger.waitForResponse(msgId))
                    .then(res => res.payload.response)
                    .catch(err => {
                        console.warn(`[SWARM] Delegation to ${peer.instance_name} failed:`, err.message);
                        return null;
                    }));
            } else {
                // Execute locally if no peer or pool > peers
                workerTasks.push(this.meshCall([
                    { role: 'system', content: `You are Worker ${i + 1} of the Matrix Swarm. Perform the following task with extreme precision and detail.` },
                    { role: 'user', content: prompt }
                ], { temperature, model: 'llama-3.3-70b-versatile' }));
            }
        }

        const workerOutputs = await Promise.all(workerTasks);
        const validOutputs = workerOutputs.filter(o => o !== null);

        if (validOutputs.length === 0) {
            throw new Error('Swarm failure: All workers returned empty/null responses.');
        }

        console.log(`🐝 [SWARM] Received ${validOutputs.length} valid responses (${workerTasks.length - validOutputs.length} failed). Conciliating...`);

        // 3. PHASE TWO: CONCILIATION (Synthesis & Verification)
        const conciliationPrompt = `
            You are the Matrix Swarm Conciliator. 
            Below are ${validOutputs.length} independent worker evaluations for the task: "${taskTitle}".
            
            WORKER OUTPUTS:
            ${validOutputs.map((o, i) => `--- WORKER ${i + 1} ---\n${o}`).join('\n\n')}
            
            TASK:
            1. Identify any contradictions or disagreements between workers.
            2. Synthesize all valid points into a single, authoritative consensus.
            3. Provide a 'Confidence Score' (0-100) based on worker alignment.
            4. If there are major contradictions that cannot be resolved, flag them as "CRITICAL_SKEPTICISM".
            
            Format:
            ## Swarm Consensus
            [The synthesized authoritative answer]
            
            ## Alignment Analysis
            - Key points of agreement: ...
            - Key points of divergence: ...
            - Confidence Score: [0-100]%
        `;

        const consensus = await this.meshCall([
            { role: 'system', content: 'You are an elite cognitive orchestrator. Minimize hallucination by verifying worker alignment.' },
            { role: 'user', content: conciliationPrompt }
        ], { temperature: 0.1, model: 'llama-3.3-70b-versatile' });

        // 4. LOGGING
        if (EventLogger) {
            EventLogger.info('swarm_agent', 'consensus_reached', `Swarm task '${taskTitle}' finished with ${validOutputs.length} workers.`, {
                task: taskTitle,
                workerCount: validOutputs.length,
                consensusSnippet: consensus?.substring(0, 100)
            });
        }

        return {
            consensus,
            workers: validOutputs.length,
            poolTotal: poolSize
        };
    }

    /**
     * Execute a Spatial Analysis task for environmental grounding.
     * Part of Phase 46: Spatial Synergy.
     */
    async executeSpatialAnalyst(imageUrl, metadata = {}) {
        console.log(`🐝 [SWARM] Initiating Spatial Analysis for Uplink: ${imageUrl}`);

        const prompt = `
            Analyze this environment for topological grounding.
            IMAGE_URL: ${imageUrl}
            METADATA: ${JSON.stringify(metadata)}
            
            TASK:
            1. Identify primary physical entities and their spatial relationships.
            2. Detect any machine-operable interfaces or control points.
            3. Assess environmental safety/integrity for autonomous operation.
            4. Generate a 'Topological Summary' (JSON) for Hive coordination.
        `;

        try {
            const analysis = await this.executeWithConsensus('Spatial Environmental Grounding', prompt, 3);

            // Log spatial event
            if (EventLogger) {
                EventLogger.info('swarm_agent', 'spatial_grounding_complete', `Environment grounded via vision uplift.`, {
                    imageUrl,
                    confidence: analysis.consensus.match(/Confidence Score: (\d+)%/)?.[1]
                });
            }

            return analysis;
        } catch (err) {
            console.error('[SWARM_AGENT] Spatial analysis failed:', err.message);
            throw err;
        }
    }
}

module.exports = SwarmAgent;
