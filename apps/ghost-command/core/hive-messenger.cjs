const os = require('os');

class HiveMessenger {
    constructor(supabase, registry) {
        this.supabase = supabase;
        this.registry = registry;
        this.handlers = new Map();
        this.subscription = null;
        this.instanceId = null;
    }

    async start() {
        if (this.subscription) return;

        // Ensure we are registered to get our ID
        this.instanceId = await this.registry.register();
        if (!this.instanceId) {
            console.error('[HIVE_MESSENGER] Failed to register instance. Cannot start messaging.');
            return;
        }

        console.log('🧠 [HIVE_MESSENGER] Mind-to-Mind Synchronization Active');

        // Subscribe to DIRECT and BROADCAST messages
        // target_node = this.instanceId (Direct)
        // target_node = null (Broadcast)
        this.subscription = this.supabase
            .channel(`hive_global_${this.instanceId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'hive_messages',
                filter: `target_node=in.(${this.instanceId},null)`
            }, (payload) => this.handleIncomingMessage(payload.new))
            .subscribe();
    }

    /**
     * Broadcast a message to all online nodes
     */
    async broadcast(type, payload) {
        console.log(`[HIVE_MESSENGER] 📡 Broadcasting ${type} to planetary mesh...`);
        const { data, error } = await this.supabase
            .from('hive_messages')
            .insert([{
                source_node: this.instanceId,
                target_node: null, // NULL signals a broadcast
                type: type,
                payload: payload,
                status: 'pending'
            }])
            .select()
            .single();

        if (error) {
            console.error(`[HIVE_MESSENGER] Broadcast failed:`, error.message);
            throw error;
        }

        return data.id;
    }

    registerHandler(type, handler) {
        this.handlers.set(type, handler);
        console.log(`[HIVE_MESSENGER] Registered handler for type: ${type}`);
    }

    async handleIncomingMessage(message) {
        const { id, type, payload, source_node } = message;
        console.log(`[HIVE_MESSENGER] 📥 Incoming ${type} from node ${source_node}`);

        // Update status to processing
        await this.supabase.from('hive_messages').update({ status: 'processing' }).eq('id', id);

        const handler = this.handlers.get(type);
        if (handler) {
            try {
                const result = await handler(payload, source_node);

                // Update status to completed with result
                await this.supabase.from('hive_messages').update({
                    status: 'completed',
                    payload: { ...payload, response: result },
                    processed_at: new Date().toISOString()
                }).eq('id', id);

                console.log(`[HIVE_MESSENGER] ✅ Processed ${type} message ${id}`);
            } catch (err) {
                console.error(`[HIVE_MESSENGER] Handler Error for ${type}:`, err.message);
                await this.supabase.from('hive_messages').update({
                    status: 'error',
                    payload: { ...payload, error: err.message },
                    processed_at: new Date().toISOString()
                }).eq('id', id);
            }
        } else {
            console.warn(`[HIVE_MESSENGER] No handler for message type: ${type}`);
            await this.supabase.from('hive_messages').update({
                status: 'error',
                payload: { ...payload, error: 'No handler registered' },
                processed_at: new Date().toISOString()
            }).eq('id', id);
        }
    }

    async send(targetNodeId, type, payload) {
        const { data, error } = await this.supabase
            .from('hive_messages')
            .insert([{
                source_node: this.instanceId,
                target_node: targetNodeId,
                type: type,
                payload: payload,
                status: 'pending'
            }])
            .select()
            .single();

        if (error) {
            console.error(`[HIVE_MESSENGER] Failed to send ${type} to ${targetNodeId}:`, error.message);
            throw error;
        }

        return data.id;
    }

    async waitForResponse(messageId, timeout = 30000) {
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            const { data, error } = await this.supabase
                .from('hive_messages')
                .select('status, payload')
                .eq('id', messageId)
                .single();

            if (data && (data.status === 'completed' || data.status === 'error')) {
                return data;
            }

            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        throw new Error(`[HIVE_MESSENGER] Timeout waiting for response to message ${messageId}`);
    }

    stop() {
        if (this.subscription) {
            this.subscription.unsubscribe();
            this.subscription = null;
        }
    }
}

module.exports = HiveMessenger;
