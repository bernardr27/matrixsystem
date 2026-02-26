'use server';

import { createClient } from '@/lib/supabase/server';
import { isSafeMode } from '@/lib/safe-mode';
import { redirect } from 'next/navigation';

export async function deleteAccount() {
    if (isSafeMode()) {
        // In safe mode, we just redirect. 
        // Ideally we'd clear local storage on client, but server can't do that.
        return { success: true };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Not logged in" };
    }

    // 1. Fetch Session IDs to clean up linked Synapses
    const { data: sessions } = await supabase.from('sessions').select('id').eq('user_id', user.id);
    const sessionIds = sessions?.map((s: any) => s.id) || [];

    if (sessionIds.length > 0) {
        // 2. Delete Synapses (Manual Cascade)
        // Remove connections where this user's sessions are source or target
        await supabase.from('synapses').delete().in('source_id', sessionIds);
        await supabase.from('synapses').delete().in('target_id', sessionIds);
    }

    // 3. Delete Sessions
    const { error: sessionError } = await supabase.from('sessions').delete().eq('user_id', user.id);
    if (sessionError) console.error("Session delete error", sessionError);

    // 4. Delete Profile
    const { error: profileError } = await supabase.from('profiles').delete().eq('id', user.id);
    if (profileError) console.error("Profile delete error", profileError);

    // 5. Sign out
    await supabase.auth.signOut();

    // redirect() must be called outside try/catch — it throws a special Next.js error
    redirect('/login');
}
