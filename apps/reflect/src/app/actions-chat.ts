'use server';

import { createClient } from '@/lib/supabase/server';
import { getCompletion } from '@/lib/ai/engine';
import { searchSimilarSessions } from '@/lib/ai/rag';
import { isSafeMode } from '@/lib/safe-mode';

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export async function chatWithJournal(messages: ChatMessage[]) {
    // Safe Mode Intercept
    if (isSafeMode()) {
        return {
            role: 'assistant',
            content: "I am in Safe Mode. I cannot read your encrypted journal history, but I can tell you that you are doing great."
        };
    }

    const lastUserMessage = messages[messages.length - 1].content;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { role: 'assistant', content: "Please log in to chat with your journal." };

    // 1. Search for context
    const contextEntries = await searchSimilarSessions(lastUserMessage, user.id);

    // 2. Format context
    const contextString = contextEntries.map((c: { created_at: string; initial_input: string }) =>
        `[${new Date(c.created_at).toLocaleDateString()}] ${c.initial_input}`
    ).join('\n\n');

    // 3. Construct System Prompt
    const systemPrompt = `You are Reflect, a wise and empathetic mirror. 
    You have access to the user's journal entries (CONTEXT).
    Answer their question based on patterns in their writing. 
    Be succinct, insightful, and kind.
    
    CONTEXT:
    ${contextString || "No relevant history found."}`;

    // 4. Call AI
    // We send a simplified history to keep it cheap/fast
    const result = await getCompletion([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: lastUserMessage }
    ], 'llama3'); // Defaulting to configured model

    return { role: 'assistant', content: result.content };
}
