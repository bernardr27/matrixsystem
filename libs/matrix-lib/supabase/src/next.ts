import { createBrowserClient, createServerClient } from "@supabase/ssr";

type CookieStoreLike = {
  getAll: () => Array<{ name: string; value: string }>;
  set: (name: string, value: string, options?: Record<string, unknown>) => void;
};

function resolveSupabaseEnv(env: NodeJS.ProcessEnv = process.env): { url: string; key: string } {
  const url = (env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const key = (env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
  return { url, key };
}

function hasUsableCredentials(url: string, key: string): boolean {
  if (!url || !key) return false;
  if (url.includes("placeholder")) return false;
  if (key === "placeholder") return false;
  return true;
}

function createNoopClient() {
  const authError = { message: "Supabase is not configured" };
  const emptyMany = { data: [], error: null };
  const emptySingle = { data: null, error: null };

  const createBuilder = () => {
    const builder: any = {
      select: () => builder,
      eq: () => builder,
      neq: () => builder,
      gt: () => builder,
      gte: () => builder,
      lt: () => builder,
      lte: () => builder,
      like: () => builder,
      ilike: () => builder,
      is: () => builder,
      in: () => builder,
      contains: () => builder,
      order: () => builder,
      limit: () => builder,
      range: () => builder,
      maybeSingle: async () => emptySingle,
      single: async () => emptySingle,
      then: (resolve: any, reject?: any) => Promise.resolve(emptyMany).then(resolve, reject)
    };
    return builder;
  };

  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      signOut: async () => ({ error: null }),
      signInWithOAuth: async () => ({ data: null, error: authError }),
      signInWithPassword: async () => ({ data: null, error: authError }),
      signUp: async () => ({ data: null, error: authError }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } })
    },
    from: () => ({
      ...createBuilder(),
      insert: async () => ({ data: null, error: authError }),
      update: () => ({ ...createBuilder(), then: (resolve: any, reject?: any) => Promise.resolve({ data: null, error: authError }).then(resolve, reject) }),
      delete: () => ({ ...createBuilder(), then: (resolve: any, reject?: any) => Promise.resolve({ data: null, error: authError }).then(resolve, reject) }),
      upsert: async () => ({ data: null, error: authError })
    }),
    channel: () => ({
      on: () => ({ subscribe: () => ({ unsubscribe: () => { } }) }),
      subscribe: () => ({ unsubscribe: () => { } })
    }),
    removeChannel: () => { }
  } as any;
}

export function createBrowserSupabaseClientFromEnv(env: NodeJS.ProcessEnv = process.env) {
  const { url, key } = resolveSupabaseEnv(env);
  if (!hasUsableCredentials(url, key)) return createNoopClient();
  return createBrowserClient(url, key);
}

export function createServerSupabaseClientFromCookies(
  cookieStore: CookieStoreLike,
  env: NodeJS.ProcessEnv = process.env
) {
  const { url, key } = resolveSupabaseEnv(env);
  if (!hasUsableCredentials(url, key)) return createNoopClient();
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Ignore writes in environments that disallow mutating cookies.
        }
      }
    }
  });
}

export async function createServerSupabaseClient(
  cookieStore?: CookieStoreLike,
  env: NodeJS.ProcessEnv = process.env
) {
  let finalStore = cookieStore;
  if (!finalStore) {
    const { cookies } = await import('next/headers');
    finalStore = await cookies() as any;
  }

  const { url, key } = resolveSupabaseEnv(env);
  if (!hasUsableCredentials(url, key)) return createNoopClient();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return (finalStore as any).getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => (finalStore as any).set(name, value, options));
        } catch {
          // Ignore writes in environments that disallow mutating cookies.
        }
      }
    }
  });
}

export async function checkSupabaseConnectivity(env: NodeJS.ProcessEnv = process.env): Promise<{ reachable: boolean; error?: string }> {
  const { url } = resolveSupabaseEnv(env);
  if (!url) return { reachable: false, error: "No URL configured" };

  try {
    const res = await fetch(`${url}/rest/v1/`, { method: 'GET', headers: { 'apikey': env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '' } });
    return { reachable: res.ok };
  } catch (err: any) {
    return { reachable: false, error: err.message };
  }
}
