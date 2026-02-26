import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import http from 'http';

const execAsync = promisify(exec);

const OLLAMA_PORT = 11434;
const OLLAMA_MODELS_DIR = 'G:\\OllamaModels';

/**
 * Check if Ollama is running by probing port 11434
 */
async function isOllamaRunning(): Promise<{ running: boolean; latency: number }> {
    const start = Date.now();
    return new Promise(resolve => {
        const req = http.request(
            { hostname: 'localhost', port: OLLAMA_PORT, path: '/', method: 'GET', timeout: 3000 },
            () => resolve({ running: true, latency: Date.now() - start })
        );
        req.on('error', () => resolve({ running: false, latency: Date.now() - start }));
        req.on('timeout', () => { req.destroy(); resolve({ running: false, latency: Date.now() - start }); });
        req.end();
    });
}

/**
 * Get list of installed Ollama models
 */
async function getModels(): Promise<string[]> {
    try {
        const { stdout } = await execAsync('ollama list 2>&1', { timeout: 10000 });
        const lines = stdout.trim().split('\n').slice(1); // skip header
        return lines.map(l => l.split(/\s+/)[0]).filter(Boolean);
    } catch {
        return [];
    }
}

// GET — Check Ollama status + list models
export async function GET() {
    const status = await isOllamaRunning();
    let models: string[] = [];
    if (status.running) {
        models = await getModels();
    }
    return NextResponse.json({
        running: status.running,
        latency: status.latency,
        port: OLLAMA_PORT,
        models,
        modelsDir: OLLAMA_MODELS_DIR,
        timestamp: Date.now(),
    });
}

// POST — Start or stop Ollama
export async function POST(req: NextRequest) {
    try {
        const { action } = await req.json() as { action: string };

        if (action === 'start') {
            const { running } = await isOllamaRunning();
            if (running) {
                return NextResponse.json({
                    success: true,
                    message: 'Ollama is already running',
                    alreadyRunning: true,
                });
            }

            // Start Ollama with custom models directory, in a hidden window
            await execAsync(
                `powershell -Command "Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', 'set OLLAMA_MODELS=${OLLAMA_MODELS_DIR} && ollama serve' -WindowStyle Hidden"`,
                { timeout: 10000 }
            );

            // Poll for startup (up to 15s)
            for (let i = 0; i < 30; i++) {
                await new Promise(r => setTimeout(r, 500));
                const check = await isOllamaRunning();
                if (check.running) {
                    return NextResponse.json({
                        success: true,
                        message: `Ollama started successfully (${check.latency}ms latency)`,
                    });
                }
            }

            return NextResponse.json({
                success: true,
                message: 'Ollama launch initiated — may take a few more seconds to respond',
            });
        }

        if (action === 'stop') {
            const { running } = await isOllamaRunning();
            if (!running) {
                return NextResponse.json({
                    success: true,
                    message: 'Ollama is not running',
                    alreadyStopped: true,
                });
            }

            // Kill ollama processes
            await execAsync(
                `powershell -Command "Get-Process -Name ollama*, 'ollama app' -ErrorAction SilentlyContinue | Stop-Process -Force; Write-Output 'stopped'"`,
                { timeout: 10000 }
            );

            // Wait for port to free
            for (let i = 0; i < 10; i++) {
                await new Promise(r => setTimeout(r, 500));
                const check = await isOllamaRunning();
                if (!check.running) {
                    return NextResponse.json({ success: true, message: 'Ollama stopped' });
                }
            }

            return NextResponse.json({ success: true, message: 'Ollama stop signal sent' });
        }

        return NextResponse.json({ error: 'Invalid action. Use start or stop.' }, { status: 400 });
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
