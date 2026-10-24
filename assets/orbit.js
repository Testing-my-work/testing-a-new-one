/* C°LB · Orbit · interactive modules
   Each module checks for its own markup, so one file serves every page. */
(function () {
  'use strict';
  var O = window.Orbit; if (!O) return;
  var d = document, $ = O.$, $$ = O.$$, clamp = O.clamp, RM = O.rm;
  var SVGNS = 'http://www.w3.org/2000/svg';
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var seg = function (p, a, b) { return clamp((p - a) / (b - a), 0, 1); };
  var ease = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };
  var IMG = 'shared/img/products/';
  function onFrame(fn) { var q = false; return function () { if (q) return; q = true; requestAnimationFrame(function () { q = false; fn(); }); }; }
  function el(tag, attrs, parent) { var n = d.createElementNS(SVGNS, tag); for (var k in attrs) n.setAttribute(k, attrs[k]); if (parent) parent.appendChild(n); return n; }

  /* =====================================================================
     1. HERO · the ring that becomes a beam, a pool of light, then a dot
     ===================================================================== */
  (function hero() {
    var sec = $('[data-hero]'); if (!sec) return;
    var stage = $('.hero__stage', sec), ap = $('[data-ap]', sec), img = $('.ap__img', ap), face = $('.ap__face', ap);
    var bladesSvg = $('.ap__blades', ap), ringTxt = $('.ap__text', ap);
    var l1 = $('.hero__l1', sec), l2 = $('.hero__l2', sec), meta = $('.hero__meta', sec), read = $('[data-hero-read]', sec), scrollHint = $('.hero__scroll', sec);
    var capB = $('.hero__cap--b', sec), capC = $('.hero__cap--c', sec), capD = $('.hero__cap--d', sec);
    var fx = $('[data-beamfx]', sec);

    /* --- iris blades: N half-planes pivoting on the rim (see notes in style.css) --- */
    var N = 9, R = 100, blades = [];
    if (!RM) {
      for (var i = 0; i < N; i++) {
        var g = el('g', {}, bladesSvg);
        el('rect', { class: 'blade', x: 0, y: -320, width: 420, height: 640 }, g);
        blades.push(g);
      }
    }
    function setIris(dd) {
      var beta = Math.acos(clamp(dd / R, 0, 1)) * 180 / Math.PI;
      for (var k = 0; k < blades.length; k++) {
        var theta = k * 360 / N;
        blades[k].setAttribute('transform', 'rotate(' + (theta - beta).toFixed(2) + ') translate(' + dd.toFixed(2) + ' 0)');
      }
    }
    if (RM) { bladesSvg.style.display = 'none'; return; }
    setIris(0);
    var irisStart = null, irisDone = false;
    function irisStep(t) {
      if (!irisStart) irisStart = t;
      var k = clamp((t - irisStart - 350) / 1700, 0, 1);
      setIris(ease(k) * 106);
      if (k < 1) requestAnimationFrame(irisStep); else { irisDone = true; bladesSvg.style.display = 'none'; }
    }
    function startIris() { requestAnimationFrame(irisStep); }
    if (img.complete) startIris(); else { img.addEventListener('load', startIris, { once: true }); setTimeout(function () { if (!irisStart) startIris(); }, 1500); }

    /* --- beam fx elements --- */
    var cone = $('.beamfx__cone', fx), pool = $('.beamfx__pool', fx), floor = $('.beamfx__floor', fx), dims = $('.beamfx__dims', fx);
    var dim = $('.beamfx__dim', fx), tA = $('.beamfx__tick.a', fx), tB = $('.beamfx__tick.b', fx), dimL = $('.beamfx__label', fx);
    var arc = $('.beamfx__arc', fx), angT = $('.beamfx__angle', fx), dot = $('.beamfx__dot', fx);

    var W, H, D, mobile, top0, span;
    var kin1 = $$('.kin__l', l1), kin2 = $$('.kin__l', l2);
    function measure() {
      W = stage.clientWidth; H = stage.clientHeight; D = ap.offsetWidth; mobile = W < 761;
      fx.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      var r = sec.getBoundingClientRect();
      top0 = r.top + window.scrollY; span = Math.max(1, sec.offsetHeight - H);
    }
    function setLine(n, x1, y1, x2, y2) { n.setAttribute('x1', x1); n.setAttribute('y1', y1); n.setAttribute('x2', x2); n.setAttribute('y2', y2); }
    var lastField = 'bone', lastRead = '';
    function frame() {
      var p = clamp((window.scrollY - top0) / span, 0, 1);
      // --- disc position/scale through the phases
      var c0x = mobile ? W * .5 : W - Math.max(16, Math.min(64, W * .04)) - D * .46, c0y = mobile ? H * .53 : H * .52;
      var s1 = Math.min(mobile ? 1.12 : 1.32, (Math.min(W, H) * .9) / D);
      var lumD = clamp(Math.min(W, H) * .1, 60, 104), sL = lumD / D;
      var lx = W * .5, ly = mobile ? H * .2 : H * .17;
      var a = ease(seg(p, 0, .2)), b = ease(seg(p, .22, .4));
      var cx = lerp(lerp(c0x, W * .5, a), lx, b);
      var cy = lerp(lerp(c0y, H * .5, a), ly, b);
      var sc = lerp(lerp(1, s1, a), sL, b);
      var off = ease(seg(p, .74, .84));
      ap.style.transform = 'translate3d(' + (cx - D / 2).toFixed(1) + 'px,' + (cy - D / 2).toFixed(1) + 'px,0) scale(' + sc.toFixed(4) + ')';
      ap.style.opacity = (1 - off).toFixed(3);
      ap.style.setProperty('--iz', (1.22 - .22 * a).toFixed(3));
      ap.style.setProperty('--face', seg(p, .24, .34).toFixed(3));
      ap.style.setProperty('--txt', (1 - seg(p, .12, .26)).toFixed(3));
      ap.style.setProperty('--tr', (p * 300).toFixed(1) + 'deg');

      // --- headline drifts apart and leaves
      var h = ease(seg(p, 0, .24));
      l1.style.transform = 'translate3d(' + (-h * W * .35).toFixed(1) + 'px,' + (-h * H * .12).toFixed(1) + 'px,0)';
      l2.style.transform = 'translate3d(' + (h * W * .35).toFixed(1) + 'px,' + (h * H * .14).toFixed(1) + 'px,0)';
      l1.style.opacity = l2.style.opacity = (1 - seg(p, .1, .24)).toFixed(3);
      meta.style.opacity = (1 - seg(p, 0, .1)).toFixed(3);
      meta.style.visibility = p > .12 ? 'hidden' : '';
      meta.style.transform = 'translateY(' + (seg(p, 0, .12) * 30).toFixed(1) + 'px)';
      if (scrollHint) scrollHint.style.opacity = (1 - seg(p, 0, .05)).toFixed(3);
      if (!O.fine) {
        kin1.concat(kin2).forEach(function (l, k) { l.style.setProperty('--w', Math.round(700 - Math.max(0, Math.sin(p * 9 + k * .5)) * 420 * (1 - h))); });
      }

      // --- the beam
      var floorY = mobile ? H * .76 : H * .8;
      var apexY = cy + (lumD / 2) * .7;
      var grow = seg(p, .3, .46), widen = ease(seg(p, .46, .62));
      var half = (lerp(0, 17, easeOut(grow)) + widen * 13) * Math.PI / 180;
      var beamOn = seg(p, .3, .36) * (1 - seg(p, .7, .8));
      var rx = (floorY - apexY) * Math.tan(half);
      cone.setAttribute('points', lx + ',' + apexY.toFixed(1) + ' ' + (lx - rx).toFixed(1) + ',' + floorY.toFixed(1) + ' ' + (lx + rx).toFixed(1) + ',' + floorY.toFixed(1));
      cone.style.opacity = beamOn.toFixed(3);
      setLine(floor, W * .04, floorY, W * .96, floorY);
      floor.style.opacity = (seg(p, .3, .4) * (1 - seg(p, .72, .82)) * .9).toFixed(3);

      // pool → circle → dot
      var shrink = ease(seg(p, .72, .9));
      var dotR = 13;
      var prx = lerp(rx * 1.05, dotR, shrink), pry = lerp(Math.max(6, rx * .17), dotR, shrink);
      var pcy = lerp(floorY, H, shrink);
      pool.setAttribute('cx', lx); pool.setAttribute('cy', pcy.toFixed(1)); pool.setAttribute('rx', Math.max(0, prx).toFixed(1)); pool.setAttribute('ry', Math.max(0, pry).toFixed(1));
      pool.style.opacity = (seg(p, .36, .46) * (1 - seg(p, .84, .9))).toFixed(3);
      dot.setAttribute('cx', lx); dot.setAttribute('cy', pcy.toFixed(1));
      dot.setAttribute('r', p > .8 ? (Math.min(dotR, prx) * seg(p, .8, .88)).toFixed(2) : 0);

      // dimensions (act 3)
      var dimOn = seg(p, .5, .56) * (1 - seg(p, .68, .74));
      dims.style.opacity = dimOn.toFixed(3);
      var dy = floorY + 34;
      setLine(dim, lx - rx, dy, lx + rx, dy); setLine(tA, lx - rx, dy - 9, lx - rx, dy + 9); setLine(tB, lx + rx, dy - 9, lx + rx, dy + 9);
      dimL.setAttribute('x', lx); dimL.setAttribute('y', dy + 30);
      var deg = Math.round(half * 360 / Math.PI);
      dimL.textContent = 'Pool Ø ' + (2 * 4 * Math.tan(half)).toFixed(1) + ' m from 4 m';
      var ar = Math.min(110, (floorY - apexY) * .38);
      arc.setAttribute('d', 'M' + (lx - ar * Math.sin(half)).toFixed(1) + ' ' + (apexY + ar * Math.cos(half)).toFixed(1) + ' A ' + ar + ' ' + ar + ' 0 0 0 ' + (lx + ar * Math.sin(half)).toFixed(1) + ' ' + (apexY + ar * Math.cos(half)).toFixed(1));
      angT.setAttribute('x', lx); angT.setAttribute('y', (apexY + ar + 36).toFixed(1)); angT.textContent = deg + '°';

      // captions
      var cb = seg(p, .3, .36) * (1 - seg(p, .46, .52)), cc = seg(p, .52, .58) * (1 - seg(p, .7, .76));
      capB.style.opacity = cb.toFixed(3); capB.style.transform = (mobile ? '' : 'translateY(-50%) ') + 'translateY(' + ((1 - cb) * 30).toFixed(1) + 'px)';
      capC.style.opacity = cc.toFixed(3); capC.style.transform = (mobile ? '' : 'translateY(-50%) ') + 'translateY(' + ((1 - cc) * 30).toFixed(1) + 'px)';
      var cd = ease(seg(p, .8, .9));
      capD.style.opacity = cd.toFixed(3); capD.style.transform = 'translateY(-50%) scale(' + (.86 + cd * .14).toFixed(3) + ')';

      // readout + field colour
      var txt = !irisDone && p < .02 ? 'Aperture opening' : p < .24 ? 'Aperture f/1.4 · Ø ' + Math.round(86 + a * 40) + ' mm' : p < .46 ? 'Downlight · Ø 86 mm' : p < .72 ? 'Beam ' + deg + '° · Pool Ø ' + (2 * 4 * Math.tan(half)).toFixed(1) + ' m' : 'Next · the idea';
      if (txt !== lastRead) { read.textContent = txt; lastRead = txt; }
      var f = p > .26 && p < .8 ? 'cobalt' : 'bone';
      if (f !== lastField) { lastField = f; sec.setAttribute('data-field', f); O.refreshField(); }
    }
    var tick = onFrame(frame);
    measure(); frame();
    window.addEventListener('scroll', tick, { passive: true });
    window.addEventListener('resize', function () { measure(); frame(); });
    window.addEventListener('load', function () { measure(); frame(); });
    var irisWatch = setInterval(function () { if (irisDone) { clearInterval(irisWatch); frame(); } }, 400);
  })();

  /* Manifesto thread grows out of the hero's dot */
  (function thread() {
    var t = $('.mani__thread'); if (!t || RM) return;
    var sec = t.parentNode;
    var f = onFrame(function () {
      var r = sec.getBoundingClientRect();
      t.style.setProperty('--t', clamp((window.innerHeight - r.top) / (window.innerHeight * .55), 0, 1).toFixed(3));
    });
    window.addEventListener('scroll', f, { passive: true }); f();
  })();

  /* =====================================================================
     2. BEAM PLAYGROUND · drag the cone edge from 10° to 60°
     ===================================================================== */
  O.FAMILIES = [
    { max: 14, name: 'Pin spot', use: 'One artwork, one sculpture, one jewel. Everything else stays in shadow.', img: 'fulgeo', prod: 'Spotlights · Fulgeo', href: 'products.html#spotlights', link: 'See spotlights' },
    { max: 22, name: 'Narrow spot', use: 'Accent light: a single object pops while the room stays calm.', img: 'keros', prod: 'Spotlights · Keros A', href: 'products.html#spotlights', link: 'See spotlights' },
    { max: 32, name: 'Spot', use: 'Track spots for retail walls and galleries, re-aimed every season.', img: 'tl3-series', prod: 'Track lights · TL3 Series', href: 'products.html#track-lights', link: 'See track lights' },
    { max: 44, name: 'Flood', use: 'Downlights for lobbies, corridors and lounges: general light with punch.', img: 'neptune', prod: 'Downlights · Neptune', href: 'products.html#downlights', link: 'See downlights' },
    { max: 60, name: 'Wide wash', use: 'Floods and washers for façades, landscape and big volumes, evenly lit.', img: 'fl1', prod: 'Floodlights · FL1 Series', href: 'products.html#flood-lights', link: 'See floodlights' }
  ];
  O.familyFor = function (a) { for (var i = 0; i < O.FAMILIES.length; i++) if (a <= O.FAMILIES[i].max) return O.FAMILIES[i]; return O.FAMILIES[O.FAMILIES.length - 1]; };

  (function beam() {
    var st = $('[data-beam]'); if (!st) return;
    var svg = $('.beam__svg', st), sec = st.closest('section');
    var cone = $('.bp-cone', svg), pool = $('.bp-pool', svg), eA = $('.bp-edge.a', svg), eB = $('.bp-edge.b', svg);
    var hA = $('.bp-handle.a', svg), hB = $('.bp-handle.b', svg), arc = $('.bp-arc', svg), arcT = $('.bp-arc-t', svg);
    var dimLine = $('.bp-dim line', svg), dimT = $('.bp-dim text', svg), objs = $$('.bp-obj', svg);
    var degEl = $('[data-beam-deg]', sec), famEl = $('[data-beam-family]', sec), useEl = $('[data-beam-use]', sec), imgEl = $('[data-beam-img]', sec);
    var prodEl = $('[data-beam-prod]', sec), linkEl = $('[data-beam-link]', sec), litEl = $('[data-beam-lit]', sec), chips = $$('[data-beam-set]', sec);
    var AX = 500, AY = 70, FY = 560, HH = FY - AY, OBJ = [{ x: 225, w: 29 }, { x: 500, w: 26 }, { x: 768, w: 48 }];
    var angle = 24, fam = null, touched = false;
    function set(a) {
      a = clamp(Math.round(a), 10, 60); angle = a;
      var half = a / 2 * Math.PI / 180, rx = HH * Math.tan(half);
      cone.setAttribute('points', AX + ',' + AY + ' ' + (AX - rx).toFixed(1) + ',' + FY + ' ' + (AX + rx).toFixed(1) + ',' + FY);
      pool.setAttribute('rx', (rx * 1.04).toFixed(1)); pool.setAttribute('ry', Math.max(8, rx * .16).toFixed(1));
      eA.setAttribute('x2', (AX - rx).toFixed(1)); eB.setAttribute('x2', (AX + rx).toFixed(1));
      hA.setAttribute('transform', 'translate(' + (AX - rx).toFixed(1) + ' ' + (FY - 120) + ')');
      hB.setAttribute('transform', 'translate(' + (AX + rx).toFixed(1) + ' ' + (FY - 120) + ')');
      // handles ride on the edge lines at a fixed height
      var hy = FY - 150, hx = (hy - AY) * Math.tan(half);
      hA.setAttribute('transform', 'translate(' + (AX - hx).toFixed(1) + ' ' + hy + ')');
      hB.setAttribute('transform', 'translate(' + (AX + hx).toFixed(1) + ' ' + hy + ')');
      var ar = 84;
      arc.setAttribute('d', 'M' + (AX - ar * Math.sin(half)).toFixed(1) + ' ' + (AY + ar * Math.cos(half)).toFixed(1) + ' A ' + ar + ' ' + ar + ' 0 0 0 ' + (AX + ar * Math.sin(half)).toFixed(1) + ' ' + (AY + ar * Math.cos(half)).toFixed(1));
      arcT.textContent = a + '°'; arcT.setAttribute('y', AY + ar + 38);
      dimLine.setAttribute('x1', (AX - rx).toFixed(1)); dimLine.setAttribute('x2', (AX + rx).toFixed(1));
      dimT.textContent = 'Pool Ø ' + (2 * 3.5 * Math.tan(half)).toFixed(2) + ' m from a 3.5 m ceiling';
      var lit = 0;
      objs.forEach(function (o, i) { var on = Math.abs(OBJ[i].x - AX) + OBJ[i].w * .4 < rx; o.classList.toggle('lit', on); if (on) lit++; });
      litEl.textContent = lit + ' of 3';
      degEl.textContent = a;
      var f = O.familyFor(a);
      st.setAttribute('aria-valuenow', a); st.setAttribute('aria-valuetext', a + ' degrees, ' + f.name.toLowerCase());
      chips.forEach(function (c) { c.setAttribute('aria-pressed', String(+c.getAttribute('data-beam-set') === a)); });
      if (f !== fam) {
        fam = f; famEl.textContent = f.name; useEl.textContent = f.use; prodEl.textContent = f.prod;
        linkEl.href = f.href; linkEl.textContent = f.link;
        imgEl.classList.add('swap');
        setTimeout(function () { imgEl.src = IMG + f.img + '.jpg'; imgEl.alt = f.prod; imgEl.classList.remove('swap'); }, 180);
      }
    }
    function toSvg(e) {
      var pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
      return pt.matrixTransform(svg.getScreenCTM().inverse());
    }
    function fromPointer(e) { var p = toSvg(e); set(2 * Math.atan(Math.abs(p.x - AX) / Math.max(60, p.y - AY)) * 180 / Math.PI); }
    var dragging = false;
    st.addEventListener('pointerdown', function (e) {
      dragging = true; touched = true; st.classList.add('is-drag', 'touched');
      try { st.setPointerCapture(e.pointerId); } catch (err) {}
      fromPointer(e);
    });
    st.addEventListener('pointermove', function (e) { if (dragging) fromPointer(e); });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (t) { st.addEventListener(t, function () { dragging = false; st.classList.remove('is-drag'); }); });
    st.addEventListener('keydown', function (e) {
      var k = e.key, n = null;
      if (k === 'ArrowRight' || k === 'ArrowUp') n = angle + 1; else if (k === 'ArrowLeft' || k === 'ArrowDown') n = angle - 1;
      else if (k === 'PageUp') n = angle + 5; else if (k === 'PageDown') n = angle - 5; else if (k === 'Home') n = 10; else if (k === 'End') n = 60;
      if (n !== null) { e.preventDefault(); touched = true; st.classList.add('touched'); set(n); }
    });
    chips.forEach(function (c) { c.addEventListener('click', function () { touched = true; st.classList.add('touched'); animateTo(+c.getAttribute('data-beam-set')); }); });
    var anim = null;
    function animateTo(target, dur, cb) {
      cancelAnimationFrame(anim);
      if (RM) { set(target); if (cb) cb(); return; }
      var from = angle, t0 = null; dur = dur || 600;
      (function step(t) { if (!t0) t0 = t; var k = clamp((t - t0) / dur, 0, 1); set(lerp(from, target, ease(k))); if (k < 1) anim = requestAnimationFrame(step); else if (cb) cb(); })(performance.now());
    }
    set(24);
    // one demo sweep the first time the stage scrolls into view
    if ('IntersectionObserver' in window && !RM) {
      var io = new IntersectionObserver(function (en) {
        if (!en[0].isIntersecting) return; io.disconnect();
        setTimeout(function () { if (touched) return; animateTo(52, 1100, function () { if (!touched) animateTo(14, 1000, function () { if (!touched) animateTo(24, 700); }); }); }, 400);
      }, { threshold: .5 });
      io.observe(st);
    }
  })();

  /* =====================================================================
     3. DIAL · rotary navigation for the five product worlds
     ===================================================================== */
  (function dial() {
    var dl = $('[data-dial]'); if (!dl) return;
    var sec = dl.closest('[data-world]'), face = $('[data-dial-face]', dl), opts = $$('.dial__opt', dl), ticks = $('.dial__ticks', dl);
    var info = $('[data-world-info]', sec), nameEl = $('[data-w-name]', sec), descEl = $('[data-w-desc]', sec), catsEl = $('[data-w-cats]', sec);
    var linkEl = $('[data-w-link]', sec), ctaEl = $('[data-w-cta]', sec), imgEl = $('[data-w-img]', sec), countEl = $('[data-w-count]', sec);
    var G = [
      { name: 'Indoor', field: 'brass', count: 85, img: IMG + 'tl3-series.jpg', alt: 'TL3 track spotlight, Indoor range', desc: 'Downlights, spotlights, magnetic and track systems, linear and strip light for hotels, homes, offices and retail.', cats: ['Downlights', 'Spotlights', 'Magnetic', 'Track', 'Linear', 'Strip', 'Panel'], href: 'products.html#indoor' },
      { name: 'Outdoor', field: 'cobalt', count: 64, img: IMG + 'bl3-series.jpg', alt: 'BL3 bollard, Outdoor range', desc: 'Bollards, uplights, wall washers, floods, step and handrail lights, neon flex and streetlights. IP65 to IP68.', cats: ['Inground', 'Wall washers', 'Bollards', 'Floods', 'Step', 'Handrail', 'Neon flex', 'Streetlights', '+3'], href: 'products.html#outdoor' },
      { name: 'Industrial', field: 'ink', count: 4, img: IMG + 'hbr3-series.jpg', alt: 'HBR3 high-bay luminaire, Industrial range', desc: 'High-bay luminaires for warehouses, factories and logistics halls, up to 36,000 lm with 160 lm/W efficacy.', cats: ['UFO high-bays', 'Linear high-bays'], href: 'products.html#industrial' },
      { name: 'Back of House', field: 'bone', count: 11, img: IMG + 'bh2-series.jpg', alt: 'BH bulkhead, Back of House range', desc: 'Bulkheads, emergency and batten lights for car parks, plant rooms, corridors and service areas.', cats: ['Bulkheads', 'Battens', 'Emergency'], href: 'products.html#back-of-house' },
      { name: 'Smart Poles', field: 'paper', count: 20, img: 'shared/img/poles/orbit.jpg', pole: true, alt: 'Orbit smart pole render', desc: 'Twenty pole designs that carry light, 5G, CCTV, sensors, screens, EV charging, emergency call and Wi-Fi.', cats: ['20 designs', '8 systems', 'Custom finishes'], href: 'solutions.html#range' }
    ];
    // ticks + degree numerals
    for (var t = 0; t < 120; t++) {
      var a = t * 3, rad = (a - 90) * Math.PI / 180, major = a % 72 === 0, r1 = 196, r2 = major ? 172 : (a % 30 === 0 ? 182 : 188);
      el('line', { x1: 200 + r1 * Math.cos(rad), y1: 200 + r1 * Math.sin(rad), x2: 200 + r2 * Math.cos(rad), y2: 200 + r2 * Math.sin(rad), class: major ? 'major' : '' }, ticks);
      if (a % 30 === 0 && !major) { var tx = el('text', { x: 200 + 176 * Math.cos(rad), y: 200 + 176 * Math.sin(rad) + 3, 'text-anchor': 'middle' }, ticks); tx.textContent = a + '°'; }
    }
    el('circle', { cx: 200, cy: 200, r: 118, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.2, opacity: .5 }, ticks);
    var cur = 0, rot = 0;
    function select(i, focus, instant) {
      i = ((i % 5) + 5) % 5;
      var target = -i * 72, diff = ((target - rot) % 360 + 540) % 360 - 180;
      rot = rot + diff;
      face.style.setProperty('--rot', rot + 'deg');
      opts.forEach(function (o, k) { o.setAttribute('aria-checked', String(k === i)); o.tabIndex = k === i ? 0 : -1; });
      if (focus) opts[i].focus({ preventScroll: true });
      if (i === cur && !instant) return;
      cur = i; var g = G[i];
      info.classList.remove('swap'); void info.offsetWidth; info.classList.add('swap');
      nameEl.textContent = g.name; descEl.textContent = g.desc;
      catsEl.innerHTML = g.cats.map(function (c) { return '<li>' + c + '</li>'; }).join('');
      linkEl.href = g.href; ctaEl.textContent = 'Explore ' + g.name; countEl.textContent = g.count;
      $('small', countEl.parentNode).textContent = g.pole ? 'pole designs' : 'luminaires';
      imgEl.classList.add('swap');
      setTimeout(function () { imgEl.src = g.img; imgEl.alt = g.alt; imgEl.classList.toggle('pole', !!g.pole); imgEl.parentNode.classList.toggle('is-pole', !!g.pole); imgEl.classList.remove('swap'); }, 220);
      sec.setAttribute('data-field', g.field); O.refreshField();
    }
    opts.forEach(function (o, k) { o.addEventListener('click', function (e) { if (moved) { e.preventDefault(); return; } select(k); }); });
    face.addEventListener('keydown', function (e) {
      var k = e.key;
      if (k === 'ArrowRight' || k === 'ArrowDown') { e.preventDefault(); select(cur + 1, true); }
      else if (k === 'ArrowLeft' || k === 'ArrowUp') { e.preventDefault(); select(cur - 1, true); }
      else if (k === 'Home') { e.preventDefault(); select(0, true); } else if (k === 'End') { e.preventDefault(); select(4, true); }
    });
    // drag to rotate
    var dragging = false, moved = false, startA = 0, startRot = 0, sx = 0, sy = 0;
    function ang(e) { var r = dl.getBoundingClientRect(); return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI; }
    face.addEventListener('pointerdown', function (e) {
      dragging = true; moved = false; startA = ang(e); startRot = rot; sx = e.clientX; sy = e.clientY;
    });
    window.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      if (!moved && Math.hypot(e.clientX - sx, e.clientY - sy) > 6) { moved = true; dl.classList.add('is-drag'); try { face.setPointerCapture(e.pointerId); } catch (err) {} }
      if (!moved) return;
      var delta = ((ang(e) - startA) % 360 + 540) % 360 - 180;
      rot = startRot + delta; face.style.setProperty('--rot', rot + 'deg');
      startA = ang(e); startRot = rot;
    });
    window.addEventListener('pointerup', function () {
      if (!dragging) return; dragging = false; dl.classList.remove('is-drag');
      if (moved) { var i = Math.round(-rot / 72); select(i); setTimeout(function () { moved = false; }, 50); }
    });
    select(0, false, true);
  })();

  /* =====================================================================
     4. RAIL · vertical scroll drives a horizontal track (desktop); native swipe on mobile
     ===================================================================== */
  (function rail() {
    var sec = $('[data-rail]'); if (!sec) return;
    var track = $('[data-rail-track]', sec), vp = $('.rail__vp', sec), ring = $('[data-rail-ring]', sec), nEl = $('[data-rail-n]', sec);
    var mq = window.matchMedia('(min-width: 901px)'), dist = 0, total = $$('.rc', track).length - 1, C = 163.4;
    function progress(p) {
      ring.style.strokeDashoffset = (C * (1 - p)).toFixed(1);
      var n = Math.min(total, Math.round(p * (total - 1)) + 1);
      nEl.textContent = (n < 10 ? '0' : '') + n + ' / ' + total;
    }
    function setup() {
      if (mq.matches && !RM) {
        sec.classList.add('is-pinned');
        dist = Math.max(0, track.scrollWidth - window.innerWidth);
        sec.style.height = (window.innerHeight + dist) + 'px';
      } else {
        sec.classList.remove('is-pinned'); sec.style.height = ''; track.style.transform = '';
      }
      update();
    }
    function update() {
      if (sec.classList.contains('is-pinned')) {
        var r = sec.getBoundingClientRect(), p = clamp(-r.top / Math.max(1, r.height - window.innerHeight), 0, 1);
        track.style.transform = 'translate3d(' + (-p * dist).toFixed(1) + 'px,0,0)';
        progress(p);
      } else {
        progress(clamp(vp.scrollLeft / Math.max(1, vp.scrollWidth - vp.clientWidth), 0, 1));
      }
    }
    var f = onFrame(update);
    window.addEventListener('scroll', f, { passive: true });
    vp.addEventListener('scroll', f, { passive: true });
    window.addEventListener('resize', setup);
    window.addEventListener('load', setup);
    if (mq.addEventListener) mq.addEventListener('change', setup);
    setup();
  })();

  /* =====================================================================
     5. PIXEL FAÇADE · rings ripple out from the pointer
     ===================================================================== */
  (function pixels() {
    $$('[data-pixels]').forEach(function (grid) {
      var tile = grid.closest('.tile') || grid.parentNode, cells = [], cols, rows, raf = null, visible = false, hover = false, px = .5, py = .5, t0 = performance.now();
      function build() {
        var w = grid.clientWidth, h = grid.clientHeight;
        cols = w < 520 ? 16 : 28; grid.style.setProperty('--cols', cols);
        var cw = (w - 44) / cols; rows = Math.max(4, Math.floor((h - 22) / cw));
        grid.innerHTML = ''; cells = [];
        var frag = d.createDocumentFragment();
        for (var i = 0; i < cols * rows; i++) { var c = d.createElement('i'); frag.appendChild(c); cells.push(c); }
        grid.appendChild(frag);
      }
      function frame(t) {
        raf = null; if (!visible) return;
        var e = (t - t0) / 1000, R = (e * (hover ? 14 : 8)) % (cols * .9);
        var cx = px * cols, cy = py * rows;
        for (var y = 0; y < rows; y++) for (var x = 0; x < cols; x++) {
          var dd = Math.hypot(x + .5 - cx, (y + .5 - cy) * 1.0), c = cells[y * cols + x];
          var on = Math.abs(dd - R) < .75 || (hover && dd < 1.3);
          var on2 = Math.abs(dd - (R - 3.5)) < .55;
          c.className = on ? 'on' : on2 ? 'on2' : '';
        }
        if (!RM) raf = requestAnimationFrame(frame);
      }
      build();
      tile.addEventListener('pointermove', function (e) { var r = grid.getBoundingClientRect(); px = clamp((e.clientX - r.left) / r.width, 0, 1); py = clamp((e.clientY - r.top) / r.height, 0, 1); });
      tile.addEventListener('pointerenter', function () { hover = true; t0 = performance.now(); });
      tile.addEventListener('pointerleave', function () { hover = false; px = .5; py = .5; });
      if (RM) { cells.forEach(function (c, i) { if (i % 7 === 0) c.className = 'on'; }); return; }
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible && !raf) raf = requestAnimationFrame(frame); }).observe(grid);
      var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(build, 200); });
    });
  })();


  /* =====================================================================
     6. CATALOGUE · round-chip filters over products.json
     ===================================================================== */
  O.cardHTML = function (p) {
    var sp = O.specFor(p), e = O.esc, b = sp.beams;
    var ws = []; (p.variants || []).forEach(function (v) { var m = /(\d+)\s*W/.exec(v); if (m) ws.push(+m[1]); });
    var wr = ws.length ? (Math.min.apply(0, ws) === Math.max.apply(0, ws) ? ws[0] + ' W' : Math.min.apply(0, ws) + '–' + Math.max.apply(0, ws) + ' W') : (p.variants.length > 1 ? p.variants.length + ' variants' : /Neon|Strip/.test(p.category) ? 'Made to length' : '1 variant');
    var fig = p.image ? '<img src="' + p.image + '" alt="' + e(p.name) + ', ' + e(p.category.toLowerCase()) + '" width="800" height="800" loading="lazy">' : '<span class="pcard__ph" aria-hidden="true"><i></i>' + e(p.category.slice(0, 2).toUpperCase()) + '</span>';
    return '<li class="pcard"><a class="pcard__link" href="product.html?p=' + encodeURIComponent(p.slug) + '"><span class="pcard__fig">' + fig + '</span><span class="pcard__meta">' + e(p.category) + ' · ' + e(p.group) + '</span><span class="pcard__name">' + e(p.name) + '</span></a>' +
      '<ul class="pcard__specs"><li>' + sp.ip + '</li><li>' + (b.length > 1 ? b[0] + '–' + b[b.length - 1] : b[0]) + '°</li><li>' + wr + '</li></ul>' +
      '<button class="pcard__add" type="button" data-spec-add data-slug="' + e(p.slug) + '" data-name="' + e(p.name) + '" data-img="' + (p.image || '') + '" data-cat="' + e(p.category) + '" aria-pressed="false" aria-label="Add ' + e(p.name) + ' to spec list"><svg class="ico" aria-hidden="true"><use href="#i-plus"/></svg></button></li>';
  };
  (function catalog() {
    var sec = $('[data-catalog]'); if (!sec) return;
    var grid = $('[data-pgrid]', sec), more = $('[data-more]', sec), nOut = $('[data-result-n]', sec), countOut = $('[data-count-out]', sec);
    var title = $('[data-cat-title]', sec), desc = $('[data-cat-desc]', sec), catRow = $('[data-cat-row]', sec), catChips = $('[data-filter="cat"]', sec);
    var state = { group: '', cat: '', ip: '', beam: '' }, list = [], shown = 24;
    var DESC = {
      '': 'Every C°LB luminaire in one place. Choose a group, a category, an IP rating or a beam angle; the grid redraws as you go.',
      'Indoor': 'Downlights, spotlights, magnetic and track systems, linear, strip and panel light for interiors.',
      'Outdoor': 'Façade, landscape and street luminaires sealed to IP65–IP67 for Saudi heat, dust and irrigation.',
      'Industrial': 'High-bays for warehouses and production halls, up to 36,000 lm.',
      'Back of House': 'Bulkheads, battens and emergency fittings for car parks, plant rooms and corridors.',
      'Spotlights': 'Recessed, surface and gimbal spots from 3 W to 50 W, with 15°, 24° and 36° optics and deep anti-glare baffles.',
      'Downlights': 'Round and square downlights for lobbies, corridors and residences; 36° and 60° optics, CRI 90+.'
    };
    function beamOk(bs, v) { return !v || bs.some(function (b) { return v === 'narrow' ? b <= 15 : v === 'medium' ? b > 15 && b <= 30 : v === 'wide' ? b > 30 && b <= 60 : b > 60; }); }
    function ipOk(ip, v) { return !v || (v === 'IP65' ? (ip === 'IP65' || ip === 'IP66') : ip === v); }
    function filtered() {
      return list.filter(function (p) {
        var sp = O.specFor(p);
        return (!state.group || p.group === state.group) && (!state.cat || p.category === state.cat) && ipOk(sp.ip, state.ip) && beamOk(sp.beams, state.beam);
      });
    }
    function setPressed(group, v) { $$('.chip', $('[data-filter="' + group + '"]', sec)).forEach(function (c) { c.setAttribute('aria-pressed', String(c.getAttribute('data-v') === v)); }); }
    function buildCats() {
      if (!state.group) { catRow.hidden = true; return; }
      var cats = {}; list.forEach(function (p) { if (p.group === state.group) cats[p.category] = (cats[p.category] || 0) + 1; });
      var keys = Object.keys(cats);
      if (keys.length < 2) { catRow.hidden = true; return; }
      catRow.hidden = false;
      catChips.innerHTML = '<button class="chip" type="button" data-v="" aria-pressed="' + (!state.cat) + '">All ' + O.esc(state.group) + '</button>' + keys.map(function (k) {
        return '<button class="chip" type="button" data-v="' + O.esc(k) + '" aria-pressed="' + (state.cat === k) + '">' + O.esc(k) + ' <span class="n">' + cats[k] + '</span></button>';
      }).join('');
    }
    function render() {
      var f = filtered();
      nOut.textContent = f.length; countOut.textContent = f.length;
      grid.innerHTML = f.length ? f.slice(0, shown).map(O.cardHTML).join('') : '<li class="pgrid__empty"><p class="h3">No luminaire matches that combination.</p><p class="muted">Loosen a filter, or ask a specialist: most optics can be adapted.</p></li>';
      more.hidden = f.length <= shown;
      ['group', 'ip', 'beam'].forEach(function (k) { setPressed(k, state[k]); });
      buildCats();
      title.textContent = state.cat || (state.group ? state.group : 'All luminaires');
      desc.textContent = DESC[state.cat] || DESC[state.group] || (state.cat ? state.cat + ' from the C°LB ' + (state.group || '') + ' range. Sample specifications shown until datasheets are linked.' : DESC['']);
      $$('[data-set-cat]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-set-cat') === state.cat)); });
      $$('[data-set-group]').forEach(function (b) { b.classList.toggle('is-on', b.getAttribute('data-set-group') === state.group); });
      O.syncSpec();
      try {
        var h = state.cat ? state.cat.toLowerCase().replace(/\s+/g, '-') : state.group ? state.group.toLowerCase().replace(/\s+/g, '-') : '';
        history.replaceState(null, '', h ? '#' + h : location.pathname + location.search);
      } catch (e) {}
    }
    function go() { shown = 24; render(); }
    function toGrid() { var r = sec.getBoundingClientRect(); if (r.top > 120 || r.bottom < 200) sec.scrollIntoView({ behavior: RM ? 'auto' : 'smooth' }); }
    sec.addEventListener('click', function (e) {
      var c = e.target.closest('[data-filter] .chip'); if (!c) return;
      var k = c.parentNode.getAttribute('data-filter'), v = c.getAttribute('data-v');
      if (k === 'group') { state.group = v; state.cat = ''; } else state[k] = v;
      go();
    });
    $('[data-reset]', sec).addEventListener('click', function () { state = { group: '', cat: '', ip: '', beam: '' }; go(); });
    more.addEventListener('click', function () { shown += 24; render(); });
    $$('[data-set-group]').forEach(function (b) { b.addEventListener('click', function () { state.group = b.getAttribute('data-set-group'); state.cat = ''; go(); toGrid(); }); });
    $$('[data-set-cat]').forEach(function (b) { b.addEventListener('click', function () {
      var c = b.getAttribute('data-set-cat'); if (state.cat === c) { state.cat = ''; } else { state.cat = c; var p = list.filter(function (x) { return x.category === c; })[0]; if (p) state.group = p.group; }
      go(); toGrid(); }); });
    function fromHash() {
      var h = decodeURIComponent(location.hash.slice(1)).toLowerCase(); if (!h) return;
      var g = ['Indoor', 'Outdoor', 'Industrial', 'Back of House'].filter(function (x) { return x.toLowerCase().replace(/\s+/g, '-') === h; })[0];
      if (g) { state.group = g; state.cat = ''; return; }
      var p = list.filter(function (x) { return x.categorySlug === h || x.category.toLowerCase().replace(/\s+/g, '-') === h; })[0];
      if (p) { state.cat = p.category; state.group = p.group; }
    }
    O.products().then(function (data) {
      if (!data.length) return;
      list = data.slice().sort(function (a, b) { return (b.image ? 1 : 0) - (a.image ? 1 : 0); });
      fromHash(); render();
      if (location.hash) setTimeout(function () { sec.scrollIntoView(); }, 60);
    });
    window.addEventListener('hashchange', function () { fromHash(); render(); });
  })();


  /* =====================================================================
     7. PRODUCT DETAIL · variants, finish, beam geometry, ?p= swapping
     ===================================================================== */
  (function pdp() {
    var root = $('[data-pdp]'); if (!root) return;
    var state = { w: 7, b: 24, lmPerW: 90, name: 'Keros A', code: 'KRA', fin: 'WH' };
    var kW = $('[data-k-w]'), kLm = $('[data-k-lm]'), code = $('[data-pdp-code]'), degEl = $('[data-bg-deg]');
    var cone = $('[data-bg-cone]'), rings = $('[data-bg-rings]'), curve = $('[data-bg-curve]'), table = $('[data-bg-table]'), cdEl = $('[data-bg-cd]');
    var fmt = function (n) { return Math.round(n).toLocaleString('en-US'); };
    function lumen() { return state.w * state.lmPerW; }
    function updateCode() { code.textContent = 'CLB-' + state.code + '-' + (state.w < 10 ? '0' : '') + state.w + '-' + state.b + '-' + state.fin; }
    function geometry() {
      var b = state.b, half = b / 2 * Math.PI / 180, AX = 400, AY = 44, FY = 520, H = FY - AY, rx = H * Math.tan(half);
      cone.setAttribute('points', AX + ',' + AY + ' ' + (AX - rx).toFixed(1) + ',' + FY + ' ' + (AX + rx).toFixed(1) + ',' + FY);
      var g = '', lm = lumen(), I = lm * .85 / (2 * Math.PI * (1 - Math.cos(half))), rows = '';
      [1, 2, 3].forEach(function (m) {
        var y = AY + H * m / 3, r = (y - AY) * Math.tan(half), dia = 2 * m * Math.tan(half), lux = I / (m * m);
        g += '<g class="bg-ring"><ellipse cx="' + AX + '" cy="' + y.toFixed(1) + '" rx="' + r.toFixed(1) + '" ry="' + Math.max(4, r * .16).toFixed(1) + '"/>' +
          '<line x1="' + (AX + r + 10).toFixed(1) + '" y1="' + y.toFixed(1) + '" x2="' + (AX + r + 40).toFixed(1) + '" y2="' + y.toFixed(1) + '"/>' +
          '<text class="big" x="' + (AX + r + 48).toFixed(1) + '" y="' + (y + 2).toFixed(1) + '">Ø ' + dia.toFixed(2) + ' m</text>' +
          '<text x="' + (AX + r + 48).toFixed(1) + '" y="' + (y + 20).toFixed(1) + '">' + fmt(lux) + ' lx</text></g>';
        rows += '<tr><th scope="row">' + m + ' m</th><td>' + dia.toFixed(2) + ' m</td><td>' + fmt(lux) + '</td></tr>';
      });
      rings.innerHTML = g; table.innerHTML = rows; cdEl.textContent = fmt(I); degEl.textContent = b;
      // polar curve: cos^n lobe whose half-intensity angle equals half the beam
      var n = Math.log(.5) / Math.log(Math.cos(half)), pts = [], R = 250;
      for (var a = -90; a <= 90; a += 3) { var t = a * Math.PI / 180, v = Math.pow(Math.max(0, Math.cos(t)), n); pts.push([150 + Math.sin(t) * v * R, 20 + Math.cos(t) * v * R]); }
      curve.setAttribute('d', 'M' + pts.map(function (q) { return q[0].toFixed(1) + ' ' + q[1].toFixed(1); }).join(' L') + ' Z');
      $$('[data-pdp-beams] .chip, [data-pdp-beams2] .chip').forEach(function (c) { c.setAttribute('aria-pressed', String(+c.getAttribute('data-b') === b)); });
      updateCode();
    }
    function power() {
      kW.textContent = state.w; kLm.textContent = fmt(lumen());
      $$('[data-pdp-variants] .chip').forEach(function (c) { c.setAttribute('aria-pressed', String(+c.getAttribute('data-w') === state.w)); });
      geometry();
    }
    root.addEventListener('click', function (e) {
      var c = e.target.closest('[data-pdp-variants] .chip'); if (c) { state.w = +c.getAttribute('data-w'); power(); return; }
      c = e.target.closest('[data-pdp-beams] .chip, [data-pdp-beams2] .chip'); if (c) { state.b = +c.getAttribute('data-b'); geometry(); return; }
      c = e.target.closest('[data-pdp-finish] .swatch');
      if (c) {
        $$('[data-pdp-finish] .swatch').forEach(function (s) { s.setAttribute('aria-pressed', String(s === c)); });
        $('[data-pdp-finish-l]').textContent = c.getAttribute('data-f');
        $('.pdp__orbit').style.setProperty('--fin', getComputedStyle(c).getPropertyValue('--c'));
        state.fin = { 'Matt white': 'WH', 'Matt black': 'BK', 'Brushed brass': 'BR' }[c.getAttribute('data-f')]; updateCode(); return;
      }
      c = e.target.closest('.pdp__thumb');
      if (c) {
        $$('.pdp__thumb').forEach(function (t) { t.setAttribute('aria-pressed', String(t === c)); });
        var disc = $('.pdp__disc'), img = $('[data-pdp-img]'), old = $('svg', disc);
        if (old) old.remove();
        if (c.getAttribute('data-view') === 'photo') { img.hidden = false; disc.style.borderRadius = ''; }
        else { img.hidden = true; disc.appendChild($('svg', c).cloneNode(true)); disc.style.borderRadius = c.getAttribute('data-view') === 'side' ? '40px' : ''; }
      }
    });
    // ?p=slug swaps the template to any catalogue item
    var slug = new URLSearchParams(location.search).get('p');
    if (slug && slug !== 'keros') O.products().then(function (list) {
      var p = list.filter(function (x) { return x.slug === slug; })[0]; if (!p) return;
      var sp = O.specFor(p);
      document.title = p.name + ' · ' + p.category + ' · C°LB';
      $('[data-pdp-name]').textContent = p.name; $('[data-pdp-crumb]').textContent = p.name;
      $('[data-pdp-fam]').textContent = p.category + ' · ' + p.group; $('[data-s-fam]').textContent = p.category;
      var cl = $('[data-pdp-catlink]'); cl.textContent = p.category; cl.href = 'products.html#' + (p.categorySlug || '');
      $('[data-pdp-desc]').textContent = 'The ' + p.name + ' from the C°LB ' + p.group.toLowerCase() + ' range. ' + (p.variants.length ? p.variants.length + ' catalogue variants' : 'Made to order') + ', ' + sp.ip + ' rated, CRI ' + sp.cri + '+. Full description to follow from the approved datasheet.';
      $('[data-k-ip]').textContent = sp.ip; $('[data-s-ip]').textContent = sp.ip;
      var img = $('[data-pdp-img]'), th = $('[data-pdp-thumb]');
      if (p.image) { img.src = p.image; th.src = p.image; img.alt = p.name + ', product photo'; } else { img.src = 'shared/brand/clb-logo-black.svg'; th.src = img.src; img.alt = 'Product photo to follow'; img.style.inlineSize = '40%'; }
      var ws = []; p.variants.forEach(function (v) { var m = /(\d+)\s*W/.exec(v); if (m) ws.push(+m[1]); });
      var vc = $('[data-pdp-variants]');
      if (ws.length) { vc.innerHTML = ws.map(function (w) { return '<button class="chip" type="button" aria-pressed="false" data-w="' + w + '">' + w + 'W</button>'; }).join(''); state.w = ws[ws.length - 1]; $('[data-s-w]').textContent = ws.join(' / ') + ' W'; $('[data-s-lm]').textContent = ws.map(function (w) { return fmt(w * state.lmPerW); }).join(' / ') + ' lm'; }
      else if (p.variants.length) { $('[data-pdp-vl]').textContent = 'Variant'; vc.innerHTML = p.variants.map(function (v, i) { return '<button class="chip" type="button" aria-pressed="' + (i === 0) + '" data-w="' + sp.watt + '">' + O.esc(v) + '</button>'; }).join(''); state.w = sp.watt; }
      else { vc.innerHTML = '<span class="mono small">Configured per project</span>'; state.w = sp.watt; }
      state.b = sp.beams[0] > 60 ? 60 : sp.beams[Math.min(1, sp.beams.length - 1)];
      if ([15, 24, 36, 60].indexOf(state.b) < 0) state.b = sp.beams[0] <= 15 ? 15 : sp.beams[0] <= 30 ? 24 : sp.beams[0] <= 45 ? 36 : 60;
      state.code = p.slug.replace(/[^a-z0-9]/gi, '').slice(0, 3).toUpperCase(); state.name = p.name;
      $$('[data-spec-add]', $('.pdp')).forEach(function (b) { b.setAttribute('data-slug', p.slug); b.setAttribute('data-name', p.name); b.setAttribute('data-img', p.image || ''); b.setAttribute('data-cat', p.category); });
      var rel = list.filter(function (x) { return x.category === p.category && x.slug !== p.slug; }).sort(function (a, b) { return (b.image ? 1 : 0) - (a.image ? 1 : 0); }).slice(0, 8);
      if (rel.length < 4) rel = rel.concat(list.filter(function (x) { return x.group === p.group && x.category !== p.category && x.image; }).slice(0, 8 - rel.length));
      $('[data-rel]').innerHTML = rel.map(O.cardHTML).join('');
      power(); O.syncSpec();
    });
    power();
    // related rail arrows
    var vp = $('[data-rel-vp]');
    if (vp) {
      $('[data-rel-prev]').addEventListener('click', function () { vp.scrollBy({ left: -vp.clientWidth * .7, behavior: RM ? 'auto' : 'smooth' }); });
      $('[data-rel-next]').addEventListener('click', function () { vp.scrollBy({ left: vp.clientWidth * .7, behavior: RM ? 'auto' : 'smooth' }); });
    }
  })();

  /* Download tiles are placeholders in the prototype */
  d.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-dl]'); if (!a) return;
    e.preventDefault(); O.toast(a.getAttribute('data-dl') + ': file will be linked once Marketing supplies it');
  });


  /* =====================================================================
     8. POLE FLIPPER · 20 arched frames
     ===================================================================== */
  (function flip() {
    var root = $('[data-flip]'); if (!root) return;
    var track = $('[data-flip-track]', root), items = $$('.flip__item', track), N = items.length, cur = 0;
    var nEl = $('[data-flip-n]', root), nameEl = $('[data-flip-name]', root), names = $('[data-flip-names]', root);
    root.classList.add('is-js');
    names.innerHTML = items.map(function (it, i) { return '<button type="button" data-i="' + i + '">' + it.getAttribute('data-name') + '</button>'; }).join('');
    var nameBtns = $$('button', names);
    function layout(dragPx) {
      var w = items[0].offsetWidth || 240, mobile = window.innerWidth < 700;
      items.forEach(function (it, i) {
        var o = i - cur; if (o > N / 2) o -= N; if (o < -N / 2) o += N;
        var x = o * w * (mobile ? .82 : 1.04) + (dragPx || 0), a = Math.abs(o);
        var sc = a === 0 ? 1 : Math.max(.55, 1 - a * .16), y = a * (mobile ? 24 : 36);
        it.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y + 'px,0) scale(' + sc.toFixed(3) + ')';
        it.style.opacity = a > (mobile ? 2 : 3) ? 0 : (1 - a * .22).toFixed(2);
        it.style.zIndex = 50 - a;
        it.style.pointerEvents = a > 3 ? 'none' : '';
        it.classList.toggle('is-active', o === 0);
        it.setAttribute('aria-hidden', String(o !== 0));
      });
      nEl.textContent = (cur < 9 ? '0' : '') + (cur + 1); nameEl.textContent = items[cur].getAttribute('data-name');
      nameBtns.forEach(function (b, i) { b.setAttribute('aria-current', String(i === cur)); });
    }
    function go(i) { cur = (i % N + N) % N; layout(); }
    $('[data-flip-prev]', root).addEventListener('click', function () { go(cur - 1); });
    $('[data-flip-next]', root).addEventListener('click', function () { go(cur + 1); });
    names.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) go(+b.getAttribute('data-i')); });
    root.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { e.preventDefault(); go(cur + 1); } else if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1); } });
    var sx = null, dx = 0, moved = false;
    track.addEventListener('pointerdown', function (e) { sx = e.clientX; dx = 0; moved = false; });
    window.addEventListener('pointermove', function (e) {
      if (sx === null) return; dx = e.clientX - sx;
      if (Math.abs(dx) > 6) { moved = true; root.classList.add('is-drag'); items.forEach(function (it) { it.style.transition = 'none'; }); layout(dx); }
    });
    window.addEventListener('pointerup', function () {
      if (sx === null) return; sx = null; root.classList.remove('is-drag'); items.forEach(function (it) { it.style.transition = ''; });
      if (moved) { var w = items[0].offsetWidth; go(cur - Math.round(dx / (w * .9))); }
    });
    track.addEventListener('click', function (e) {
      if (moved) { e.preventDefault(); return; }
      var it = e.target.closest('.flip__item'); if (it && !it.classList.contains('is-active')) go(items.indexOf(it));
    });
    window.addEventListener('resize', function () { layout(); });
    layout();
  })();

  /* =====================================================================
     9. POLE ANATOMY · eight modules orbit the pole
     ===================================================================== */
  (function anatomy() {
    var root = $('[data-anat]'); if (!root) return;
    var M = {
      light: ['Light', 'Asymmetric street optics with DALI dimming. Light rises when sensors see people and falls to 30% on empty roads.', ['Up to 160 lm/W', 'Type II / III optics', 'Zhaga socket']],
      '5g': ['5G small cell', 'A concealed bay for operator small cells and antennas, so networks densify without new masts on the skyline.', ['Operator-neutral bay', 'Fibre-ready shaft', 'Thermal managed']],
      cctv: ['CCTV', 'Fixed or PTZ cameras on a reinforced arm, streaming to the city operations centre over the pole backbone.', ['Up to 4K', 'Edge analytics', 'PoE++ power']],
      sensors: ['Environmental sensors', 'Air quality, noise, temperature and footfall data that feed dashboards and adapt the lighting.', ['PM2.5 / PM10', 'Noise dB(A)', 'People counting']],
      screen: ['Digital signage', 'A sunlight-readable screen for wayfinding, public notices and advertising revenue.', ['2,500+ nits', 'IK10 glass', 'Remote CMS']],
      ev: ['EV charging', 'An AC charger in the base cabinet turns every parking bay along the street into a charging point.', ['7–22 kW AC', 'Type 2 socket', 'OCPP 1.6J']],
      sos: ['Emergency call', 'A one-touch help point with two-way audio and a camera, linked to security control rooms.', ['Two-way VoIP', 'Beacon light', 'Vandal resistant']],
      wifi: ['Public Wi-Fi', 'Outdoor access points that bring connectivity to parks, plazas and transit stops.', ['Wi-Fi 6', 'Captive portal', 'Mesh capable']]
    };
    var keys = ['light', '5g', 'cctv', 'sensors', 'screen', 'ev', 'sos', 'wifi'];
    var mods = $$('.mod', root), parts = $$('[data-part]', root), ring = $('[data-anat-ring]', root);
    var t = $('[data-anat-t]'), dsc = $('[data-anat-d]'), f = $('[data-anat-f]'), k = $('[data-anat-k]');
    function show(key) {
      var m = M[key]; if (!m) return;
      mods.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-mod') === key)); });
      parts.forEach(function (p) { p.classList.toggle('on', p.getAttribute('data-part') === key); });
      t.textContent = m[0]; dsc.textContent = m[1]; f.innerHTML = m[2].map(function (x) { return '<li>' + x + '</li>'; }).join('');
      k.textContent = 'System 0' + (keys.indexOf(key) + 1) + ' / 08';
    }
    mods.forEach(function (b) {
      b.addEventListener('click', function () { show(b.getAttribute('data-mod')); ring.classList.add('paused'); });
      b.addEventListener('mouseenter', function () { show(b.getAttribute('data-mod')); });
      b.addEventListener('focus', function () { show(b.getAttribute('data-mod')); });
    });
    show('light');
  })();


  /* =====================================================================
     10. PROJECTS + JOURNAL · simple chip filters
     ===================================================================== */
  (function projects() {
    var root = $('[data-projects]'); if (!root) return;
    var chips = $$('[data-prj-chips] .chip', root), items = $$('.pj', root), n = $('[data-prj-n]', root), apps = $$('[data-app]').filter(function (b) { return b.tagName === 'BUTTON'; });
    function set(v, scroll) {
      var c = 0;
      items.forEach(function (it) { var on = !v || it.getAttribute('data-app') === v; it.classList.toggle('is-out', !on); it.classList.remove('is-in'); if (on) { void it.offsetWidth; it.classList.add('is-in'); c++; } });
      chips.forEach(function (ch) { ch.setAttribute('aria-pressed', String(ch.getAttribute('data-v') === v)); });
      apps.forEach(function (a) { a.setAttribute('aria-pressed', String(a.getAttribute('data-app') === v)); });
      n.textContent = c;
      if (scroll) root.scrollIntoView({ behavior: RM ? 'auto' : 'smooth' });
    }
    chips.forEach(function (ch) { ch.addEventListener('click', function () { set(ch.getAttribute('data-v')); }); });
    apps.forEach(function (a) { a.setAttribute('aria-pressed', 'false'); a.addEventListener('click', function () { set(a.getAttribute('aria-pressed') === 'true' ? '' : a.getAttribute('data-app'), true); }); });
  })();
  (function journal() {
    var root = $('[data-journal]'); if (!root) return;
    var pills = $$('[data-stream]'), items = $$('.post', root), n = $('[data-j-n]', root);
    function set(v) {
      var c = 0;
      items.forEach(function (it) { var on = !v || it.getAttribute('data-s') === v; it.hidden = !on; if (on) c++; });
      pills.forEach(function (p) { p.setAttribute('aria-pressed', String(p.getAttribute('data-stream') === v)); });
      if (n) n.textContent = c;
      try { history.replaceState(null, '', v ? '#' + v : location.pathname); } catch (e) {}
    }
    pills.forEach(function (p) { p.addEventListener('click', function () { set(p.getAttribute('data-stream')); }); });
    function fromHash() { var h = location.hash.slice(1); if (h && pills.some(function (p) { return p.getAttribute('data-stream') === h; })) { set(h); root.scrollIntoView(); } }
    fromHash(); window.addEventListener('hashchange', fromHash);
  })();


  /* =====================================================================
     11. ARTICLE · reading ring, active TOC, copy link
     ===================================================================== */
  (function article() {
    var ring = $('[data-read-ring]'); if (!ring) return;
    var pct = $('[data-read-pct]'), prose = $('.prose'), links = $$('.toc__list a'), heads = links.map(function (a) { return $(a.getAttribute('href')); });
    var f = onFrame(function () {
      var r = prose.getBoundingClientRect(), p = clamp((window.innerHeight * .5 - r.top) / r.height, 0, 1);
      ring.style.strokeDashoffset = (163.4 * (1 - p)).toFixed(1); pct.textContent = Math.round(p * 100) + '%';
      var on = -1; heads.forEach(function (h, i) { if (h && h.getBoundingClientRect().top < window.innerHeight * .35) on = i; });
      links.forEach(function (a, i) { a.classList.toggle('is-on', i === on); });
    });
    window.addEventListener('scroll', f, { passive: true }); f();
    var sh = $('[data-share]');
    if (sh) sh.addEventListener('click', function () {
      try { navigator.clipboard.writeText(location.href).then(function () { O.toast('Link copied'); }, function () { O.toast('Copy the address bar link to share'); }); } catch (e) { O.toast('Copy the address bar link to share'); }
    });
  })();


  /* =====================================================================
     12. ABOUT · 1976 → 2026 timeline drawn as an orbit; badge ring
     ===================================================================== */
  (function timeline() {
    var sec = $('[data-tl]'); if (!sec || RM) return;
    var arc = $('[data-tl-arc]', sec), dotsG = $('[data-tl-dots]', sec), marker = $('[data-tl-marker]', sec);
    var yearEl = $('[data-tl-year]', sec), txtEl = $('[data-tl-txt]', sec);
    var M = $$('[data-tl-list] li', sec).map(function (li) { return { y: +li.getAttribute('data-y'), t: $('span', li).textContent }; });
    var CX = 500, CY = 520, R = 440;
    function pt(t) { var a = Math.PI - t * Math.PI; return [CX + R * Math.cos(a), CY - R * Math.sin(a)]; }
    var dots = M.map(function (m, i) {
      var t = (m.y - 1976) / 50, p = pt(t), g = el('g', { class: 'tl__dot', tabindex: 0, role: 'button', 'aria-label': m.y + ': ' + m.t }, dotsG);
      el('circle', { cx: p[0].toFixed(1), cy: p[1].toFixed(1), r: 11 }, g);
      var lp = pt(t), lx = CX + (R + 38) * Math.cos(Math.PI - t * Math.PI), ly = CY - (R + 38) * Math.sin(Math.PI - t * Math.PI);
      var tx = el('text', { x: lx.toFixed(1), y: (ly + 5).toFixed(1), 'text-anchor': t < .3 ? 'end' : t > .7 ? 'start' : 'middle' }, g); tx.textContent = m.y;
      g.addEventListener('click', function () { jump(i); });
      g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); jump(i); } });
      return g;
    });
    function jump(i) {
      var top = sec.getBoundingClientRect().top + window.scrollY, span = sec.offsetHeight - window.innerHeight;
      window.scrollTo({ top: top + span * ((M[i].y - 1976) / 50) + 2, behavior: 'smooth' });
    }
    var last = -1;
    var f = onFrame(function () {
      var r = sec.getBoundingClientRect(), p = clamp(-r.top / Math.max(1, sec.offsetHeight - window.innerHeight), 0, 1);
      arc.style.setProperty('--off', (1 - p).toFixed(4));
      var q = pt(p); marker.setAttribute('cx', q[0].toFixed(1)); marker.setAttribute('cy', q[1].toFixed(1));
      var year = 1976 + p * 50, idx = 0;
      M.forEach(function (m, i) { if (year >= m.y - .5) idx = i; });
      dots.forEach(function (g, i) { g.classList.toggle('past', i < idx); g.classList.toggle('on', i === idx); });
      if (idx !== last) { last = idx; yearEl.textContent = M[idx].y; txtEl.textContent = M[idx].t; }
    });
    window.addEventListener('scroll', f, { passive: true }); window.addEventListener('resize', f); f();
  })();
  (function badges() {
    var b = $('[data-badges-toggle]'), ring = $('[data-badges]'); if (!b || !ring) return;
    b.addEventListener('click', function () { var on = ring.classList.toggle('paused'); b.setAttribute('aria-pressed', String(on)); b.textContent = on ? 'Resume the orbit' : 'Pause the orbit'; });
    if (RM) { ring.classList.add('paused'); b.hidden = true; }
  })();


  /* =====================================================================
     13. CONTACT · spec list, validation, success iris
     ===================================================================== */
  (function contact() {
    var form = $('[data-form]'); if (!form) return;
    var list = $('[data-spec-list]'), field = $('[data-spec-field]');
    function renderSpec(items) {
      if (!list) return;
      field.value = items.map(function (i) { return i.slug; }).join(',');
      if (!items.length) { list.innerHTML = '<li class="speclist__empty">No luminaires saved yet. Use the <b>+</b> on any product to add it here.</li>'; return; }
      list.innerHTML = items.map(function (i) {
        return '<li>' + (i.img ? '<img src="' + O.esc(i.img) + '" alt="">' : '<span class="ph"></span>') + '<span><b>' + O.esc(i.name) + '</b><small>' + O.esc(i.cat || '') + '</small></span><button type="button" data-rm="' + O.esc(i.slug) + '" aria-label="Remove ' + O.esc(i.name) + '"><svg class="ico" aria-hidden="true"><use href="#i-close"/></svg></button></li>';
      }).join('');
    }
    O.onSpec = renderSpec; renderSpec(O.spec.all());
    if (list) list.addEventListener('click', function (e) { var b = e.target.closest('[data-rm]'); if (b) O.spec.remove(b.getAttribute('data-rm')); });
    // deep links: #spec preselects Spec support, Book a visit preselects visit
    function pick(v) { var r = $('input[name="type"][value="' + v + '"]', form); if (r) r.checked = true; }
    if (location.hash === '#spec') pick('spec');
    window.addEventListener('hashchange', function () { if (location.hash === '#spec') pick('spec'); });
    var visit = $('[data-visit]'); if (visit) visit.addEventListener('click', function () { pick('visit'); });
    var drop = $('.drop input', form), dn = $('[data-drop-n]', form);
    if (drop) drop.addEventListener('change', function () { dn.textContent = drop.files.length ? drop.files.length + ' file' + (drop.files.length > 1 ? 's' : '') : ''; });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = null;
      $$('[required]', form).forEach(function (inp) {
        var ok = inp.type === 'checkbox' ? inp.checked : inp.type === 'email' ? /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(inp.value) : inp.value.trim().length > 1;
        var wrap = inp.closest('.field-big') || inp.closest('.consent');
        if (wrap) wrap.classList.toggle('is-bad', !ok);
        inp.setAttribute('aria-invalid', String(!ok));
        if (!ok && !bad) bad = inp;
      });
      if (bad) { bad.focus(); O.toast('Please check the highlighted fields'); return; }
      var done = $('[data-form-done]', form);
      $('[data-ref]', done).textContent = 'CLB-' + String(Date.now()).slice(-5);
      done.hidden = false; done.focus();
    });
    form.addEventListener('input', function (e) { var w = e.target.closest('.field-big'); if (w && w.classList.contains('is-bad')) w.classList.remove('is-bad'); });
  })();

  /* (page modules are appended below) */
  O.modules = O.modules || {};
  if (O.pageInit) O.pageInit();
})();
