/**
 * Offline-First IndexedDB Cache for Reflect Journal Entries
 * 
 * Provides a local-first caching layer so users can read and draft
 * journal entries even when completely offline. Entries sync to
 * Supabase when connectivity is restored.
 */

const DB_NAME = 'reflect_offline';
const DB_VERSION = 1;
const STORE_JOURNALS = 'journal_entries';
const STORE_DRAFTS = 'journal_drafts';

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            // Cached journal entries from the server
            if (!db.objectStoreNames.contains(STORE_JOURNALS)) {
                const journalStore = db.createObjectStore(STORE_JOURNALS, { keyPath: 'id' });
                journalStore.createIndex('created_at', 'created_at', { unique: false });
                journalStore.createIndex('user_id', 'user_id', { unique: false });
            }

            // Offline drafts waiting to sync
            if (!db.objectStoreNames.contains(STORE_DRAFTS)) {
                const draftStore = db.createObjectStore(STORE_DRAFTS, { keyPath: 'id', autoIncrement: true });
                draftStore.createIndex('synced', 'synced', { unique: false });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Cache entries fetched from Supabase for offline reading
export async function cacheJournalEntries(entries: any[]): Promise<void> {
    const db = await openDB();
    const tx = db.transaction(STORE_JOURNALS, 'readwrite');
    const store = tx.objectStore(STORE_JOURNALS);

    for (const entry of entries) {
        store.put(entry);
    }

    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

// Read cached entries when offline
export async function getCachedJournalEntries(userId: string): Promise<any[]> {
    const db = await openDB();
    const tx = db.transaction(STORE_JOURNALS, 'readonly');
    const store = tx.objectStore(STORE_JOURNALS);
    const index = store.index('user_id');
    const request = index.getAll(userId);

    return new Promise((resolve, reject) => {
        request.onsuccess = () => {
            const entries = request.result.sort(
                (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            resolve(entries);
        };
        request.onerror = () => reject(request.error);
    });
}

// Save a draft offline (to sync later)
export async function saveDraft(draft: { content: string; mood?: string; tags?: string[] }): Promise<number> {
    const db = await openDB();
    const tx = db.transaction(STORE_DRAFTS, 'readwrite');
    const store = tx.objectStore(STORE_DRAFTS);

    const request = store.add({
        ...draft,
        synced: false,
        created_at: new Date().toISOString()
    });

    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result as number);
        request.onerror = () => reject(request.error);
    });
}

// Get all unsynced drafts
export async function getUnsyncedDrafts(): Promise<any[]> {
    const db = await openDB();
    const tx = db.transaction(STORE_DRAFTS, 'readonly');
    const store = tx.objectStore(STORE_DRAFTS);
    const index = store.index('synced');
    const request = index.getAll(false as any);

    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Mark a draft as synced  
export async function markDraftSynced(id: number): Promise<void> {
    const db = await openDB();
    const tx = db.transaction(STORE_DRAFTS, 'readwrite');
    const store = tx.objectStore(STORE_DRAFTS);
    const request = store.get(id);

    return new Promise((resolve, reject) => {
        request.onsuccess = () => {
            const draft = request.result;
            if (draft) {
                draft.synced = true;
                store.put(draft);
            }
            resolve();
        };
        request.onerror = () => reject(request.error);
    });
}

// Sync all pending drafts to the server
export async function syncDrafts(supabase: any, userId: string): Promise<number> {
    const drafts = await getUnsyncedDrafts();
    let synced = 0;

    for (const draft of drafts) {
        try {
            const { error } = await supabase.from('sessions').insert({
                user_id: userId,
                content: draft.content,
                mood: draft.mood,
                tags: draft.tags,
                created_at: draft.created_at,
                source: 'offline_draft'
            });

            if (!error) {
                await markDraftSynced(draft.id);
                synced++;
            }
        } catch (e) {
            console.warn('[OFFLINE] Failed to sync draft:', e);
        }
    }

    return synced;
}
