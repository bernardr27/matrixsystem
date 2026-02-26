import { NextResponse } from 'next/server';
import { execFile } from 'child_process';
import path from 'path';

const MATRIX_ROOT = path.resolve(process.cwd(), '..', '..');
const DEFAULT_TIMEOUT = 120000;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { prompt: promptText, model, app, timeout } = body;

        if (!promptText) {
            return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
        }

        const cwd = app
            ? path.join(MATRIX_ROOT, 'apps', app)
            : MATRIX_ROOT;

        const args = [
            '-p', promptText,
            '-m', model || 'gemini-2.5-flash',
            '--sandbox', 'none',
        ];

        const result = await new Promise<string>((resolve, reject) => {
            execFile('gemini', args, {
                cwd,
                timeout: timeout || DEFAULT_TIMEOUT,
                maxBuffer: 10 * 1024 * 1024,
                env: { ...process.env },
                windowsHide: true,
            }, (error, stdout, stderr) => {
                if (error) {
                    reject(new Error(error.message));
                    return;
                }
                resolve(stdout.trim());
            });
        });

        return NextResponse.json({
            success: true,
            response: result,
            model: model || 'gemini-2.5-flash',
            timestamp: new Date().toISOString(),
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        );
    }
}
