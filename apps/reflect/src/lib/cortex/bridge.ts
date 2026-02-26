import { createClient } from '@/lib/supabase/client';

export interface CortexConfig {
    notionApiKey?: string;
    notionDbId?: string;
    obsidianPath?: string;
    enabled: boolean;
}

export class CortexManager {
    private config: CortexConfig | null = null;

    async loadConfig() {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase.from('profiles')
                .select('notion_api_key, notion_db_id, obsidian_path, cortex_sync_enabled')
                .eq('id', user.id)
                .single();

            if (data) {
                this.config = {
                    notionApiKey: data.notion_api_key,
                    notionDbId: data.notion_db_id,
                    obsidianPath: data.obsidian_path,
                    enabled: data.cortex_sync_enabled ?? false
                };
            }
        }
    }

    isEnabled(): boolean {
        return this.config?.enabled ?? false;
    }

    getConfig(): CortexConfig | null {
        return this.config;
    }
}

export const cortexManager = new CortexManager();
