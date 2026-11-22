import { z } from 'zod';

const optionalNonEmptyString = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().trim().min(1).optional(),
);

const optionalHttpUrl = z.preprocess(
  (value) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  },
  z
    .url()
    .refine((val) => val.startsWith('http://') || val.startsWith('https://'), {
      message: 'URL harus menggunakan protokol http:// atau https://',
    })
    .optional(),
);

export const publicEnvSchema = z.object({
  PUBLIC_APP_URL: optionalHttpUrl,
  PUBLIC_SUPABASE_URL: optionalHttpUrl,
  PUBLIC_SUPABASE_ANON_KEY: optionalNonEmptyString,
});

export const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  APP_URL: optionalHttpUrl,
  SUPABASE_SERVICE_ROLE_KEY: optionalNonEmptyString,
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

const FORBIDDEN_PUBLIC_SECRET_PATTERNS = [
  'SERVICE_ROLE',
  'PRIVATE_KEY',
  'SECRET_KEY',
  'DATABASE_URL',
];

export function assertNoSecretLeakage(env: Record<string, unknown>): void {
  for (const key of Object.keys(env)) {
    const isClientExposedPrefix = key.startsWith('PUBLIC_') || key.startsWith('VITE_');
    if (!isClientExposedPrefix) continue;

    const upperKey = key.toUpperCase();
    for (const pattern of FORBIDDEN_PUBLIC_SECRET_PATTERNS) {
      if (upperKey.includes(pattern)) {
        throw new Error(
          `Konfigurasi tidak aman: variabel "${key}" tidak boleh memakai prefix publik karena mengandung kredensial privat.`,
        );
      }
    }
  }
}

export function parsePublicEnv(rawEnv: Record<string, unknown>): PublicEnv {
  assertNoSecretLeakage(rawEnv);
  const parsed = publicEnvSchema.safeParse(rawEnv);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Validasi environment publik gagal: ${details}`);
  }

  return parsed.data;
}

export function parseServerEnv(
  rawEnv: Record<string, unknown>,
  options: { requireSupabase?: boolean } = {},
): { publicEnv: PublicEnv; serverEnv: ServerEnv } {
  const publicEnv = parsePublicEnv(rawEnv);
  const parsedServer = serverEnvSchema.safeParse(rawEnv);

  if (!parsedServer.success) {
    const details = parsedServer.error.issues
      .map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Validasi environment server gagal: ${details}`);
  }

  if (options.requireSupabase) {
    const missing: string[] = [];
    if (!publicEnv.PUBLIC_SUPABASE_URL) missing.push('PUBLIC_SUPABASE_URL');
    if (!publicEnv.PUBLIC_SUPABASE_ANON_KEY) missing.push('PUBLIC_SUPABASE_ANON_KEY');
    if (!parsedServer.data.SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');

    if (missing.length > 0) {
      throw new Error(
        `Variabel Supabase wajib belum terkonfigurasi: ${missing.join(', ')}`,
      );
    }
  }

  return {
    publicEnv,
    serverEnv: parsedServer.data,
  };
}
