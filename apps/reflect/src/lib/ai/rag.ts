import { createClient } from '../supabase/client';

export async function searchSimilarSessions(input: string, userId: string): Promise<any[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('sessions')
        .select('created_at, initial_input, reframe_question')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

    if (error || !data) return [];
    return data;
}

export async function getContext(userId: string, input: string): Promise<string> {
    try {
        const history = await searchSimilarSessions(input, userId);
        if (history.length === 0) return "";

        const contextString = history.map((h: any) =>
            `[${new Date(h.created_at).toLocaleDateString()}] Input: "${h.initial_input}"`
        ).join('\n');

        return `The following are excerpts from the user's past sessions:\n${contextString}\n\nUse this to identify recurring themes, improvements, or contradictions.`;
    } catch (err) {
        console.error("RAG Context Error:", err);
        return "";
    }
}

export async function saveEmbedding(userId: string, sessionId: string, text: string) {
    
}
