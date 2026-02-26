import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Cognitive distortion patterns to detect
const PATTERN_DEFINITIONS = [
  {
    id: 'catastrophizing',
    name: 'Catastrophizing',
    description: 'Expecting the worst-case scenario',
    keywords: ['worst', 'disaster', 'terrible', 'catastrophe', 'nightmare', 'ruined', 'everything will go wrong', 'can\'t handle'],
    indicators: ['always', 'never', 'worst', 'disaster']
  },
  {
    id: 'black-and-white',
    name: 'All-or-Nothing Thinking',
    description: 'Viewing situations in only two categories',
    keywords: ['always', 'never', 'every', 'none', 'all', 'nothing', 'completely', 'totally'],
    indicators: ['always', 'never', 'every', 'none']
  },
  {
    id: 'overgeneralization',
    name: 'Overgeneralization',
    description: 'Drawing broad conclusions from a single event',
    keywords: ['everyone', 'no one', 'everything', 'nothing', 'typical', 'same thing happens'],
    indicators: ['everyone', 'no one', 'everything']
  },
  {
    id: 'mind-reading',
    name: 'Mind Reading',
    description: 'Assuming you know what others are thinking',
    keywords: ['they think', 'they must think', 'they probably think', 'they\'re judging', 'they hate me'],
    indicators: ['they think', 'probably think', 'must think']
  },
  {
    id: 'fortune-telling',
    name: 'Fortune Telling',
    description: 'Predicting negative outcomes without evidence',
    keywords: ['will fail', 'going to be', 'won\'t work', 'will never', 'guaranteed to', 'destined to'],
    indicators: ['will fail', 'won\'t work', 'will never']
  },
  {
    id: 'should-statements',
    name: 'Should Statements',
    description: 'Using "should" or "must" statements that create pressure',
    keywords: ['should', 'shouldn\'t', 'must', 'have to', 'ought to', 'need to'],
    indicators: ['should', 'must', 'have to']
  },
  {
    id: 'personalization',
    name: 'Personalization',
    description: 'Blaming yourself for things outside your control',
    keywords: ['my fault', 'I caused', 'because of me', 'I\'m responsible', 'I let them down'],
    indicators: ['my fault', 'because of me', 'I caused']
  },
  {
    id: 'emotional-reasoning',
    name: 'Emotional Reasoning',
    description: 'Believing feelings reflect reality',
    keywords: ['I feel like', 'I feel that', 'feels true', 'feels like proof'],
    indicators: ['I feel like', 'feels true']
  }
];

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ patterns: [], summary: 'Sign in to view patterns.' });
    }

    const { data: patterns } = await supabase
      .from('patterns')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    const mapped = (patterns || []).map((p: any) => ({
      id: p.pattern_type || p.id,
      name: p.pattern_name || p.pattern_type,
      description: PATTERN_DEFINITIONS.find(d => d.id === p.pattern_type)?.description || 'Detected pattern',
      confidence: p.confidence || 0.5,
      intensity: p.confidence || 0.5,
    }));

    return NextResponse.json({
      patterns: mapped,
      summary: generateSummary(mapped),
    });
  } catch (error) {
    console.error('Pattern fetch error:', error);
    return NextResponse.json({ patterns: [], summary: 'Unable to load patterns.' });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { text, sessionId } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Detect patterns in the text
    const detectedPatterns = detectPatterns(text.toLowerCase());

    // If sessionId provided, save patterns to database
    if (sessionId && detectedPatterns.length > 0) {
      const { error } = await supabase.from('patterns').insert(
        detectedPatterns.map(pattern => ({
          user_id: user.id,
          session_id: sessionId,
          pattern_type: pattern.id,
          pattern_name: pattern.name,
          confidence: pattern.confidence,
          evidence: pattern.evidence
        }))
      );

      if (error) {
        console.error('Error saving patterns:', error);
      }
    }

    return NextResponse.json({
      patterns: detectedPatterns,
      summary: generateSummary(detectedPatterns)
    });

  } catch (error) {
    console.error('Pattern detection error:', error);
    return NextResponse.json(
      { error: 'Failed to detect patterns' },
      { status: 500 }
    );
  }
}

function detectPatterns(text: string): Array<{
  id: string;
  name: string;
  description: string;
  confidence: number;
  evidence: string[];
}> {
  const detected: Array<{
    id: string;
    name: string;
    description: string;
    confidence: number;
    evidence: string[];
  }> = [];

  for (const pattern of PATTERN_DEFINITIONS) {
    const evidence: string[] = [];
    let matchCount = 0;

    // Check for keyword matches
    for (const keyword of pattern.keywords) {
      if (text.includes(keyword.toLowerCase())) {
        matchCount++;
        evidence.push(keyword);
      }
    }

    // Calculate confidence (0-1 scale)
    const confidence = Math.min(matchCount / 3, 1);

    // Only include if confidence > 0.3
    if (confidence > 0.3) {
      detected.push({
        id: pattern.id,
        name: pattern.name,
        description: pattern.description,
        confidence: Math.round(confidence * 100) / 100,
        evidence: evidence.slice(0, 3) // Top 3 evidence points
      });
    }
  }

  // Sort by confidence (highest first)
  return detected.sort((a, b) => b.confidence - a.confidence);
}

function generateSummary(patterns: Array<{ name: string; confidence: number }>): string {
  if (patterns.length === 0) {
    return 'No strong cognitive distortions detected. Your thinking appears balanced.';
  }

  const topPattern = patterns[0];
  
  if (patterns.length === 1) {
    return `Detected primarily ${topPattern.name.toLowerCase()} in your reflection.`;
  }

  return `Detected ${patterns.length} patterns, primarily ${topPattern.name.toLowerCase()}.`;
}
