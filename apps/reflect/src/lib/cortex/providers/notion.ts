import { Client } from '@notionhq/client';

export class NotionProvider {
    private client: Client;

    constructor(apiKey: string) {
        this.client = new Client({ auth: apiKey });
    }

    async getRelevantContext(query: string, databaseId: string): Promise<string[]> {
        try {
            const response = await (this.client as any).databases.query({
                database_id: databaseId,
                filter: {
                    or: [
                        {
                            property: 'Name',
                            title: {
                                contains: query,
                            },
                        },
                    ],
                },
                page_size: 5,
            });

            const snippets: string[] = [];
            for (const page of response.results as any) {
                // Simplified: Just grabbing the title for now
                if (page.properties.Name?.title?.[0]?.plain_text) {
                    snippets.push(page.properties.Name.title[0].plain_text);
                }
            }
            return snippets;
        } catch (error) {
            console.error("[NotionProvider] Error fetching context:", error);
            return [];
        }
    }
}
