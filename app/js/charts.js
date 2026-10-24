/* ═══════════════════════════════════════════════════════════════
   charts.js — dependency-free SVG chart engine
   Designed for My Climate Story. Everything is drawn by hand so
   the typography, motion and colour stay consistent with the UI.
   ═══════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  let uid = 0;

  function el(name, attrs) {
    const n = document.createElementNS(NS, name);
    if (attrs) for (const k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }
  function txt(x, y, str, attrs) {
    const t = el('text', Object.assign({ x, y }, attrs || {}));
    t.textContent = str;
    return t;
  }
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ── scale helpers ─────────────────────────────────────────── */
  function niceDomain(min, max, padRatio) {
    const pad = (max - min) * (padRatio == null ? 0.12 : padRatio) || 0.5;
    return [min - pad, max + pad];
  }
  function ticks(min, max, count) {
    const span = max - min;
    const raw = span / count;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const norm = raw / mag;
    let step;
    if (norm <= 1) step = 1;
    else if (norm <= 2) step = 2;
    else if (norm <= 2.5) step = 2.5;
    else if (norm <= 5) step = 5;
    else step = 10;
    step *= mag;
    const out = [];
    let t = Math.ceil(min / step) * step;
    for (; t <= max + step * 0.001; t += step) out.push(+t.toFixed(10));
    return out;
  }

  /* ── tooltip ───────────────────────────────────────────────── */
  function ensureTip(host) {
    let tip = host.querySelector('.chart-tip');
    if (!tip) {
      tip = document.createElement('div');
      tip.className = 'chart-tip';
      host.appendChild(tip);
    }
    return tip;
  }

  /* ═══════════════════════════════════════════════════════════
     LINE / AREA CHART
     opts:
       data      [{x, y}]
       color     css colour
       fill      bool
       yFormat   fn
       yPad      ratio
       trend     {slope, lo, hi, anchorX, anchorY}
       zero      draw a zero baseline
       xTicks    number
       unit      string shown in tooltip
       label     series name
       animate   bool
     ═══════════════════════════════════════════════════════════ */
  function lineChart(host, opts) {
    const o = Object.assign({
      color: '#ff7a45', fill: true, yFormat: v => v.toFixed(1),
      yPad: 0.14, xTicks: 6, unit: '', label: '', animate: true, height: null
    }, opts);

    const W = Math.max(host.clientWidth || 0, 220);
    const H = Math.max(o.height || host.clientHeight || 210, 120);
    const P = { t: 14, r: 14, b: 26, l: 44 };
    const iw = W - P.l - P.r;
    const ih = H - P.t - P.b;
    const id = 'c' + (++uid);

    host.innerHTML = '';
    host.style.position = 'relative';

    const svg = el('svg', {
      width: W, height: H, viewBox: `0 0 ${W} ${H}`,
      style: 'display:block;overflow:visible'
    });

    const data = o.data.slice();
    if (!data.length) return;

    const xs = data.map(d => d.x);
    const ys = data.map(d => d.y);
    let yMin = Math.min.apply(null, ys), yMax = Math.max.apply(null, ys);
    if (o.trend) {
      const t = o.trend;
      [t.slope, t.lo, t.hi].forEach(s => {
        [data[0].x, data[data.length - 1].x].forEach(x => {
          const v = t.anchorY + s * (x - t.anchorX);
          if (isFinite(v)) { yMin = Math.min(yMin, v); yMax = Math.max(yMax, v); }
        });
      });
    }
    if (o.zero) { yMin = Math.min(yMin, 0); yMax = Math.max(yMax, 0); }
    const [d0, d1] = niceDomain(yMin, yMax, o.yPad);
    const xMin = xs[0], xMax = xs[xs.length - 1];

    const sx = v => P.l + ((v - xMin) / (xMax - xMin || 1)) * iw;
    const sy = v => P.t + ih - ((v - d0) / (d1 - d0 || 1)) * ih;

    /* defs */
    const defs = el('defs');
    const grad = el('linearGradient', { id: id + 'g', x1: 0, y1: 0, x2: 0, y2: 1 });
    grad.appendChild(el('stop', { offset: '0%', 'stop-color': o.color, 'stop-opacity': .34 }));
    grad.appendChild(el('stop', { offset: '62%', 'stop-color': o.color, 'stop-opacity': .08 }));
    grad.appendChild(el('stop', { offset: '100%', 'stop-color': o.color, 'stop-opacity': 0 }));
    defs.appendChild(grad);

    const glow = el('filter', { id: id + 'f', x: '-30%', y: '-60%', width: '160%', height: '260%' });
    glow.appendChild(el('feGaussianBlur', { stdDeviation: 4, result: 'b' }));
    const merge = el('feMerge');
    merge.appendChild(el('feMergeNode', { in: 'b' }));
    merge.appendChild(el('feMergeNode', { in: 'SourceGraphic' }));
    glow.appendChild(merge);
    defs.appendChild(glow);
    svg.appendChild(defs);

    /* grid + y axis */
    const gGrid = el('g');
    const yt = ticks(d0, d1, o.yTicks || 5);
    yt.forEach(v => {
      const y = sy(v);
      if (y < P.t - 1 || y > P.t + ih + 1) return;
      gGrid.appendChild(el('line', {
        x1: P.l, x2: P.l + iw, y1: y, y2: y,
        stroke: 'rgba(255,255,255,.055)', 'stroke-width': 1
      }));
      gGrid.appendChild(txt(P.l - 10, y + 3.5, o.yFormat(v), {
        'text-anchor': 'end', fill: '#5c6880',
        'font-family': 'JetBrains Mono, monospace', 'font-size': 9.5, 'letter-spacing': '.04em'
      }));
    });

    /* zero baseline */
    if (o.zero && d0 < 0 && d1 > 0) {
      gGrid.appendChild(el('line', {
        x1: P.l, x2: P.l + iw, y1: sy(0), y2: sy(0),
        stroke: 'rgba(255,255,255,.18)', 'stroke-width': 1, 'stroke-dasharray': '3 3'
      }));
    }
    svg.appendChild(gGrid);

    /* x axis */
    const gX = el('g');
    const step = Math.max(1, Math.ceil(data.length / o.xTicks));
    data.forEach((d, i) => {
      if (i % step !== 0 && i !== data.length - 1) return;
      gX.appendChild(txt(sx(d.x), P.t + ih + 17, String(d.x), {
        'text-anchor': 'middle', fill: '#5c6680',
        'font-family': 'JetBrains Mono, monospace', 'font-size': 9.5, 'letter-spacing': '.03em'
      }));
    });
    svg.appendChild(gX);

    /* confidence band */
    if (o.trend) {
      const t = o.trend;
      const pts = [];
      for (let i = 0; i < data.length; i++) {
        const x = data[i].x;
        const yv = t.anchorY + t.hi * (x - t.anchorX);
        pts.push([sx(x), sy(yv)]);
      }
      for (let i = data.length - 1; i >= 0; i--) {
        const x = data[i].x;
        const yv = t.anchorY + t.lo * (x - t.anchorX);
        pts.push([sx(x), sy(yv)]);
      }
      svg.appendChild(el('polygon', {
        points: pts.map(p => p.join(',')).join(' '),
        fill: o.color, 'fill-opacity': .11, stroke: 'none'
      }));
    }

    /* area */
    if (o.fill) {
      const ap = [`${sx(data[0].x)},${P.t + ih}`]
        .concat(data.map(d => `${sx(d.x)},${sy(d.y)}`))
        .concat([`${sx(data[data.length - 1].x)},${P.t + ih}`]);
      svg.appendChild(el('polygon', { points: ap.join(' '), fill: `url(#${id}g)` }));
    }

    /* line path */
    let dstr = '';
    data.forEach((d, i) => { dstr += (i ? 'L' : 'M') + sx(d.x).toFixed(2) + ',' + sy(d.y).toFixed(2) + ' '; });
    const path = el('path', {
      d: dstr.trim(), fill: 'none', stroke: o.color,
      'stroke-width': 2.1, 'stroke-linejoin': 'round', 'stroke-linecap': 'round',
      filter: `url(#${id}f)`
    });
    svg.appendChild(path);

    /* trend line */
    if (o.trend) {
      const t = o.trend;
      const y1 = t.anchorY + t.slope * (xMin - t.anchorX);
      const y2 = t.anchorY + t.slope * (xMax - t.anchorX);
      svg.appendChild(el('line', {
        x1: sx(xMin), y1: sy(y1), x2: sx(xMax), y2: sy(y2),
        stroke: 'rgba(238,242,251,.75)', 'stroke-width': 1.5,
        'stroke-dasharray': '5 4', 'stroke-linecap': 'round'
      }));
    }

    /* dots (hidden until hover) */
    const gDots = el('g');
    data.forEach(d => {
      gDots.appendChild(el('circle', {
        cx: sx(d.x), cy: sy(d.y), r: 2.6,
        fill: '#0a101d', stroke: o.color, 'stroke-width': 1.4, opacity: .55
      }));
    });
    svg.appendChild(gDots);

    /* hover layer */
    const cross = el('line', {
      y1: P.t, y2: P.t + ih, stroke: 'rgba(255,255,255,.28)',
      'stroke-width': 1, 'stroke-dasharray': '3 3', opacity: 0
    });
    const hov = el('circle', {
      r: 5, fill: o.color, stroke: '#04060d', 'stroke-width': 2,
      opacity: 0, filter: `url(#${id}f)`
    });
    svg.appendChild(cross);
    svg.appendChild(hov);

    const hit = el('rect', {
      x: P.l, y: P.t, width: iw, height: ih, fill: 'transparent',
      style: 'cursor:crosshair'
    });
    svg.appendChild(hit);
    host.appendChild(svg);

    const tip = ensureTip(host);

    function onMove(ev) {
      const r = svg.getBoundingClientRect();
      const px = (ev.touches ? ev.touches[0].clientX : ev.clientX) - r.left;
      let best = 0, bd = Infinity;
      data.forEach((d, i) => {
        const dd = Math.abs(sx(d.x) - px);
        if (dd < bd) { bd = dd; best = i; }
      });
      const d = data[best];
      const cx = sx(d.x), cy = sy(d.y);
      cross.setAttribute('x1', cx); cross.setAttribute('x2', cx); cross.setAttribute('opacity', 1);
      hov.setAttribute('cx', cx); hov.setAttribute('cy', cy); hov.setAttribute('opacity', 1);

      tip.innerHTML =
        `<span class="tip-x">${d.x}</span>` +
        `<span class="tip-v">${o.yFormat(d.y)}<em>${o.unit}</em></span>` +
        (o.label ? `<span class="tip-l">${o.label}</span>` : '');
      tip.classList.add('on');

      const tw = tip.offsetWidth || 90;
      let lx = cx + 12;
      if (lx + tw > W - 4) lx = cx - tw - 12;
      tip.style.transform = `translate(${Math.max(2, lx)}px, ${clamp(cy - 46, 2, H - 60)}px)`;
    }
    function onLeave() {
      cross.setAttribute('opacity', 0);
      hov.setAttribute('opacity', 0);
      tip.classList.remove('on');
    }
    hit.addEventListener('mousemove', onMove);
    hit.addEventListener('mouseleave', onLeave);
    hit.addEventListener('touchstart', onMove, { passive: true });
    hit.addEventListener('touchmove', onMove, { passive: true });
    hit.addEventListener('touchend', onLeave);

    /* draw-in animation */
    if (o.animate && !document.body.classList.contains('lite')) {
      try {
        const len = path.getTotalLength();
        path.style.strokeDasharray = len;
        path.style.strokeDashoffset = len;
        path.getBoundingClientRect();
        path.style.transition = 'stroke-dashoffset 1.5s cubic-bezier(.22,1,.36,1)';
        path.style.strokeDashoffset = 0;
        setTimeout(() => { path.style.strokeDasharray = ''; path.style.transition = ''; }, 1700);
      } catch (e) { /* jsdom */ }
    }
  }

  /* ═══════════════════════════════════════════════════════════
     BAR / COLUMN CHART (seasonal climatology)
     ═══════════════════════════════════════════════════════════ */
  function barChart(host, opts) {
    const o = Object.assign({
      labels: [], values: [], color: '#2ee6c5', yFormat: v => v.toFixed(0),
      unit: '', highlight: -1
    }, opts);
    const W = Math.max(host.clientWidth || 0, 220);
    const H = Math.max(host.clientHeight || 180, 120);
    const P = { t: 16, r: 10, b: 26, l: 38 };
    const iw = W - P.l - P.r, ih = H - P.t - P.b;

    host.innerHTML = '';
    const svg = el('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}`, style: 'display:block' });

    const vMin = Math.min.apply(null, o.values);
    const vMax = Math.max.apply(null, o.values);
    const [d0, d1] = niceDomain(vMin, vMax, 0.18);
    const sy = v => P.t + ih - ((v - d0) / (d1 - d0 || 1)) * ih;

    ticks(d0, d1, 3).forEach(v => {
      const y = sy(v);
      svg.appendChild(el('line', { x1: P.l, x2: P.l + iw, y1: y, y2: y, stroke: 'rgba(255,255,255,.05)' }));
      svg.appendChild(txt(P.l - 8, y + 3.5, o.yFormat(v), {
        'text-anchor': 'end', fill: '#5c6880', 'font-family': 'JetBrains Mono, monospace', 'font-size': 9
      }));
    });

    const bw = iw / o.values.length;
    const barW = bw * 0.58;
    o.values.forEach((v, i) => {
      const x = P.l + i * bw + (bw - barW) / 2;
      const y = sy(v);
      const h = Math.max(1, P.t + ih - y);
      const isHi = i === o.highlight;
      const rect = el('rect', {
        x, y: P.t + ih, width: barW, height: 0, rx: Math.min(3, barW / 2),
        fill: isHi ? '#ff7a45' : o.color, 'fill-opacity': isHi ? .95 : .42
      });
      svg.appendChild(rect);
      requestAnimationFrame(() => {
        rect.style.transition = 'y .7s cubic-bezier(.22,1,.36,1), height .7s cubic-bezier(.22,1,.36,1)';
        rect.setAttribute('y', y); rect.setAttribute('height', h);
      });
      svg.appendChild(txt(x + barW / 2, P.t + ih + 16, o.labels[i] || '', {
        'text-anchor': 'middle', fill: isHi ? '#ff7a45' : '#5c6880',
        'font-family': 'JetBrains Mono, monospace', 'font-size': 9
      }));
    });

    host.appendChild(svg);
  }

  /* ═══════════════════════════════════════════════════════════
     SPARKLINE
     ═══════════════════════════════════════════════════════════ */
  function spark(host, values, color) {
    const W = 100, H = 30;
    host.innerHTML = '';
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: '100%', height: '100%', preserveAspectRatio: 'none' });
    const mn = Math.min.apply(null, values), mx = Math.max.apply(null, values);
    const d = values.map((v, i) => {
      const x = (i / (values.length - 1)) * W;
      const y = H - 3 - ((v - mn) / (mx - mn || 1)) * (H - 6);
      return `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    svg.appendChild(el('path', { d, fill: 'none', stroke: color || '#2ee6c5', 'stroke-width': 1.6, 'vector-effect': 'non-scaling-stroke', 'stroke-linecap': 'round' }));
    host.appendChild(svg);
  }

  /* ── responsive re-render registry ─────────────────────────── */
  const registry = new Map();
  let raf = null;
  function schedule() {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      registry.forEach(rec => {
        if (!rec.host.isConnected) return;
        if (rec.host.offsetParent === null) return;
        const w = rec.host.clientWidth;
        if (w === rec.w) return;
        rec.w = w;
        rec.render();
      });
    });
  }
  global.addEventListener('resize', schedule, { passive: true });

  function mount(host, renderer) {
    const rec = { host, render: () => renderer(host), w: -1 };
    registry.set(host, rec);
    rec.w = host.clientWidth;
    renderer(host);
  }

  global.Charts = {
    line(host, opts) { mount(host, h => lineChart(h, opts)); },
    bar(host, opts) { mount(host, h => barChart(h, opts)); },
    spark,
    redrawAll() { registry.forEach(r => { r.w = -1; }); schedule(); }
  };
})(window);
