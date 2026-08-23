(function () {
  'use strict';

  // Suno's /embed/<id> page is the full Suno web app: ~82 JS chunks and roughly
  // 2.3 MB per iframe. Rendering one per track on page load costs several MB
  // before anyone presses play, so each card starts as a lightweight facade and
  // swaps in the real iframe on click. Loading Suno's own player (rather than
  // playing the CDN mp3 directly) is what keeps play counts registering.
  const EMBED_ORIGIN = 'https://suno.com';
  const IFRAME_ALLOW = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';

  function buildIframe(id, title) {
    const iframe = document.createElement('iframe');
    // autoplay=1 is read by the embed player, so the visitor's click on the
    // facade starts playback instead of only revealing a second play button.
    // If Suno ever drops the parameter the player still loads, just paused.
    iframe.src = EMBED_ORIGIN + '/embed/' + encodeURIComponent(id) + '?autoplay=1';
    iframe.title = 'Suno player: ' + title;
    iframe.allow = IFRAME_ALLOW;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.loading = 'eager';
    return iframe;
  }

  function activate(facade) {
    const id = facade.getAttribute('data-suno-id');
    if (!id) {
      return;
    }

    const card = facade.closest('.home-suno-card');
    if (!card || card.classList.contains('is-loaded')) {
      return;
    }

    const title = facade.getAttribute('data-suno-title') || 'Suno track';
    const iframe = buildIframe(id, title);

    card.classList.add('is-loaded');
    facade.replaceWith(iframe);

    // The button the visitor just activated is gone, so hand focus to the
    // player that replaced it rather than dropping it back to the document.
    iframe.focus({ preventScroll: true });
  }

  function init() {
    const facades = document.querySelectorAll('.home-suno-facade');
    facades.forEach(function (facade) {
      facade.addEventListener('click', function () {
        activate(facade);
      });

      // Warm the connection on intent so the swap feels immediate without
      // paying for the payload unless the visitor actually plays something.
      facade.addEventListener('pointerenter', warmConnection, { once: true });
      facade.addEventListener('focus', warmConnection, { once: true });
    });
  }

  let warmed = false;
  function warmConnection() {
    if (warmed) {
      return;
    }
    warmed = true;

    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = EMBED_ORIGIN;
    document.head.appendChild(link);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
