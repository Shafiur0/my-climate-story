# Data & statistics

What the app reads, how it is cleaned, how the numbers are produced, and what the app is therefore
allowed to claim.

---

## The three products

| Product | What we take | Why |
|---|---|---|
| **NASA POWER** (MERRA-2) | `T2M` (°C), `PRECTOTCORR` (mm/day), monthly, 1985–2024 | The only source that gives a *location-specific* series from lat/lon alone, with no key |
| **NASA GIBS** | MODIS Terra true colour + bands 7-2-1 | Before/after imagery, 2000 → 2024, no key, tiles straight into a browser |
| **NASA GISTEMP v4** | Global land–ocean anomaly, 1880–2025 | Planetary context — never subtracted from local values |

Both POWER and GIBS are keyless and CORS-open, which is why the app can run with no backend.

**Landsat is not used yet.** It is the only way to get a genuine 1980s scene, but it needs an
Earthdata login and a preprocessing step, so it is listed as future work and the app says so rather
than implying a 40-year photo pair.

---

## Endpoints

### POWER — monthly point

```
https://power.larc.nasa.gov/api/temporal/monthly/point
  ?parameters=T2M,PRECTOTCORR
  &community=AG
  &longitude=90.4125&latitude=23.8103
  &start=1985&end=2024
  &format=JSON
```

Response keys are `YYYYMM`. **`YYYY13` is POWER's own annual figure, not a month.**

### GIBS — WMS

```
https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi
  ?SERVICE=WMS&REQUEST=GetMap&VERSION=1.1.1
  &LAYERS=MODIS_Terra_CorrectedReflectance_TrueColor
  &STYLES=&FORMAT=image/jpeg&SRS=EPSG:4326
  &BBOX={west},{south},{east},{north}&WIDTH=1200&HEIGHT=675
  &TIME=2024-11-15
```

False colour swaps the layer for `MODIS_Terra_SurfaceReflectance_Bands721`, which separates water
from vegetation far more sharply — the view a remote-sensing analyst would actually use.

MODIS true colour begins in **2000**, which is why the comparison is 2000 vs 2024 and not 1985.

### GIBS — WMTS tiles (the Leaflet basemap)

```
https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_ShadedRelief_Bathymetry
  /default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg
```

The `GoogleMapsCompatible_Level8` segment is required; `500m` returns HTTP 400.

### GISTEMP — v4 annual table

```
https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.csv
```

---

## Five cleaning rules

Every one of these has silently corrupted a climate chart somewhere. They are applied in
`scripts/build_data.py` and again in `app/js/power.js` for live requests.

1. **Skip month 13.** `YYYY13` is an annual aggregate. Averaging it in double-counts the year.
2. **`-999` is the missing sentinel.** Drop any value `<= -900`.
3. **`PRECTOTCORR` is a daily rate.** Multiply by the number of days in the month before summing.
   Forgetting this makes annual rainfall ~30× too small.
4. **Use real month lengths.** Leap years matter when summing rainfall.
5. **Require ≥ 10 valid months** before computing an annual mean, otherwise the year is dropped.

A year with fewer than 10 valid months is omitted rather than interpolated. The app would rather
show a gap than invent a point.

---

## The statistics

Three tests, all standard, all reproducible by hand.

### 1. Theil–Sen slope

The median of all pairwise slopes:

```
slopes = [ (y_j - y_i) / (x_j - x_i)  for all i < j where x_j != x_i ]
slope  = median(slopes)
```

Reported **per decade** (`slope × 10`). Why not least squares: a single bad year — a station
outage, a reanalysis step change — drags an OLS fit, while the median of pairwise slopes barely
moves. It tolerates roughly 29% contaminated data before breaking down.

The intercept is anchored on the median residual, `median(y_i - slope·x_i)`, so the fitted line
passes through the middle of the cloud rather than being pulled by the ends.

### 2. Kendall τ-b

Measures monotonic association without assuming linearity:

```
τ = (C − D) / sqrt((n₀ − n₁)(n₀ − n₂))

C  = concordant pairs, D = discordant pairs
n₀ = n(n−1)/2,  n₁ = pairs tied in x,  n₂ = pairs tied in y
```

Significance via the normal approximation, `z = τ / sqrt(2(2n+5) / (9n(n−1)))`, two-tailed.

### 3. Benjamini–Hochberg correction

We run **48 tests** per period (4 sites × 12 months). At α = 0.05, roughly 2.4 of them would look
significant by chance alone. BH controls the false discovery rate:

```
sort p ascending → p₁ … pₘ
qᵢ = min over j ≥ i of ( pⱼ · m / j )
```

The app reports **q**, not p, for the pilot sites. For an arbitrary coordinate only a single test is
run, so **p** is the honest figure and the passport labels it as such.

### Bootstrap interval

The 95% interval on the slope comes from 400 resamples of the (year, value) pairs, taking the 2.5th
and 97.5th percentile of the resampled median slopes. In the browser this runs in well under 100 ms
for n = 24.

---

## The data bundle

`app/js/data.js` sets one global. Generated — never hand-edited.

