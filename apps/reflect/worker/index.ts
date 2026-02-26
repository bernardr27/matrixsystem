// @ts-nocheck
/// <reference lib="webworker" />



// Custom Service Worker Extension for Push Notifications
// This file is automatically merged into the generated sw.js by @ducanh2912/next-pwa

self.addEventListener('push', (event: PushEvent) => {
    const defaultData = {
        title: 'Matrix Intelligence',
        body: 'You have a new notification.',
        icon: '/reflect_logo_v4.png',
        url: '/'
    };

    let data = defaultData;
    try {
        if (event.data) {
            data = { ...defaultData, ...event.data.json() };
        }
    } catch (e) {
        // If data is plain text
        if (event.data) {
            data.body = event.data.text();
        }
    }

    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: data.icon,
            badge: '/badge-72x72.png',
            vibrate: [100, 50, 100],
            data: {
                url: data.url
            }
        })
    );
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
    event.notification.close();
    const url = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList: readonly WindowClient[]) => {
            // If a window tab is already open, focus it
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.navigate(url);
                    return client.focus();
                }
            }
            // Otherwise open a new tab
            return clients.openWindow(url);
        })
    );
});

// ---------- BACKGROUND SYNC ----------

self.addEventListener('sync', (event: any) => {
    if (event.tag === 'sync-drafts') {
        event.waitUntil(syncDraftsBackground());
    }
});

async function syncDraftsBackground() {
    const DB_NAME = 'reflect_offline';
    const DB_VERSION = 1;
    const STORE_DRAFTS = 'journal_drafts';

    const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });

    // Check if drafts store exists
    if (!db.objectStoreNames.contains(STORE_DRAFTS)) return;

    const tx = db.transaction(STORE_DRAFTS, 'readonly');
    const store = tx.objectStore(STORE_DRAFTS);
    const index = store.index('synced');
    const request = index.getAll(false);

    const unsyncedDrafts = await new Promise<any[]>((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });

    if (unsyncedDrafts.length === 0) return;

    try {
        const res = await fetch('/api/journal/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(unsyncedDrafts)
        });

        if (res.ok) {
            const result = await res.json();

            if (result.success && result.syncedIds) {
                // Mark them as synced in IndexedDB
                const writeTx = db.transaction(STORE_DRAFTS, 'readwrite');
                const writeStore = writeTx.objectStore(STORE_DRAFTS);

                for (const id of result.syncedIds) {
                    const getReq = writeStore.get(id);
                    getReq.onsuccess = () => {
                        const draft = getReq.result;
                        if (draft) {
                            draft.synced = true;
                            writeStore.put(draft);
                        }
                    };
                }
            }
        }
    } catch (err) {
        console.warn('[SW_SYNC] Background sync failed:', err);
    }
}

