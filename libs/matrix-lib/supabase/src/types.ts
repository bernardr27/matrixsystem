/**
 * Type definitions for Supabase integration
 */

import type { SupabaseClient, User } from '@supabase/supabase-js';

/**
 * Database schema types
 * These are common patterns used across Matrix apps
 */

export interface Profile {
  id: string;
  user_id: string;
  username: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
}

export interface MatrixSession {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  created_at: string;
}

export interface DataRecord {
  id: string;
  user_id: string;
  type: string;
  data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Query options
 */
export interface QueryOptions {
  enabled?: boolean;
  cache?: boolean;
  revalidate?: number;
}

/**
 * Authentication types
 */
export type AuthProvider = 'email' | 'google' | 'discord' | 'github';

export interface MatrixAuthError {
  code: string;
  message: string;
  status: number;
}

/**
 * Hook return types
 */
export interface UseUserReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface UseAuthReturn {
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

export interface UseTableReturn<T = any> {
  data: T[];
  loading: boolean;
  error: string | null;
}

export interface UseInsertReturn {
  insert: (data: Record<string, any>) => Promise<any>;
  loading: boolean;
  error: string | null;
}

export interface UseUpdateReturn {
  update: (id: string, data: Record<string, any>) => Promise<any>;
  loading: boolean;
  error: string | null;
}

export interface UseDeleteReturn {
  delete: (id: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

/**
 * Supabase client types
 */
export type SupabaseClientType = SupabaseClient;
