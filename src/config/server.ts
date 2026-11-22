import { parseServerEnv } from '@/validation/env';
import type { PublicConfig } from '@/config/public';

export interface ServerConfig {
  nodeEnv: 'development' | 'production' | 'test';
  appUrl: string;
  publicConfig: PublicConfig;
  supabaseServiceRoleKey: string | null;
  isSupabaseAdminConfigured: boolean;
}

export interface PublicRuntimeSummary {
  environment: 'development' | 'production' | 'test';
  supabasePublicConfigured: boolean;
  supabaseAdminConfigured: boolean;
}

function assertServerContext(): void {
  if (typeof window !== 'undefined') {
    throw new Error(
      'Pelanggaran batas keamanan: konfigurasi server tidak boleh diakses dari kode browser.',
    );
  }
}

export function getServerConfig(
  rawEnv?: Record<string, unknown>,
  options: { requireSupabase?: boolean } = {},
): ServerConfig {
  assertServerContext();

  const source: Record<string, unknown> =
    rawEnv ?? {
      ...process.env,
      PUBLIC_APP_URL: process.env.PUBLIC_APP_URL ?? import.meta.env.PUBLIC_APP_URL,
      PUBLIC_SUPABASE_URL:
        process.env.PUBLIC_SUPABASE_URL ?? import.meta.env.PUBLIC_SUPABASE_URL,
      PUBLIC_SUPABASE_ANON_KEY:
        process.env.PUBLIC_SUPABASE_ANON_KEY ?? import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    };

  const { publicEnv, serverEnv } = parseServerEnv(source, options);

  const supabaseUrl = publicEnv.PUBLIC_SUPABASE_URL ?? null;
  const supabaseAnonKey = publicEnv.PUBLIC_SUPABASE_ANON_KEY ?? null;
  const supabaseServiceRoleKey = serverEnv.SUPABASE_SERVICE_ROLE_KEY ?? null;
  const appUrl =
    serverEnv.APP_URL ?? publicEnv.PUBLIC_APP_URL ?? 'http://localhost:3000';

  return {
    nodeEnv: serverEnv.NODE_ENV,
    appUrl,
    publicConfig: {
      appUrl,
      supabaseUrl,
      supabaseAnonKey,
      isSupabasePublicConfigured: Boolean(supabaseUrl && supabaseAnonKey),
    },
    supabaseServiceRoleKey,
    isSupabaseAdminConfigured: Boolean(supabaseUrl && supabaseServiceRoleKey),
  };
}

export function getPublicRuntimeSummary(
  rawEnv?: Record<string, unknown>,
): PublicRuntimeSummary {
  const config = getServerConfig(rawEnv);

  return {
    environment: config.nodeEnv,
    supabasePublicConfigured: config.publicConfig.isSupabasePublicConfigured,
    supabaseAdminConfigured: config.isSupabaseAdminConfigured,
  };
}
