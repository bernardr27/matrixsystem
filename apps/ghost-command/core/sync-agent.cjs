const axios = require('axios');
const os = require('os');

class SyncAgent {
    constructor(supabase, registry) {
        this.supabase = supabase;
        this.registry = registry;
        this.syncInterval = 60000; // Sync every 60 seconds
        this.isRunning = false;
        this.lastSync = new Date(0).toISOString();
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        console.log('[SYNC_AGENT] 📡 Global Memory Sync initialized');
        this.poll();
    }

    async poll() {
        while (this.isRunning) {
            try {
                await this.syncWithPeers();
            } catch (err) {
                console.error('[SYNC_AGENT] Poll Error:', err.message);
            }
            await new Promise(resolve => setTimeout(resolve, this.syncInterval));
        }
    }

    async syncWithPeers() {
        // 1. Discover online instances
        const instances = await this.registry.getInstances();
        const peers = instances.filter(i => i.isOnline && i.id !== this.registry.instanceId);

        if (peers.length === 0) {
            console.log('[SYNC_AGENT] No peers online. Waiting...');
            return;
        }

        console.log(`[SYNC_AGENT] 🌐 Syncing with ${peers.length} peers...`);

        for (const peer of peers) {
            try {
                // Construct peer API URL (assumes standard Matrix port mapped or accessible via hostname)
                // In production, this would use Tailscale Funnel URLs or static IPs
                const peerUrl = `http://${peer.host}:3005/api/memory/export?since=${this.lastSync}`;

                const response = await axios.get(peerUrl, { timeout: 5000 });
                const { synapses, sessions } = response.data;

                if (synapses && synapses.length > 0) {
                    await this.ingestMemory(synapses, sessions, peer.id);
                }
            } catch (err) {
                console.warn(`[SYNC_AGENT] Failed to sync with peer ${peer.instance_name}:`, err.message);
            }
        }

        this.lastSync = new Date().toISOString();
    }

    async ingestMemory(synapses, sessions, nodeSourceId) {
        console.log(`[SYNC_AGENT] 📥 Ingesting ${synapses.length} synapses from Swarm Node ${nodeSourceId}`);

        // 1. Ingest Sessions first (Context)
        // We use upsert to avoid duplicates, adding node_source to metadata
        for (const session of sessions) {
            const { error } = await this.supabase
                .from('sessions')
                .upsert([{
                    ...session,
                    metadata: {
                        ...(session.metadata || {}),
                        node_source: nodeSourceId,
                        sync_timestamp: new Date().toISOString()
                    }
                }], { onConflict: 'id' });

            if (error) console.error(`[SYNC_AGENT] Session Ingest Error:`, error.message);
        }

        // 2. Ingest Synapses
        for (const synapse of synapses) {
            const { error } = await this.supabase
                .from('synapses')
                .upsert([{
                    ...synapse,
                    metadata: {
                        ...(synapse.metadata || {}),
                        node_source: nodeSourceId,
                        sync_timestamp: new Date().toISOString()
                    }
                }], { onConflict: 'id' });

            if (error) console.error(`[SYNC_AGENT] Synapse Ingest Error:`, error.message);
        }
    }

    stop() {
        this.isRunning = false;
    }
}

module.exports = SyncAgent;
