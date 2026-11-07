import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if credentials are genuine (not empty and not default templates/placeholders)
export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('placeholder') && 
  !supabaseAnonKey.includes('placeholder') &&
  !supabaseUrl.includes('your-project-ref') &&
  !supabaseUrl.includes('your-project') &&
  !supabaseUrl.includes('<') &&
  !supabaseAnonKey.includes('your-public-anon-key') &&
  supabaseUrl.startsWith('https://') &&
  supabaseUrl !== 'https://.supabase.co'
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export function getDatabaseMode(): {
  mode: 'supabase_live' | 'local_resilient';
  label: string;
  urlPreview?: string;
} {
  if (isSupabaseConfigured && supabaseUrl) {
    let hostname = 'supabase.co';
    try {
      hostname = new URL(supabaseUrl).hostname;
    } catch (e) {
      hostname = supabaseUrl;
    }
    return {
      mode: 'supabase_live',
      label: `Supabase Cloud Connected (${hostname})`,
      urlPreview: hostname,
    };
  }

  return {
    mode: 'local_resilient',
    label: 'Resilient Offline / Demo Mode (Full Local DB Engine)',
  };
}
