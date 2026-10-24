# My Climate Story

**NASA Space Apps Challenge 2026 · Bangladesh Local Events · 13–14 November 2026**
Challenge: *Be an Earth System Trend Detective* · Theme: *The Next Frontier*

Team **Delta Detectives** — a mobile-friendly web app that lets anyone pick a place on Earth and
watch four decades of NASA satellite data tell them what actually changed there: the river, the
heat, the rain. Plain language, low bandwidth, and an Evidence Passport behind every number.

> **Status:** the frontend is complete and deployable. There is no backend yet — the browser talks
> to NASA directly. This repo is structured so a backend can be dropped in without touching the UI.

---

## Quick start

There is **no build step, no package manager, no framework.** It is static files.

```bash
cd app
python -m http.server 4173
# open http://127.0.0.1:4173
```

Any static server works (`npx serve app`, `php -S`, VS Code Live Server). Opening `index.html`
directly from disk mostly works, but `fetch()` to NASA POWER needs a real origin — use a server.

---

## What works today

| View | What it does | Data source |
|---|---|---|
| **Home** | Rotating NASA Blue Marble, live before/after slider, method walkthrough | GIBS |
| **Explore** | Map picker, satellite comparison, temperature + rainfall charts, Evidence Passport | POWER, GIBS |
| **Trend Lab** | 4 sites × 12 months heatmap of all 48 Theil–Sen tests, hover any cell | POWER |
| **Quiz** | 6 questions using real imagery and real trend values | GIBS, POWER |
| **Take action** | 9 locally-sized steps with a pledge counter | — |
| **Teachers** | Comparison table builder, 3×45 min lesson plan, print/PDF | POWER |
| **Method** | Research method, data-quality finding, data sources, AI disclosure, submission block | — |

**Two data paths — this matters when you touch the code:**

1. **Bundled (offline).** The four pilot sites — Dhaka, Satkhira, Sylhet, Bhola — ship as
   `app/js/data.js`, generated ahead of time from the research workbook. No network needed.
2. **Live (in-browser).** Any other coordinate is fetched from the NASA POWER API at runtime and
   the statistics are computed in the browser (`app/js/power.js`). Verified against Doha, Qatar.

Also included: full **English ⇄ বাংলা** switcher, a **low-data mode**, and a print stylesheet.

---

## Repository layout

```
.
├── README.md                  ← you are here
├── docs/
│   ├── ARCHITECTURE.md        how the frontend is built, and where to change what
│   ├── API.md                 ★ the backend contract — read this if you build the server
│   ├── DATA.md                NASA sources, the statistics, the data bundle schema
│   ├── DESIGN.md              design tokens and component inventory
│   └── CONTRIBUTING.md        git workflow, code style, PR checklist, deploy
│
├── app/                       ← the deployable site (publish this folder)
│   ├── index.html             all seven views live here
│   ├── css/app.css            the entire design system, ~1.2k lines
│   └── js/
│       ├── data.js            generated NASA bundle — do not hand-edit
│       ├── charts.js          hand-rolled SVG chart engine
│       ├── map.js             NASA GIBS URLs, before/after slider, Leaflet locator
│       ├── power.js           live POWER fetch + Theil–Sen / Kendall τ  ← backend seam
│       ├── quiz.js            quiz engine
│       └── app.js             router, i18n, all view rendering, CONFIG
│
└── *.xlsx / *.docx / *.pdf    original research material — reference only, not served
```

---

## Pick your role

| If you are… | Read first | Then |
|---|---|---|
| **Backend developer** | [`docs/API.md`](docs/API.md) | [`docs/DATA.md`](docs/DATA.md) for the maths |
| **Frontend developer** | [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | [`docs/DESIGN.md`](docs/DESIGN.md) |
| **Designer** | [`docs/DESIGN.md`](docs/DESIGN.md) | `app/css/app.css` |
| **Data / research** | [`docs/DATA.md`](docs/DATA.md) | the `.xlsx` workbook in the repo root |
| **Presenter / storyteller** | this file | run the app and follow the Explore → Trend Lab → Method path |

---

## Before you submit

Fill these in. They are all in `app/js/app.js` near the top, inside `CONFIG`:

```js
const CONFIG = {
  repo: '',      // public GitHub URL — judges score this 0 or 1
  video: '',     // 30-second final video (YouTube/Vimeo)
  team: [        // every member, with role
    // { name: 'Full Name', role: 'Frontend & data visualisation' },
  ],
  apiBase: ''    // set only when the backend exists
};
```

Judges check that the repo link opens **without a login**, in a private window. Test it.

Also verify: the AI disclosure on the Method page says the prompt log is kept with the project
documentation — make sure that is actually true before submitting.

---

## Submission facts (from the official Participants Guide)

| Item | Detail |
|---|---|
| Bangladesh hackathon | **13–14 November 2026**, Friday + Saturday |
| Global window | 14–15 November 2026 — Bangladesh runs one day ahead |
| Team size | 1–6, solo allowed |
| Eligibility | All ages. Under 18 needs a guardian registered and present at all times |
| Repository | Public, open access, no login |
| Required fields | Summary, 30-second demo, AI use disclosure, NASA data sources, references |

**Score sheet:** Impact / Creativity / Validity / Relevance / Presentation at 20 each (100),
Teamwork / UX / NASA data usage at 5 each (15), challenge named / repo access / project page
complete at 1 each (3) → **118 max**, plus a 5% bonus for teams with women members.

---

## Known limitations — say these out loud

- NASA POWER is **modelled reanalysis**, not a thermometer at an address. The app says so.
- The 1985–2024 raw series shows *apparent cooling* plus implausible rainfall jumps. That is a
  reanalysis artefact. The app reports **"no reliable conclusion yet"** rather than a false trend.
- The imagery slider is **MODIS (2000 → 2024)**, not a true 1985 comparison. Landsat is needed for
  that and requires an Earthdata login — it is listed as future work, not claimed.
- Serial autocorrelation in the yearly series has not been fully corrected for.
- Any coordinate outside the four pilot sites is a **single uncorrected test** — the app labels it
  `p`, not `q`, and says so in the passport.

These are not bugs. Showing uncertainty is the differentiator. Do not paper over them in a pitch.

---

## Roadmap

- [ ] Backend proxy + cache for POWER (see `docs/API.md`) — removes CORS risk and speeds up first load
- [ ] Landsat 5 / 8–9 scene pairs for a real 1980s comparison
- [ ] Measured water/land area change in hectares
- [ ] Offline service worker so the pilot sites work with no signal at all
- [ ] Community memory overlay, opt-in and consent-recorded
- [ ] Teacher dashboard

---

## Credits and licence

NASA data is public domain, retrieved 23 October 2026.
Imagery © NASA GIBS · MODIS Terra. Temperature and rainfall © NASA POWER (MERRA-2).
Global anomaly © NASA GISTEMP v4.

Third-party libraries: [Leaflet](https://leafletjs.com) 1.9.4 (BSD-2-Clause),
Google Fonts — Space Grotesk, Inter, JetBrains Mono, Noto Sans Bengali (OFL).
Everything else — the design system, the chart engine, the slider, the statistics — is written
in this repo.

Code is released under the MIT Licence. Space Apps requires event code to stay open source.
