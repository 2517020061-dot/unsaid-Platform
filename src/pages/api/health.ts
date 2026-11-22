import type { APIRoute } from 'astro';
import { getPublicRuntimeSummary } from '@/config/server';

export const prerender = false;

export const GET: APIRoute = async () => {
  const summary = getPublicRuntimeSummary();

  return new Response(
    JSON.stringify({
      ok: true,
      service: 'unsaid-platform',
      runtime: 'astro-ssr',
      environment: summary.environment,
      supabasePublicConfigured: summary.supabasePublicConfigured,
      supabaseAdminConfigured: summary.supabaseAdminConfigured,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    },
  );
};
