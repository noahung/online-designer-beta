/**
 * Designer Form Embed SDK
 * Lightweight loader for embedding forms on any website.
 * Supports: inline, popup, and full-page modes.
 * Usage: <div data-designer-form="FORM_ID" data-mode="inline"></div>
 *        <script src="https://designer.advertomedia.co.uk/embed.js" async></script>
 */
;(function (window, document) {
  'use strict';

  var BASE_URL = (function () {
    // Auto-detect the script's own origin so self-hosted setups work too
    var scripts = document.querySelectorAll('script[src*="embed.js"]');
    if (scripts.length > 0) {
      try {
        var url = new URL(scripts[scripts.length - 1].src);
        return url.origin;
      } catch (e) { /* ignore */ }
    }
    return 'https://designer.advertomedia.co.uk';
  })();

  // ─── Utilities ─────────────────────────────────────────────────────────────

  function uid() {
    return 'df-' + Math.random().toString(36).slice(2, 9);
  }

  function getFormUrl(formId) {
    return BASE_URL + '/form/' + formId;
  }

  function applyContainerReset(el) {
    // Strict CSS reset so host-page styles don't bleed in
    el.style.cssText += [
      'all:initial',
      'display:block',
      'margin:0',
      'padding:0',
      'border:0',
      'font:inherit',
      'box-sizing:border-box'
    ].join(';');
  }

  function createIframe(formId, opts) {
    var iframe = document.createElement('iframe');
    iframe.src = getFormUrl(formId);
    iframe.title = opts.title || 'Form';
    iframe.id = 'designer-iframe-' + formId + '-' + uid();
    iframe.setAttribute('data-designer-id', formId);
    iframe.setAttribute('allow', 'camera; microphone; geolocation');
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('scrolling', 'no');
    if (opts.lazy) iframe.setAttribute('loading', 'lazy');

    var transparent = opts.transparent === 'true' || opts.transparent === true;

    iframe.style.cssText = [
      'width:100%',
      'border:none',
      'display:block',
      'overflow:hidden',
      transparent ? 'background:transparent' : 'background:#fff',
      'transition:height 0.2s ease'
    ].join(';');

    return iframe;
  }

  // ─── Registry of active embeds ─────────────────────────────────────────────

  var registry = {}; // formId -> array of { iframe, popup, mode }

  function register(formId, entry) {
    if (!registry[formId]) registry[formId] = [];
    registry[formId].push(entry);
  }

  // ─── Inline / Standard embed ───────────────────────────────────────────────

  function initInline(el) {
    var formId = el.getAttribute('data-designer-form');
    if (!formId) return;

    var opts = {
      title: el.getAttribute('data-title') || 'Form',
      lazy: el.getAttribute('data-lazy') !== 'false',
      transparent: el.getAttribute('data-transparent') || 'false',
      width: el.getAttribute('data-width') || '100%',
      minHeight: el.getAttribute('data-min-height') || '400'
    };

    var wrapper = document.createElement('div');
    applyContainerReset(wrapper);
    wrapper.style.width = opts.width;
    wrapper.style.maxWidth = el.getAttribute('data-max-width') || '100%';

    var iframe = createIframe(formId, opts);
    iframe.style.minHeight = opts.minHeight + 'px';
    iframe.style.height = opts.minHeight + 'px';

    wrapper.appendChild(iframe);

    // Replace the placeholder element
    el.parentNode.replaceChild(wrapper, el);

    register(formId, { iframe: iframe, mode: 'inline' });
  }

  // ─── Popup / Lightbox embed ────────────────────────────────────────────────

  var activePopup = null;

  function buildPopupOverlay(formId, opts) {
    // Overlay backdrop
    var overlay = document.createElement('div');
    overlay.id = 'designer-overlay-' + formId;
    overlay.setAttribute('data-designer-overlay', formId);
    overlay.style.cssText = [
      'all:initial',
      'position:fixed',
      'inset:0',
      'z-index:2147483647',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'background:rgba(0,0,0,0.6)',
      'backdrop-filter:blur(4px)',
      'opacity:0',
      'transition:opacity 0.25s ease',
      'box-sizing:border-box',
      'padding:20px'
    ].join(';');

    // Modal box
    var modal = document.createElement('div');
    modal.style.cssText = [
      'all:initial',
      'position:relative',
      'width:100%',
      'max-width:' + (opts.popupWidth || '680px'),
      'max-height:90vh',
      'border-radius:12px',
      'overflow:hidden',
      'box-shadow:0 25px 60px rgba(0,0,0,0.4)',
      'background:#fff',
      'display:flex',
      'flex-direction:column',
      'transform:translateY(20px) scale(0.97)',
      'transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
      'box-sizing:border-box'
    ].join(';');

    // Close button
    var closeBtn = document.createElement('button');
    closeBtn.setAttribute('aria-label', 'Close form');
    closeBtn.style.cssText = [
      'all:initial',
      'position:absolute',
      'top:12px',
      'right:12px',
      'z-index:10',
      'width:32px',
      'height:32px',
      'border-radius:50%',
      'background:rgba(0,0,0,0.15)',
      'border:none',
      'cursor:pointer',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'font-size:18px',
      'line-height:1',
      'color:#fff',
      'transition:background 0.15s',
      'font-family:sans-serif'
    ].join(';');
    closeBtn.textContent = '×';
    closeBtn.onmouseover = function () { closeBtn.style.background = 'rgba(0,0,0,0.4)'; };
    closeBtn.onmouseout = function () { closeBtn.style.background = 'rgba(0,0,0,0.15)'; };
    closeBtn.onclick = function () { closePopup(formId); };

    var iframe = createIframe(formId, opts);
    iframe.style.height = '500px';
    iframe.style.minHeight = '300px';
    iframe.style.flexShrink = '0';

    modal.appendChild(closeBtn);
    modal.appendChild(iframe);
    overlay.appendChild(modal);

    // Click outside to close
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closePopup(formId);
    });

    // Escape key
    var escHandler = function (e) {
      if (e.key === 'Escape') closePopup(formId);
    };
    document.addEventListener('keydown', escHandler);
    overlay._escHandler = escHandler;

    return { overlay: overlay, iframe: iframe };
  }

  function openPopup(formId) {
    if (activePopup && activePopup.formId === formId) return;
    if (activePopup) closePopup(activePopup.formId);

    var entries = registry[formId];
    if (!entries) return;
    var entry = entries.find(function (e) { return e.mode === 'popup'; });
    if (!entry) return;

    document.body.appendChild(entry.overlay);
    // Disable body scroll
    document.body.style.overflow = 'hidden';

    // Animate in (next tick so CSS transition fires)
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        entry.overlay.style.opacity = '1';
        var modal = entry.overlay.firstChild.nextSibling || entry.overlay.querySelector('div');
        // The modal is the second child (after we build it as above, it is the first child)
        var modalEl = entry.overlay.children[0];
        if (modalEl) {
          modalEl.style.transform = 'translateY(0) scale(1)';
        }
      });
    });

    activePopup = { formId: formId };
  }

  function closePopup(formId) {
    var entries = registry[formId];
    if (!entries) return;
    var entry = entries.find(function (e) { return e.mode === 'popup'; });
    if (!entry || !entry.overlay.parentNode) return;

    entry.overlay.style.opacity = '0';
    var modalEl = entry.overlay.children[0];
    if (modalEl) {
      modalEl.style.transform = 'translateY(20px) scale(0.97)';
    }

    setTimeout(function () {
      if (entry.overlay.parentNode) {
        entry.overlay.parentNode.removeChild(entry.overlay);
        if (entry.overlay._escHandler) {
          document.removeEventListener('keydown', entry.overlay._escHandler);
        }
      }
      document.body.style.overflow = '';
    }, 300);

    activePopup = null;
  }

  function initPopup(el) {
    var formId = el.getAttribute('data-designer-form');
    if (!formId) return;

    var opts = {
      title: el.getAttribute('data-title') || 'Form',
      lazy: el.getAttribute('data-lazy') !== 'false',
      transparent: el.getAttribute('data-transparent') || 'false',
      popupWidth: el.getAttribute('data-popup-width') || '680px',
      trigger: el.getAttribute('data-trigger') || 'click',
      delay: parseInt(el.getAttribute('data-delay') || '0', 10),
      buttonText: el.getAttribute('data-button-text') || 'Open Form',
      buttonColor: el.getAttribute('data-button-color') || '#3B82F6',
      buttonTextColor: el.getAttribute('data-button-text-color') || '#ffffff',
      buttonRadius: el.getAttribute('data-button-radius') || '8px'
    };

    var result = buildPopupOverlay(formId, opts);

    // The trigger element: can be the div itself turned into a button,
    // or we wire up an existing element via data-trigger-el="#myBtn"
    var triggerEl = null;
    var triggerSelector = el.getAttribute('data-trigger-el');
    if (triggerSelector) {
      triggerEl = document.querySelector(triggerSelector);
    }

    if (opts.trigger === 'click') {
      if (!triggerEl) {
        // Create a button in place of the div
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = opts.buttonText;
        btn.style.cssText = [
          'all:initial',
          'display:inline-flex',
          'align-items:center',
          'justify-content:center',
          'padding:12px 24px',
          'background:' + opts.buttonColor,
          'color:' + opts.buttonTextColor,
          'border:none',
          'border-radius:' + opts.buttonRadius,
          'font-size:16px',
          'font-weight:600',
          'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
          'cursor:pointer',
          'transition:opacity 0.15s,transform 0.15s',
          'box-sizing:border-box'
        ].join(';');
        btn.onmouseover = function () { btn.style.opacity = '0.9'; btn.style.transform = 'scale(1.02)'; };
        btn.onmouseout = function () { btn.style.opacity = '1'; btn.style.transform = 'scale(1)'; };
        btn.onclick = function () { openPopup(formId); };
        el.parentNode.replaceChild(btn, el);
      } else {
        triggerEl.addEventListener('click', function () { openPopup(formId); });
        el.parentNode.removeChild(el);
      }
    } else if (opts.trigger === 'exit') {
      el.parentNode.removeChild(el);
      document.addEventListener('mouseleave', function handler(e) {
        if (e.clientY < 10) {
          openPopup(formId);
          document.removeEventListener('mouseleave', handler);
        }
      });
    } else if (opts.trigger === 'delay') {
      el.parentNode.removeChild(el);
      setTimeout(function () { openPopup(formId); }, opts.delay * 1000);
    }

    register(formId, { mode: 'popup', overlay: result.overlay, iframe: result.iframe });
  }

  // ─── Full-page embed ───────────────────────────────────────────────────────

  function initFullpage(el) {
    var formId = el.getAttribute('data-designer-form');
    if (!formId) return;

    var opts = {
      title: el.getAttribute('data-title') || 'Form',
      transparent: el.getAttribute('data-transparent') || 'false'
    };

    var iframe = createIframe(formId, opts);
    iframe.style.cssText += [
      ';position:fixed',
      'inset:0',
      'width:100%',
      'height:100%',
      'z-index:2147483646'
    ].join(';');

    document.body.appendChild(iframe);
    el.parentNode.removeChild(el);

    register(formId, { iframe: iframe, mode: 'fullpage' });
  }

  // ─── postMessage handler ───────────────────────────────────────────────────

  window.addEventListener('message', function (event) {
    var data = event.data;
    if (!data || typeof data !== 'object') return;

    // Height auto-resize
    if (data.type === 'designerFormHeight' && data.height) {
      Object.keys(registry).forEach(function (formId) {
        registry[formId].forEach(function (entry) {
          if (entry.iframe && entry.iframe.contentWindow === event.source) {
            var h = Math.max(parseInt(data.height, 10), 200);
            entry.iframe.style.height = h + 'px';
          }
        });
      });
    }

    // Form submitted → close popup or redirect
    if (data.type === 'designerFormSubmitted') {
      var fid = data.formId;
      if (fid && registry[fid]) {
        registry[fid].forEach(function (entry) {
          if (entry.mode === 'popup') closePopup(fid);
        });
      }
      // Generic fallback – find by source
      Object.keys(registry).forEach(function (formId) {
        registry[formId].forEach(function (entry) {
          if (entry.iframe && entry.iframe.contentWindow === event.source) {
            if (entry.mode === 'popup') closePopup(formId);
          }
        });
      });
    }

    // Redirect parent
    if (data.type === 'designerFormRedirect' && data.url) {
      try {
        var target = new URL(data.url);
        // Only allow http/https redirects
        if (target.protocol === 'http:' || target.protocol === 'https:') {
          window.location.href = data.url;
        }
      } catch (e) { /* invalid URL, ignore */ }
    }
  }, false);

  // ─── Boot ──────────────────────────────────────────────────────────────────

  function boot() {
    var elements = document.querySelectorAll('[data-designer-form]');
    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      var mode = el.getAttribute('data-mode') || 'inline';
      if (mode === 'popup') {
        initPopup(el);
      } else if (mode === 'fullpage') {
        initFullpage(el);
      } else {
        initInline(el);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})(window, document);
