/**
 * Data Fetching Hooks
 * useApi, useFetch for common API patterns
 */

import { useState, useCallback, useEffect } from 'react';

/**
 * Generic API hook for common fetch patterns
 */
export function useApi<T = any>(
  url: string,
  options?: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    headers?: Record<string, string>;
    body?: any;
    enabled?: boolean;
    cacheTime?: number;
    retries?: number;
  }
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);

  const enabled = options?.enabled !== false;

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url, {
        method: options?.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        body: options?.body ? JSON.stringify(options.body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      setData(result.data || result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [url, enabled, options]);

  const revalidate = useCallback(async () => {
    setIsValidating(true);
    await fetchData();
    setIsValidating(false);
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    error,
    loading,
    isValidating,
    revalidate,
    mutate: (newData: T) => setData(newData),
  };
}

/**
 * Fetch hook with more control
 */
export function useFetch<T = any>(url: string, init?: RequestInit) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);

  const fetch_ = useCallback(
    async (fetchUrl?: string) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(fetchUrl || url, init);

        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status}`);
        }

        const result = await response.json();
        setData(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [url, init]
  );

  return {
    data,
    error,
    loading,
    fetch: fetch_,
  };
}

/**
 * POST request hook
 */
export function usePost<T = any, D = any>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);

  const post = useCallback(
    async (body?: D) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
          throw new Error(`POST Error: ${response.status}`);
        }

        const result = await response.json();
        setData(result.data || result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [url]
  );

  return { data, error, loading, post };
}

/**
 * Pagination hook
 */
export function usePagination<T = any>(
  fetchFn: (page: number, limit: number) => Promise<{ data: T[]; total: number }>,
  initialLimit = 10
) {
  const [data, setData] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const totalPages = Math.ceil(total / limit);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn(page, limit);
      setData(result.data);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [page, limit, fetchFn]);

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  return {
    data,
    page,
    limit,
    total,
    totalPages,
    loading,
    error,
    setPage,
    setLimit,
    goToPage: (newPage: number) => setPage(Math.min(Math.max(1, newPage), totalPages)),
    nextPage: () => setPage((p) => Math.min(p + 1, totalPages)),
    prevPage: () => setPage((p) => Math.max(p - 1, 1)),
  };
}
