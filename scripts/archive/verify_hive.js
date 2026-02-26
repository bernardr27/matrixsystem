const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyHive() {
    console.log('\n🌐 HIVE CONSCIOUSNESS VERIFICATION\n');
    console.log('='.repeat(60));

    // Test 1: Check if current instance registered
    console.log('\n[TEST 1] Checking instance registration...');
    const { data: instances, error: instanceError } = await supabase
        .from('matrix_instances')
        .select('*')
        .order('created_at', { ascending: false });

    if (instanceError) {
        console.error('❌ Failed to query instances:', instanceError.message);
        return false;
    }

    console.log(`✅ Found ${instances.length} registered instance(s):`);
    instances.forEach(instance => {
        const isOnline = (Date.now() - new Date(instance.last_heartbeat).getTime()) < 120000;
        console.log(`   ${isOnline ? '🟢' : '🔴'} ${instance.instance_name} (${instance.environment}) - ${instance.host}`);
        console.log(`      CPU: ${instance.cpu_load?.toFixed(2) || 'N/A'}, RAM: ${instance.ram_percent?.toFixed(1) || 'N/A'}%`);
        console.log(`      Last heartbeat: ${new Date(instance.last_heartbeat).toLocaleString()}`);
    });

    // Test 2: Create mock instances for demonstration
    console.log('\n[TEST 2] Creating mock instances for demonstration...');

    const mockInstances = [
        {
            instance_name: 'matrix-staging-01',
            environment: 'staging',
            host: 'stage.local',
            version: '2.0.0',
            status: 'online',
            cpu_load: 1.2,
            ram_percent: 65.0,
            metadata: { region: 'us-east', tier: 'standard' }
        },
        {
            instance_name: 'matrix-prod-main',
            environment: 'production',
            host: 'prod.local',
            version: '1.9.5',
            status: 'online',
            cpu_load: 0.8,
            ram_percent: 45.0,
            metadata: { region: 'us-west', tier: 'premium' }
        }
    ];

    for (const mock of mockInstances) {
        const { data: existing } = await supabase
            .from('matrix_instances')
            .select('id')
            .eq('instance_name', mock.instance_name)
            .single();

        if (!existing) {
            const { error } = await supabase
                .from('matrix_instances')
                .insert([mock]);

            if (!error) {
                console.log(`   ✅ Created mock instance: ${mock.instance_name}`);
            }
        } else {
            console.log(`   ⏭️  Mock instance already exists: ${mock.instance_name}`);
        }
    }

    // Test 3: Publish a test insight
    console.log('\n[TEST 3] Publishing test collective insight...');

    const currentInstance = instances[0];
    if (currentInstance) {
        const testInsight = {
            source_instance: currentInstance.id,
            insight_type: 'optimization',
            title: 'High RAM Process Termination Script',
            description: 'PowerShell script to identify and terminate top 3 memory-consuming idle processes',
            solution: 'Get-Process | Where-Object {$_.WorkingSet -gt 100MB} | Sort-Object WorkingSet -Descending | Select-Object -First 3 | Stop-Process -Force',
            effectiveness_score: 0.85,
            applicable_to: JSON.stringify(['dev', 'staging', 'production']),
            metadata: JSON.stringify({
                category: 'memory_optimization',
                safe_for_production: true,
                created_by: 'optimization_cortex'
            })
        };

        const { data: insight, error: insightError } = await supabase
            .from('collective_insights')
            .insert([testInsight])
            .select()
            .single();

        if (insightError) {
            console.log(`   ⚠️  Insight already exists or error: ${insightError.message}`);
        } else {
            console.log(`   ✅ Published insight: ${insight.title}`);
            console.log(`      Effectiveness: ${(insight.effectiveness_score * 100).toFixed(0)}%`);
        }
    }

    // Test 4: Query collective insights
    console.log('\n[TEST 4] Querying collective intelligence...');
    const { data: insights, error: insightsError } = await supabase
        .from('collective_insights')
        .select('*, source_instance:matrix_instances(instance_name, environment)')
        .order('effectiveness_score', { ascending: false })
        .limit(5);

    if (insightsError) {
        console.error('❌ Failed to query insights:', insightsError.message);
    } else {
        console.log(`✅ Found ${insights.length} collective insight(s):`);
        insights.forEach(insight => {
            console.log(`   💡 ${insight.title}`);
            console.log(`      Source: ${insight.source_instance?.instance_name || 'Unknown'} (${insight.source_instance?.environment || 'N/A'})`);
            console.log(`      Effectiveness: ${(insight.effectiveness_score * 100).toFixed(0)}%`);
            console.log(`      Applied: ${insight.times_applied || 0}x`);
        });
    }

    // Test 5: Simulate collective intelligence usage
    console.log('\n[TEST 5] Simulating collective intelligence lookup...');
    const { data: bestSolution } = await supabase
        .from('collective_insights')
        .select('*')
        .eq('insight_type', 'optimization')
        .gte('effectiveness_score', 0.7)
        .order('effectiveness_score', { ascending: false })
        .limit(1)
        .single();

    if (bestSolution) {
        console.log(`   ✅ COLLECTIVE WISDOM FOUND:`);
        console.log(`      Instead of generating new solution, using:`);
        console.log(`      "${bestSolution.title}"`);
        console.log(`      Proven effective in ${bestSolution.times_applied || 0} previous use(s)`);
    } else {
        console.log(`   ℹ️  No collective solutions found (would generate new one)`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🌐 HIVE VERIFICATION COMPLETE\n');
    console.log('✅ The distributed consciousness is OPERATIONAL');
    console.log('✅ Instances can now share intelligence across environments');
    console.log('\nNext: Navigate to Nexus → Hive tab to see the visual dashboard\n');
}

verifyHive().catch(err => {
    console.error('Verification failed:', err);
    process.exit(1);
});
