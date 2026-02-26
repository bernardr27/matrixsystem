import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// The matrix root - resolve from the project directory
const MATRIX_ROOT = process.env.MATRIX_ROOT || path.resolve(process.cwd(), '../../');

function isWithinMatrix(targetPath: string): boolean {
    const resolved = path.resolve(targetPath);
    const root = path.resolve(MATRIX_ROOT);
    return resolved === root || resolved.startsWith(root + path.sep);
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || 'list';
    const relativePath = searchParams.get('path') || '';

    // Resolve the target path within the matrix root
    const targetPath = relativePath
        ? path.resolve(MATRIX_ROOT, relativePath)
        : MATRIX_ROOT;

    // Security: never escape matrix root
    if (!isWithinMatrix(targetPath)) {
        return NextResponse.json(
            { error: 'ACCESS_DENIED', message: 'Path is outside Matrix boundary' },
            { status: 403 }
        );
    }

    try {
        if (action === 'list') {
            if (!fs.existsSync(targetPath)) {
                return NextResponse.json(
                    { error: 'DIR_NOT_FOUND', path: relativePath },
                    { status: 404 }
                );
            }

            const stat = fs.statSync(targetPath);
            if (!stat.isDirectory()) {
                return NextResponse.json(
                    { error: 'NOT_A_DIRECTORY', path: relativePath },
                    { status: 400 }
                );
            }

            const entries = fs.readdirSync(targetPath, { withFileTypes: true });
            const files = entries
                .filter(e => !e.name.startsWith('.') || e.name === '.env.local')
                .map(entry => {
                    const fullPath = path.join(targetPath, entry.name);
                    const relPath = path.relative(MATRIX_ROOT, fullPath).replace(/\\/g, '/');
                    let size: number | null = null;
                    let modified: string | null = null;

                    if (entry.isFile()) {
                        try {
                            const s = fs.statSync(fullPath);
                            size = s.size;
                            modified = s.mtime.toISOString();
                        } catch { }
                    }

                    return {
                        name: entry.name,
                        isFile: entry.isFile(),
                        size,
                        modified,
                        path: relPath,
                    };
                })
                .sort((a, b) => {
                    if (a.isFile === b.isFile) return a.name.localeCompare(b.name);
                    return a.isFile ? 1 : -1; // folders first
                });

            return NextResponse.json({
                files,
                currentPath: path.relative(MATRIX_ROOT, targetPath).replace(/\\/g, '/') || '',
                root: MATRIX_ROOT.replace(/\\/g, '/'),
            });
        }

        if (action === 'read') {
            if (!fs.existsSync(targetPath)) {
                return NextResponse.json(
                    { error: 'FILE_NOT_FOUND', path: relativePath },
                    { status: 404 }
                );
            }

            const stat = fs.statSync(targetPath);

            // Don't read files over 1MB
            if (stat.size > 1024 * 1024) {
                return NextResponse.json(
                    { error: 'FILE_TOO_LARGE', size: stat.size, maxSize: 1024 * 1024 },
                    { status: 413 }
                );
            }

            // Check if binary
            const ext = path.extname(targetPath).toLowerCase();
            const binaryExts = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.zip', '.tar', '.gz', '.exe', '.dll', '.so', '.node'];
            if (binaryExts.includes(ext)) {
                return NextResponse.json(
                    { error: 'BINARY_FILE', extension: ext, size: stat.size },
                    { status: 415 }
                );
            }

            const content = fs.readFileSync(targetPath, 'utf8');
            return NextResponse.json({
                content,
                name: path.basename(targetPath),
                size: stat.size,
                modified: stat.mtime.toISOString(),
                path: relativePath,
            });
        }

        if (action === 'stats') {
            const stat = fs.statSync(targetPath);
            return NextResponse.json({
                exists: true,
                isFile: stat.isFile(),
                isDirectory: stat.isDirectory(),
                size: stat.size,
                modified: stat.mtime.toISOString(),
                created: stat.birthtime.toISOString(),
            });
        }

        return NextResponse.json({ error: 'UNKNOWN_ACTION', action }, { status: 400 });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[FS_API]', msg);
        return NextResponse.json(
            { error: 'FS_ERROR', message: msg },
            { status: 500 }
        );
    }
}
