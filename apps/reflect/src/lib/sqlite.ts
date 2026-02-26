import path from 'path';

let db: any = null;

// Singleton SQLite connection for local persistence (Node runtime only).
export function getDb() {
  // Safeguard for build time or non-node runtimes
  // We check for NEXT_PHASE or lack of process.versions.node if we were in a browser (though this is server-only)
  if (process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.NODE_ENV === 'test' ||
    process.env.CI === 'true' ||
    !process.env.AI_BASE_URL) {
    return {
      prepare: () => ({
        run: () => ({ lastInsertRowid: 0 }),
        all: () => [],
        get: () => null,
        exec: () => { }
      })
    };
  }

  if (db) return db;

  try {

    const req = eval('require');
    const Database = req('better-sqlite3');
    const dbPath = path.join(process.cwd(), 'data.sqlite');
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mode TEXT NOT NULL,
        initial_input TEXT NOT NULL,
        mirror_text TEXT NOT NULL,
        pattern_text TEXT NOT NULL,
        reframe_question TEXT NOT NULL,
        user_resolution TEXT,
        image_url TEXT,
        started_at TEXT DEFAULT CURRENT_TIMESTAMP,
        completed_at TEXT
      );
      CREATE TABLE IF NOT EXISTS synapses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_id INTEGER NOT NULL,
        target_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        description TEXT,
        strength REAL DEFAULT 0.5,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(source_id) REFERENCES sessions(id),
        FOREIGN KEY(target_id) REFERENCES sessions(id)
      );
      CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        username TEXT,
        preferred_tone TEXT DEFAULT 'Neutral',
        reflection_points INTEGER DEFAULT 0,
        tier TEXT DEFAULT 'Seed',
        graph_3d_enabled BOOLEAN DEFAULT 1,
        ai_provider TEXT,
        local_ai_url TEXT,
        local_ai_model TEXT,
        notion_api_key TEXT,
        notion_db_id TEXT,
        obsidian_path TEXT,
        cortex_sync_enabled BOOLEAN DEFAULT 0
      );
      -- Ensure at least one profile exists for local dev
      INSERT OR IGNORE INTO profiles (id, username, tier) VALUES ('test-user-123', 'TestUser', 'Seed');
    `);
    return db;
  } catch (err) {
    if (err.message && err.message.includes('Could not locate the bindings file')) {
      // Ssssh! Known issue on Windows production builds without build tools.
      // We fall back to standard non-persistent behavior.
    } else {
      console.error("[SQLite] Unhandled Load Error:", err);
    }
    // Fallback object to prevent crashes in non-node or build environments
    return { prepare: () => ({ run: () => ({ lastInsertRowid: 0 }), all: () => [], get: () => null, exec: () => { } }) };
  }
}
