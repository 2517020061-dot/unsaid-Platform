import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getPublicConfig } from '@/config/public';

export function createBrowserSupabaseClient(): SupabaseClient | null {
  const { supabaseUrl, supabaseAnonKey } = getPublicConfig();

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
