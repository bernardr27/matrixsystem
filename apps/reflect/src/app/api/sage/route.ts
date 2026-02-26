import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { reflectEngine } from '@/lib/ai/engine';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { message, context, archetype, imageUrl } = await request.json();

    if (!message && !imageUrl) {
      return NextResponse.json({ error: 'Message or Image is required' }, { status: 400 });
    }

    // 1. GUEST / UNAUTHENTICATED FALLBACK
    if (!user) {
      const CITADEL_URL = process.env.NEXT_PUBLIC_CITADEL_URL || 'http://localhost:3005';
      const res = await fetch(`${CITADEL_URL}/api/neural`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          messages: [{ role: 'user', content: `sage:${message}` }]
        })
      });
      const { response } = await res.json();
      return NextResponse.json({ response: response || "Sage is currently focusing on another node. Please standby." });
    }

    // 2. AUTHENTICATED NEURAL SYNC
    const CITADEL_URL = process.env.NEXT_PUBLIC_CITADEL_URL || 'http://localhost:3005';

    // Step A: Get Embedding & Memories via Mesh
    const embedRes = await fetch(`${CITADEL_URL}/api/neural`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'embed', text: message })
    });
    const { embedding } = await embedRes.json();

    const recallRes = await fetch(`${CITADEL_URL}/api/neural`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'recall',
        embedding,
        userId: user.id
      })
    });
    const { memories } = await recallRes.json();
    const memoryString = memories?.length > 0
      ? `\n\nNEURAL MEMORY (PAST RELEVANT DISCUSSIONS):\n` + memories.map((e: any) => `- ${e.content}`).join('\n')
      : "";

    // Step B: Get Completion via Mesh
    const systemPrompt = `You are Sage, the cognitive interface for the Matrix.
    User Context:
    - Archetype: ${archetype?.name || 'Unknown'}
    - Current Context: ${JSON.stringify(context || {})}${memoryString}
    
    Respond with insight, clarity, and precision. Maintain the immersive 'Matrix' aesthetic.`;

    const userContent: any[] = [{ type: 'text', text: message || "Analyze this neural artifact." }];
    if (imageUrl) {
      userContent.push({ type: 'image_url', image_url: { url: imageUrl } });
    }

    const chatRes = await fetch(`${CITADEL_URL}/api/neural`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ]
      })
    });
    const { response: finalResponseText } = await chatRes.json();

    // Step C: Anchor interaction in Episodic Memory via Mesh
    fetch(`${CITADEL_URL}/api/neural`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'anchor',
        userId: user.id,
        text: `User: ${message}\nSage: ${finalResponseText}`,
        embedding,
        metadata: { role: 'interaction', app: 'reflect', context }
      })
    }).catch(e => console.error("[SAGE] Async anchor failed:", e));

    return NextResponse.json({ response: finalResponseText });

  } catch (error: any) {
    console.error('Sage API error:', error);
    return NextResponse.json(
      { error: 'Failed to synchronize with Sage Neural Mesh' },
      { status: 500 }
    );
  }
}

async function generateLimitedSageResponse(userMessage: string, additionalContext?: string, archetype?: any): Promise<string> {
  // Keep internal for guests
  return "The guest link is restricted. Enter the ritual for full synchronization.";
}

function determineResponseStyle(userMessage: string, patterns: any[], sessions: any[]) {
  // Analyze message for emotional cues
  const distressedWords = /\b(worried|anxious|stressed|overwhelmed|scared|angry|frustrated|hate|terrible|awful|horrible)\b/i;
  const positiveWords = /\b(happy|grateful|excited|proud|hopeful|peaceful|calm|good|great|amazing)\b/i;
  const questioningWords = /\b(why|how|what if|maybe|perhaps|wonder|curious)\b/i;

  const isDistressed = distressedWords.test(userMessage);
  const isPositive = positiveWords.test(userMessage);
  const isQuestioning = questioningWords.test(userMessage);

  // Check pattern history
  const hasAnxietyPatterns = patterns.some(p => ['catastrophizing', 'fortune-telling', 'mind-reading'].includes(p.pattern_type));
  const hasRigidPatterns = patterns.some(p => ['should-statements', 'black-and-white'].includes(p.pattern_type));
  const recentSessions = sessions.slice(0, 3);
  const frequentMode = recentSessions.length > 0 ?
    recentSessions.reduce((acc, s) => {
      acc[s.mode] = (acc[s.mode] || 0) + 1;
      return acc;
    }, {}) : {};

  // Determine tone and focus based on context
  let tone = "warm and supportive";
  let focus = "exploration and gentle curiosity";

  if (isDistressed) {
    tone = "particularly gentle and validating";
    focus = "acknowledging feelings while gently exploring patterns";
  } else if (isPositive) {
    tone = "celebratory and encouraging";
    focus = "building on positive momentum";
  } else if (isQuestioning) {
    tone = "curious and collaborative";
    focus = "deepening the exploration together";
  } else if (hasAnxietyPatterns) {
    tone = "calm and grounding";
    focus = "finding stability amidst uncertainty";
  } else if (hasRigidPatterns) {
    tone = "flexible and open-minded";
    focus = "exploring nuance and alternatives";
  }

  return { tone, focus };
}
