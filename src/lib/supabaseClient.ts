import { createClient } from '@supabase/supabase-js';

// ── Replace these two lines with your real values from:
//    Supabase Dashboard → Project Settings → API
// ─────────────────────────────────────────────────────
const SUPABASE_URL  = 'https://hfmxbdwjgsrbispnokbl.supabase.co' as string;
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmbXhiZHdqZ3NyYmlzcG5va2JsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0ODE3NDQsImV4cCI6MjA5MjA1Nzc0NH0.Vzk2kwhDG9g0KuyYuwbNMqFtpdv1Sp8uOHNInBESVR0' as string;
// ─────────────────────────────────────────────────────

/**
 * True only when both values look like real credentials.
 * When false the app runs in LocalStorage (demo) mode.
 */
export const IS_CONFIGURED =
  SUPABASE_URL  !== 'https://YOUR_PROJECT_REF.supabase.co' &&
  SUPABASE_ANON !== 'YOUR_ANON_PUBLIC_KEY' &&
  SUPABASE_URL.startsWith('https://') &&
  SUPABASE_ANON.length > 20;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/** Async helper — returns the current user's id or throws */
export async function getUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('Not authenticated');
  return data.user.id;
}
