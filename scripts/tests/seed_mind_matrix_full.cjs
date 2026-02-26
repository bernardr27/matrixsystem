/**
 * Full Seed for Phase 39
 */
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fullSeed() {
    console.log('🌱 Starting Full Seed for Phase 39...');

    // 1. Create a test profile
    const testId = '00000000-0000-0000-0000-000000000001';
    const { data: profile, error: pError } = await supabase.from('profiles').upsert({
        id: testId,
        username: 'test_seeker'
    }).select().single();

    if (pError) {
        console.error('❌ Error seeding profile:', pError.message);
        return;
    }
    console.log(`👤 Profile created: ${profile.username} (${profile.id})`);

    // 2. Insert mock sessions
    const sessions = [
        {
            user_id: testId,
            mode: 'mindset',
            initial_input: 'I feel exhausted after working on the matrix system for 12 hours straight. My brain is foggy.',
            content: 'Working late again. The neural mesh is complex.',
            emotion: 'exhaustion',
            mood_score: 0.3,
            is_trashed: false
        },
        {
            user_id: testId,
            mode: 'discipline',
            initial_input: 'Woke up at 5 AM to code. I need to maintain this focus if I want to reach the next peak.',
            content: 'Early morning momentum.',
            emotion: 'determination',
            mood_score: 0.8,
            is_trashed: false
        },
        {
            user_id: testId,
            mode: 'career',
            initial_input: 'Wondering if I should transition to a full AGI researcher role. The sovereign OS project is proving my capability.',
            content: 'Strategic career planning.',
            emotion: 'contemplative',
            mood_score: 0.6,
            is_trashed: false
        },
        {
            user_id: testId,
            mode: 'mindset',
            initial_input: 'The burnout is real. I keep pushing but my output is diminishing. I might need a reset.',
            content: 'Diminishing returns on focus.',
            emotion: 'frustration',
            mood_score: 0.2,
            is_trashed: false
        }
    ];

    const { data: inserted, error: sError } = await supabase.from('sessions').insert(sessions).select();
    if (sError) {
        console.error('❌ Error seeding sessions:', sError.message);
        return;
    }

    console.log(`✅ ${inserted.length} sessions seeded.`);
}

fullSeed();