```js
window.NASA_DATA = {
  meta: {
    team, app, challenge, event, retrieved,
    global2024,          // 1.28 — GISTEMP 2024 anomaly, °C vs 1951–1980
    nMonthly, nAnnual, nTests
  },

  sites: [{
    name: 'Dhaka', bn: 'ঢাকা', id: 'dhaka',
    lat: 23.8103, lon: 90.4125,
    bbox: [w, s, e, n],          // fallback only; frontend derives its own
    kind: 'Mega-delta capital', note: '…',

    sept:   [[2001, 27.94], …],          // 24 entries, [year, °C]
    annual: [[1985, 26.42, 1113.6], …],  // 40 entries, [year, °C, mm]
    clim:   [18.16, 21.9, …],            // 12 monthly means, Jan→Dec

    trend: { slope: 0.425, lo: 0.263, hi: 0.59, tau: 0.591, p: 5.7e-5, q: 0.001372 },
    t2024: 25.44, p2024: 3046.1,
    dq: { tEarly: 26.49, tLate: 25.51, pEarly: 1101, pLate: 2809 }
  }],

  trends: [{ site, start, end, month, slope, lo, hi, tau, p, q }],  // 96 entries
  gistemp: [[1880, -0.17], …]                                      // 146 entries
}
```

`slope` is always **°C per decade**. `month` is 1–12. `trends` contains both periods: filter on
`start === 2001` or `start === 1985`.

> **Tuples, not objects.** `sept[0][1]` is the temperature. `PowerAPI.fetchSeries()` uses objects
> internally and converts at the boundary in `storyFor()`. See `ARCHITECTURE.md`.

---

## Regenerating

```bash
pip install openpyxl
python scripts/build_data.py
```

Reads `Delta_Detectives_NASA_Climate_Evidence.xlsx`, writes `app/js/data.js`, prints a summary.
Output is deterministic — running it twice produces an identical bundle.

The workbook is the source of truth. If you add a site, add its rows there first.

---

## Adding a pilot site

1. Fetch POWER monthly data for the coordinates, 1985–2024, `T2M` + `PRECTOTCORR`.
2. Add the monthly rows to `Monthly NASA`, the derived annual rows to `Annual NASA`.
3. Run the trend tests (Theil–Sen + Kendall, then BH across all sites × months) and add them to
   `Trend Tests`. **The BH correction must be re-run across the new total** — 5 sites × 12 months
   is 60 tests, not 48.
4. Add a `SITE_META` entry in `scripts/build_data.py` (id, Bangla name, kind, note).
5. Run the script. Confirm the printed slope and q look sane.
6. Add the site to `Trend Lab` expectations: the heatmap iterates `NASA_DATA.sites`, so it adapts
   automatically, but the notes text hardcodes "four sites" in a few places.

---

## The data-quality finding — read before you present

Comparing the raw **1985–1994** and **2015–2024** decades implies **cooling at all four sites**,
plus rainfall increases that are not physically plausible:

| Site | Mean T | Annual rainfall |
|---|---|---|
| Dhaka | 26.49 → 25.51 °C | 1,101 → 2,809 mm |
| Satkhira | 26.46 → 25.96 °C | 1,157 → 2,636 mm |
| Sylhet | 24.88 → 24.53 °C | 1,801 → 5,261 mm |
| Bhola | 26.23 → 25.70 °C | 1,080 → 4,234 mm |

These numbers are arithmetically correct outputs from the downloaded data. **They are not an
established forty-year climate trend.** Reanalysis depends on changing input observations, model
versions and bias-correction procedures, and the series shows step changes consistent with product
transitions.

The app reports **"no reliable conclusion yet"** for that window. Do not remove that. It is the most
credible thing on the Method page.

---

## What the app may and may not claim

| ✅ Supported | ❌ Not supported |
|---|---|
| September warmed at all four pilot sites, 2001–2024, after BH correction | That Bangladesh warmed or cooled over 1985–2024 |
| 2024 was the warmest year in the GISTEMP record (+1.28 °C) | That the river moved *because of* climate change |
| The satellite imagery shows a different channel geometry in 2000 vs 2024 | That the change is climate-attributable |
| POWER values are modelled reanalysis for a grid cell | That they are a thermometer reading at an address |

Bank erosion, dredging, upstream flow, tides and land use all move a shoreline. Two satellite dates
show *that* something changed, never *why*.

---

## Sources

- POWER monthly API — <https://power.larc.nasa.gov/docs/services/api/temporal/monthly/>
- POWER parameter dictionary — <https://power.larc.nasa.gov/parameters/>
- GISTEMP v4 — <https://data.giss.nasa.gov/gistemp/data_v4.html>
- Worldview / GIBS — <https://worldview.earthdata.nasa.gov/>
- Landsat data overview — <https://science.nasa.gov/mission/landsat/data-overview/>
- MERRA-2 — <https://www.earthdata.nasa.gov/data/projects/merra-2>
- MOD13Q1 NDVI — <https://search.earthdata.nasa.gov/search?q=MOD13Q1>
