/**
 * Seed data for Phase 39 Memory Weaving
 */
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function seed() {
    console.log('🌱 Seeding Mind Matrix test data...');

    // 1. Get first profile
    const { data: profiles } = await supabase.from('profiles').select('id').limit(1);
    if (!profiles || profiles.length === 0) {
        console.error('❌ No profiles found. Please create a user first.');
        return;
    }
    const userId = profiles[0].id;
    console.log(`👤 Using User ID: ${userId}`);

    // 2. Insert mock sessions
    const sessions = [
        {
            user_id: userId,
            mode: 'mindset',
            initial_input: 'I feel exhausted after working on the matrix system for 12 hours straight. My brain is foggy.',
            content: 'Working late again. The neural mesh is complex.',
            emotion: 'exhaustion',
            mood_score: 0.3
        },
        {
            user_id: userId,
            mode: 'discipline',
            initial_input: 'Woke up at 5 AM to code. I need to maintain this focus if I want to reach the next peak.',
            content: 'Early morning momentum.',
            emotion: 'determination',
            mood_score: 0.8
        },
        {
            user_id: userId,
            mode: 'career',
            initial_input: 'Wondering if I should transition to a full AGI researcher role. The sovereign OS project is proving my capability.',
            content: 'Strategic career planning.',
            emotion: 'contemplative',
            mood_score: 0.6
        },
        {
            user_id: userId,
            mode: 'mindset',
            initial_input: 'The burnout is real. I keep pushing but my output is diminishing. I might need a reset.',
            content: 'Diminishing returns on focus.',
            emotion: 'frustration',
            mood_score: 0.2
        }
    ];

    const { data: inserted, error } = await supabase.from('sessions').insert(sessions).select();
    if (error) {
        console.error('❌ Error seeding sessions:', error.message);
        return;
    }

    console.log(`✅ ${inserted.length} sessions seeded.`);
}

seed();
