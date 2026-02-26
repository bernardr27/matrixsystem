"use client"

/**
 * React hooks for Supabase integration
 * Provides common patterns for authentication, data fetching, and subscriptions
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, type SupabaseClient } from './client';

/**
 * Hook to get the current user
 */
export function useUser() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        if (error) throw error;
        setUser(user);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to get user');
      } finally {
        setLoading(false);
      }
    };

    getUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return { user, loading, error };
}

/**
 * Hook for user authentication
 */
export function useAuth() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signUp = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      setError(null);
      try {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        router.push('/auth/confirm');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Sign up failed');
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      setError(null);
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push('/dashboard');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Sign in failed');
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  const signOut = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign out failed');
    } finally {
      setLoading(false);
    }
  }, [router]);

  return { signUp, signIn, signOut, loading, error };
}

/**
 * Hook for tables
 */
export function useTable(
  tableName: string,
  options?: {
    enabled?: boolean;
  }
) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const enabled = options?.enabled !== false;

  useEffect(() => {
    if (!enabled) return;

    const fetchData = async () => {
      try {
        const { data, error } = await supabase.from(tableName).select('*');
        if (error) throw error;
        setData(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Subscribe to real-time changes (Supabase v2 channel API)
    const channel = supabase
      .channel(`matrix-lib:${tableName}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: tableName },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            setData((prev) => [...prev, payload.new]);
          } else if (payload.eventType === 'UPDATE') {
            setData((prev) =>
              prev.map((item) =>
                item.id === payload.new.id ? payload.new : item
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setData((prev) => prev.filter((item) => item.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableName, enabled]);

  return { data, loading, error };
}

/**
 * Hook for inserting data
 */
export function useInsert(tableName: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const insert = useCallback(
    async (data: Record<string, any>) => {
      setLoading(true);
      setError(null);
      try {
        const result = await supabase.from(tableName).insert([data]);
        if (result.error) throw result.error;
        return result.data?.[0];
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Insert failed';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [tableName]
  );

  return { insert, loading, error };
}

/**
 * Hook for updating data
 */
export function useUpdate(tableName: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(
    async (id: string, data: Record<string, any>) => {
      setLoading(true);
      setError(null);
      try {
        const result = await supabase
          .from(tableName)
          .update(data)
          .eq('id', id);
        if (result.error) throw result.error;
        return result.data?.[0];
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Update failed';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [tableName]
  );

  return { update, loading, error };
}

/**
 * Hook for deleting data
 */
export function useDelete(tableName: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const delete_ = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);
      try {
        const result = await supabase.from(tableName).delete().eq('id', id);
        if (result.error) throw result.error;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Delete failed';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [tableName]
  );

  return { delete: delete_, loading, error };
}
