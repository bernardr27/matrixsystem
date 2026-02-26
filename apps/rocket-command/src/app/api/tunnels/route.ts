import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile, unlink } from 'fs/promises';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

const MATRIX_ROOT = process.env.MATRIX_ROOT || 'g:\\matrix';

// GET — Return current tunnel URLs from the log file
export async function GET() {
    try {
        const urlFile = path.join(MATRIX_ROOT, 'logs', 'tunnel_urls.json');
        const content = await readFile(urlFile, 'utf-8');
        const urls = JSON.parse(content);
        return NextResponse.json({ tunnels: urls, status: 'active', timestamp: Date.now() });
    } catch {
        return NextResponse.json({ tunnels: {}, status: 'inactive', timestamp: Date.now() });
    }
}

// POST — Start or stop tunnels
export async function POST(req: NextRequest) {
    try {
        const { action, target } = await req.json() as { action: string; target?: string };
        const tunnelScript = path.join(MATRIX_ROOT, 'launchers', 'tunnel.ps1');

        // Verify tunnel script exists
        if (action === 'start' && !fs.existsSync(tunnelScript)) {
            return NextResponse.json({
                error: `Tunnel launcher not found at ${tunnelScript}`,
                success: false,
            }, { status: 500 });
        }

        if (action === 'start') {
            // Check if cloudflared is installed
            const cfPath = 'C:\\Program Files (x86)\\cloudflared\\cloudflared.exe';
            if (!fs.existsSync(cfPath)) {
                return NextResponse.json({
                    error: 'cloudflared not found. Install with: winget install --id Cloudflare.cloudflared',
                    success: false,
                }, { status: 500 });
            }

            const appArg = target || 'all';
            const escapedScript = tunnelScript.replace(/\\/g, '\\\\');
            await execAsync(
                `powershell -ExecutionPolicy Bypass -Command "& { $env:Path += ';C:\\Program Files (x86)\\cloudflared'; Start-Process powershell -ArgumentList '-ExecutionPolicy Bypass -File \\"${escapedScript}\\" -App ${appArg}' -WindowStyle Hidden }"`,
                { timeout: 10000 }
            );
            return NextResponse.json({
                success: true,
                message: `Tunnel launch initiated for: ${appArg}. Polling for URLs...`,
            });
        }

        if (action === 'stop') {
            await execAsync(
                `powershell -Command "Get-Process -Name cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force"`,
                { timeout: 10000 }
            );

            // Clean up URL file
            const urlFile = path.join(MATRIX_ROOT, 'logs', 'tunnel_urls.json');
            try { await unlink(urlFile); } catch { /* already gone */ }

            return NextResponse.json({ success: true, message: 'All tunnels stopped and URLs cleared' });
        }

        return NextResponse.json({ error: 'Invalid action. Use start or stop.' }, { status: 400 });
    } catch (err) {
        return NextResponse.json({ error: String(err), success: false }, { status: 500 });
    }
}
