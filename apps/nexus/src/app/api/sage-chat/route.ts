/**
 * Phase 23: Sage Chat API (Integration with Groq)
 * Use "force-dynamic" to prevent static build errors.
 */

import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export const dynamic = 'force-dynamic';

const groq = process.env.GROQ_API_KEY
    ? new Groq({ apiKey: process.env.GROQ_API_KEY })
    : null;

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { messages, systemPrompt, model } = body;

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 });
        }

        const CITADEL_URL = process.env.CITADEL_URL || 'http://localhost:3005';

        const response = await fetch(`${CITADEL_URL}/api/neural`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'chat',
                messages: [
                    { role: 'system', content: systemPrompt || 'You are SAGE.' },
                    ...messages
                ],
                options: { model }
            })
        });

        if (!response.ok) {
            throw new Error(`Neural Mesh sync failed: ${response.statusText}`);
        }

        const data = await response.json();

        return NextResponse.json({
            reply: data.response,
            usage: {} // Usage stats aggregated in Citadel if needed
        });

    } catch (error: any) {
        console.error('[SAGE_CHAT] Error:', error);
        return NextResponse.json({ error: error.message || 'Neural Mesh Error' }, { status: 500 });
    }
}
