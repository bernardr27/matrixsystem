import { createClient } from "@supabase/supabase-js";

type Env = NodeJS.ProcessEnv;

function urlFromEnv(env: Env): string {
  return String(env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
}

function anonKeyFromEnv(env: Env): string {
  return String(env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
}

function serviceKeyFromEnv(env: Env): string {
  return String(env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
}

export function createAnonSupabaseClientFromEnv(env: Env = process.env) {
  const url = urlFromEnv(env);
  const anon = anonKeyFromEnv(env);
  if (!url || !anon) return null;
  return createClient(url, anon);
}

export function createServiceSupabaseClientFromEnv(env: Env = process.env) {
  const url = urlFromEnv(env);
  const service = serviceKeyFromEnv(env);
  if (!url || !service) return null;
  return createClient(url, service);
}

export function createAdminSupabaseClientFromEnv(env: Env = process.env) {
  const url = urlFromEnv(env);
  const service = serviceKeyFromEnv(env);
  const anon = anonKeyFromEnv(env);
  if (!url || (!service && !anon)) return null;
  return createClient(url, service || anon);
}
