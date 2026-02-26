class HandHandler {
    constructor(supabase, context) {
        this.supabase = supabase;
        this.context = context;
        this.hand = require('../ghost-hand.cjs');
    }

    async handle(cmd) {
        try {
            if (cmd.command.startsWith('hand:type ')) {
                const text = cmd.command.replace('hand:type ', '');
                await this.hand.type(text);
                await this.updateStatus(cmd.id, 'executed', `TYPED: ${text}`);
            }
            else if (cmd.command.startsWith('hand:click ')) {
                const parts = cmd.command.split(' ');
                const x = parts[1];
                const y = parts[2];
                if (x && y) {
                    await this.hand.move(x, y, true);
                    await this.updateStatus(cmd.id, 'executed', `CLICKED: ${x},${y}`);
                } else {
                    await this.hand.click();
                    await this.updateStatus(cmd.id, 'executed', `CLICKED_CURRENT`);
                }
            }
            else if (cmd.command.startsWith('hand:move ')) {
                const parts = cmd.command.split(' ');
                await this.hand.move(parts[1], parts[2], false);
                await this.updateStatus(cmd.id, 'executed', `MOVED: ${parts[1]},${parts[2]}`);
            }
            else if (cmd.command.startsWith('hand:hotkey ')) {
                const keys = cmd.command.replace('hand:hotkey ', '');
                await this.hand.hotkey(keys);
                await this.updateStatus(cmd.id, 'executed', `HOTKEY: ${keys}`);
            }
        } catch (err) {
            console.error('[HAND_ERROR]', err);
            await this.updateStatus(cmd.id, 'failed', `HAND_FAIL: ${err.message}`);
        }
    }

    async updateStatus(id, status, output) {
        await this.supabase.from('ghost_bridge').update({ status, output }).eq('id', id);
    }
}

module.exports = HandHandler;
