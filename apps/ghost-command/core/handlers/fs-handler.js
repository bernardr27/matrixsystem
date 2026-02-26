const fs = require('fs');
const path = require('path');

class FsHandler {
    constructor(supabase, context) {
        this.supabase = supabase;
        this.context = context;
    }

    get ROOT_DIR() {
        return path.resolve(__dirname, '../../../../');
    }

    cleanPath(inputPath) {
        // Strip metadata tags like [60s]
        const clean = inputPath.replace(/\[.*?\]/g, '').trim();
        return path.isAbsolute(clean) ? clean : path.join(this.ROOT_DIR, clean);
    }

    async handle(cmd) {
        if (cmd.command.startsWith('get ')) return this.upload(this.cleanPath(cmd.command.replace('get ', '')), cmd.id);
        if (cmd.command.startsWith('download ')) return this.download(this.cleanPath(cmd.command.replace('download ', '')), cmd.id);
        if (cmd.command.startsWith('list ')) return this.list(this.cleanPath(cmd.command.replace('list ', '')), cmd.id);
        if (cmd.command.startsWith('read ')) return this.read(this.cleanPath(cmd.command.replace('read ', '')), cmd.id);
        if (cmd.command.startsWith('search ')) return this.search(cmd.command.replace('search ', '').trim(), cmd.id);
        if (cmd.command.startsWith('stats')) return this.stats(cmd.id);
        if (cmd.command.startsWith('write ')) {
            // This is complex because write has content. 
            // The runner handles it via regex or custom split.
            // For now, assume it's handled by a smarter splitter in the main loop or here.
            return this.updateStatus(cmd.id, 'failed', 'WRITE_NOT_IMPLEMENTED_IN_MODULAR_V1');
        }
    }

    async upload(absolutePath, cmdId) {
        try {
            if (!fs.existsSync(absolutePath)) throw new Error(`File not found: ${absolutePath}`);

            const fileName = path.basename(absolutePath);
            const fileBuffer = fs.readFileSync(absolutePath);

            const { data, error } = await this.supabase.storage
                .from('ghost-storage')
                .upload(`transfers/${Date.now()}_${fileName}`, fileBuffer, { upsert: true });

            if (error) throw error;

            const { data: { publicUrl } } = this.supabase.storage.from('ghost-storage').getPublicUrl(data.path);
            await this.updateStatus(cmdId, 'executed', `FILE_READY: ${publicUrl}`);
        } catch (err) {
            await this.updateStatus(cmdId, 'failed', `SYNC_FAILED: ${err.message}`);
        }
    }

    async download(storagePath, cmdId) {
        try {
            // storagePath is from Supabase, not local FS, so we don't use cleanPath on it if it's the KEY
            // BUT wait, formatting suggests "download <path>" usually means download FROM web/storage TO local.
            // In the original code: storagePath param was used for .download(storagePath).
            // So it expects a Supabase path. 
            // My cleanPath logic applied to it might break it if it changes the string structure too much.
            // However, the original code treated it as 'storagePath'.
            // Let's revert the "cleanPath" usage for the FIRST argument of download if it's meant to be a remote path.
            // checking original: cmd.command.replace('download ', '').trim() -> download(storagePath)
            // It seems 'download' in this context means "download from supabase storage".
            // So we should NOT resolve it to a local path.

            // Actually, let's keep the download method largely as is but fix the save location to use ROOT_DIR
            const { data, error } = await this.supabase.storage.from('ghost-storage').download(storagePath);
            if (error) throw error;

            const fileName = path.basename(storagePath);
            const buffer = Buffer.from(await data.arrayBuffer());
            const downloadsDir = path.join(this.ROOT_DIR, 'core/downloads');
            if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir, { recursive: true });

            const savePath = path.join(downloadsDir, fileName);
            fs.writeFileSync(savePath, buffer);
            await this.updateStatus(cmdId, 'executed', `DOWNLOAD_COMPLETE: Saved to ${savePath}`);
        } catch (err) {
            await this.updateStatus(cmdId, 'failed', `DOWNLOAD_FAILED: ${err.message}`);
        }
    }

    async list(absolutePath, cmdId) {
        try {
            console.log(`[FS_HANDLER] Listing: ${absolutePath} (Root: ${this.ROOT_DIR})`);

            if (!fs.existsSync(absolutePath)) {
                // Return a structured error instead of failing the command
                // This allows the UI to handle it (e.g. redirect to root) without showing a global error
                await this.updateStatus(cmdId, 'executed', `DIR_LIST:${JSON.stringify({ error: 'DIR_NOT_FOUND', path: absolutePath })}`);
                return;
            }

            const entries = fs.readdirSync(absolutePath, { withFileTypes: true });
            const list = entries.map(entry => ({
                name: entry.name,
                isFile: entry.isFile(),
                size: entry.isFile() ? fs.statSync(path.join(absolutePath, entry.name)).size : null,
                path: path.relative(this.ROOT_DIR, path.join(absolutePath, entry.name)).replace(/\\/g, '/')
            })).sort((a, b) => (a.isFile === b.isFile ? a.name.localeCompare(b.name) : a.isFile ? 1 : -1));

            await this.updateStatus(cmdId, 'executed', `DIR_LIST:${JSON.stringify(list)}`);
        } catch (err) {
            console.error(`[FS_HANDLER] List error: ${err.message}`);
            await this.updateStatus(cmdId, 'failed', `SYNC_FAILED: ${err.message}`);
        }
    }

    async read(absolutePath, cmdId) {
        try {
            const content = fs.readFileSync(absolutePath, 'utf8');
            await this.updateStatus(cmdId, 'executed', `FILE_CONTENT:${content}`);
        } catch (err) {
            await this.updateStatus(cmdId, 'failed', `READ_FAILED: ${err.message}`);
        }
    }

    async search(query, cmdId) {
        try {
            const { execSync } = require('child_process');
            // Using powershell for smart search
            const script = `Get-ChildItem -Path "${this.ROOT_DIR}" -Filter "*${query}*" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 20 | ForEach-Object { $_.FullName.Replace("${this.ROOT_DIR}", "") }`;
            const results = execSync(`powershell -WindowStyle Hidden -Command "${script}"`, { windowsHide: true }).toString().trim().split('\r\n').filter(Boolean);
            await this.updateStatus(cmdId, 'executed', `SEARCH_RESULTS:${JSON.stringify(results)}`);
        } catch (err) {
            await this.updateStatus(cmdId, 'failed', `SEARCH_FAILED: ${err.message}`);
        }
    }

    async stats(cmdId) {
        try {
            const { execSync } = require('child_process');
            const script = `Get-ChildItem -Path "${this.ROOT_DIR}" -Directory | ForEach-Object { $size = (Get-ChildItem $_.FullName -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum; [PSCustomObject]@{ name = $_.Name; size = [Math]::Round($size / 1MB, 2) } } | ConvertTo-Json`;
            const results = execSync(`powershell -Command "${script}"`).toString();
            await this.updateStatus(cmdId, 'executed', `FS_STATS:${results}`);
        } catch (err) {
            await this.updateStatus(cmdId, 'failed', `STATS_FAILED: ${err.message}`);
        }
    }

    async updateStatus(id, status, output) {
        await this.supabase.from('ghost_bridge').update({ status, output }).eq('id', id);
    }
}

module.exports = FsHandler;
