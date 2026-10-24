/* ═══════════════════════════════════════════════════════════════
   power.js — live NASA POWER retrieval + statistics in the browser
   Used for any coordinate that is not one of the four pilot sites.
   The maths mirrors the offline analysis in the research workbook:
   Theil–Sen slope, Kendall tau-b, bootstrap interval.
   ═══════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  const API = 'https://power.larc.nasa.gov/api/temporal/monthly/point';

  /* ── backend seam ──────────────────────────────────────────────
     When window.MC_CONFIG.apiBase is set (js/app.js → CONFIG.apiBase),
     every request goes to the team backend instead of NASA directly.
     The backend must return the same normalised shape fetchSeries()
     produces: { sept: [{x,y}], annual: [{x,y,p}], clim: [12] }.
     See docs/API.md.
     ───────────────────────────────────────────────────────────── */
  function apiBase() {
    return (window.MC_CONFIG && window.MC_CONFIG.apiBase) || '';
  }

  function backendUrl(lat, lon, start, end) {
    const base = apiBase().replace(/\/+$/, '');
    return base + '/power?lat=' + lat.toFixed(4) + '&lon=' + lon.toFixed(4) +
      '&start=' + start + '&end=' + end;
  }

  function median(a) {
    const s = a.slice().sort((x, y) => x - y);
    const m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  }

  /* ── Kendall tau-b with normal-approximation p ─────────────── */
  function kendall(xs, ys) {
    const n = xs.length;
    let C = 0, D = 0, tx = 0, ty = 0;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = xs[j] - xs[i], dy = ys[j] - ys[i];
        if (dx === 0 && dy === 0) continue;
        if (dx === 0) { tx++; continue; }
        if (dy === 0) { ty++; continue; }
        if (dx * dy > 0) C++; else D++;
      }
    }
    const n0 = (n * (n - 1)) / 2;
    const denom = Math.sqrt((n0 - tx) * (n0 - ty));
    const tau = denom ? (C - D) / denom : 0;
    const varTau = (2 * (2 * n + 5)) / (9 * n * (n - 1));
    const z = tau / Math.sqrt(varTau);
    const p = 2 * (1 - normCdf(Math.abs(z)));
    return { tau: +tau.toFixed(3), p: Math.max(p, 1e-12) };
  }

  function normCdf(z) {
    // Abramowitz & Stegun 7.1.26
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp(-z * z / 2);
    const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return z > 0 ? 1 - prob : prob;
  }

  /* ── Theil–Sen slope with bootstrap interval ───────────────── */
  function theilSen(xs, ys, reps) {
    const n = xs.length;
    const slopes = [];
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = xs[j] - xs[i];
        if (dx !== 0) slopes.push((ys[j] - ys[i]) / dx);
      }
    }
    const slope = median(slopes);

    // bootstrap
    const R = reps || 400;
    const boots = [];
    for (let r = 0; r < R; r++) {
      const bx = [], by = [];
      for (let k = 0; k < n; k++) {
        const idx = Math.floor(Math.random() * n);
        bx.push(xs[idx]); by.push(ys[idx]);
      }
      const bs = [];
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const dx = bx[j] - bx[i];
          if (dx !== 0) bs.push((by[j] - by[i]) / dx);
        }
      }
      if (bs.length) boots.push(median(bs));
    }
    boots.sort((a, b) => a - b);
    const lo = boots.length ? boots[Math.floor(boots.length * 0.025)] : slope;
    const hi = boots.length ? boots[Math.floor(boots.length * 0.975)] : slope;

    // intercept anchored at the median residual
    const res = xs.map((x, i) => ys[i] - slope * x);
    const intercept = median(res);

    return {
      slope: +(slope * 10).toFixed(3),   // per decade
      lo: +(lo * 10).toFixed(3),
      hi: +(hi * 10).toFixed(3),
      intercept
    };
  }

  /* ── fetch + shape ─────────────────────────────────────────── */
  function url(lat, lon, start, end) {
    return API +
      '?parameters=T2M,PRECTOTCORR&community=AG' +
      '&longitude=' + lon.toFixed(4) +
      '&latitude=' + lat.toFixed(4) +
      '&start=' + start + '&end=' + end + '&format=JSON';
  }

  async function fetchSeries(lat, lon, startYear, endYear) {
    if (apiBase()) {
      const res = await fetch(backendUrl(lat, lon, startYear, endYear));
      if (!res.ok) throw new Error('Backend request failed: ' + res.status);
      const json = await res.json();
      if (!json || !Array.isArray(json.sept)) throw new Error('Malformed /power response');
      return json; // already normalised — no reshaping needed
    }

    const res = await fetch(url(lat, lon, startYear, endYear), { cache: 'force-cache' });
    if (!res.ok) throw new Error('POWER request failed: ' + res.status);
    const json = await res.json();
    const params = json.properties && json.properties.parameter;
    if (!params || !params.T2M) throw new Error('No T2M in response');

    const t2m = params.T2M, precip = params.PRECTOTCORR;
    const byYearMonth = {};
    const years = new Set();

    Object.keys(t2m).forEach(key => {
      if (key.length !== 6) return;          // skip 8-digit annual keys
      const y = +key.slice(0, 4);
      const m = +key.slice(4, 6);
      if (m < 1 || m > 12) return;           // skip month 13 (annual)
      const v = t2m[key];
      if (v == null || v <= -900) return;
      (byYearMonth[y] = byYearMonth[y] || {})[m] = v;
      years.add(y);
    });

    const yearList = Array.from(years).sort((a, b) => a - b);

    // September series (matches the pilot methodology)
    const sept = [];
    yearList.forEach(y => {
      const v = byYearMonth[y] && byYearMonth[y][9];
      if (v != null) sept.push({ x: y, y: +v.toFixed(2) });
    });

    // annual mean T + annual rainfall
    const annual = [];
    yearList.forEach(y => {
      const months = byYearMonth[y];
      if (!months) return;
      const vals = Object.keys(months).map(k => months[k]);
      if (vals.length < 10) return;
      const t = vals.reduce((a, b) => a + b, 0) / vals.length;
      let rain = 0;
      let ok = true;
      for (let m = 1; m <= 12; m++) {
        const key = y + String(m).padStart(2, '0');
        const pd = precip && precip[key];
        if (pd == null || pd <= -900) { ok = false; break; }
        const days = new Date(y, m, 0).getDate();
        rain += pd * days;
      }
      annual.push({ x: y, y: +t.toFixed(2), p: ok ? +rain.toFixed(1) : null });
    });

    // climatology
    const clim = [];
    for (let m = 1; m <= 12; m++) {
      const vals = yearList.map(y => byYearMonth[y] && byYearMonth[y][m]).filter(v => v != null);
      clim.push(vals.length ? +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2) : null);
    }

    return { sept, annual, clim, meta: json.header || null };
  }

  /* ── full story for an arbitrary coordinate ────────────────── */
  async function storyFor(lat, lon) {
    const raw = await fetchSeries(lat, lon, 1985, 2024);
    const septWindow = raw.sept.filter(d => d.x >= 2001);
    if (septWindow.length < 10) throw new Error('Insufficient September coverage at this point');

    const xs = septWindow.map(d => d.x);
    const ys = septWindow.map(d => d.y);
    const ts = theilSen(xs, ys);
    const k = kendall(xs, ys);

    const annualT = raw.annual.filter(d => d.y != null);
    const last = annualT[annualT.length - 1] || { y: null, p: null };
    const early = annualT.filter(d => d.x >= 1985 && d.x <= 1994);
    const late = annualT.filter(d => d.x >= 2015 && d.x <= 2024);
    const mean = arr => arr.length ? arr.reduce((a, b) => a + b.y, 0) / arr.length : null;
    const meanP = arr => {
      const v = arr.filter(d => d.p != null);
      return v.length ? v.reduce((a, b) => a + b.p, 0) / v.length : null;
    };

    return {
      name: Math.abs(lat).toFixed(2) + '° ' + (lat >= 0 ? 'N' : 'S') + ', ' +
            Math.abs(lon).toFixed(2) + '° ' + (lon >= 0 ? 'E' : 'W'),
      bn: null,
      kind: 'Custom coordinates',
      lat, lon,
      // normalised to the same [year, value, ...] tuples used by the bundled pilot data
      sept: septWindow.map(d => [d.x, d.y]),
      annual: raw.annual.map(d => [d.x, d.y, d.p]),
      clim: raw.clim,
      trend: {
        slope: ts.slope, lo: ts.lo, hi: ts.hi,
        tau: k.tau, p: k.p, q: k.p,       // single test → p is the honest figure
        intercept: ts.intercept
      },
      t2024: last.y,
      p2024: last.p,
      isPilot: false,
      dq: (mean(early) != null && mean(late) != null) ? {
        tEarly: +mean(early).toFixed(2),
        tLate: +mean(late).toFixed(2),
        pEarly: meanP(early) != null ? Math.round(meanP(early)) : null,
        pLate: meanP(late) != null ? Math.round(meanP(late)) : null
      } : null
    };
  }

  global.PowerAPI = { fetchSeries, storyFor, theilSen, kendall };
})(window);
