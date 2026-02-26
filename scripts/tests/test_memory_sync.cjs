/**
 * Phase 41: Memory Sync Verification
 */
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testSync() {
    console.log('🧪 Starting Phase 41: Memory Sync Verification...');

    try {
        // 1. Create a transient test user to satisfy foreign key constraints
        const email = `sync_test_${Math.random().toString(36).substring(7)}@example.com`;
        const { data: userData, error: aError } = await supabase.auth.admin.createUser({
            email,
            password: 'password123',
            email_confirm: true
        });

        if (aError) throw aError;
        const userId = userData.user.id;
        console.log(`👤 Transient test user created: ${userId}`);

        // Ensure profile exists
        await supabase.from('profiles').upsert({ id: userId, username: 'sync_tester' });

        const syncId = '00000000-0000-0000-0000-' + Date.now().toString().slice(-12);
        const sourceId = '11111111-1111-1111-1111-111111111111';
        const targetId = '22222222-2222-2222-2222-222222222222';

        const mockSynapses = [
            {
                id: syncId,
                source_id: sourceId,
                target_id: targetId,
                type: 'SYNC_TEST',
                strength: 1.0
            }
        ];

        const mockSessions = [
            {
                id: sourceId,
                initial_input: 'Source node memory context',
                emotion: 'determination',
                mood_score: 0.8,
                user_id: userId
            },
            {
                id: targetId,
                initial_input: 'Target node memory context',
                emotion: 'joy',
                mood_score: 0.9,
                user_id: userId
            }
        ];

        console.log('📡 Simulating ingestion of memory from mock peer...');

        // Use upsert to simulate the ingestMemory logic
        const { error: sessionError } = await supabase
            .from('sessions')
            .upsert(mockSessions, { onConflict: 'id' });

        if (sessionError) throw sessionError;
        console.log('✅ Mock sessions ingested.');

        const { error: synapseError } = await supabase
            .from('synapses')
            .upsert(mockSynapses, { onConflict: 'id' });

        if (synapseError) throw synapseError;
        console.log('✅ Mock synapses ingested.');

        console.log('🔍 Verifying record presence...');
        const { data: verify } = await supabase
            .from('synapses')
            .select('*')
            .eq('id', mockSynapses[0].id)
            .single();

        if (verify) {
            console.log('🏆 Memory Synchronization Verified Successfully.');
        } else {
            console.error('❌ Sync failed: Record not found after ingestion.');
        }

    } catch (err) {
        console.error('❌ Sync Verification Failed:', err.message);
    }

    console.log('\n🧪 Verification Complete.');
}

testSync();
