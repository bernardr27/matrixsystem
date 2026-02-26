import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Optional: Require authentication for vision uploads in production
        // if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Sanitize and name
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase();
        const fileName = `${timestamp}_${safeName}`;

        // Save to public/uploads/vision
        const uploadDir = join(process.cwd(), 'public', 'uploads', 'vision');
        await mkdir(uploadDir, { recursive: true });

        const path = join(uploadDir, fileName);
        await writeFile(path, buffer);

        // Return the relative URL
        return NextResponse.json({
            success: true,
            url: `/uploads/vision/${fileName}`,
            filename: fileName
        });
    } catch (error: any) {
        console.error('Vision Upload Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
