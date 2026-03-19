const DEFAULT_BASE_URL = 'https://status.defingo.net';
const DEFAULT_PAGE_SLUG = 'default';
const STATUS_UP = 1;
const STATUS_DOWN = 0;

function withNoTrailingSlash(url) {
  return url.replace(/\/+$/, '');
}

function buildHeaders(env) {
  const headers = { Accept: 'application/json' };

  if (env.KUMA_BEARER_TOKEN) {
    headers.Authorization = `Bearer ${env.KUMA_BEARER_TOKEN}`;
  }

  if (env.KUMA_ACCESS_CLIENT_ID && env.KUMA_ACCESS_CLIENT_SECRET) {
    headers['CF-Access-Client-Id'] = env.KUMA_ACCESS_CLIENT_ID;
    headers['CF-Access-Client-Secret'] = env.KUMA_ACCESS_CLIENT_SECRET;
  }

  return headers;
}

async function fetchJson(url, headers) {
  const response = await fetch(url, { method: 'GET', headers });

  const contentType = (response.headers.get('content-type') || '').toLowerCase();
  const bodyText = await response.text();

  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${url}: ${bodyText.slice(0, 200)}`);
  }

  if (!contentType.includes('application/json')) {
    const looksLikeHtml = bodyText.trim().startsWith('<!DOCTYPE') || bodyText.trim().startsWith('<html');
    if (looksLikeHtml) {
      throw new Error(
        `Upstream returned HTML instead of JSON for ${url}. ` +
        `Cloudflare Access is likely blocking the request. ` +
        `Configure KUMA_ACCESS_CLIENT_ID and KUMA_ACCESS_CLIENT_SECRET in Cloudflare Pages environment variables ` +
        `and allow that service token in the Access policy for status.defingo.net.`
      );
    }
    throw new Error(`Upstream returned unexpected content-type (${contentType || 'unknown'}) for ${url}`);
  }

  try {
    return JSON.parse(bodyText);
  } catch (err) {
    throw new Error(`Invalid JSON from ${url}: ${err.message}`);
  }
}

function calculateSummary(heartbeatPayload) {
  const heartbeatList = heartbeatPayload?.heartbeatList ?? {};
  const uptimeList = heartbeatPayload?.uptimeList ?? {};
  const monitorIds = Object.keys(heartbeatList);

  let up = 0;
  let down = 0;
  let degraded = 0;

  for (const monitorId of monitorIds) {
    const entries = heartbeatList[monitorId];
    if (!Array.isArray(entries) || entries.length === 0) {
      degraded += 1;
      continue;
    }
    const status = Number(entries[0].status);
    if (status === STATUS_UP) up += 1;
    else if (status === STATUS_DOWN) down += 1;
    else degraded += 1;
  }

  const uptimePercentages = Object.values(uptimeList)
    .map(Number)
    .filter(Number.isFinite)
    .map((v) => (v >= 0 && v <= 1 ? v * 100 : v));

  const avgUptime = uptimePercentages.length
    ? Math.round((uptimePercentages.reduce((sum, v) => sum + v, 0) / uptimePercentages.length) * 100) / 100
    : null;

  const total = monitorIds.length;
  let overall = 'unknown';
  if (total > 0 && down === 0 && degraded === 0) overall = 'operational';
  else if (down > 0) overall = 'outage';
  else if (degraded > 0) overall = 'degraded';

  return { overall, total, up, down, degraded, avgUptime };
}

export async function onRequestGet({ env }) {
  const baseUrl = withNoTrailingSlash(env.KUMA_BASE_URL || DEFAULT_BASE_URL);
  const slug = env.KUMA_STATUS_PAGE_SLUG || DEFAULT_PAGE_SLUG;
  const headers = buildHeaders(env);

  try {
    const [statusPagePayload, heartbeatPayload] = await Promise.all([
      fetchJson(`${baseUrl}/api/status-page/${slug}`, headers),
      fetchJson(`${baseUrl}/api/status-page/heartbeat/${slug}`, headers),
    ]);

    const summary = calculateSummary(heartbeatPayload);
    const incidents = Array.isArray(statusPagePayload.incident) ? statusPagePayload.incident.length : 0;

    const body = JSON.stringify({
      overall: summary.overall,
      summary,
      incidents,
      generatedAt: new Date().toISOString(),
      statusPageUrl: `${baseUrl}/`,
    });

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=30, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Unable to retrieve Uptime Kuma status.', detail: err.message }),
      {
        status: 502,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}
