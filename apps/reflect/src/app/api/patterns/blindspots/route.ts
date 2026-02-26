import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSafeMode } from '@/lib/safe-mode';

const BLINDSPOT_DEFS = [
  {
    id: 'defensive_avoidance',
    type: 'Defensive_Avoidance',
    description: 'Patterns suggest a tendency to deflect ownership when pressure escalates.',
    keywords: ['not my fault', 'they made me', 'out of my control', 'no choice', 'forced'],
  },
  {
    id: 'cognitive_dissonance',
    type: 'Cognitive_Dissonance',
    description: 'Signals show conflicting values vs. repeated behaviors in recent reflections.',
    keywords: ['but i keep', 'even though', 'i say i want', 'i know i should'],
  },
  {
    id: 'rumination_loop',
    type: 'Rumination_Loop',
    description: 'Recurring loop detected with repeated language and unresolved questions.',
    keywords: ['again and again', 'same thing', 'keeps happening', 'stuck', 'loop'],
  },
  {
    id: 'overcontrol',
    type: 'Overcontrol',
    description: 'High control language suggests constricted range for uncertainty tolerance.',
    keywords: ['must', 'should', 'have to', 'can’t let', 'need to'],
  }
];

function detectBlindspots(text: string) {
  const lower = text.toLowerCase();
  const results = BLINDSPOT_DEFS.map(def => {
    let hits = 0;
    def.keywords.forEach(k => {
      if (lower.includes(k)) hits += 1;
    });
    return {
      id: def.id,
      type: def.type,
      description: def.description,
      intensity: Math.min(1, hits / 3),
    };
  }).filter(r => r.intensity > 0);

  return results.sort((a, b) => b.intensity - a.intensity).slice(0, 3);
}

export async function GET() {
  try {
    if (isSafeMode()) {
      return NextResponse.json({
        blindspots: [
          {
            id: 'demo_1',
            type: 'Defensive_Avoidance',
            description: 'You may be externalizing friction rather than claiming agency in decisions.',
            intensity: 0.8
          },
          {
            id: 'demo_2',
            type: 'Cognitive_Dissonance',
            description: 'Your stated goals diverge from your recent pattern of choices.',
            intensity: 0.6
          }
        ],
        simulated: true
      });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('sessions')
      .select('initial_input, mirror_text, pattern_text')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    const combined = (data || [])
      .map((s: any) => `${s.initial_input || ''} ${s.mirror_text || ''} ${s.pattern_text || ''}`)
      .join(' ');

    const blindspots = detectBlindspots(combined);

    return NextResponse.json({ blindspots, simulated: false });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err instanceof Error ? err.message : String(err)) || 'Failed to generate blindspots' }, { status: 500 });
  }
}
