import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getServerConfig } from '@/config/server';

const SERVER_CLIENT_OPTIONS = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
} as const;

export function createServerAnonClient(): SupabaseClient | null {
  const config = getServerConfig();
  const { supabaseUrl, supabaseAnonKey } = config.publicConfig;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey, SERVER_CLIENT_OPTIONS);
}

export function createServerAdminClient(): SupabaseClient | null {
  const config = getServerConfig();
  const { supabaseUrl } = config.publicConfig;
  const { supabaseServiceRoleKey } = config;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, SERVER_CLIENT_OPTIONS);
}
