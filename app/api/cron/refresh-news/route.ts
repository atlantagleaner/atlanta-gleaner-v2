// ─────────────────────────────────────────────────────────────────────────────
// Atlanta Gleaner — Daily News Refresh Cron Route
// Triggered automatically by Vercel Cron at 5 AM ET daily.
// Protected by CRON_SECRET environment variable.
// ─────────────────────────────────────────────────────────────────────────────

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
    console.warn('[cron/refresh-news] Unauthorized attempt');
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const origin = request.headers.get('x-forwarded-host')
      ? `https://${request.headers.get('x-forwarded-host')}`
      : 'https://www.atlantagleaner.com';

    const res = await fetch(`${origin}/api/news`, {
      method: 'POST',
      headers: {
        'x-cron-secret': cronSecret!,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`News engine returned HTTP ${res.status}`);
    }

    const data = await res.json();
    console.log(`[cron/refresh-news] Refreshed successfully. ${data.count} items. ${data.generatedAt}`);

    return Response.json({
      ok: true,
      message: `News block refreshed — ${data.count} items`,
      generatedAt: data.generatedAt,
    });
  } catch (err: any) {
    console.error('[cron/refresh-news] Error:', err.message);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
