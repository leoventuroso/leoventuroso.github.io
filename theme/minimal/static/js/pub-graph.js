/* Publications network as a timeline: papers and co-authors.
 *
 * x = publication year (ticks only at years that have a paper, a range
 * frame); one horizontal lane per research theme, labelled directly. Papers
 * are pinned to their year; co-authors float in the lane next to the papers
 * they share. A small force simulation only resolves overlaps.
 *
 * Data is inlined at build time by plugins/publications.py into
 * #pub-graph-data: { themes: [{id, label}], nodes: [...], links: [[paper, author]] }.
 * Progressive enhancement: the figure stays hidden without JS and the list
 * below it is the full content. Colors: --graph-<slot> in style.css,
 * where each theme's slot is fixed by its position in PUBLICATION_THEMES.
 */
(function () {
  'use strict';

  var root = document.getElementById('pub-graph');
  var dataEl = document.getElementById('pub-graph-data');
  if (!root || !dataEl || !window.requestAnimationFrame) return;

  var D;
  try { D = JSON.parse(dataEl.textContent); } catch (e) { return; }
  if (!D.nodes || !D.nodes.length) return;

  var NS = 'http://www.w3.org/2000/svg';
  var canvas = root.querySelector('.pub-graph-canvas');
  var svg = root.querySelector('svg');
  var tip = root.querySelector('.pub-graph-tip');
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var themeIndex = {};
  D.themes.forEach(function (t, i) { themeIndex[t.id] = i; });

  function colorOf(themeId) { return 'var(--graph-' + D.themes[themeIndex[themeId]].slot + ')'; }

  // A paper with two themes gets a ring in the second theme's color; if the
  // two lanes are adjacent it straddles them (`span`), else it stays in the
  // lane of its main theme.
  var N = D.nodes.map(function (n) {
    var lane = themeIndex[n.theme];
    var second = n.themes && n.themes.length > 1 ? themeIndex[n.themes[1]] : undefined;
    return {
      d: n, lane: lane, x: 0, y: 0, vx: 0, vy: 0, fx: null, fy: null,
      r: n.kind === 'paper' ? 8 : 5,
      color: colorOf(n.theme),
      color2: second !== undefined ? colorOf(n.themes[1]) : null,
      span: second !== undefined && Math.abs(second - lane) === 1
        ? [Math.min(lane, second), Math.max(lane, second)] : null
    };
  });
  function laneLo(n) { return n.span ? n.span[0] : n.lane; }
  function laneHi(n) { return n.span ? n.span[1] : n.lane; }
  function shares(p, q) { return laneLo(p) <= laneHi(q) && laneLo(q) <= laneHi(p); }
  function midY(n) { return n.span ? lanes[n.span[0]].bottom : lanes[n.lane].mid; }
  var L = D.links;
  var adj = N.map(function () { return {}; });
  var papersOf = N.map(function () { return []; });
  L.forEach(function (l) {
    adj[l[0]][l[1]] = true; adj[l[1]][l[0]] = true;
    papersOf[l[1]].push(l[0]);
  });

  var years = N.filter(function (n) { return n.d.kind === 'paper'; })
               .map(function (n) { return n.d.year; });
  var y0 = Math.min.apply(null, years), y1 = Math.max.apply(null, years);
  var dataYears = years.filter(function (y, i) { return years.indexOf(y) === i; }).sort();

  var W = 0, H = 0, S = 1, alpha = 0, running = false, drag = null;
  var selected = null, hover = null;
  var PAD = 30, AXIS = 30, LABEL = 22;
  var lanes = [];
  var els = { links: [], nodes: [], lanes: [], ticks: [], axis: null };

  // ---------- scales ----------

  function xOf(year) {
    return PAD + (year - y0 + 0.5) / (y1 - y0 + 1) * (W - 2 * PAD);
  }

  // Lane heights follow how many nodes each theme has (and how many papers
  // share a year in it); the figure grows with the lanes instead of having a
  // fixed aspect ratio. Returns the total height.
  function layoutLanes() {
    var top = 0;
    lanes = D.themes.map(function (t, i) {
      var inLane = N.filter(function (n) { return n.lane === i; });
      var perYear = {}, stack = 1;
      inLane.forEach(function (n) {
        if (n.d.kind !== 'paper') return;
        perYear[n.d.year] = (perYear[n.d.year] || 0) + 1;
        stack = Math.max(stack, perYear[n.d.year]);
      });
      var h = LABEL + Math.max(22 * (Math.sqrt(inLane.length) + 1), 34 * stack + 20) * S;
      var lane = { top: top, bottom: top + h, mid: top + LABEL + (h - LABEL) / 2 };
      top += h;
      return lane;
    });
    return Math.round(top + AXIS);
  }

  function targetX(n, i) {
    if (n.d.kind === 'paper') return xOf(n.d.year);
    var ps = papersOf[i], s = 0;
    ps.forEach(function (p) { s += xOf(N[p].d.year); });
    return ps.length ? s / ps.length : W / 2;
  }

  // ---------- simulation ----------

  function tick(a) {
    var i, j, p, q, dx, dy, d2, d, f, min, push, rest = 30 * S;
    for (i = 0; i < N.length; i++) {
      p = N[i];
      for (j = i + 1; j < N.length; j++) {
        q = N[j];
        if (!shares(p, q)) continue;
        dx = q.x - p.x; dy = q.y - p.y; d2 = dx * dx + dy * dy;
        if (d2 < 0.01) { dx = 0.1; dy = 0.1; d2 = 0.02; }
        d = Math.sqrt(d2); f = Math.min(3, 900 * S * a / d2);
        p.vx -= dx / d * f; p.vy -= dy / d * f; q.vx += dx / d * f; q.vy += dy / d * f;
        min = p.r + q.r + 5;
        if (d < min) {
          push = (min - d) / d * 0.4;
          p.x -= dx * push; p.y -= dy * push; q.x += dx * push; q.y += dy * push;
        }
      }
    }
    L.forEach(function (l) {
      var s = N[l[0]], t = N[l[1]], ddx = t.x - s.x, ddy = t.y - s.y;
      var dd = Math.sqrt(ddx * ddx + ddy * ddy) || 1, k = (dd - rest) / dd * a * 0.06;
      t.vx -= ddx * k; t.vy -= ddy * k;           // only authors follow papers
    });
    for (i = 0; i < N.length; i++) {
      p = N[i];
      var paper = p.d.kind === 'paper';
      p.vx += (targetX(p, i) - p.x) * (paper ? 0.3 : 0.02) * a;
      p.vy += (midY(p) - p.y) * (paper ? 0.1 : 0.015) * a;
      if (p.fx !== null) { p.x = p.fx; p.y = p.fy; p.vx = p.vy = 0; continue; }
      p.vx *= 0.6; p.vy *= 0.6; p.x += p.vx; p.y += p.vy;
      p.x = Math.max(p.r + 2, Math.min(W - p.r - 2, p.x));
      p.y = Math.max(lanes[laneLo(p)].top + LABEL + p.r, Math.min(lanes[laneHi(p)].bottom - p.r - 4, p.y));
    }
  }

  function settle(steps, from) {
    for (var i = 0; i < steps; i++) tick(from * (1 - i / (steps + 40)));
  }

  function kick(a) {
    alpha = Math.max(alpha, a);
    if (reduced) { settle(80, alpha); alpha = 0; render(); return; }
    if (running) return;
    running = true;
    (function loop() {
      tick(alpha);
      if (!drag) alpha *= 0.95;
      render();
      if (alpha > 0.005 || drag) requestAnimationFrame(loop); else running = false;
    })();
  }

  function seed() {
    var s = 7;
    function rnd() { s = (s * 9301 + 49297) % 233280; return s / 233280; }
    N.forEach(function (n, i) {
      n.x = targetX(n, i) + (n.d.kind === 'paper' ? 0 : (rnd() - 0.5) * 50);
      n.y = midY(n) + (n.d.kind === 'paper' ? 0 : (rnd() - 0.5) * 40);
      n.vx = n.vy = 0;
    });
  }

  // ---------- drawing ----------

  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  function build() {
    var gA = el('g', { 'class': 'pg-axis', 'aria-hidden': 'true' }, svg);
    var gT = el('g', { 'class': 'pg-lanes', 'aria-hidden': 'true' }, svg);
    var gL = el('g', { 'class': 'pg-links' }, svg);
    var gN = el('g', { 'class': 'pg-nodes' }, svg);

    els.axis = el('line', { 'class': 'pg-axis-line' }, gA);
    els.ticks = dataYears.map(function (y) {
      var g = el('g', {}, gA);
      el('line', { 'class': 'pg-tick-mark', y1: 0, y2: 4 }, g);
      var t = el('text', { 'class': 'pg-tick', 'text-anchor': 'middle', y: 17 }, g);
      t.textContent = y;
      return { g: g, year: y };
    });

    els.lanes = D.themes.map(function (t, i) {
      var g = el('g', { 'class': 'pg-lane' }, gT);
      var dot = el('circle', { r: 3.5, cx: 4, cy: -4 }, g);
      dot.style.fill = 'var(--graph-' + t.slot + ')';
      var text = el('text', { x: 12 }, g);
      text.textContent = t.label;
      return g;
    });

    els.links = L.map(function (l) {
      var line = el('line', { 'class': 'pg-link' }, gL);
      line.style.setProperty('--c', N[l[0]].color);
      return line;
    });

    els.nodes = N.map(function (n, i) {
      var paper = n.d.kind === 'paper';
      var label = paper
        ? n.d.label + ', ' + n.d.year + ', ' + themeNames(n.d) + '. Show it in the list below.'
        : n.d.label + ', co-author of ' + n.d.papers + (n.d.papers === 1 ? ' paper' : ' papers') + '.';
      var g = el('g', {
        'class': 'pg-node ' + (paper ? 'pg-paper' : 'pg-author'),
        tabindex: 0, role: 'button', 'aria-label': label
      }, gN);
      g.style.setProperty('--c', n.color);
      el('circle', { 'class': 'pg-hit', r: 14 }, g);
      el('circle', { 'class': 'pg-ring', r: n.r + 6 }, g);
      if (n.color2) {
        g.style.setProperty('--c2', n.color2);
        el('circle', { 'class': 'pg-second', r: n.r + 3 }, g);
      }
      el('circle', { 'class': 'pg-mark', r: n.r }, g);
      bindNode(g, i);
      return g;
    });

    svg.addEventListener('pointerdown', function (ev) {
      if (ev.target === svg) { selected = null; style(); }
    });
  }

  function placeStatic() {
    var base = H - AXIS + 8;
    els.axis.setAttribute('x1', xOf(y0).toFixed(1));
    els.axis.setAttribute('x2', xOf(y1).toFixed(1));
    els.axis.setAttribute('y1', base); els.axis.setAttribute('y2', base);
    els.ticks.forEach(function (t) {
      t.g.setAttribute('transform', 'translate(' + xOf(t.year).toFixed(1) + ' ' + base + ')');
    });
    els.lanes.forEach(function (g, i) {
      g.setAttribute('transform', 'translate(0 ' + (lanes[i].top + 14).toFixed(1) + ')');
    });
  }

  function render() {
    L.forEach(function (l, i) {
      var s = N[l[0]], t = N[l[1]], line = els.links[i];
      line.setAttribute('x1', s.x.toFixed(1)); line.setAttribute('y1', s.y.toFixed(1));
      line.setAttribute('x2', t.x.toFixed(1)); line.setAttribute('y2', t.y.toFixed(1));
    });
    N.forEach(function (n, i) {
      els.nodes[i].setAttribute('transform', 'translate(' + n.x.toFixed(1) + ' ' + n.y.toFixed(1) + ')');
    });
    if (!tip.hidden && tip._i !== undefined) placeTip(tip._i);
  }

  // Highlight the focused node (selected, else hovered) and its neighbours.
  function style() {
    var focus = selected !== null ? selected : hover;
    N.forEach(function (n, i) {
      els.nodes[i].classList.toggle('is-dim', focus !== null && i !== focus && !adj[focus][i]);
      els.nodes[i].classList.toggle('is-selected', i === selected);
    });
    L.forEach(function (l, i) {
      var hot = focus !== null && (l[0] === focus || l[1] === focus);
      els.links[i].classList.toggle('is-hot', hot);
      els.links[i].classList.toggle('is-dim', focus !== null && !hot);
    });
  }

  // ---------- interaction ----------

  function themeNames(n) {
    return n.themes.map(function (t) { return D.themes[themeIndex[t]].label; }).join(' + ');
  }

  function showTip(i) {
    var n = N[i].d;
    tip.textContent = '';
    var strong = document.createElement('strong');
    strong.textContent = n.label;
    var meta = document.createElement('span');
    meta.textContent = n.kind === 'paper'
      ? (n.venue ? n.venue + ', ' : '') + n.year + (n.themes.length > 1 ? ' · ' + themeNames(n) : '')
      : n.papers + (n.papers === 1 ? ' paper together' : ' papers together');
    tip.appendChild(strong); tip.appendChild(meta);
    tip._i = i; tip.hidden = false; placeTip(i);
  }

  function hideTip(i) {
    if (i === undefined || tip._i === i) { tip.hidden = true; tip._i = undefined; }
  }

  function placeTip(i) {
    var n = N[i], hx = n.x > W * 0.7 ? 'calc(-100% + 16px)' : (n.x < W * 0.3 ? '-16px' : '-50%');
    tip.style.left = n.x + 'px';
    tip.style.top = n.y + 'px';
    tip.style.transform = 'translate(' + hx + ', ' + (n.y < 90 ? '18px' : 'calc(-100% - 18px)') + ')';
  }

  function activate(i) {
    var n = N[i].d;
    if (n.kind === 'paper') {
      selected = i; style();
      var entry = document.getElementById(n.id);
      if (entry) {
        entry.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
        entry.classList.remove('is-flash');
        void entry.offsetWidth;          // restart the highlight animation
        entry.classList.add('is-flash');
      }
    } else {
      selected = selected === i ? null : i;
      style();
    }
  }

  function toLocal(ev) {
    var r = canvas.getBoundingClientRect();
    return [ev.clientX - r.left, ev.clientY - r.top];
  }

  function bindNode(g, i) {
    // Mobile browsers ignore `touch-action` on elements inside an SVG and
    // turn a drag into a page scroll (cancelling the pointer); block the
    // scroll only for touches that start on a node.
    g.addEventListener('touchstart', function (ev) { ev.preventDefault(); }, { passive: false });
    g.addEventListener('pointerdown', function (ev) {
      if (ev.button !== 0) return;
      g.setPointerCapture(ev.pointerId);
      drag = { i: i, moved: false, x0: ev.clientX, y0: ev.clientY };
      hideTip();
    });
    g.addEventListener('pointermove', function (ev) {
      if (!drag || drag.i !== i) return;
      if (!drag.moved && Math.abs(ev.clientX - drag.x0) + Math.abs(ev.clientY - drag.y0) < 4) return;
      if (!drag.moved) { drag.moved = true; g.classList.add('is-dragging'); }
      var q = toLocal(ev);
      N[i].fx = Math.max(0, Math.min(W, q[0]));
      N[i].fy = Math.max(0, Math.min(H - AXIS, q[1]));
      kick(0.3);
    });
    function end(ev) {
      if (!drag || drag.i !== i) return;
      var click = !drag.moved && ev.type === 'pointerup';
      N[i].fx = N[i].fy = null;       // released: papers spring back to their year
      g.classList.remove('is-dragging');
      drag = null;
      if (click) activate(i); else kick(0.3);
    }
    g.addEventListener('pointerup', end);
    g.addEventListener('pointercancel', end);
    g.addEventListener('pointerenter', function (ev) {
      if (drag || ev.pointerType === 'touch') return;
      hover = i; style(); showTip(i);
    });
    g.addEventListener('pointerleave', function () {
      if (hover === i) { hover = null; style(); }
      hideTip(i);
    });
    g.addEventListener('focus', function () { hover = i; style(); showTip(i); });
    g.addEventListener('blur', function () {
      if (hover === i) { hover = null; style(); }
      hideTip(i);
    });
    g.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); activate(i); }
      if (ev.key === 'Escape') { selected = null; style(); }
    });
  }

  // ---------- sizing ----------

  function measure() {
    return Math.round(canvas.getBoundingClientRect().width);
  }

  function setSize(w) {
    W = w; S = Math.max(0.75, Math.min(1.2, W / 544));
    H = layoutLanes();
    canvas.style.height = H + 'px';
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
  }

  function onResize() {
    var w = measure();
    if (!w || w === W) return;
    setSize(w);
    seed(); settle(200, 1);
    placeStatic(); render();
  }

  // ---------- start ----------

  root.hidden = false;
  var w0 = measure();
  if (!w0) { root.hidden = true; return; }
  setSize(w0);
  seed();
  settle(260, 1);
  build();
  placeStatic();
  style();
  render();
  if (window.ResizeObserver) new ResizeObserver(onResize).observe(canvas);
  if (!reduced) kick(0.1);
})();
