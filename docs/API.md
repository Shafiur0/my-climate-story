# Backend contract

**Audience:** whoever builds the server. You do not need to have read the frontend.

The frontend already works without a backend — it calls NASA directly from the browser. This
document describes the server that should replace those direct calls, and the exact shapes it must
return so the UI keeps working unchanged.

---

## Why a backend at all

| Problem today | What the backend fixes |
|---|---|
| NASA POWER is slow on a cold request (2–15 s) | Cache it once, serve it in ~40 ms |
| Every visitor hits NASA's API directly | One cache serves everybody; no risk of being rate-limited |
| CORS is open today, but could tighten | Your domain, your headers |
| Statistics run in the browser on every visit | Optional: move them server-side and return finished stories |
| No usage data | You can log which places people actually look at |

It is not required for the demo. It is required for the app to feel fast.

---

## The one rule

> **Do not reshape the data.** Return exactly the shapes below, with the same key names and the
> same array order. The frontend has no adapter layer beyond the check described in
> [Wiring it up](#wiring-it-up).

---

## Conventions

| | |
|---|---|
| Base URL | whatever you deploy, e.g. `https://api.myclimatestory.app` |
| Content type | `application/json; charset=utf-8` (except `/imagery`) |
| CORS | `Access-Control-Allow-Origin: *` on all GET endpoints |
| Auth | none for reads — keep it public, judges must be able to open it |
| Versioning | prefix with `/v1` if you like; set `apiBase` to include it |
| Envelope | **no** `{ data: ... }` wrapper — return the object directly |

### Errors

Any non-2xx must use this shape, so the UI can show something useful:

```json
{ "error": { "code": "NO_DATA", "message": "Insufficient September coverage at this point." } }
```

| Status | Code | When |
|---|---|---|
| 400 | `INVALID_PARAM` | lat/lon/start/end missing or out of range |
| 404 | `NOT_FOUND` | unknown site id, unknown route |
| 422 | `NO_DATA` | coordinate is valid but NASA has too little coverage |
| 429 | `RATE_LIMITED` | include `Retry-After` |
| 502 | `UPSTREAM_ERROR` | NASA returned an error |
| 504 | `UPSTREAM_TIMEOUT` | NASA took too long — the UI retries on next visit |

The frontend surfaces `message` verbatim in a toast and in the "no time series" state, so write it
for a student, not a developer.

---

## `GET /health`

Cheap, no upstream call. Use it for uptime checks.

```json
{ "ok": true, "version": "1.0.0", "upstream": { "power": "ok", "gibs": "ok" } }
```

---

## `GET /power` ★ the important one

The single endpoint the UI needs. Everything else is a convenience.

### Query

| Param | Type | Range | Default |
|---|---|---|---|
| `lat` | float | −85 … 85 | required |
| `lon` | float | −180 … 180 | required |
| `start` | int year | 1981 … 2026 | 1985 |
| `end` | int year | ≥ start, span ≤ 50 | 2024 |

```
GET /power?lat=23.8103&lon=90.4125&start=1985&end=2024
```

### Response

```json
{
  "sept": [
    { "x": 2001, "y": 27.94 },
    { "x": 2002, "y": 27.29 }
  ],
  "annual": [
    { "x": 1985, "y": 26.42, "p": 1113.6 },
    { "x": 1986, "y": 26.16, "p": 1372.8 }
  ],
  "clim": [18.16, 21.9, 26.94, 30.0, 29.97, 29.14, 28.61, 28.41, 27.92, 26.41, 22.92, 19.32],
  "meta": {
    "source": "NASA POWER",
    "product": "MERRA-2",
    "parameters": ["T2M", "PRECTOTCORR"],
    "lat": 23.8103,
    "lon": 90.4125,
    "start": 1985,
    "end": 2024,
    "retrieved": "2026-10-23T00:00:00Z",
    "cached": true
  }
}
```

### Field rules — read these carefully

**`sept`** — September mean 2 m air temperature, °C, one entry per year.
- Ascending by `x`. Only years that have a valid September value.
- **Do not** filter to 2001+ — the frontend does that itself so the window stays adjustable.
- `y` rounded to 2 decimals.

**`annual`** — one entry per year, ascending.
- `y` = mean of that year's monthly `T2M`, °C, 2 decimals.
- `p` = annual rainfall in mm (sum of `PRECTOTCORR mm/day × days in month`), 1 decimal.
- `p` may be `null` if rainfall is incomplete; `y` may be `null` in principle but prefer omitting
  the year entirely if temperature is missing.

**`clim`** — exactly 12 numbers, January → December, °C, 2 decimals. `null` for a month with no data.

**`meta`** — not rendered today, but log it. If a result is disputed, this is the provenance.

### Data cleaning the frontend assumes you did

NASA POWER's monthly response contains traps. Handle all of these server-side:

1. **Month 13 is not a month.** Keys are `YYYYMM`; `YYYY13` is POWER's own annual figure. Skip it.
2. **`-999` is the missing-value sentinel.** Drop any value `<= -900`.
3. **8-digit keys** appear in some responses for annual aggregates. Skip keys whose length ≠ 6.
4. **Rainfall is a daily rate.** `PRECTOTCORR` is mm/day. Multiply by days in the month before
   summing, or annual totals will be ~30× too small.
5. **Leap years.** Use the real day count, not a constant 30.

If fewer than 10 valid September years remain, return **422 `NO_DATA`** rather than a thin series.

---

## `GET /sites`

Pilot site summaries for the left rail. Can be a hardcoded constant — the four sites do not change.

```json
[
  {
    "id": "dhaka",
    "name": "Dhaka",
    "bn": "ঢাকা",
    "lat": 23.8103,
    "lon": 90.4125,
    "kind": "Mega-delta capital",
    "note": "Dense urban core on the Buriganga and Turag.",
    "t2024": 25.44,
    "p2024": 3046.1,
    "trend": { "slope": 0.425, "lo": 0.263, "hi": 0.59, "tau": 0.591, "p": 0.0000572, "q": 0.001372 }
  }
]
```

`slope` is **°C per decade**, not per year. `q` is Benjamini–Hochberg adjusted; `p` is raw.

---

## `GET /sites/:id`

Full story object — same shape as one entry in `app/js/data.js` → `NASA_DATA.sites`.
Include `sept`, `annual`, `clim`, `trend`, `dq`. Optional today (the bundle covers it); useful once
you want the pilot sites to update without a redeploy.

---

## `GET /trends?period=2001`

All 48 tests for the Trend Lab heatmap.

| Param | Values | Default |
|---|---|---|
| `period` | `1985` or `2001` | `2001` |

```json
{
  "period": 2001,
  "tests": [
    { "site": "Dhaka", "start": 2001, "end": 2024, "month": 9,
      "slope": 0.425, "lo": 0.263, "hi": 0.59, "tau": 0.591, "p": 0.0000572, "q": 0.001372 }
  ]
}
```

`month` is 1–12. Must contain exactly 4 sites × 12 months = 48 entries per period.

---

## `GET /global`

```json
{
  "source": "NASA GISTEMP v4",
  "baseline": "1951-1980",
  "series": [[1880, -0.17], [1881, -0.09]]
}
```

`series` is `[year, anomaly°C]` pairs, ascending. Plain arrays, not objects — this one is different
from `sept`/`annual` on purpose; match it exactly.

---

## `GET /imagery` (optional)

A caching proxy in front of NASA GIBS. The browser can reach GIBS directly today, so this is only
worth building if you want long-lived CDN caching or want to hide the upstream.

| Param | | |
|---|---|---|
| `lat`, `lon` | centre of the view | required |
| `date` | `YYYY-MM-DD` | required |
| `layer` | `true` (true colour) or `false` (7-2-1) | `true` |
| `w`, `h` | pixels | `1200`, `675` |

Respond with `image/jpeg`, `Cache-Control: public, max-age=31536000, immutable` — a past date never
changes. Upstream is:

```
https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi
  ?SERVICE=WMS&REQUEST=GetMap&VERSION=1.1.1
  &LAYERS=MODIS_Terra_CorrectedReflectance_TrueColor   (or ..._SurfaceReflectance_Bands721)
  &STYLES=&FORMAT=image/jpeg&SRS=EPSG:4326
  &BBOX={w},{s},{e},{n}&WIDTH={w}&HEIGHT={h}&TIME={date}
```

No key, no login. If you build this, the frontend change is in `app/js/map.js` → `gibsUrl()`.

---

## Caching

| Endpoint | `Cache-Control` | Rationale |
|---|---|---|
| `/power` | `public, max-age=86400` | POWER updates monthly; a day of staleness is free |
| `/sites` | `public, max-age=3600` | rarely changes |
| `/trends` | `public, max-age=86400` | derived from POWER |
| `/global` | `public, max-age=604800` | annual series |
| `/imagery` | `public, max-age=31536000, immutable` | historical dates are fixed |
| `/health` | `no-store` | |

Round `lat`/`lon` to 2 decimals for the cache key. Two requests 1 km apart should share an entry.

**Recommended:** a persistent KV store (Redis, SQLite, Postgres, or even a JSON file on disk) keyed
`power:{lat2}:{lon2}:{start}:{end}`. POWER's first response is slow and its result is stable, so the
cache hit rate will be very high.

---

## Wiring it up

The seam already exists. In `app/js/app.js`:

```js
const CONFIG = {
  ...
  apiBase: ''   // ← set this
};
```

Set it to your base URL (`https://api.example.org` or `https://api.example.org/v1`). That is the
entire integration. `app/js/power.js` checks `window.MC_CONFIG.apiBase` on every request and routes
`fetchSeries()` to `${apiBase}/power?...` instead of NASA.

What does **not** change: the Theil–Sen slope, Kendall τ, bootstrap interval and all rendering still
run in the browser. Your server only needs to serve clean series.

If you later want the server to own the statistics too, add `GET /story?lat=&lon=` returning the
complete story object (`sept`, `annual`, `clim`, `trend`, `t2024`, `p2024`, `dq`, `isPilot: false`)
and branch inside `storyFor()` in `power.js`. Document the shape here first.

---

## A minimal reference implementation

Not production code — just enough to prove the shape.

```js
// Node 20+, no dependencies beyond express + node-fetch (or built-in fetch)
import express from 'express';
const app = express();

const cache = new Map(); // swap for Redis/SQLite
const key = (la, lo, s, e) => `power:${la.toFixed(2)}:${lo.toFixed(2)}:${s}:${e}`;

app.get('/power', async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lon = parseFloat(req.query.lon);
  const start = parseInt(req.query.start ?? 1985, 10);
  const end = parseInt(req.query.end ?? 2024, 10);

  if (!Number.isFinite(lat) || Math.abs(lat) > 85) {
    return res.status(400).json({ error: { code: 'INVALID_PARAM', message: 'Latitude must be between -85 and 85.' } });
  }
  if (!Number.isFinite(lon) || Math.abs(lon) > 180) {
    return res.status(400).json({ error: { code: 'INVALID_PARAM', message: 'Longitude must be between -180 and 180.' } });
  }

  const k = key(lat, lon, start, end);
  if (cache.has(k)) return res.json({ ...cache.get(k), meta: { ...cache.get(k).meta, cached: true } });

  const upstream =
    'https://power.larc.nasa.gov/api/temporal/monthly/point' +
    `?parameters=T2M,PRECTOTCORR&community=AG&longitude=${lon}&latitude=${lat}` +
    `&start=${start}&end=${end}&format=JSON`;

  try {
    const r = await fetch(upstream, { signal: AbortSignal.timeout(30000) });
    if (!r.ok) throw new Error(`upstream ${r.status}`);
    const json = await r.json();
    const out = normalise(json, lat, lon, start, end);
    if (out.sept.length < 10) {
      return res.status(422).json({ error: { code: 'NO_DATA', message: 'Not enough usable September data at this location.' } });
    }
    cache.set(k, out);
    res.set('Cache-Control', 'public, max-age=86400');
    res.json({ ...out, meta: { ...out.meta, cached: false } });
  } catch (err) {
    res.status(502).json({ error: { code: 'UPSTREAM_ERROR', message: 'NASA POWER did not respond. Try again shortly.' } });
  }
});

function normalise(json, lat, lon, start, end) {
  const p = json.properties.parameter;
  const t2m = p.T2M, rain = p.PRECTOTCORR;
  const byYM = {}, years = new Set();

  for (const k of Object.keys(t2m)) {
    if (k.length !== 6) continue;              // skip annual aggregates
    const y = +k.slice(0, 4), m = +k.slice(4, 6);
    if (m < 1 || m > 12) continue;             // skip month 13
    const v = t2m[k];
    if (v == null || v <= -900) continue;      // -999 sentinel
    (byYM[y] ??= {})[m] = v;
    years.add(y);
  }

  const ys = [...years].sort((a, b) => a - b);
  const sept = [];
  const annual = [];

  for (const y of ys) {
    const months = byYM[y];
    const vals = Object.values(months);
    if (vals.length < 10) continue;

    if (months[9] != null) sept.push({ x: y, y: +months[9].toFixed(2) });

    const t = vals.reduce((a, b) => a + b, 0) / vals.length;
    let mm = 0, ok = true;
    for (let m = 1; m <= 12; m++) {
      const v = rain?.[`${y}${String(m).padStart(2, '0')}`];
      if (v == null || v <= -900) { ok = false; break; }
      mm += v * new Date(y, m, 0).getDate();   // mm/day × days
    }
    annual.push({ x: y, y: +t.toFixed(2), p: ok ? +mm.toFixed(1) : null });
  }

  const clim = [];
  for (let m = 1; m <= 12; m++) {
    const v = ys.map(y => byYM[y][m]).filter(x => x != null);
    clim.push(v.length ? +(v.reduce((a, b) => a + b, 0) / v.length).toFixed(2) : null);
  }

  return {
    sept, annual, clim,
    meta: { source: 'NASA POWER', product: 'MERRA-2',
            parameters: ['T2M', 'PRECTOTCORR'],
            lat, lon, start, end,
            retrieved: new Date().toISOString(), cached: false }
  };
}

app.listen(process.env.PORT ?? 8080);
```

Suggested stack, if you want a default: **FastAPI or Express + SQLite/Postgres for the cache**,
deployed on Fly.io, Render or Railway. A single small instance is enough — the cache does the work.

---

## Acceptance tests

Before you call it done, these must pass:

```bash
# 1. Dhaka returns a plausible series
curl -s "http://localhost:8080/power?lat=23.8103&lon=90.4125&start=1985&end=2024" \
  | jq '{sept: (.sept|length), annual: (.annual|length), clim: (.clim|length)}'
# expect: sept 24, annual 40, clim 12

# 2. Second call is fast (cache hit)
time curl -s "http://localhost:8080/power?lat=23.8103&lon=90.4125&start=1985&end=2024" > /dev/null

# 3. Bad latitude is rejected
curl -s "http://localhost:8080/power?lat=999&lon=90&start=2001&end=2024" | jq .error.code
# expect: "INVALID_PARAM"

# 4. Middle of the Pacific returns NO_DATA, not a broken series
curl -s "http://localhost:8080/power?lat=0&lon=-140&start=2001&end=2024" | jq .error.code
# expect: "NO_DATA" (or a valid series — check what POWER actually returns there)

# 5. CORS header present
curl -sI "http://localhost:8080/power?lat=23.8&lon=90.4" | grep -i access-control
```

Then set `apiBase` in `app/js/app.js`, open Explore, type `25.2854 / 51.5310` (Doha) and confirm the
charts render. If they do, the contract holds.
