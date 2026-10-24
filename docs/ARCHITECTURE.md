# Architecture

How the frontend is put together, and where to change what. Read [`DESIGN.md`](DESIGN.md) alongside
this if you are touching the UI.

---

## Principles

Five decisions explain almost every oddity in the codebase:

1. **No framework, no build step.** Plain ES2019 in IIFEs, one stylesheet. A judge can clone the
   repo, open it, and read it. Nothing to `npm install` at 3 a.m. in a hackathon venue.
2. **One HTML file, seven views.** Views are `<section class="view">` elements toggled by a router.
   No client-side routing library, no page reloads, no flicker.
3. **Charts are hand-rolled SVG.** Chart.js was in the original plan; writing ~400 lines of SVG
   instead gave full control of typography, motion and tooltips, removed a CDN dependency, and made
   the whole app work offline. Do not add a chart library now.
4. **Data is either bundled or live.** Four pilot sites ship as a generated file; everything else is
   fetched at runtime. Two code paths, clearly separated.
5. **The uncertainty is part of the product.** "No reliable conclusion yet" is a designed state,
   not an error case. Preserve it when you refactor.

---

## Load order

```html
<script src="js/data.js"></script>     <!-- 1. window.NASA_DATA — must come first -->
<script src="js/charts.js"></script>   <!-- 2. window.Charts -->
<script src="js/map.js"></script>      <!-- 3. window.MC -->
<script src="js/power.js"></script>    <!-- 4. window.PowerAPI -->
<script src="js/quiz.js"></script>     <!-- 5. window.Quiz (reads NASA_DATA at load) -->
<script src="js/app.js"></script>      <!-- 6. everything else, boots last -->
```

`app.js` is the only module with side effects at load. It sets `window.MC_CONFIG`, binds the router,
and calls `boot()` on `DOMContentLoaded`. The other five only define globals.

`data.js` is generated — never hand-edit it. See [`DATA.md`](DATA.md).

---

## Module map

| File | Exposes | Responsibility | Depends on |
|---|---|---|---|
| `data.js` | `window.NASA_DATA` | Frozen NASA bundle: 4 sites, 96 tests, GISTEMP | — |
| `charts.js` | `window.Charts` | SVG line/area/bar/spark, tooltips, resize | — |
| `map.js` | `window.MC` | GIBS URLs, before/after slider, Leaflet locator | Leaflet (CDN) |
| `power.js` | `window.PowerAPI` | Live POWER fetch, Theil–Sen, Kendall τ, story builder | `MC_CONFIG` |
| `quiz.js` | `window.Quiz` | 6-question engine | `NASA_DATA`, `MC` |
| `app.js` | — | Router, i18n, CONFIG, every view's render function | all of the above |

---

## The router

```js
const views = ['home','explore','trend','quiz','act','teach','method'];

function go(view, push) { … }
```

- Toggles `.is-active` on `#view-<name>`, which is the only thing `display` reacts to.
- Sets `location.hash` so views are linkable (`#explore`) and back/forward work.
- Listens to `hashchange`, so a pasted URL lands on the right view.
- On every switch it re-arms reveal animations for that view and calls the view's lazy initialiser
  (`onExploreOpen`, `renderHeat`, `renderTeach`, `renderAct`, `renderMethod`).

**Anything with a `data-view` attribute navigates.** `bindNav()` delegates on `document`, so buttons
injected later (the quiz result screen) still work — call `MC.bindNav(root)` after injecting HTML.

> ⚠️ `html { scroll-behavior: smooth }` makes `window.scrollTo` animate. The router uses
> `behavior: 'instant'` deliberately. Keep it, or view switches will visibly scroll.

---

## State

There is no store. Three module-level objects hold everything:

```js
const explore = { ready, story, layer, map, ba, siteIdx };
let  heatPeriod = 2001;
const teachSel  = new Set(['Dhaka', 'Bhola']);
```

`explore.story` is the single source of truth for the Explore view. Both data paths normalise into
the same **story object**, which is why `renderStory()` does not care where the numbers came from:

```js
{
  id?, name, bn, kind, lat, lon,
  sept:   [[year, t2c], …],          // arrays, not objects
  annual: [[year, t2c, mm], …],
  clim:   [12 numbers],
  trend:  { slope, lo, hi, tau, p, q },   // slope in °C per decade
  t2024, p2024,
  isPilot: boolean,
  dq?:    { tEarly, tLate, pEarly, pLate }
}
```

> **The one gotcha that has bitten twice:** `sept` and `annual` are **tuples**, not objects.
> `story.sept[0][1]` is the temperature. `PowerAPI.fetchSeries()` returns objects internally, and
> `storyFor()` converts to tuples at the boundary. If you add a data source, convert there.

---

## Explore render pipeline

```
selectSite(i) ─┐
loadCustom(lat, lon) ─┴─→ renderStory(story)
                              ├── renderSlider(story)     → MC.BeforeAfter.load()
                              ├── renderTemp(story)       → Charts.line() + trend band
                              ├── renderRain(story)       → Charts.line()
                              ├── renderMeaning(story)    → one plain-language sentence
                              ├── renderPassport(story)   → 8 cells + caveat
                              └── renderGlobal()          → GISTEMP, rendered once
```

`renderStory` is idempotent — call it with a new story and everything re-renders. Adding a panel
means adding one line here.

### The trend band maths

The confidence band is anchored at the **mean year**, not at zero:

```js
const meanX = xs.reduce((a,c) => a+c, 0) / xs.length;
trend: { slope, lo: lo/10, hi: hi/10, anchorX: meanX, anchorY: b + slope*meanX }
```

Anchor at 0 and the band fans out to ±30 °C by 2024, which blows up the y-domain and flattens the
line into a rectangle. This is the single most subtle bug in the codebase. Do not "simplify" it.

