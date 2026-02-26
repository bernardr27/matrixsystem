import type { SupabaseClient } from '@supabase/supabase-js';

export class NeuralMemory {
    static async recall(supabase: SupabaseClient, embedding: number[], userId: string, matchCount = 5) {
        const { data: similarEpisodes, error } = await supabase.rpc('match_episodes', {
            query_embedding: embedding,
            match_threshold: 0.70,
            match_count: matchCount,
            user_identifier: userId
        });

        if (error) throw error;
        return similarEpisodes || [];
    }

    static async anchor(supabase: SupabaseClient, userId: string, content: string, embedding: number[], metadata: any = {}) {
        const { error } = await supabase.from('episodic_memory').insert({
            user_id: userId,
            content,
            embedding,
            metadata: {
                ...metadata,
                timestamp: new Date().toISOString()
            }
        });

        if (error) throw error;
    }
}
