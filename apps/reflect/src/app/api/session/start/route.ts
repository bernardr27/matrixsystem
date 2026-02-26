import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { reflectEngine, getEngine } from '@/lib/ai/engine';
import { ReflectMode } from '@/lib/ai/types';
import { getDb } from '@/lib/sqlite';
import { NotionProvider } from '@/lib/cortex/providers/notion';
import { ObsidianProvider } from '@/lib/cortex/providers/obsidian';

export const runtime = 'nodejs';

function enforceGuardrails(resp: { mirror: string; pattern: string; reframe: string }) {
    const combined = `${resp.mirror}\n\n${resp.pattern}\n\n${resp.reframe}`.trim();
    const words = combined.split(/\s+/).filter(Boolean);
    if (words.length > 200) {
        throw new Error('Response exceeds 200 words');
    }
    const questionMarks = (resp.reframe.match(/\?/g) || []).length;
    if (questionMarks !== 1) {
        throw new Error('Exactly one question required in Reframe');
    }
    const platitudes = [/you got this/i, /stay positive/i, /believe in yourself/i, /keep going/i];
    if (platitudes.some((r) => r.test(combined))) {
        throw new Error('Platitudes detected');
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { text, mode = 'mindset', imageUrl, persona = 'sage' } = body || {};
        if (!text || typeof text !== 'string') {
            return NextResponse.json({ error: 'text is required' }, { status: 400 });
        }

        const db = getDb();
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        let profile: any;
        let currentPoints = 0;
        let userName = 'Subject';
        let preferredTone = 'Neutral';

        if (user) {
            const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            profile = data;
            userName = profile?.username || 'Subject';
            preferredTone = profile?.preferred_tone || 'Neutral';
            currentPoints = profile?.reflection_points || 0;
        } else {
            profile = db.prepare('SELECT username, preferred_tone, reflection_points, ai_provider, local_ai_url, local_ai_model, notion_api_key, notion_db_id, obsidian_path, cortex_sync_enabled FROM profiles LIMIT 1').get() as any;
            userName = profile?.username || 'Subject';
            preferredTone = profile?.preferred_tone || 'Neutral';
            currentPoints = profile?.reflection_points || 0;
        }

        let externalContext = "";
        if (profile?.cortex_sync_enabled) {
            const contextPromises = [];

            // Parallel Notion fetch
            if (profile.notion_api_key && profile.notion_db_id) {
                const notion = new NotionProvider(profile.notion_api_key);
                contextPromises.push(notion.getRelevantContext(text.split(' ')[0], profile.notion_db_id));
            }

            // Parallel Obsidian fetch
            if (profile.obsidian_path) {
                const obsidian = new ObsidianProvider();
                contextPromises.push(obsidian.getRelevantContext(text.split(' ')[0], profile.obsidian_path));
            }

            const results = await Promise.all(contextPromises);
            const flatResults = results.flat();

            if (flatResults.length > 0) {
                externalContext = `\n[HOST_EXTERNAL_CORTEX_SNIPPETS]:\n${flatResults.join('\n---\n')}\n`;
            }
        }

        const userEngine = getEngine({
            provider: profile?.ai_provider,
            url: profile?.local_ai_url,
            model: profile?.local_ai_model
        });

        const fullInput = externalContext ? `${externalContext}\n${text}` : text;

        if (body.stream) {
            const encoder = new TextEncoder();
            const stream = userEngine.streamReflection(
                fullInput,
                mode as ReflectMode,
                [],
                imageUrl,
                persona as any,
                userName,
                undefined,
                preferredTone
            );

            let fullContent = "";
            let streamComplete = false;

            const readable = new ReadableStream({
                async start(controller) {
                    try {
                        for await (const chunk of stream) {
                            fullContent += chunk;
                            controller.enqueue(encoder.encode(chunk));
                        }
                        streamComplete = true;
                        controller.close();
                    } catch (e) {
                        controller.error(e);
                    }
                }
            });

            // Fire and forget post-processing after stream finish would be ideal
            // but for now, we'll return the stream and handle metadata separately
            // In a more robust system, we'd use a background worker.

            return new Response(readable, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                },
            });
        }

        const response = await userEngine.generateReflection(fullInput, mode as ReflectMode, [], imageUrl, persona as any, userName, undefined, preferredTone);
        enforceGuardrails(response as any);

        // Award Points & Update Tier logic
        const newPoints = currentPoints + 10;
        let newTier = 'Seed';
        if (newPoints >= 200) newTier = 'Singularity';
        else if (newPoints >= 100) newTier = 'Bloom';
        else if (newPoints >= 50) newTier = 'Sprout';

        

        if (user) {
            await supabase.from('profiles').update({ reflection_points: newPoints, tier: newTier }).eq('id', user.id);
        } else {
            db.prepare('UPDATE profiles SET reflection_points = ?, tier = ? WHERE 1=1').run(newPoints, newTier);
        }

        let sessionId: string | number;
        if (user) {
            const { data, error: sessionErr } = await supabase.from('sessions').insert({
                user_id: user.id,
                mode,
                initial_input: text,
                mirror_text: response.mirror,
                pattern_text: response.pattern,
                reframe_question: response.reframe,
                image_url: imageUrl
            }).select('id').single();
            if (sessionErr) throw sessionErr;
            sessionId = data.id;
        } else {
            const stmt = db.prepare(
                'INSERT INTO sessions (mode, initial_input, mirror_text, pattern_text, reframe_question, image_url, started_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)'
            );
            const info = stmt.run(mode, text, response.mirror, response.pattern, response.reframe, imageUrl);
            sessionId = info.lastInsertRowid as number;
        }

        // --- TRIGGER NEURAL INDEXING (SAGE CORTEX) ---
        if (sessionId) {
            await supabase.from('ghost_bridge').insert({
                command: `sage:embed ${sessionId}|${text}`,
                status: 'pending'
            });
        }

        // Autonomous Synaptogenesis (Fire and Forget)
        discoverSynapsesAsync(sessionId, text, mode as ReflectMode, user?.id, profile).catch(err =>
            console.error("Synaptogenesis error:", err)
        );

        return NextResponse.json({
            id: sessionId,
            response,
            features: [
                "Neural Memory (Synaptogenesis) Active",
                profile?.cortex_sync_enabled ? "Cortex Sync (External Knowledge) Integrated" : "Cortex Sync Ready",
                "Biometric Feedback Stream Enabled",
                "Tier Progression Tracking Ready"
            ]
        });

    } catch (err: unknown) {
        return NextResponse.json({ error: (err instanceof Error ? err.message : String(err)) || 'Internal error' }, { status: 500 });
    }
}

