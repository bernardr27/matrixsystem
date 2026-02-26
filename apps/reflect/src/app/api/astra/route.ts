import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSafeMode } from '@/lib/safe-mode';
import { getZodiacSign } from '@/lib/astra';

function generateDemoAstra() {
  return {
    sign: 'Aquarius',
    birthDate: '1995-02-10',
    birthTime: '14:30',
    current_retrograde: 'Mercury',
    lunar_phase: 'Waxing Crescent',
    nodes: {
      north: 'Leo',
      south: 'Aquarius'
    },
    chart: {
      sun: 'Aquarius',
      moon: 'Gemini',
      ascendant: 'Libra'
    },
    simulated: true
  };
}

export async function GET() {
  try {
    if (isSafeMode()) {
      return NextResponse.json(generateDemoAstra());
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const birthDate = user.user_metadata?.birthDate;
    if (!birthDate) {
      return NextResponse.json({ error: 'Birth date not set in profile' }, { status: 400 });
    }

    const sign = getZodiacSign(birthDate);

    return NextResponse.json({
      sign,
      birthDate,
      birthTime: user.user_metadata?.birthTime || '',
      current_retrograde: 'None',
      lunar_phase: 'Waxing Gibbous',
      nodes: {
        north: 'Leo',
        south: 'Aquarius'
      },
      chart: {
        sun: sign,
        moon: 'Gemini',
        ascendant: 'Libra'
      },
      simulated: false
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err instanceof Error ? err.message : String(err)) || 'Failed to fetch astra profile' }, { status: 500 });
  }
}
