import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type WebPushModule = {
    setVapidDetails: (subject: string, publicKey: string, privateKey: string) => void;
    sendNotification: (sub: { endpoint: string; keys: unknown }, payload: string) => Promise<unknown>;
};

let configured = false;
function getWebPush(): WebPushModule | null {
    try {
        const req = eval('require') as (id: string) => WebPushModule;
        const webpush = req('web-push');

        if (!configured) {
            const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
            const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
            if (vapidPublicKey && vapidPrivateKey) {
                webpush.setVapidDetails('mailto:matrix@reflect.app', vapidPublicKey, vapidPrivateKey);
            }
            configured = true;
        }

        return webpush;
    } catch {
        return null;
    }
}

export async function POST(request: NextRequest) {
    try {
        const webpush = getWebPush();
        if (!webpush) {
            return NextResponse.json({ error: 'Push runtime unavailable' }, { status: 503 });
        }

        const { userId, title, body, icon, url } = await request.json();
        const supabase = await createClient();

        // Get user's subscription
        const { data: subscription, error } = await supabase
            .from('push_subscriptions')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error || !subscription) {
            return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
        }

        // Prepare push payload
        const payload = JSON.stringify({
            title: title || 'Matrix Notification',
            body: body || 'You have a new notification',
            icon: icon || '/reflect_logo_v4.png',
            url: url || '/'
        });

        // Send push notification
        await webpush.sendNotification(
            {
                endpoint: subscription.endpoint,
                keys: subscription.keys
            },
            payload
        );

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error('Push send error:', error);

        // If subscription is invalid, remove it (web-push throws with statusCode)
        const statusCode = error && typeof error === 'object' && 'statusCode' in error ? (error as { statusCode: number }).statusCode : 0;
        if (statusCode === 410) {
            const supabase = await createClient();
            const { userId } = await request.json();
            await supabase.from('push_subscriptions').delete().eq('user_id', userId);
        }

        const msg = error instanceof Error ? error.message : 'Push notification failed';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
