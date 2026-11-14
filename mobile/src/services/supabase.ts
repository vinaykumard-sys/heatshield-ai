import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  'https://shayisuhjkpuulmouxju.supabase.co';

export const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_R4EYgtfRm5tNoGb61YdDng_JDTUTejW';

class MobileMemoryStorage {
  private data: Record<string, string> = {};

  async getItem(key: string): Promise<string | null> {
    return this.data[key] ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.data[key] = value;
  }

  async removeItem(key: string): Promise<void> {
    delete this.data[key];
  }
}

const memoryStorage = new MobileMemoryStorage();
const hasLocalStorage = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  !SUPABASE_URL.includes('your-project') &&
  !SUPABASE_ANON_KEY.includes('dummy') &&
  SUPABASE_URL.startsWith('https://')
);

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: hasLocalStorage ? window.localStorage : (memoryStorage as any),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});
