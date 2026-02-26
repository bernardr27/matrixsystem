const CapabilityEngine = require('../capability-engine.cjs');

class CapabilityHandler {
    constructor(supabase, context = {}) {
        this.supabase = supabase;
        this.context = context;
        this.engine = new CapabilityEngine(supabase);
    }

    async handle(cmd) {
        try {
            const raw = cmd.command.replace(/^cap:/i, '').trim();
            const [actionRaw, id, target] = raw.split(/\s+/);
            const action = (actionRaw || 'list').toLowerCase();

            if (action === 'list') {
                const list = this.engine.list();
                await this.updateStatus(cmd.id, 'executed', JSON.stringify({ capabilities: list }, null, 2));
                return;
            }

            if (action === 'show') {
                if (!id) throw new Error('Usage: cap:show <capability_id>');
                const detail = this.engine.show(id);
                await this.updateStatus(cmd.id, 'executed', JSON.stringify(detail, null, 2));
                return;
            }

            if (action === 'run') {
                if (!id) throw new Error('Usage: cap:run <capability_id> [target]');
                await this.updateStatus(cmd.id, 'executing', `CAPABILITY_EXEC: ${id}`);
                const result = await this.engine.run(id, target);

                // Delegate capabilities enqueue into ghost_bridge automatically
                if (result.mode === 'delegate' && result.delegate_command) {
                    await this.supabase.from('ghost_bridge').insert({
                        command: result.delegate_command,
                        source: 'capability_handler',
                        status: 'pending',
                        payload: JSON.stringify({
                            capability: id,
                            target: target || null,
                            prd_path: result.prd_path
                        })
                    });
                }

                await this.updateStatus(cmd.id, 'executed', JSON.stringify(result, null, 2));
                return;
            }

            if (action === 'gate') {
                await this.updateStatus(cmd.id, 'executing', 'CAPABILITY_EXEC: ai_quality_guardrails');
                const result = await this.engine.run('ai_quality_guardrails', target);
                await this.updateStatus(cmd.id, 'executed', JSON.stringify(result, null, 2));
                return;
            }

            throw new Error(`Unknown capability action: ${action}`);
        } catch (err) {
            await this.updateStatus(cmd.id, 'failed', `CAPABILITY_FAIL: ${err.message}`);
        }
    }

    async updateStatus(id, status, output) {
        if (!id) return;
        await this.supabase.from('ghost_bridge').update({ status, output }).eq('id', id);
    }
}

module.exports = CapabilityHandler;
