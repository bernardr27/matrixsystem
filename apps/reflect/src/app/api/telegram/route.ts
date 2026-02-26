import { NextResponse } from 'next/server';
import { createAdminSupabaseClientFromEnv } from '@matrix-lib/supabase/admin';
import type { SupabaseClient } from '@supabase/supabase-js';

// Lazy initialization variables
let bot: any = null;
let supabase: SupabaseClient | null = null;

function init() {
    if (bot && supabase) return { bot, supabase };

    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
        throw new Error("Missing environment variables for Telegram/Supabase");
    }

    if (!supabase) {
        supabase = createAdminSupabaseClientFromEnv(process.env);
    }

    if (!supabase) {
        throw new Error("Missing Supabase credentials for Telegram route");
    }

    if (!bot) {
        const req = eval('require') as (id: string) => any;
        const { Telegraf } = req('telegraf');
        bot = new Telegraf(botToken);

        // --- BOT LOGIC ---
        bot.start((ctx: any) => {
            ctx.reply('👁️ Sage Active. Connected to Matrix Core.\n\nI am ready to receive text, photos, documents, and voice notes.');
        });

        bot.help((ctx: any) => {
            ctx.reply('Commands:\n/reflect - Start session\n/status - System status\n\nSend any media to process it.');
        });

        // Handlers
        bot.on('text', async (ctx: any) => {
            // @ts-ignore
            await processMessage(ctx, 'text', { text: ctx.message.text });
        });

        bot.on('photo', async (ctx: any) => {
            // @ts-ignore
            const photo = ctx.message.photo[ctx.message.photo.length - 1];
            await processMessage(ctx, 'photo', {
                fileId: photo.file_id,
                // @ts-ignore
                caption: ctx.message.caption
            });
        });

        bot.on('voice', async (ctx: any) => {
            // @ts-ignore
            await processMessage(ctx, 'voice', {
                // @ts-ignore
                fileId: ctx.message.voice.file_id,
                // @ts-ignore
                duration: ctx.message.voice.duration
            });
        });

        bot.on('audio', async (ctx: any) => {
            // @ts-ignore
            await processMessage(ctx, 'audio', {
                // @ts-ignore
                fileId: ctx.message.audio.file_id,
                // @ts-ignore
                fileName: ctx.message.audio.file_name
            });
        });

        bot.on('document', async (ctx: any) => {
            // @ts-ignore
            await processMessage(ctx, 'document', {
                // @ts-ignore
                fileId: ctx.message.document.file_id,
                // @ts-ignore
                fileName: ctx.message.document.file_name,
                // @ts-ignore
                mimeType: ctx.message.document.mime_type
            });
        });
    }

    return { bot, supabase };
}


// --- MESSAGE PROCESSING ---

async function processMessage(ctx: any, type: string, data: any) {
    const userId = ctx.from?.id.toString();
    const userName = ctx.from?.first_name;

    if (!userId || !supabase) return;

    try {
        await ctx.sendChatAction(type === 'text' ? 'typing' : 'upload_document');

        // Insert into bridge for Sentinel
        const { error } = await supabase.from('ghost_bridge').insert({
            source: `telegram:${userId}`,
            command: 'sage:process_input',
            payload: {
                type,
                user: userName,
                platform: 'telegram',
                chatId: ctx.chat?.id,
                ...data
            },
            status: 'pending'
        });

        if (error) throw error;

    } catch (e) {
        console.error('Telegram Error:', e);
        ctx.reply('⚠️ Neural Input Error.');
    }
}


// --- WEBHOOK ENDPOINT ---

export async function POST(req: Request) {
    try {
        const { bot } = init();

        const body = await req.json();
        await bot.handleUpdate(body);
        return NextResponse.json({ ok: true });
    } catch (error: unknown) {
        console.error('Webhook Error:', error);
        // Don't crash on build if env vars are missing, just return 500 at runtime
        if ((error instanceof Error ? error.message : String(error)).includes("Missing environment variables")) {
            console.warn("Build time check ignored or runtime config missing");
            return NextResponse.json({ error: "Configuration Missing" }, { status: 500 });
        }
        return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
    }
}