async function discoverSynapsesAsync(currentId: string | number, currentText: string, mode: ReflectMode, userId?: string, profile?: any) {
    try {
        const db = getDb();
        const supabase = await createClient();
        const userEngine = getEngine({
            provider: profile?.ai_provider,
            url: profile?.local_ai_url,
            model: profile?.local_ai_model
        });
        // Fetch last 5 reflections to compare
        let recent: any[];
        if (userId) {
            const { data } = await supabase.from('sessions')
                .select('id, initial_input, mode')
                .eq('user_id', userId)
                .neq('id', currentId)
                .order('started_at', { ascending: false })
                .limit(5);
            recent = data || [];
        } else {
            recent = db.prepare('SELECT id, initial_input, mode FROM sessions WHERE id != ? ORDER BY started_at DESC LIMIT 5').all(currentId);
        }

        if (recent.length === 0) return;

        const context = recent.map((r: any, i: number) => `REF-${i} (ID: ${r.id}): ${r.initial_input}`).join('\n');

        const systemPrompt = `
You are the "Synaptic Discovery Engine" for Reflect.
Your Task: Identify if the new reflection connects to any of the provided past reflections.

New Reflection: "${currentText}"
Mode: ${mode}

Past Reflections:
${context}

Rules:
1. Identify 0 to 2 strongest connections.
2. Connection Types: "reinforcement" (similar theme), "contradiction" (changed mind/feeling), "evolution" (progressed thought).
3. Output a ONLY a JSON array of objects: [{"targetId": ID, "type": "type", "description": "Short explanation"}]
`;

        const completion = await userEngine.getCompletion([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: "Analyze connections." }
        ]);

        const raw = completion.content.trim();
        // Extract JSON if wrapped in markdown
        const jsonMatch = raw.match(/\[[\s\S]*\]/);
        const links = JSON.parse(jsonMatch ? jsonMatch[0] : raw);

        if (Array.isArray(links)) {
            if (userId) {
                const supabaseLinks = links.filter(l => l.targetId).map(l => ({
                    source_id: currentId,
                    target_id: l.targetId,
                    type: l.type,
                    description: l.description || ''
                }));
                if (supabaseLinks.length > 0) {
                    await supabase.from('synapses').insert(supabaseLinks);
                }
            } else {
                const insertStmt = db.prepare('INSERT INTO synapses (source_id, target_id, type, description) VALUES (?, ?, ?, ?)');
                for (const link of links) {
                    if (link.targetId && link.type) {
                        insertStmt.run(currentId, link.targetId, link.type, link.description || '');
                    }
                }
            }
        }
    } catch (error) {
        console.error("Synaptogenesis Discovery Logic Failed:", error);
    }
}
