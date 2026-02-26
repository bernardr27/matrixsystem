import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSafeMode } from '@/lib/safe-mode';

const SIGNAL_TYPES = ['epiphany', 'convergence', 'dissonance', 'resonance'];

function generateDemoSignals() {
  return [
    {
      id: 'sig_001',
      type: 'convergence',
      title: 'Value Alignment Detected',
      description: 'Your recent reflections converge around autonomy and authentic choice.',
      strength: 0.85,
      sessions: 5
    },
    {
      id: 'sig_002',
      type: 'resonance',
      title: 'Recurring Insight',
      description: 'Pattern of growth acknowledged across multiple reflection modes.',
      strength: 0.72,
      sessions: 8
    },
    {
      id: 'sig_003',
      type: 'dissonance',
      title: 'Value-Action Gap',
      description: 'Tension between stated intentions and observable patterns.',
      strength: 0.61,
      sessions: 3
    }
  ];
}

export async function GET() {
  try {
    if (isSafeMode()) {
      return NextResponse.json({
        signals: generateDemoSignals(),
        simulated: true
      });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch recent sessions for signal generation
    const { data, error } = await supabase
      .from('sessions')
      .select('id, mode, initial_input, mirror_text, pattern_text, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) throw error;

    // Simple signal generation based on session frequency
    const modeFreq: Record<string, number> = {};
    (data || []).forEach((s: any) => {
      modeFreq[s.mode] = (modeFreq[s.mode] || 0) + 1;
    });

    const signals = Object.entries(modeFreq)
      .map(([mode, count]) => ({
        id: `sig_${Date.now()}_${mode}`,
        type: count > 5 ? 'convergence' : 'resonance',
        title: `Active reflection in ${mode} mode`,
        description: `You've reflected ${count} times focusing on ${mode} recently.`,
        strength: Math.min(1, count / 10),
        sessions: count
      }))
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 5);

    return NextResponse.json({ signals, simulated: false });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err instanceof Error ? err.message : String(err)) || 'Failed to generate signals' }, { status: 500 });
  }
}
