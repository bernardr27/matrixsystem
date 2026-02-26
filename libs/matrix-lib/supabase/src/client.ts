/**
 * @matrix-lib/supabase
 * Shared Supabase client and utilities for Matrix V9 Singularity
 * 
 * This module provides a centralized Supabase client instance and common utilities
 * used across all Matrix applications. This eliminates code duplication and ensures
 * consistency in database access patterns.
 */

import { createClient } from '@supabase/supabase-js';

// Get configuration from environment
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Validate configuration
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    'Supabase credentials not configured. Some functionality may not work.'
  );
}

/**
 * Main Supabase client for browser and server-side client operations
 * Use this for authenticated requests from the client side
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

/**
 * Admin Supabase client for server-side operations
 * Use this only in server components or API routes with service role key
 */
export const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export type SupabaseClient = typeof supabase;
export type SupabaseAdminClient = typeof supabaseAdmin;

export { createClient } from '@supabase/supabase-js';
export type {
  Session,
  User,
  AuthChangeEvent,
  AuthError,
  PostgrestError,
  RealtimePostgresChangesPayload,
} from '@supabase/supabase-js';
