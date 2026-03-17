#!/usr/bin/env node
/* eslint-disable no-console */
const { createSupabaseFromEnv } = require('./_supabase_client.cjs');

function parseArgs(argv) {
    const staleHoursArg = argv.find((a) => a.startsWith('--stale-hours='));
    const failDaysArg = argv.find((a) => a.startsWith('--failed-days='));
    const dryRun = argv.includes('--dry-run');
    const staleHours = staleHoursArg ? Number(staleHoursArg.split('=')[1]) : 2;
    const failedDays = failDaysArg ? Number(failDaysArg.split('=')[1]) : 3;
    return {
        dryRun,
        staleHours: Number.isFinite(staleHours) && staleHours > 0 ? staleHours : 2,
        failedDays: Number.isFinite(failedDays) && failedDays > 0 ? failedDays : 3
    };
}

async function main() {
    const args = parseArgs(process.argv.slice(2));
    const supabase = createSupabaseFromEnv();

    const staleBefore = new Date(Date.now() - args.staleHours * 60 * 60 * 1000).toISOString();
    const failedBefore = new Date(Date.now() - args.failedDays * 24 * 60 * 60 * 1000).toISOString();

    const { count: pendingCount, error: pendingErr } = await supabase
        .from('ghost_bridge')
        .select('id', { head: true, count: 'exact' })
        .eq('status', 'pending')
        .lt('created_at', staleBefore);
    if (pendingErr) throw pendingErr;

    const { count: executingCount, error: executingErr } = await supabase
        .from('ghost_bridge')
        .select('id', { head: true, count: 'exact' })
        .eq('status', 'executing')
        .lt('created_at', staleBefore);
    if (executingErr) throw executingErr;

    const { count: failedCountRaw, error: failedErr } = await supabase
        .from('ghost_bridge')
        .select('id', { head: true, count: 'exact' })
        .eq('status', 'failed')
        .lt('created_at', failedBefore);
    if (failedErr) throw failedErr;

    const staleCount = (pendingCount || 0) + (executingCount || 0);
    const failedCount = failedCountRaw || 0;

    let deletedStale = 0;
    let deletedFailed = 0;

    if (!args.dryRun) {
        const pendingDelete = await supabase
            .from('ghost_bridge')
            .delete()
            .eq('status', 'pending')
            .lt('created_at', staleBefore)
            .select('id');
        if (pendingDelete.error) throw pendingDelete.error;

        const executingDelete = await supabase
            .from('ghost_bridge')
            .delete()
            .eq('status', 'executing')
            .lt('created_at', staleBefore)
            .select('id');
        if (executingDelete.error) throw executingDelete.error;

        deletedStale = (Array.isArray(pendingDelete.data) ? pendingDelete.data.length : 0) +
            (Array.isArray(executingDelete.data) ? executingDelete.data.length : 0);

        const failedDelete = await supabase
            .from('ghost_bridge')
            .delete()
            .eq('status', 'failed')
            .lt('created_at', failedBefore)
            .select('id');
        if (failedDelete.error) throw failedDelete.error;
        deletedFailed = Array.isArray(failedDelete.data) ? failedDelete.data.length : 0;
    }

    console.log(
        `[bridge_hygiene] dry_run=${args.dryRun ? 'true' : 'false'} ` +
        `stale_candidates=${staleCount} failed_candidates=${failedCount} ` +
        `deleted_stale=${deletedStale} deleted_failed=${deletedFailed}`
    );
}

main().catch((err) => {
    console.error(`[bridge_hygiene] ${err?.message || String(err)}`);
    process.exit(1);
});