---

## Contracts

### `Charts.line(host, opts)`

| Option | Type | Notes |
|---|---|---|
| `data` | `[{x, y}]` | ascending x; `x` numeric (year) |
| `color` | css colour | stroke + gradient |
| `fill` | bool | area under the line |
| `yFormat` | `v => string` | axis + tooltip |
| `unit` | string | tooltip suffix, e.g. `' °C'` |
| `label` | string | tooltip series name |
| `xTicks` | int | target count, not exact |
| `yTicks` | int | default 5 |
| `yPad` | float | domain padding ratio, default 0.14 |
| `zero` | bool | force 0 into the domain |
| `animate` | bool | stroke draw-in; auto-disabled in lite mode |
| `trend` | `{slope, lo, hi, anchorX, anchorY}` | dashed line + band |

`Charts.bar`, `Charts.spark` and `Charts.redrawAll()` also exist. All charts self-register and
re-render on resize — you never call resize yourself.

### `MC.BeforeAfter(rootEl)`

Returns `{ load(cfg), reset(), setPos(pct) }`.

```js
ba.load({
  lat, lon,
  aspect: 16/9,      // container ratio — the bbox is derived from it
  latSpan: 0.9,      // degrees of latitude covered
  layer: 'true' | 'false',
  dateA: '2000-11-15', dateB: '2024-11-15',
  yearA: '2000', yearB: '2024',
  w: 1200            // request width; height derived
});
```

`bboxFor()` widens longitude by `1/cos(lat)` so the image is not stretched. The slider clips with
`clip-path` on `--pos`, driven by pointer events and arrow keys.

### `MC.initMap(el, sites, onPick)`

Returns `{ map, focus(lat, lon, id), invalidate() }`. `onPick(lat, lon, idOrNull)` fires on marker
click (`id`) or bare map click (`null`). Call `invalidate()` after the container becomes visible —
Leaflet cannot measure a hidden element.

### `PowerAPI`

```js
PowerAPI.fetchSeries(lat, lon, startYear, endYear)  // → {sept:[{x,y}], annual:[{x,y,p}], clim}
PowerAPI.storyFor(lat, lon)                          // → story object (tuples)
PowerAPI.theilSen(xs, ys, reps?)                     // → {slope, lo, hi, intercept} per decade
PowerAPI.kendall(xs, ys)                             // → {tau, p}
```

Routes through `CONFIG.apiBase` when set — see [`API.md`](API.md).

---

## i18n

A flat key→string dictionary inside `app.js`. Elements opt in with `data-i18n="key"`.

```html
<span data-i18n="hero.cta1">Explore your place</span>
```

`applyLang()` caches the original English in `el.dataset.en` on first switch, so toggling is
lossless. Values containing `<` are injected as HTML (needed for `<strong>` and `<br>`).

**Untranslated keys silently stay English** — that is intentional, so a partial translation never
renders as blanks. Bangla mode deliberately keeps chart axes, dataset names and statistical terms in
English.

Bangla needs different typography, handled by `html[data-lang="bn"]` rules at the end of `app.css`:
looser line-height, no letter-spacing, smaller display sizes. Check any new heading in Bangla before
you ship it — Bangla runs ~20% longer than English.

---

## Motion

- `.reveal` + `data-d="1…5"` for staggered entrance. An `IntersectionObserver` adds `.in`.
- Charts draw in via `stroke-dashoffset`.
- `body.lite` kills all animation and drops imagery to 320 px.
- `prefers-reduced-motion` is respected globally.

Reveals re-arm on view change. If you inject HTML with `.reveal`, observe it manually or it stays
invisible — the element starts at `opacity: 0`.

---

## Performance notes

- Total payload is ~250 KB of source, ~90 KB gzipped. No framework, no polyfills.
- GIBS requests are the slowest thing on the page. The slider shows a skeleton and a
  `is-loaded` / `is-failed` state; never remove that.
- The starfield is capped at 220 particles and throttled to ~30 fps.
- Charts re-render on resize through a single debounced `requestAnimationFrame`, not per-chart
  listeners.

---

## Adding a view — checklist

1. Add `<section class="view" id="view-name">` in `index.html`, after the existing views.
2. Add a `<a data-view="name">` link in the nav and the footer.
3. Add `'name'` to the `views` array in `app.js`.
4. Write `renderName()` and call it from `go()`'s `requestAnimationFrame` block.
5. Add `.view-pad` to the inner wrapper for correct top padding.
6. Add Bangla strings under the same keys in `I18N.bn`.
7. Check at 1440 px, 900 px and 390 px. Check print if it is a teacher-facing page.

## Adding a component

Copy the nearest existing pattern rather than inventing one — the design system is small and
consistent. New tokens go at the top of `app.css` under `:root`, never inline. New component styles
go in the matching section, not at the end of the file.

---

## Debugging

```js
// in the console
NASA_DATA.sites[0]              // Dhaka, full bundle entry
MC.gibsUrl('true', [90,23.4,91,24.3], '2024-11-15', 600, 400)  // inspect an image URL
PowerAPI.storyFor(23.81, 90.41) // live path, returns a promise
Charts.redrawAll()              // force every chart to re-measure
```

Common symptoms:

| Symptom | Cause |
|---|---|
| Chart is empty, axis says `NaN` | data passed as objects where tuples expected (or vice versa) |
| Line is flat at the top of a huge domain | trend band anchored at 0 instead of mean year |
| Map is blank grey | `invalidate()` never called after the container became visible |
| Content invisible after a view switch | `.reveal` elements not re-observed |
| Images never appear | GIBS unreachable — check `is-failed` on `.ba` |
