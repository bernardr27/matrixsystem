/**
 * Final Seed for Phase 39 using Auth
 */
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fullSeed() {
    console.log('🌱 Starting Auth-based Seed for Phase 39...');

    // 1. Create/Sign-in a test user
    const email = `test_${Math.random().toString(36).substring(7)}@example.com`;
    const { data, error: aError } = await supabase.auth.admin.createUser({
        email,
        password: 'password123',
        email_confirm: true
    });

    if (aError) {
        console.error('❌ Auth Error:', aError.message);
        return;
    }
    const userId = data.user.id;
    console.log(`👤 Auth user created: ${email} (${userId})`);

    // 2. Ensure profile exists (Upsert just in case trigger didn't catch it or is missing)
    await supabase.from('profiles').upsert({ id: userId, username: email.split('@')[0] });

    // 3. Insert mock sessions
    const sessions = [
        {
            user_id: userId,
            mode: 'mindset',
            initial_input: 'I feel exhausted after working on the matrix system for 12 hours straight. My brain is foggy.',
            content: 'Working late again. The neural mesh is complex.',
            emotion: 'exhaustion',
            mood_score: 0.3,
            is_trashed: false
        },
        {
            user_id: userId,
            mode: 'discipline',
            initial_input: 'Woke up at 5 AM to code. I need to maintain this focus if I want to reach the next peak.',
            content: 'Early morning momentum.',
            emotion: 'determination',
            mood_score: 0.8,
            is_trashed: false
        },
        {
            user_id: userId,
            mode: 'career',
            initial_input: 'Wondering if I should transition to a full AGI researcher role. The sovereign OS project is proving my capability.',
            content: 'Strategic career planning.',
            emotion: 'contemplative',
            mood_score: 0.6,
            is_trashed: false
        }
    ];

    const { data: inserted, error: sError } = await supabase.from('sessions').insert(sessions).select();
    if (sError) {
        console.error('❌ Error seeding sessions:', sError.message);
        return;
    }

    console.log(`✅ ${inserted.length} sessions seeded for testing.`);
    console.log(`🚀 READY FOR WEAVE: Use user_id ${userId}`);
}

fullSeed();
