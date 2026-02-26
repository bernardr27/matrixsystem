import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

// No specialized config needed for App Router POST with formData


export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const files = formData.getAll('file') as unknown as File[];

        if (!files || files.length === 0) {
            return NextResponse.json({ success: false, message: 'No files uploaded' }, { status: 400 });
        }

        const uploadDir = join(process.cwd(), 'public', 'debug_captures');

        // Ensure directory exists
        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (e) {
            // Ignore if exists
        }

        const savedFiles: string[] = [];

        for (const file of files) {
            if (!file.name) continue;

            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            // Dynamic filename with timestamp to prevent overwrites
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            // Sanitize: Only allow alphanumerics, dots, and underscores
            const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase();

            // Add random suffix for batch uniqueness
            const random = Math.random().toString(36).substring(7);
            const fileName = `debug_${timestamp}_${random}_${safeName}`;

            const path = join(uploadDir, fileName);
            await writeFile(path, buffer);
            savedFiles.push(fileName);
        }

        return NextResponse.json({
            success: true,
            count: savedFiles.length,
            filenames: savedFiles
        });
    } catch (error: unknown) {
        console.error('Upload error:', error);
        return NextResponse.json({ success: false, message: (error instanceof Error ? error.message : String(error)) || 'Server Upload Error' }, { status: 500 });
    }
}
