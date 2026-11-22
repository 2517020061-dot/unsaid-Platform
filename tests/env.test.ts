import { describe, expect, it } from 'vitest';
import {
  assertNoSecretLeakage,
  parsePublicEnv,
  parseServerEnv,
} from '@/validation/env';
import { getPublicRuntimeSummary, getServerConfig } from '@/config/server';

describe('Validasi Environment & Batas Keamanan', () => {
  it('menerima environment kosong pada tahap fondasi dengan nilai aman', () => {
    const publicEnv = parsePublicEnv({
      PUBLIC_APP_URL: '',
      PUBLIC_SUPABASE_URL: '',
      PUBLIC_SUPABASE_ANON_KEY: '',
    });

    expect(publicEnv.PUBLIC_APP_URL).toBeUndefined();
    expect(publicEnv.PUBLIC_SUPABASE_URL).toBeUndefined();
    expect(publicEnv.PUBLIC_SUPABASE_ANON_KEY).toBeUndefined();
  });

  it('menolak URL Supabase yang tidak valid', () => {
    expect(() =>
      parsePublicEnv({
        PUBLIC_SUPABASE_URL: 'bukan-url-valid',
      }),
    ).toThrow(/Validasi environment publik gagal/);
  });

  it('menolak secret server yang memakai prefix publik PUBLIC_ atau VITE_', () => {
    expect(() =>
      assertNoSecretLeakage({
        PUBLIC_SUPABASE_SERVICE_ROLE_KEY: 'secret-value',
      }),
    ).toThrow(/Konfigurasi tidak aman/);

    expect(() =>
      assertNoSecretLeakage({
        VITE_SUPABASE_SERVICE_ROLE_KEY: 'secret-value',
      }),
    ).toThrow(/Konfigurasi tidak aman/);
  });

  it('mewajibkan seluruh variabel Supabase saat opsi requireSupabase aktif', () => {
    expect(() =>
      parseServerEnv(
        {
          NODE_ENV: 'production',
          PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        },
        { requireSupabase: true },
      ),
    ).toThrow(/PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY/);
  });

  it('tidak membocorkan SUPABASE_SERVICE_ROLE_KEY pada ringkasan runtime publik', () => {
    const mockEnv = {
      NODE_ENV: 'test',
      PUBLIC_APP_URL: 'https://unsaid.example.id',
      PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      PUBLIC_SUPABASE_ANON_KEY: 'anon-key-contoh',
      SUPABASE_SERVICE_ROLE_KEY: 'rahasia-service-role-server',
    };

    const serverConfig = getServerConfig(mockEnv);
    const summary = getPublicRuntimeSummary(mockEnv);

    expect(serverConfig.supabaseServiceRoleKey).toBe('rahasia-service-role-server');
    expect(summary).toEqual({
      environment: 'test',
      supabasePublicConfigured: true,
      supabaseAdminConfigured: true,
    });
    expect(JSON.stringify(summary)).not.toContain('rahasia-service-role-server');
  });
});
