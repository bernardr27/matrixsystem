const db = require('better-sqlite3')('g:/test_v2/app/reflect.db');

const migrations = [
    `ALTER TABLE profiles ADD COLUMN reflection_points INTEGER DEFAULT 0;`,
    `ALTER TABLE profiles ADD COLUMN tier TEXT DEFAULT 'Seed';`,
    `ALTER TABLE profiles ADD COLUMN graph_3d_enabled BOOLEAN DEFAULT 1;`,
    `CREATE TABLE IF NOT EXISTS synapses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_id INTEGER NOT NULL,
        target_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (source_id) REFERENCES sessions(id),
        FOREIGN KEY (target_id) REFERENCES sessions(id)
    );`
];

migrations.forEach(sql => {
    try {
        db.prepare(sql).run();
        console.log(`Success: ${sql.substring(0, 50)}...`);
    } catch (e) {
        if (e.message.includes('duplicate column name')) {
            console.log(`Skipped (Already exists): ${sql.substring(0, 50)}...`);
        } else {
            console.error(`Error executing ${sql}:`, e.message);
        }
    }
});

console.log("Migration check complete.");
db.close();
