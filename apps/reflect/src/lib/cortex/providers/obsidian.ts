import fs from 'fs';
import path from 'path';

export class ObsidianProvider {
    /**
     * Search for relevant Markdown snippets within a local vault.
     */
    async getRelevantContext(query: string, vaultPath: string): Promise<string[]> {
        if (!vaultPath || !fs.existsSync(vaultPath)) {
            console.error("[ObsidianProvider] Vault path does not exist:", vaultPath);
            return [];
        }

        try {
            const files = fs.readdirSync(vaultPath);
            const mdFiles = files.filter(f => f.endsWith('.md'));

            // Simple keyword-based ranking
            const matches = mdFiles.map(filename => {
                const fullPath = path.join(vaultPath, filename);
                const content = fs.readFileSync(fullPath, 'utf-8');
                const score = (content.match(new RegExp(query, 'gi')) || []).length;
                return { filename, content, score };
            })
                .filter(m => m.score > 0)
                .sort((a, b) => b.score - a.score)
                .slice(0, 3); // Take top 3

            return matches.map(m => `Note: ${m.filename}\n${m.content.slice(0, 500)}...`);
        } catch (error) {
            console.error("[ObsidianProvider] Error reading vault:", error);
            return [];
        }
    }

    /**
     * Basic validation to ensure the path is a readable directory.
     */
    validatePath(vaultPath: string): boolean {
        try {
            const stats = fs.statSync(vaultPath);
            return stats.isDirectory();
        } catch {
            return false;
        }
    }
}
