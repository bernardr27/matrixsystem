import { createAnonSupabaseClientFromEnv } from '@matrix-lib/supabase/admin';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabase = createAnonSupabaseClientFromEnv(process.env);
if (!supabase) {
    console.error("Missing credentials");
    process.exit(1);
}

async function testLog() {
    console.log("Attempting to write to sentinel_logs...");
    const { error } = await (supabase!).from('sentinel_logs').insert({
        error_message: 'Manual Verification Test',
        severity: 'info',
        context: { source: 'cli_test' }
    });

    if (error) {
        console.error("Write failed:", error);
    } else {
        console.log("Write successful.");
    }
}

testLog();
