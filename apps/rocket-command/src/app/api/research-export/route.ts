import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const MATRIX_ROOT = process.env.MATRIX_ROOT || 'g:\\matrix';

export async function POST(request: NextRequest) {
    try {
        const { prd, title } = await request.json();

        if (!prd || !title) {
            return NextResponse.json({ error: 'PRD content and title are required' }, { status: 400 });
        }

        const fileName = `${title.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.md`;
        const prdDir = path.join(MATRIX_ROOT, 'docs', 'prd');

        if (!fs.existsSync(prdDir)) {
            fs.mkdirSync(prdDir, { recursive: true });
        }

        const filePath = path.join(prdDir, fileName);
        await fs.promises.writeFile(filePath, prd, 'utf-8');

        return NextResponse.json({
            success: true,
            path: filePath,
            message: `PRD exported to ${fileName}. Ralph will pick this up for implementation.`
        });

    } catch (error: any) {
        console.error('[RESEARCH_EXPORT] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
