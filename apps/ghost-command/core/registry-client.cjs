const os = require('os');

class RegistryClient {
    constructor(supabase, config) {
        this.supabase = supabase;
        this.config = config;
        this.instanceId = null;
        this.registrationComplete = false;
    }

    async register() {
        const instanceData = {
            instance_name: this.config.instanceName || `matrix-${os.hostname()}`,
            environment: this.config.environment || 'dev',
            host: os.hostname(),
            version: this.config.version || '2.0.0',
            status: 'online',
            cpu_load: os.loadavg()[0],
            ram_percent: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(1),
            uptime_seconds: Math.floor(process.uptime()),
            metadata: {
                platform: os.platform(),
                arch: os.arch(),
                release: os.release(),
                region: process.env.MATRIX_REGION || (process.env.TS_NODE_NAME ? 'tailscale-mesh' : 'local-mesh'),
                provider: process.env.MATRIX_PROVIDER || (process.env.TS_NODE_NAME ? 'tailscale' : 'local'),
                cpus: os.cpus().length,
                total_mem: os.totalmem()
            }
        };

        try {
            // Check if instance already exists
            const { data: existing } = await this.supabase
                .from('matrix_instances')
                .select('id')
                .eq('instance_name', instanceData.instance_name)
                .single();

            if (existing) {
                // Update existing instance
                const { data, error } = await this.supabase
                    .from('matrix_instances')
                    .update({
                        ...instanceData,
                        last_heartbeat: new Date().toISOString()
                    })
                    .eq('id', existing.id)
                    .select()
                    .single();

                if (error) throw error;
                this.instanceId = data.id;
                console.log(`[REGISTRY] ♻️ Re-registered as ${instanceData.instance_name} (${instanceData.environment})`);
            } else {
                // Create new instance
                const { data, error } = await this.supabase
                    .from('matrix_instances')
                    .insert([instanceData])
                    .select()
                    .single();

                if (error) throw error;
                this.instanceId = data.id;
                console.log(`[REGISTRY] ✅ Registered as ${instanceData.instance_name} (${instanceData.environment})`);
            }

            this.registrationComplete = true;
            return this.instanceId;
        } catch (err) {
            console.error('[REGISTRY] Registration failed:', err.message);
            return null;
        }
    }

