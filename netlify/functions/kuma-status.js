'use strict';

const DEFAULT_BASE_URL = 'https://status.defingo.net';
const DEFAULT_PAGE_SLUG = 'default';
const STATUS_UP = 1;
const STATUS_DOWN = 0;

function withNoTrailingSlash(url) {
  return url.replace(/\/+$/, '');
}

function getHeaders() {
  const headers = {
    Accept: 'application/json',
  };

  if (process.env.KUMA_BEARER_TOKEN) {
    headers.Authorization = `Bearer ${process.env.KUMA_BEARER_TOKEN}`;
  }

  if (process.env.KUMA_ACCESS_CLIENT_ID && process.env.KUMA_ACCESS_CLIENT_SECRET) {
    headers['CF-Access-Client-Id'] = process.env.KUMA_ACCESS_CLIENT_ID;
    headers['CF-Access-Client-Secret'] = process.env.KUMA_ACCESS_CLIENT_SECRET;
  }

  return headers;
}

async function fetchJson(url, headers) {
  const response = await fetch(url, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Request failed (${response.status}) for ${url}: ${body.slice(0, 200)}`);
  }

  return response.json();
}

function calculateSummary(heartbeatPayload) {
  const heartbeatList = heartbeatPayload && heartbeatPayload.heartbeatList ? heartbeatPayload.heartbeatList : {};
  const uptimeList = heartbeatPayload && heartbeatPayload.uptimeList ? heartbeatPayload.uptimeList : {};
  const monitorIds = Object.keys(heartbeatList);

  let up = 0;
  let down = 0;
  let degraded = 0;

  monitorIds.forEach((monitorId) => {
    const entries = heartbeatList[monitorId];
    if (!Array.isArray(entries) || entries.length === 0) {
      degraded += 1;
      return;
    }

    const latest = entries[0];
    const status = Number(latest.status);

    if (status === STATUS_UP) {
      up += 1;
      return;
    }

    if (status === STATUS_DOWN) {
      down += 1;
      return;
    }

    degraded += 1;
  });

  const uptimes = Object.values(uptimeList)
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));

  const avgUptime = uptimes.length
    ? Math.round((uptimes.reduce((sum, value) => sum + value, 0) / uptimes.length) * 100) / 100
    : null;

  const total = monitorIds.length;
  const hasOutage = down > 0;
  const hasDegraded = degraded > 0;

  let overall = 'unknown';
  if (total > 0 && !hasOutage && !hasDegraded) {
    overall = 'operational';
  } else if (hasOutage) {
    overall = 'outage';
  } else if (hasDegraded) {
    overall = 'degraded';
  }

  return {
    overall,
    total,
    up,
    down,
    degraded,
    avgUptime,
  };
}

exports.handler = async function handler() {
  const baseUrl = withNoTrailingSlash(process.env.KUMA_BASE_URL || DEFAULT_BASE_URL);
  const slug = process.env.KUMA_STATUS_PAGE_SLUG || DEFAULT_PAGE_SLUG;
  const headers = getHeaders();

  try {
    const [statusPagePayload, heartbeatPayload] = await Promise.all([
      fetchJson(`${baseUrl}/api/status-page/${slug}`, headers),
      fetchJson(`${baseUrl}/api/status-page/heartbeat/${slug}`, headers),
    ]);

    const summary = calculateSummary(heartbeatPayload);
    const incidentCount = Array.isArray(statusPagePayload.incident) ? statusPagePayload.incident.length : 0;

    const responsePayload = {
      overall: summary.overall,
      summary,
      incidents: incidentCount,
      generatedAt: new Date().toISOString(),
      statusPageUrl: `${baseUrl}/`,
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=30, s-maxage=60, stale-while-revalidate=120',
      },
      body: JSON.stringify(responsePayload),
    };
  } catch (error) {
    return {
      statusCode: 502,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      },
      body: JSON.stringify({
        error: 'Unable to retrieve Uptime Kuma status.',
        detail: error.message,
      }),
    };
  }
};
