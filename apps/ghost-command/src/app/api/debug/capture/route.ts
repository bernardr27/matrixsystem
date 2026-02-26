import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';

/**
 * CAPTURE API v2.0 — Neural Optical Array Endpoint
 * Supports: capture, validate, full modes
 * Integrates with matrix-capture.js v2.0
 */
export async function POST(request: Request) {
    try {
        const { target, mode = 'capture', viewport = 'mobile' } = await request.json();

        if (!target) {
            return NextResponse.json({ error: 'Target required' }, { status: 400 });
        }

        // Sanitize target to prevent command injection
        const sanitizedTarget = String(target).replace(/[^a-zA-Z0-9._:/-]/g, '');
        if (sanitizedTarget !== target) {
            return NextResponse.json({ error: 'Invalid target characters' }, { status: 400 });
        }

        const validModes = ['capture', 'validate', 'full'];
        const validViewports = ['mobile', 'tablet', 'desktop', 'ultrawide'];

        if (!validModes.includes(mode)) {
            return NextResponse.json({ error: `Invalid mode. Use: ${validModes.join(', ')}` }, { status: 400 });
        }

        if (!validViewports.includes(viewport)) {
            return NextResponse.json({ error: `Invalid viewport. Use: ${validViewports.join(', ')}` }, { status: 400 });
        }

        const scriptPath = path.resolve(process.cwd(), '../../scripts/core/matrix-capture.js');
        const flags = [
            mode === 'validate' ? '--validate' : mode === 'full' ? '--full' : '',
            `--viewport=${viewport}`
        ].filter(Boolean).join(' ');

        const command = `node "${scriptPath}" ${sanitizedTarget} ${flags}`;

        // console.log(`[CAPTURE_API v2.0] Triggering: ${mode} for ${sanitizedTarget} @ ${viewport}`);
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`[CAPTURE_API] Error: ${error.message}`);
                return;
            }
            if (stderr) {
                console.error(`[CAPTURE_API] Stderr: ${stderr}`);
                return;
            }
            // console.log(`[CAPTURE_API] Output:\n${stdout}`);
        });

        return NextResponse.json({
            success: true,
            message: `${mode.toUpperCase()} initiated for ${target} @ ${viewport}`,
            mode,
            viewport,
            target,
        });

    } catch (error) {
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