    async heartbeat() {
        if (!this.instanceId) {
            console.warn('[REGISTRY] Cannot send heartbeat - not registered');
            return false;
        }

        try {
            const cpuLoad = os.loadavg()[0];
            const ramPercent = parseFloat(((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(1));

            // Calculate health_score (0.0 to 1.0)
            // Higher is better (less load)
            const healthScore = Math.max(0, 1 - (cpuLoad * 0.5 + (ramPercent / 100) * 0.5));

            const { error } = await this.supabase
                .from('matrix_instances')
                .update({
                    last_heartbeat: new Date().toISOString(),
                    cpu_load: cpuLoad,
                    ram_percent: ramPercent,
                    uptime_seconds: Math.floor(process.uptime()),
                    status: 'online',
                    metadata: {
                        ...this.config.metadata,
                        health_score: parseFloat(healthScore.toFixed(2)),
                        market_credits: this.config.marketCredits || 100 // Default for now
                    }
                })
                .eq('id', this.instanceId);

            if (error) throw error;
            return true;
        } catch (err) {
            console.error('[REGISTRY] Heartbeat failed:', err.message);
            return false;
        }
    }

    async publishInsight(insightData) {
        if (!this.instanceId) {
            console.warn('[REGISTRY] Cannot publish insight - not registered');
            return null;
        }

        try {
            const { data, error } = await this.supabase
                .from('collective_insights')
                .insert([{
                    source_instance: this.instanceId,
                    insight_type: insightData.type,
                    title: insightData.title,
                    description: insightData.description,
                    solution: insightData.solution,
                    effectiveness_score: insightData.effectiveness || 0.5,
                    applicable_to: insightData.applicable_to || ['dev', 'staging', 'production'],
                    metadata: insightData.metadata || {}
                }])
                .select()
                .single();

            if (error) throw error;
            console.log(`[REGISTRY] 📡 Published insight: ${insightData.title}`);
            return data;
        } catch (err) {
            console.error('[REGISTRY] Failed to publish insight:', err.message);
            return null;
        }
    }

    async getInsights(filters = {}) {
        try {
            let query = this.supabase
                .from('collective_insights')
                .select('*, source_instance:matrix_instances(instance_name, environment)')
                .order('effectiveness_score', { ascending: false });

            if (filters.type) {
                query = query.eq('insight_type', filters.type);
            }

            if (filters.minEffectiveness) {
                query = query.gte('effectiveness_score', filters.minEffectiveness);
            }

            const { data, error } = await query.limit(filters.limit || 20);

            if (error) throw error;
            return data;
        } catch (err) {
            console.error('[REGISTRY] Failed to fetch insights:', err.message);
            return [];
        }
    }

    async getInstances() {
        try {
            const { data, error } = await this.supabase
                .from('matrix_instances')
                .select('*')
                .order('last_heartbeat', { ascending: false });

            if (error) throw error;

            // Mark instances as offline if heartbeat is older than 2 minutes
            const now = Date.now();
            return data.map(instance => ({
                ...instance,
                isOnline: (now - new Date(instance.last_heartbeat).getTime()) < 120000
            }));
        } catch (err) {
            console.error('[REGISTRY] Failed to fetch instances:', err.message);
            return [];
        }
    }

    /**
     * Get aggregate statistics for the global planetary mesh.
     * Part of Phase 47: Global Synthesis.
     */
    async getGlobalMeshSummary() {
        try {
            const instances = await this.getInstances();
            const online = instances.filter(i => i.isOnline);

            const regions = {};
            online.forEach(instance => {
                const region = instance.metadata?.region || 'unknown';
                regions[region] = (regions[region] || 0) + 1;
            });

            return {
                total_nodes: instances.length,
                online_nodes: online.length,
                regional_distribution: regions,
                mesh_health: (online.length / Math.max(instances.length, 1)) * 100
            };
        } catch (err) {
            console.error('[REGISTRY] Failed to generate mesh summary:', err.message);
            return null;
        }
    }

    async recordInsightSuccess(insightId) {
        try {
            const { error } = await this.supabase.rpc('increment_insight_success', {
                insight_id: insightId
            });

            if (error) {
                // Fallback if RPC doesn't exist
                const { data: insight } = await this.supabase
                    .from('collective_insights')
                    .select('times_applied, success_count')
                    .eq('id', insightId)
                    .single();

                if (insight) {
                    await this.supabase
                        .from('collective_insights')
                        .update({
                            times_applied: insight.times_applied + 1,
                            success_count: insight.success_count + 1,
                            effectiveness_score: (insight.success_count + 1) / (insight.times_applied + 1)
                        })
                        .eq('id', insightId);
                }
            }
        } catch (err) {
            console.error('[REGISTRY] Failed to record insight success:', err.message);
        }
    }

    async updateMetadata(newMetadata) {
        if (!this.instanceId) return;

        try {
            // Fetch current metadata first
            const { data: instance } = await this.supabase
                .from('matrix_instances')
                .select('metadata')
                .eq('id', this.instanceId)
                .single();

            const currentMetadata = instance?.metadata || {};
            const mergedMetadata = { ...currentMetadata, ...newMetadata };

            const { error } = await this.supabase
                .from('matrix_instances')
                .update({ metadata: mergedMetadata })
                .eq('id', this.instanceId);

            if (error) throw error;
            console.log(`[REGISTRY] 📝 Metadata updated for ${this.config.instanceName}`);
            return true;
        } catch (err) {
            console.error('[REGISTRY] Metadata update failed:', err.message);
            return false;
        }
    }

    async shutdown() {
        if (!this.instanceId) return;

        try {
            await this.supabase
                .from('matrix_instances')
                .update({ status: 'offline' })
                .eq('id', this.instanceId);

            console.log('[REGISTRY] 👋 Marked instance as offline');
        } catch (err) {
            console.error('[REGISTRY] Shutdown notification failed:', err.message);
        }
    }
}

module.exports = RegistryClient;
