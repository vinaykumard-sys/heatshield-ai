import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variable resolution: Works in Vite (import.meta.env) and Node / React Native (process.env)
const envUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && (
    process.env?.EXPO_PUBLIC_SUPABASE_URL ||
    process.env?.VITE_SUPABASE_URL ||
    process.env?.NEXT_PUBLIC_SUPABASE_URL ||
    process.env?.SUPABASE_URL
  )) ||
  'https://shayisuhjkpuulmouxju.supabase.co';

const envKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && (
    process.env?.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    process.env?.VITE_SUPABASE_ANON_KEY ||
    process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env?.SUPABASE_ANON_KEY ||
    process.env?.SUPABASE_PUBLISHABLE_KEY
  )) ||
  'sb_publishable_R4EYgtfRm5tNoGb61YdDng_JDTUTejW';

export const supabaseUrl: string = envUrl;
export const supabaseAnonKey: string = envKey;

// Check if credentials are genuine (not empty and not default templates/placeholders)
export const isSupabaseConfigured: boolean = Boolean(
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

export function createSupabaseClient(url = supabaseUrl, key = supabaseAnonKey): SupabaseClient | null {
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  });
}

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createSupabaseClient(supabaseUrl, supabaseAnonKey)
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
    } catch {
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

// ---------------------------------------------------------------------------
// Supabase API Query Helpers
// ---------------------------------------------------------------------------

/**
 * Fetch all location zones from Supabase
 */
export async function fetchLocations(client: SupabaseClient | null = supabase) {
  if (!client) return { data: null, error: new Error('Supabase client is not configured') };
  const { data, error } = await client
    .from('locations')
    .select('*')
    .order('name', { ascending: true });
  return { data, error };
}

/**
 * Fetch cooling centres with optional verified filter
 */
export async function fetchCoolingCentres(onlyVerified = false, client: SupabaseClient | null = supabase) {
  if (!client) return { data: null, error: new Error('Supabase client is not configured') };
  let query = client.from('cooling_centres').select('*');
  if (onlyVerified) {
    query = query.eq('verification_status', 'verified');
  }
  const { data, error } = await query.order('name', { ascending: true });
  return { data, error };
}

/**
 * Fetch assistance requests with optional status filter
 */
export async function fetchAssistanceRequests(status?: string, client: SupabaseClient | null = supabase) {
  if (!client) return { data: null, error: new Error('Supabase client is not configured') };
  let query = client.from('assistance_requests').select('*');
  if (status) {
    query = query.eq('status', status);
  }
  const { data, error } = await query.order('created_at', { ascending: false });
  return { data, error };
}

/**
 * Submit a new assistance request
 */
export async function submitAssistanceRequest(payload: Record<string, any>, client: SupabaseClient | null = supabase) {
  if (!client) return { data: null, error: new Error('Supabase client is not configured') };
  const { data, error } = await client
    .from('assistance_requests')
    .insert([payload])
    .select()
    .single();
  return { data, error };
}

/**
 * Fetch a user profile by user ID
 */
export async function fetchUserProfile(userId: string, client: SupabaseClient | null = supabase) {
  if (!client) return { data: null, error: new Error('Supabase client is not configured') };
  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
}

/**
 * Update a user profile
 */
export async function updateUserProfile(userId: string, updates: Record<string, any>, client: SupabaseClient | null = supabase) {
  if (!client) return { data: null, error: new Error('Supabase client is not configured') };
  const { data, error } = await client
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  return { data, error };
}

/**
 * Fetch user notification preferences
 */
export async function fetchNotificationPreferences(userId: string, client: SupabaseClient | null = supabase) {
  if (!client) return { data: null, error: new Error('Supabase client is not configured') };
  const { data, error } = await client
    .from('user_notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();
  return { data, error };
}

/**
 * Record an activity audit log entry
 */
export async function logActivity(
  action: string,
  targetType: string,
  details?: Record<string, any>,
  client: SupabaseClient | null = supabase
) {
  if (!client) return { data: null, error: null };
  const { data, error } = await client
    .from('activity_logs')
    .insert([
      {
        action,
        target_type: targetType,
        details: details || {},
        created_at: new Date().toISOString()
      }
    ]);
  return { data, error };
}
