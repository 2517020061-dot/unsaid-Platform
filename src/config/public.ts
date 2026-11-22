import { parsePublicEnv, type PublicEnv } from '@/validation/env';

export interface PublicConfig {
  appUrl: string;
  supabaseUrl: string | null;
  supabaseAnonKey: string | null;
  isSupabasePublicConfigured: boolean;
}

export function getPublicConfig(rawEnv?: Record<string, unknown>): PublicConfig {
  const source: Record<string, unknown> =
    rawEnv ?? {
      PUBLIC_APP_URL: import.meta.env.PUBLIC_APP_URL,
      PUBLIC_SUPABASE_URL: import.meta.env.PUBLIC_SUPABASE_URL,
      PUBLIC_SUPABASE_ANON_KEY: import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    };

  const validated: PublicEnv = parsePublicEnv(source);

  const supabaseUrl = validated.PUBLIC_SUPABASE_URL ?? null;
  const supabaseAnonKey = validated.PUBLIC_SUPABASE_ANON_KEY ?? null;

  return {
    appUrl: validated.PUBLIC_APP_URL ?? 'http://localhost:3000',
    supabaseUrl,
    supabaseAnonKey,
    isSupabasePublicConfigured: Boolean(supabaseUrl && supabaseAnonKey),
  };
}
