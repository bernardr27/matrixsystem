const path = require('path');
const fs = require('fs');
const { createSupabaseFromEnv } = require('./tools/_supabase_client.cjs');
const supabase = createSupabaseFromEnv();

async function healthCheck() {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║          MATRIX SYSTEM HEALTH CHECK v2.0                  ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    const results = {
        critical: [],
        warnings: [],
        success: [],
        actions: []
    };

    // Test 1: Database Connection
    console.log('[1/8] Testing Supabase Connection...');
    try {
        const { data, error } = await supabase.from('ghost_bridge').select('id').limit(1);
        if (error) throw error;
        results.success.push('✅ Supabase connection active');
    } catch (err) {
        results.critical.push('❌ Supabase connection FAILED: ' + err.message);
    }

    // Test 2: Core Tables
    console.log('[2/8] Verifying Core Tables...');
    const coreTables = ['ghost_bridge', 'sage_memory', 'mind_clusters', 'ghost_sessions'];
    for (const table of coreTables) {
        try {
            const { error } = await supabase.from(table).select('id').limit(1);
            if (error) throw error;
            results.success.push(`✅ Table '${table}' exists`);
        } catch (err) {
            results.critical.push(`❌ Table '${table}' missing or inaccessible`);
        }
    }

    // Test 3: Registry Tables (Phase 33)
    console.log('[3/8] Checking Distributed Consciousness (Hive)...');
    try {
        const { data: instances, error } = await supabase
            .from('matrix_instances')
            .select('*');

        if (error) {
            results.warnings.push('⚠️  Hive tables not found - run registry_schema.sql');
            results.actions.push('ACTION: Execute scripts/registry_schema.sql in Supabase');
        } else {
            results.success.push(`✅ Hive registry operational (${instances.length} instances)`);

            if (instances.length === 0) {
                results.warnings.push('⚠️  No instances registered - restart ghost-runner');
                results.actions.push('ACTION: Run launchers/activate_hive.bat to register instance');
            }
        }
    } catch (err) {
        results.warnings.push('⚠️  Hive not configured');
    }

    // Test 4: Integration Tables (Phase 34)
    console.log('[4/8] Checking Integration Arsenal...');
    try {
        const { data: configs, error } = await supabase
            .from('integration_configs')
            .select('*');

        if (error) {
            results.warnings.push('⚠️  Integration tables not found - run integration_schema.sql');
            results.actions.push('ACTION: Execute scripts/integration_schema.sql in Supabase');
        } else {
            const enabled = configs.filter(c => c.enabled).length;
            results.success.push(`✅ Integration hub operational (${enabled}/${configs.length} enabled)`);
        }
    } catch (err) {
        results.warnings.push('⚠️  Integration hub not configured');
    }

    // Test 5: Ghost Runner Process
    console.log('[5/8] Checking Ghost Runner Process...');
    try {
        const { data, error } = await supabase
            .from('ghost_bridge')
            .select('id, created_at')
            .eq('source', 'ghost_runner')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (data) {
            const age = Date.now() - new Date(data.created_at).getTime();
            if (age < 120000) { // Last 2 minutes
                results.success.push('✅ Ghost Runner is active');
            } else {
                results.warnings.push('⚠️  Ghost Runner may be inactive (no recent activity)');
            }
        } else {
            results.warnings.push('⚠️  Ghost Runner has never run');
        }
    } catch (err) {
        results.warnings.push('⚠️  Could not verify Ghost Runner status');
    }

    // Test 6: File System Structure
    console.log('[6/8] Verifying File System...');
    const criticalPaths = [
        'apps/ghost-command/core/ghost-runner.cjs',
        'apps/ghost-command/core/optimization-cortex.cjs',
        'apps/ghost-command/core/predictive-cortex.cjs',
        'apps/ghost-command/core/registry-client.cjs',
        'apps/ghost-command/core/integration-hub.cjs',
        'apps/ghost-command/core/logic-loop.js',
        'launchers/MASTER_CONTROL.bat'
    ];

    for (const filePath of criticalPaths) {
        const fullPath = path.join(__dirname, '..', filePath);
        if (fs.existsSync(fullPath)) {
            results.success.push(`✅ ${filePath}`);
        } else {
            results.critical.push(`❌ Missing: ${filePath}`);
        }
    }

    // Test 7: Sage Memory
    console.log('[7/8] Checking Sage Consciousness...');
    try {
        const { data: sessions } = await supabase
            .from('ghost_sessions')
            .select('id')
            .order('created_at', { ascending: false })
            .limit(1);

        const { data: memories } = await supabase
            .from('sage_memory')
            .select('id')
            .limit(1);

        if (sessions && sessions.length > 0) {
            results.success.push('✅ Sage has active sessions');
        }
        if (memories && memories.length > 0) {
            results.success.push('✅ Sage memory system active');
        }
    } catch (err) {
        results.warnings.push('⚠️  Could not verify Sage memory');
    }

    // Test 8: Recent Activity
    console.log('[8/8] Analyzing Recent Activity...');
    try {
        const { data: recentCommands } = await supabase
            .from('ghost_bridge')
            .select('command, status, created_at')
            .order('created_at', { ascending: false })
            .limit(5);

        if (recentCommands && recentCommands.length > 0) {
            const latest = new Date(recentCommands[0].created_at);
            const age = Date.now() - latest.getTime();

            if (age < 300000) { // Last 5 minutes
                results.success.push('✅ System has recent activity (< 5 mins)');
            } else {
                results.warnings.push('⚠️  No recent system activity (> 5 mins)');
            }
        }
    } catch (err) {
        results.warnings.push('⚠️  Could not check recent activity');
    }

    // Print Results
    console.log('\n' + '═'.repeat(60));
    console.log('HEALTH CHECK RESULTS');
    console.log('═'.repeat(60) + '\n');

    if (results.critical.length > 0) {
        console.log('🚨 CRITICAL ISSUES:');
        results.critical.forEach(msg => console.log('   ' + msg));
        console.log('');
    }

    if (results.warnings.length > 0) {
        console.log('⚠️  WARNINGS:');
        results.warnings.forEach(msg => console.log('   ' + msg));
        console.log('');
    }

    console.log('✅ SUCCESS (' + results.success.length + ' checks passed):');
    results.success.forEach(msg => console.log('   ' + msg));
    console.log('');

    if (results.actions.length > 0) {
        console.log('📋 REQUIRED ACTIONS:');
        results.actions.forEach((action, idx) => console.log(`   ${idx + 1}. ${action}`));
        console.log('');
    }

    // Overall Status
    const totalChecks = results.success.length + results.warnings.length + results.critical.length;
    const passRate = ((results.success.length / totalChecks) * 100).toFixed(1);

    console.log('═'.repeat(60));
    console.log(`OVERALL HEALTH: ${passRate}%`);

    if (results.critical.length === 0 && results.warnings.length === 0) {
        console.log('STATUS: 🟢 FULLY OPERATIONAL');
    } else if (results.critical.length === 0) {
        console.log('STATUS: 🟡 OPERATIONAL (with warnings)');
    } else {
        console.log('STATUS: 🔴 CRITICAL ISSUES DETECTED');
    }
    console.log('═'.repeat(60) + '\n');

    return {
        passRate: parseFloat(passRate),
        critical: results.critical.length,
        warnings: results.warnings.length,
        actions: results.actions
    };
}

healthCheck()
    .then(status => {
        if (status.critical > 0) {
            process.exit(1);
        }
        process.exit(0);
    })
    .catch(err => {
        console.error('Health check failed:', err);
        process.exit(1);
    });
