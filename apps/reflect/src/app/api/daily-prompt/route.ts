
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSafeMode } from '@/lib/safe-mode';

const DAILY_PROMPTS = [
  "What is the hardest thing you are avoiding right now?",
  "What energy did you bring to your interactions today?",
  "If today was a chapter in a book, what would it be named?",
  "What is one thing you can let go of today?",
  "Who did you help today, and who helped you?",
  "What is a belief that held you back today?",
  "What are you grateful for right now?"
];

export async function GET() {
  if (isSafeMode()) {
    // In Safe Mode, always return a random prompt if requested
    const random = DAILY_PROMPTS[Math.floor(Math.random() * DAILY_PROMPTS.length)];
    return NextResponse.json({ enabled: true, prompt: `[Safe Mode] ${random}` });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ enabled: false }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('daily_prompt')
    .eq('id', user.id)
    .single();

  if (!profile || !profile.daily_prompt) {
    return NextResponse.json({ enabled: false });
  }

  // Logic: Seed based on date so everyone gets the same one, or random.
  // For now: Random.
  const random = DAILY_PROMPTS[Math.floor(Math.random() * DAILY_PROMPTS.length)];

  return NextResponse.json({
    enabled: true,
    prompt: random
  });
}
