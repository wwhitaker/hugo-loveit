(function () {
  'use strict';

  const STATUS_LABELS = {
    operational: 'All systems operational',
    degraded: 'Degraded performance detected',
    outage: 'Service outage detected',
    unknown: 'Status currently unavailable',
  };

  function formatStatus(status) {
    return STATUS_LABELS[status] || STATUS_LABELS.unknown;
  }

  function formatRelativeTime(isoTime) {
    if (!isoTime) {
      return 'Updated just now';
    }

    const then = new Date(isoTime);
    const now = new Date();
    const deltaSeconds = Math.max(0, Math.round((now.getTime() - then.getTime()) / 1000));

    if (deltaSeconds < 60) {
      return 'Updated just now';
    }

    const minutes = Math.round(deltaSeconds / 60);
    if (minutes < 60) {
      return `Updated ${minutes} min ago`;
    }

    const hours = Math.round(minutes / 60);
    if (hours < 24) {
      return `Updated ${hours} hr ago`;
    }

    const days = Math.round(hours / 24);
    return `Updated ${days} day${days === 1 ? '' : 's'} ago`;
  }

  function applyStatusClass(card, overall) {
    card.classList.remove('status-operational', 'status-degraded', 'status-outage', 'status-unknown');
    card.classList.add(`status-${overall || 'unknown'}`);
  }

  async function hydrateCard(card) {
    const apiPath = card.getAttribute('data-kuma-api') || '/api/kuma-status';
    const statusLink = card.querySelector('[data-kuma-link]');
    const label = card.querySelector('[data-kuma-label]');
    const meta = card.querySelector('[data-kuma-meta]');
    const up = card.querySelector('[data-kuma-up]');
    const down = card.querySelector('[data-kuma-down]');
    const uptime = card.querySelector('[data-kuma-uptime]');

    try {
      const response = await fetch(apiPath, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Request failed (${response.status})`);
      }

      const payload = await response.json();
      const summary = payload.summary || {};
      const overall = payload.overall || 'unknown';

      applyStatusClass(card, overall);
      label.textContent = formatStatus(overall);
      meta.textContent = `${formatRelativeTime(payload.generatedAt)} • ${summary.total || 0} monitors`;
      up.textContent = String(summary.up || 0);
      down.textContent = String((summary.down || 0) + (summary.degraded || 0));
      uptime.textContent = typeof summary.avgUptime === 'number' ? `${summary.avgUptime.toFixed(2)}%` : 'N/A';

      if (payload.statusPageUrl && statusLink) {
        statusLink.href = payload.statusPageUrl;
      }
    } catch (error) {
      applyStatusClass(card, 'unknown');
      label.textContent = STATUS_LABELS.unknown;
      meta.textContent = 'Unable to load live status right now';
      up.textContent = '--';
      down.textContent = '--';
      uptime.textContent = '--';
    } finally {
      card.classList.remove('is-loading');
    }
  }

  function init() {
    const cards = document.querySelectorAll('[data-kuma-card]');
    cards.forEach((card) => {
      hydrateCard(card);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
