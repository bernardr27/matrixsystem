const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://phmnyenltuqxtkadnhpj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobW55ZW5sdHVxeHRrYWRuaHBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyMTc4ODAsImV4cCI6MjA4NDc5Mzg4MH0.oyEVHSF8iZxvDD4scTmYuUOGrU82DVrPRJ1ABLBnZzM';
const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
    console.log('--- NEXUS HEARTBEAT DIAGNOSTIC ---');

    const { data, error } = await supabase
        .from('ghost_bridge')
        .select('*')
        .eq('command', 'sys:heartbeat')
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        console.error('Error fetching heartbeats:', error);
        return;
    }

    const sources = {};
    const timelines = [];

    data.forEach(entry => {
        const time = new Date(entry.created_at).getTime();
        const source = entry.source || 'unknown';

        let meta = {};
        try { meta = JSON.parse(entry.output || '{}'); } catch (e) { }

        if (!sources[source]) sources[source] = { count: 0, lastSeen: 0, pids: new Set() };
        sources[source].count++;
        sources[source].lastSeen = Math.max(sources[source].lastSeen, time);
        if (meta.pid) sources[source].pids.add(meta.pid);

        timelines.push({ time, source, pid: meta.pid, status: entry.status });
    });

    console.log('\nActive Sources (Last 50 Heartbeats):');
    Object.entries(sources).forEach(([name, stats]) => {
        const lastSeenSecondsAgo = Math.round((Date.now() - stats.lastSeen) / 1000);
        console.log(`- [${name}] Count: ${stats.count}, Last Seen: ${lastSeenSecondsAgo}s ago, PIDs: ${[...stats.pids].join(', ') || 'N/A'}`);
    });

    console.log('\nRecent Timeline (Newest First):');
    timelines.slice(0, 15).forEach(t => {
        const ago = Math.round((Date.now() - t.time) / 1000);
        console.log(`[${ago}s ago] ${t.source} (PID: ${t.pid || '?'}) - Status: ${t.status}`);
    });
}

diagnose();
