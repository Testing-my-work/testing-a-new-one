/* C°LB · Orbit · shared behaviour
   Colour fields, header, index menu, search, spec list, content map, reveals,
   kinetic type, magnetic buttons, cursor + light pool, iris page transitions. */
(function () {
  'use strict';
  var d = document, html = d.documentElement, body = d.body;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var RM = html.classList.contains('rm');
  var FINE = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  var store = {
    get: function (k, f) { try { var v = localStorage.getItem(k); return v === null ? f : JSON.parse(v); } catch (e) { return f; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var Orbit = window.Orbit = { $: $, $$: $$, rm: RM, fine: FINE, store: store, clamp: clamp };

  /* ---------- Product data (shared by search, grids, rails) ---------- */
  var dataP = null;
  Orbit.products = function () {
    if (!dataP) {
      dataP = (window.fetch ? fetch('shared/data/products.json').then(function (r) { if (!r.ok) throw 0; return r.json(); }) : Promise.reject())
        .catch(function () { return []; });
    }
    return dataP;
  };

  /* Sample specs, derived deterministically from the catalogue entry (marked "sample" in the UI). */
  function hash(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }
  var CAT = {
    'Downlights': { ip: ['IP20', 'IP44'], beam: [36, 60] }, 'Spotlights': { ip: ['IP20', 'IP44'], beam: [15, 24, 36] },
    'Magnetic Spotlights': { ip: ['IP20'], beam: [15, 24, 36] }, 'Track Lights': { ip: ['IP20'], beam: [15, 24, 36] },
    'Linear Lights': { ip: ['IP20', 'IP44'], beam: [90] }, 'Strip Lights': { ip: ['IP20', 'IP65'], beam: [120] }, 'Panel Lights': { ip: ['IP20'], beam: [110] },
    'Inground Up Lights': { ip: ['IP67'], beam: [10, 24, 36] }, 'Linear Wall Washers': { ip: ['IP65', 'IP67'], beam: [10, 30, 60] },
    'Spike Lights': { ip: ['IP65'], beam: [15, 36] }, 'Bollards': { ip: ['IP65'], beam: [120] }, 'Brick Lights': { ip: ['IP67'], beam: [90] },
    'Flood Lights': { ip: ['IP65', 'IP66'], beam: [24, 60] }, 'Streetlights': { ip: ['IP66'], beam: [140] }, 'Handrail Lights': { ip: ['IP67'], beam: [36, 60] },
    'Neon Flex': { ip: ['IP67'], beam: [120] }, 'Step Lights': { ip: ['IP65'], beam: [90] }, 'Surface Mounted Wall Lights': { ip: ['IP65'], beam: [24, 60] },
    'Industrial': { ip: ['IP65'], beam: [60, 90] }, 'Back of House': { ip: ['IP65'], beam: [120] }
  };
  Orbit.specFor = function (p) {
    var c = CAT[p.category] || { ip: ['IP20'], beam: [36] }, h = hash(p.slug || p.name || 'x');
    var w = null; (p.variants || []).forEach(function (v) { var m = /(\d+)\s*W/.exec(v); if (m && w === null) w = +m[1]; });
    if (w === null) w = [6, 9, 12, 18, 24, 36][h % 6];
    return { ip: c.ip[h % c.ip.length], beams: c.beam, watt: w, lm: Math.round(w * (95 + h % 30) / 10) * 10, cri: h % 3 ? 90 : 95 };
  };

  /* ---------- 1. Colour fields ---------- */
  var TONE = { ink: 'dark', cobalt: 'dark', bone: 'light', paper: 'light', brass: 'light' };
  var THEME = { ink: '#141414', cobalt: '#1F3BFF', bone: '#F1ECE3', paper: '#FAF7F1', brass: '#C08A3E' };
  var fieldEls = $$('[data-field]').filter(function (el) { return el !== html; });
  var metaTheme = $('meta[name="theme-color"]');
  var currentField = null;
  html.classList.add('fields');
  function applyField(f) {
    if (!f || f === currentField) return;
    currentField = f;
    html.setAttribute('data-field', f);
    html.setAttribute('data-tone', TONE[f] || 'light');
    if (metaTheme) metaTheme.setAttribute('content', THEME[f] || '#F1ECE3');
  }
  function pickField() {
    var mid = window.innerHeight * 0.5, chosen = null;
    for (var i = 0; i < fieldEls.length; i++) {
      var r = fieldEls[i].getBoundingClientRect();
      if (r.top <= mid && r.bottom > mid) chosen = fieldEls[i];
    }
    if (!chosen && fieldEls.length) chosen = window.scrollY < 10 ? fieldEls[0] : fieldEls[fieldEls.length - 1];
    if (chosen) applyField(chosen.getAttribute('data-field'));
  }
  Orbit.refreshField = pickField;

  /* ---------- 2. Header ---------- */
  var hdr = $('.hdr'), lastY = window.scrollY, menuOpen = false;
  function onHeader() {
    var y = window.scrollY;
    if (!hdr) return;
    hdr.classList.toggle('is-solid', y > 30);
    if (!menuOpen && y > 420 && y > lastY + 6) hdr.classList.add('is-hidden');
    else if (y < lastY - 6 || y < 420) hdr.classList.remove('is-hidden');
    lastY = y;
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () { ticking = false; pickField(); onHeader(); });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  pickField(); onHeader();

  /* ---------- 3. Index menu (circle wipe from the button) ---------- */
  var menu = $('#index-menu'), menuBtn = $('[data-menu-btn]');
  function trap(e, root) {
    if (e.key !== 'Tab') return;
    var f = $$('a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])', root).filter(function (el) { return el.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && d.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && d.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  function openMenu() {
    if (!menu) return;
    var r = menuBtn.getBoundingClientRect();
    menu.style.setProperty('--mx', (r.left + r.width / 2) + 'px');
    menu.style.setProperty('--my', (r.top + r.height / 2) + 'px');
    menu.hidden = false; void menu.offsetWidth; menu.classList.add('is-open');
    menuBtn.setAttribute('aria-expanded', 'true'); menuOpen = true;
    body.style.overflow = 'hidden';
    setTimeout(function () { var a = $('.menu__main a', menu); if (a) a.focus(); }, 80);
  }
  function closeMenu() {
    if (!menu || menu.hidden) return;
    menu.classList.remove('is-open'); menuBtn.setAttribute('aria-expanded', 'false'); menuOpen = false;
    body.style.overflow = '';
    setTimeout(function () { if (!menu.classList.contains('is-open')) menu.hidden = true; }, RM ? 0 : 750);
    menuBtn.focus();
  }
  if (menu && menuBtn) {
    menuBtn.addEventListener('click', function () { menu.classList.contains('is-open') ? closeMenu() : openMenu(); });
    $('[data-menu-close]', menu).addEventListener('click', closeMenu);
    menu.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); trap(e, menu); });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { if (a.hash && a.pathname === location.pathname) closeMenu(); }); });
  }

  /* ---------- 4. Search ---------- */
  var search = $('#search'), sOpeners = $$('[data-search-open]'), sInput = $('#search-q'), sRes = $('[data-search-results]');
  var PAGES = [
    { name: 'Smart Poles', cat: 'Solution · 20 designs', href: 'solutions.html', k: 'smart pole 5g cctv ev wifi street' },
    { name: 'Media Façade guide', cat: 'Journal · Media Façade', href: 'article.html', k: 'media facade façade pixel led' },
    { name: 'Lighting controls', cat: 'Solution · KNX, DALI, DMX', href: 'index.html#solutions', k: 'knx dali dmx controls scenes' },
    { name: 'Maintenance & upgrades', cat: 'Solution · Service', href: 'journal.html#maintenance', k: 'maintenance audit repair upgrade knx' },
    { name: 'Projects', cat: 'Sample references', href: 'projects.html', k: 'projects hospitality retail residential' },
    { name: 'Catalogue 2026', cat: 'Resource · PDF', href: 'index.html#resources', k: 'catalogue catalog pdf download' },
    { name: 'Showroom, Hitteen', cat: 'Contact', href: 'contact.html#showroom', k: 'showroom riyadh contact visit' }
  ];
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  Orbit.esc = esc;
  function runSearch() {
    var q = sInput.value.trim().toLowerCase();
    Orbit.products().then(function (list) {
      if (!q) { sRes.innerHTML = ''; return; }
      var out = PAGES.filter(function (p) { return (p.name + ' ' + p.k).toLowerCase().indexOf(q) > -1; }).map(function (p) {
        return '<li><a href="' + p.href + '"><span class="ph" style="background:var(--cobalt)"></span><span><b>' + esc(p.name) + '</b><small>' + esc(p.cat) + '</small></span></a></li>';
      });
      var ipq = q.replace(/\s/g, '');
      list.filter(function (p) {
        var hay = (p.name + ' ' + p.category + ' ' + p.group).toLowerCase();
        if (/^ip\d\d$/.test(ipq)) return Orbit.specFor && Orbit.specFor(p).ip.toLowerCase() === ipq;
        return hay.indexOf(q) > -1;
      }).slice(0, 24).forEach(function (p) {
        var img = p.image ? '<img src="' + p.image + '" alt="" loading="lazy">' : '<span class="ph" style="background:var(--bone);border:2px solid var(--ink)"></span>';
        out.push('<li><a href="product.html?p=' + encodeURIComponent(p.slug) + '">' + img + '<span><b>' + esc(p.name) + '</b><small>' + esc(p.group + ' · ' + p.category) + '</small></span></a></li>');
      });
      sRes.innerHTML = out.length ? out.join('') : '<li class="mono small">No match. Try a category such as “downlight” or “bollard”.</li>';
    });
  }
  function openSearch() { if (!search) return; search.hidden = false; body.style.overflow = 'hidden'; setTimeout(function () { sInput.focus(); }, 30); Orbit.products(); }
  function closeSearch() { if (!search) return; search.hidden = true; body.style.overflow = ''; if (sOpeners[0]) sOpeners[0].focus(); }
  sOpeners.forEach(function (b) { b.addEventListener('click', openSearch); });
  if (search) {
    $('[data-search-close]', search).addEventListener('click', closeSearch);
    search.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSearch(); trap(e, search); });
    var st; sInput.addEventListener('input', function () { clearTimeout(st); st = setTimeout(runSearch, 120); });
  }
  d.addEventListener('keydown', function (e) {
    if (e.key === '/' && !/input|textarea|select/i.test((e.target.tagName || '')) && search && search.hidden) { e.preventDefault(); openSearch(); }
  });

  /* ---------- 5. Toast ---------- */
  var toastEl = $('.toast'), toastT;
  Orbit.toast = function (msg) {
    if (!toastEl) return;
    $('[data-toast-msg]', toastEl).textContent = msg;
    toastEl.classList.add('show'); clearTimeout(toastT);
    toastT = setTimeout(function () { toastEl.classList.remove('show'); }, 3200);
  };

  /* ---------- 6. Spec list (localStorage) ---------- */
  var SPEC_KEY = 'orbit-spec';
  Orbit.spec = {
    all: function () { return store.get(SPEC_KEY, []); },
    has: function (slug) { return this.all().some(function (i) { return i.slug === slug; }); },
    toggle: function (item) {
      var list = this.all(), i = -1;
      list.forEach(function (x, k) { if (x.slug === item.slug) i = k; });
      if (i > -1) list.splice(i, 1); else list.push(item);
      store.set(SPEC_KEY, list); syncSpec();
      return i === -1;
    },
    remove: function (slug) { store.set(SPEC_KEY, this.all().filter(function (x) { return x.slug !== slug; })); syncSpec(); }
  };
  function syncSpec(bump) {
    var list = Orbit.spec.all();
    $$('[data-spec-count]').forEach(function (c) {
      c.textContent = list.length;
      if (bump) { c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); }
    });
    $$('[data-spec-add]').forEach(function (b) {
      var on = list.some(function (x) { return x.slug === b.getAttribute('data-slug'); });
      b.setAttribute('aria-pressed', String(on));
      var l = $('[data-spec-label]', b); if (l) l.textContent = on ? (b.getAttribute('data-on') || 'In spec list') : (b.getAttribute('data-off') || 'Add to spec list');
    });
    if (Orbit.onSpec) Orbit.onSpec(list);
  }
  Orbit.syncSpec = syncSpec;
  d.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-spec-add]');
    if (!b) return;
    e.preventDefault();
    var added = Orbit.spec.toggle({ slug: b.getAttribute('data-slug'), name: b.getAttribute('data-name'), img: b.getAttribute('data-img') || '', cat: b.getAttribute('data-cat') || '' });
    syncSpec(true);
    Orbit.toast(added ? b.getAttribute('data-name') + ' added to your spec list' : b.getAttribute('data-name') + ' removed');
  });
  syncSpec();

  /* ---------- 7. Content map ---------- */
  var cmBtn = $('.cm-fab'), cmBuilt = false;
  function buildTags() {
    if (cmBuilt) return;
    $$('[data-content]').forEach(function (el) {
      var text = el.getAttribute('data-content'), tag = d.createElement('span');
      tag.className = 'cm-tag'; tag.setAttribute('aria-hidden', 'true');
      var i = text.indexOf(':');
      if (i > 0) { var b = d.createElement('b'); b.textContent = text.slice(0, i); tag.appendChild(b); tag.appendChild(d.createTextNode(text.slice(i + 1).trim())); }
      else tag.textContent = text;
      el.insertBefore(tag, el.firstChild);
    });
    cmBuilt = true;
  }
  function setCM(on) {
    if (on) buildTags();
    body.classList.toggle('cm-on', on);
    if (cmBtn) { cmBtn.setAttribute('aria-pressed', String(on)); $('.cm-fab__n', cmBtn).textContent = on ? $$('[data-content]').length + ' slots' : ''; }
    store.set('orbit-cm', on);
  }
  if (cmBtn) {
    cmBtn.addEventListener('click', function () { setCM(cmBtn.getAttribute('aria-pressed') !== 'true'); });
    if (store.get('orbit-cm', false)) setCM(true);
  }

  /* ---------- 8. Reveals + count-up ---------- */
  function countUp(el) {
    var to = parseFloat(el.getAttribute('data-count')), t0 = null, dur = 1600;
    if (RM || isNaN(to)) return;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(to * e);
      if (p < 1) requestAnimationFrame(step);
    }
    el.textContent = '0'; requestAnimationFrame(step);
  }
  var revealEls = $$('.rv, .rv-pop, .lines');
  var countEls = $$('[data-count]');
  if ('IntersectionObserver' in window && !RM) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        if (el.hasAttribute('data-count')) countUp(el); else el.classList.add('in');
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revealEls.concat(countEls).forEach(function (el) { io.observe(el); });
    // Safety: anything already above the fold after 2.5s gets revealed even if IO is starved.
    setTimeout(function () { revealEls.forEach(function (el) { if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('in'); }); }, 2500);
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- 9. Kinetic type: light thins the letters it touches ---------- */
  var kinEls = $$('[data-kin]');
  kinEls.forEach(function (el) {
    var text = el.textContent;
    el.textContent = '';
    var sr = d.createElement('span'); sr.className = 'sr-only'; sr.textContent = text;
    var vis = d.createElement('span'); vis.className = 'kin'; vis.setAttribute('aria-hidden', 'true');
    text.split('').forEach(function (ch) {
      var s = d.createElement('span');
      if (ch === ' ') { s.className = 'kin__sp'; } else { s.className = 'kin__l'; s.textContent = ch; }
      vis.appendChild(s);
    });
    el.appendChild(sr); el.appendChild(vis);
  });
  var kinLetters = $$('.kin__l');
  Orbit.kinLetters = kinLetters;
  var px = -9999, py = -9999, kinRaf = null;
  function kinFrame() {
    kinRaf = null;
    var vh = window.innerHeight;
    for (var i = 0; i < kinLetters.length; i++) {
      var l = kinLetters[i], r = l.getBoundingClientRect();
      if (r.bottom < -50 || r.top > vh + 50) continue;
      var dx = px - (r.left + r.width / 2), dy = py - (r.top + r.height / 2);
      var t = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / 360);
      t = t * t * (3 - 2 * t);
      l.style.setProperty('--w', Math.round(700 - t * 480));
      l.style.setProperty('--x', Math.round(82 + t * 18));
    }
  }
  if (FINE && !RM && kinLetters.length) {
    window.addEventListener('pointermove', function (e) { px = e.clientX; py = e.clientY; if (!kinRaf) kinRaf = requestAnimationFrame(kinFrame); }, { passive: true });
    window.addEventListener('scroll', function () { if (!kinRaf) kinRaf = requestAnimationFrame(kinFrame); }, { passive: true });
  }

  /* ---------- 10. Buttons: hover origin + magnetic pull ---------- */
  d.addEventListener('pointermove', function (e) {
    var b = e.target.closest && e.target.closest('.btn');
    if (!b) return;
    var r = b.getBoundingClientRect();
    b.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
    b.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
  }, { passive: true });
  if (FINE && !RM) {
    $$('[data-magnetic]').forEach(function (el) {
      var strength = el.classList.contains('btn-orb') ? 0.35 : 0.25;
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
        el.style.transition = 'transform .25s cubic-bezier(.16,1,.3,1), background-color .35s, color .35s, border-color .35s';
        el.style.transform = 'translate(' + (x * strength) + 'px,' + (y * strength) + 'px)';
      });
      el.addEventListener('pointerleave', function () {
        el.style.transition = 'transform .8s cubic-bezier(.34,1.56,.64,1), background-color .35s, color .35s, border-color .35s';
        el.style.transform = '';
      });
    });
  }

  /* ---------- 11. Cursor ring + light pool ---------- */
  var cur = $('.cursor'), ring = cur && $('.cursor__ring', cur), lab = cur && $('.cursor__label', cur), pool = $('.pool');
  if (FINE && !RM && cur) {
    var cx = -100, cy = -100, rx = -100, ry = -100, plx = -600, ply = -600, moving = false;
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      cx = e.clientX; cy = e.clientY;
      if (!moving) { moving = true; rx = cx; ry = cy; plx = cx; ply = cy; cur.classList.remove('is-off'); cur.classList.add('is-live'); if (pool) pool.classList.add('on'); requestAnimationFrame(loop); }
    }, { passive: true });
    d.addEventListener('pointerleave', function () { cur.classList.add('is-off'); if (pool) pool.classList.remove('on'); });
    d.documentElement.addEventListener('mouseleave', function () { cur.classList.add('is-off'); if (pool) pool.classList.remove('on'); });
    d.documentElement.addEventListener('mouseenter', function () { cur.classList.remove('is-off'); if (pool) pool.classList.add('on'); });
    window.addEventListener('pointerdown', function () { cur.classList.add('is-down'); });
    window.addEventListener('pointerup', function () { cur.classList.remove('is-down'); });
    d.addEventListener('pointerover', function (e) {
      var t = e.target.closest && e.target.closest('a, button, [role="slider"], [role="radio"], input, select, textarea, label, [data-cursor], .dial__face');
      var labelled = t && t.getAttribute('data-cursor');
      cur.classList.toggle('is-hover', !!t && !labelled);
      cur.classList.toggle('is-label', !!labelled);
      if (labelled) lab.textContent = labelled;
    });
    function loop() {
      rx += (cx - rx) * 0.22; ry += (cy - ry) * 0.22;
      plx += (cx - plx) * 0.08; ply += (cy - ply) * 0.08;
      cur.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0)';
      if (pool) pool.style.transform = 'translate3d(' + plx + 'px,' + ply + 'px,0)';
      requestAnimationFrame(loop);
    }
  }

  /* ---------- 12. Iris page transition (fails open: plain links without JS) ---------- */
  function isInternal(a) {
    if (!a || !a.href || a.target && a.target !== '_self' || a.hasAttribute('download')) return false;
    if (a.origin !== location.origin && location.protocol !== 'file:') return false;
    if (a.protocol !== location.protocol) return false;
    if (!/\.html?$|\/$/.test(a.pathname)) return false;
    if (a.pathname === location.pathname && a.search === location.search) return false; // same-page hash link
    return true;
  }
  if (!RM) {
    d.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest && e.target.closest('a[href]');
      if (!isInternal(a) || a.hasAttribute('data-no-iris')) return;
      e.preventDefault();
      var x = e.clientX || window.innerWidth / 2, y = e.clientY || window.innerHeight / 2;
      if (!e.clientX && !e.clientY) { var r = a.getBoundingClientRect(); x = r.left + r.width / 2; y = r.top + r.height / 2; }
      var xp = (x / window.innerWidth * 100).toFixed(2), yp = (y / window.innerHeight * 100).toFixed(2);
      try { sessionStorage.setItem('orbit-iris', JSON.stringify({ x: xp, y: yp, t: Date.now() })); } catch (err) {}
      var iris = d.createElement('div'); iris.className = 'iris'; iris.setAttribute('aria-hidden', 'true');
      iris.style.setProperty('--ix', xp + '%'); iris.style.setProperty('--iy', yp + '%');
      body.appendChild(iris); void iris.offsetWidth; iris.classList.add('go');
      var href = a.href;
      setTimeout(function () { location.href = href; }, 580);
    });
    window.addEventListener('pageshow', function (e) { if (e.persisted) $$('.iris').forEach(function (i) { i.remove(); }); });
  }
  setTimeout(function () { html.classList.remove('iris-in'); }, 1200);

  /* ---------- 13. Newsletter + generic forms ---------- */
  $$('[data-newsletter]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var i = $('input', f);
      if (!i.value || i.value.indexOf('@') < 1) { i.focus(); i.setAttribute('aria-invalid', 'true'); return; }
      i.removeAttribute('aria-invalid'); f.classList.add('is-done'); i.value = ''; i.placeholder = 'Thank you, see you next month';
      Orbit.toast('Subscribed to the C°LB Journal');
    });
  });
})();
