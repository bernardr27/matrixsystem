"use server";
import { createClient } from '@/lib/supabase/server';

export async function savePreferences({ archetype, activeGoal }: { archetype: any; activeGoal: string; }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not signed in' };

    // Construct core_values object with the active goal
    const coreValues = {
      primary_directive: activeGoal,
      timestamp: new Date().toISOString()
    };

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        archetype: archetype,
        core_values: coreValues,
        onboarding_complete: true,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: (e instanceof Error ? e.message : String(e)) || 'Unknown error' };
  }
}
