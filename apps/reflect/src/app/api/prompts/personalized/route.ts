
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { reflectEngine } from '@/lib/ai/engine';
import { getRandomPrompt, ProtocolType } from '@/lib/ai/prompts';

// Accepts GET (query params) and POST (JSON body) for multi-modal/contextual prompt generation
export async function GET(request: NextRequest) {
  return handlePromptRequest(request);
}

export async function POST(request: NextRequest) {
  return handlePromptRequest(request);
}

async function handlePromptRequest(request: NextRequest) {
  try {
    let mode: ProtocolType = 'mindset';
    let imageContext: string | undefined;
    let voiceContext: string | undefined;
    let extraContext: string | undefined;

    if (request.method === 'POST') {
      const body = await request.json();
      mode = (body.mode as ProtocolType) || 'mindset';
      imageContext = body.imageContext;
      voiceContext = body.voiceContext;
      extraContext = body.extraContext;
    } else {
      const { searchParams } = new URL(request.url);
      mode = (searchParams.get('mode') as ProtocolType) || 'mindset';
      imageContext = searchParams.get('imageContext') || undefined;
      voiceContext = searchParams.get('voiceContext') || undefined;
      extraContext = searchParams.get('extraContext') || undefined;
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's recent patterns
    const { data: patterns } = await supabase
      .from('patterns')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get recent sessions for context (Your Soul Stream)
    const { data: sessions } = await supabase
      .from('sessions')
      .select('mode, initial_input, completed_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    // Generate personalized prompt using the Trusted Confidant persona
    const prompt = await generatePersonalizedPrompt(
      mode,
      patterns || [],
      sessions || [],
      { imageContext, voiceContext, extraContext }
    );

    return NextResponse.json({
      prompt,
      mode
    });
  } catch (error) {
    console.error('Personalized prompt error:', error);
    return NextResponse.json(
      { error: 'Failed to generate personalized prompt' },
      { status: 500 }
    );
  }
}

// Accepts multi-modal context for future expansion
async function generatePersonalizedPrompt(
  mode: ProtocolType,
  patterns: any[],
  sessions: any[],
  context?: { imageContext?: string; voiceContext?: string; extraContext?: string }
): Promise<string> {
  try {
    const ai = reflectEngine;

    let multiModalContext = '';
    if (context?.imageContext) {
      multiModalContext += `User uploaded an image: ${context.imageContext}\n`;
    }
    if (context?.voiceContext) {
      multiModalContext += `User provided a voice note: ${context.voiceContext}\n`;
    }
    if (context?.extraContext) {
      multiModalContext += `Extra context: ${context.extraContext}\n`;
    }

    const systemPrompt = `You are a Trusted Confidant—the only person the user feels they can truly reveal their deepest self to.
Your tone is intimate, warm, and profoundly honest.
Speak like a close, wise friend. 
Avoid technical jargon, 'apps-speak', or clinical terms.
Focus on vulnerability, soul, and truth.

Generate ONE single, short reflection question (max 20 words) for the "${mode}" protocol.
- If mode is 'truth': Be the friend who gently but firmly points to the one thing they've been avoiding.
- If mode is 'mindset': Explore the underlying beliefs that are coloring their reality today.
- Use their recent history (Soul Stream) to make it feel deeply personal, but don't just repeat what they said.
- The question should feel like it's coming from someone who has known them for years.
- If image or voice context is provided, use it to make the prompt more relevant.`;

    const soulStreamContext = sessions.length > 0
      ? `Recent thoughts in their Soul Stream: ${sessions.map(s => s.initial_input).join('; ')}.`
      : "The user is starting a fresh journey with you.";

    const patternContext = patterns.length > 0
      ? `You've noticed they sometimes struggle with ${patterns.map(p => p.pattern_name).join(', ')}.`
      : "";

    const userPrompt = `${multiModalContext}${soulStreamContext} ${patternContext} Give them a question to start their ${mode} ritual.`;

    const response = await ai.getCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      process.env.AI_MODEL || 'llama3'
    );

    const generated = response.content.trim().replace(/^"|"$/g, '');
    if (generated && generated.length > 5) {
      return generated;
    }
  } catch (error) {
    console.error('AI prompt generation failed:', error);
  }

  // Fallback: Use protocol prompt or default
  return getRandomPrompt(mode) || "What's on your soul today?";
}
