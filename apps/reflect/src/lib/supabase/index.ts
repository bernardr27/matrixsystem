// Re-export from client for convenience
export { createClient as createClientComponentClient } from './client';
// export { createClient as createServerComponentClient } from './server';
// Mock supabase export for legacy compatibility if needed, or remove if unused
import { createClient } from './client';
export const supabase = createClient();
