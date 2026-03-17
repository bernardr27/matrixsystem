import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient as createClient } from '@matrix-lib/supabase';
import { validateSession } from '@/lib/auth';
import path from 'path';
import fs from 'fs/promises';

/* ═══════════════════════════════════════════════════════
   CITADEL FS API v1.0
   Secure, authenticated file system operations
   ═══════════════════════════════════════════════════════ */

const ROOT_DIR = 'g:\\matrix';

async function checkAuth(req: NextRequest) {
    const sessionToken = req.cookies.get('citadel_session')?.value;
    if (sessionToken && validateSession(sessionToken)) return true;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return !!user;
}

export async function POST(req: NextRequest) {
    if (!(await checkAuth(req))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { action, targetPath, content } = body;

        // Safely resolve the target path to prevent directory traversal
        const resolvedPath = path.resolve(ROOT_DIR, targetPath || '');

        // Ensure the path is within the allowed ROOT_DIR
        if (!resolvedPath.toLowerCase().startsWith(ROOT_DIR.toLowerCase())) {
            return NextResponse.json({ error: 'Access Denied: Path outside matrix root.' }, { status: 403 });
        }

        if (action === 'read_dir') {
            const items = await fs.readdir(resolvedPath, { withFileTypes: true });
            const result = items.map(item => ({
                name: item.name,
                isDirectory: item.isDirectory(),
                path: path.relative(ROOT_DIR, path.join(resolvedPath, item.name)).replace(/\\/g, '/')
            }));

            // Sort: directories first, then alphabetical
            result.sort((a, b) => {
                if (a.isDirectory && !b.isDirectory) return -1;
                if (!a.isDirectory && b.isDirectory) return 1;
                return a.name.localeCompare(b.name);
            });

            return NextResponse.json({ items: result });
        }

        if (action === 'read_file') {
            const stats = await fs.stat(resolvedPath);
            if (!stats.isFile()) {
                return NextResponse.json({ error: 'Not a file' }, { status: 400 });
            }
            // 2MB size limit to prevent memory overflow in browser IDE
            if (stats.size > 2 * 1024 * 1024) {
                return NextResponse.json({ error: 'File too large (>2MB)' }, { status: 400 });
            }
            const fileContent = await fs.readFile(resolvedPath, 'utf8');
            return NextResponse.json({ content: fileContent });
        }

        if (action === 'write_file') {
            if (typeof content !== 'string') {
                return NextResponse.json({ error: 'Invalid content payload' }, { status: 400 });
            }
            await fs.writeFile(resolvedPath, content, 'utf8');
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
