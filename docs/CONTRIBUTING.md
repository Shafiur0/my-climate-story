# Contributing

Short version: **keep it dependency-free, keep it honest, check it in Bangla and on a phone before
you open a PR.**

---

## Before your first commit

Read, in this order:

1. [`../README.md`](../README.md) — what the app is and how to run it
2. [`ARCHITECTURE.md`](ARCHITECTURE.md) — if you touch `app/js/`
3. [`DESIGN.md`](DESIGN.md) — if you touch `app/css/`
4. [`API.md`](API.md) — if you are building the backend
5. [`DATA.md`](DATA.md) — if you touch data, numbers, or copy about numbers

---

## Running it

```bash
cd app
python -m http.server 4173
```

No install step. If someone adds one, that is a bug worth raising in review.

---

## Branches

```
main            always deployable
feat/<thing>    new feature            feat/trend-lab-filters
fix/<thing>     bug fix                fix/chart-nan-axis
data/<thing>    data or statistics     data/add-khulna-site
docs/<thing>    documentation only     docs/api-contract
```

Keep branches short-lived. Rebase on `main` rather than merging `main` in.

---

## Commits

```
<type>: <what changed, imperative, lowercase>

<why, if it is not obvious>
```

Types: `feat` `fix` `data` `docs` `style` `refactor` `perf` `chore`

```
fix: anchor confidence band at mean year

The band was anchored at x=0, so it fanned out to ±30 °C by 2024 and
flattened the y-domain. Anchor at mean(x) instead.
```

One logical change per commit. Do not bundle a data regeneration with a CSS tweak — the diff
becomes unreviewable.

---

## Code style

No linter is configured. Match the surrounding code.

### JavaScript

- ES2019 inside an IIFE. `'use strict'`. No modules, no bundler.
- `const` by default, `let` when reassigned, never `var`.
- Arrow functions for callbacks; `function` for named top-level functions (they read better in
  stack traces).
- Two-space indent, semicolons, single quotes.
- Globals are namespaced: `window.MC`, `window.Charts`, `window.PowerAPI`, `window.Quiz`,
  `window.NASA_DATA`. Nothing else leaks.
- Prefer early returns over nesting.
- Comment the *why*, not the *what*. The existing comments explain decisions and traps — keep that
  standard.

### CSS

- Two-space indent, one selector per line, no nesting (plain CSS, no preprocessor).
- Tokens only. No hex outside `:root`.
- Component blocks in the same order as the page, separated by the existing banner comments.
- Media queries at the bottom: `1180px` → `900px` → `620px`.

### HTML

- Semantic elements. `<button>` for actions, `<a>` for navigation — do not swap them for styling.
- Every icon-only control needs an `aria-label`.
- New user-facing strings get a `data-i18n` key and a Bangla entry.

---

## Data changes

If you touch `Delta_Detectives_NASA_Climate_Evidence.xlsx`:

```bash
python scripts/build_data.py
```

Commit **both** the workbook and the regenerated `app/js/data.js` in the same commit. Never
hand-edit `data.js`.

If you add a site, the Benjamini–Hochberg correction must be re-run across the new total number of
tests — see [`DATA.md`](DATA.md#adding-a-pilot-site).

---

## PR checklist

Copy this into the PR description.

```markdown
## What changed
-

## Why
-

## Checked
- [ ] Desktop 1440 px
- [ ] Tablet 900 px
- [ ] Mobile 390 px
- [ ] English and বাংলা
- [ ] Lite mode (nav cloud icon)
- [ ] Print, if teacher-facing
- [ ] No console errors
- [ ] No new dependencies
- [ ] No claim added that the data does not support
```

Anything that adds a `<script src>` from a CDN needs a one-line justification in the PR. The
default answer is no.

---

## Manual QA script

Run this before any release. It takes about five minutes.

1. **Home** — hero fits one screen at 1440×900; ticker scrolls; before/after slider drags smoothly.
2. **Explore** — pick each of the four sites; charts draw; passport values change; no `NaN` in axes.
3. **Live data** — type `25.2854` / `51.5310` (Doha). Expect a rising September trend and a
   desert rainfall series. This proves the POWER path still works.
4. **Layer toggle** — switch to false colour; rivers should read sharply.
5. **Trend Lab** — toggle 2001 ⇄ 1985; hover several cells; detail panel updates.
6. **Quiz** — play all six questions to the result screen; ring animates.
7. **Take action** — tick four cards; counter reads 4; filter to "At school".
8. **Teachers** — deselect all sites, confirm the empty state; reselect; print preview is legible.
9. **Method** — data-source table, AI block, submission block all render.
10. **Bangla** — toggle, check the hero and one long page for clipping.
11. **Lite mode** — toggle, confirm animation stops and imagery degrades to 320 px.
12. **Console** — zero errors throughout.

---

## Reviews

| Area | Needs a review from |
|---|---|
| `app/js/**` | another developer |
| `app/css/**`, layout changes | designer |
| any number, statistic, or claim | whoever owns the research |
| `docs/API.md` | backend owner |

If you change a number in the UI, say where it came from in the PR. "It looked about right" is how
climate misinformation gets shipped.

---

## Deploying

The site is static. Publish `app/` — nothing else.

### First publish to GitHub

One-time setup. Requires the GitHub CLI (`gh auth login` once, then it persists).

```bash
gh repo create my-climate-story --public --source=. --remote=origin --push
```

That creates the repo, adds `origin`, and pushes `main` in one step. If the repo already exists:

```bash
git remote add origin https://github.com/<user>/my-climate-story.git
git push -u origin main
```

The repo must be **public** — judges need to open it without a login.

### Current deployment

| | |
|---|---|
| Production | <https://my-climate-story.vercel.app> |
| Repository | <https://github.com/Shafiur0/my-climate-story> |
| Vercel project | `my-climate-story` |
| Root directory | **`app`** — this is essential, the site is not at the repo root |
| Build command | none (static) |
| Output directory | `app` (the project root, once Root Directory is set) |

> **Status:** deployed by CLI, not yet connected to Git. Until the Vercel GitHub App is installed
> and the repo connected, pushes do **not** auto-deploy — run `vercel --prod` from `app/` after
> changes. See *Connecting Git* below.

### Connecting Git (auto-deploy)

The project was created from the CLI, so Vercel does not yet know about the repository.

1. Install the Vercel GitHub App: <https://github.com/apps/vercel> → **Install** → grant access to
   `my-climate-story`
2. Vercel dashboard → project **my-climate-story** → **Settings → Git → Connect Git Repository**
3. Choose `Shafiur0/my-climate-story` and set **Root Directory** to `app`
4. Confirm

From then on every push to `main` deploys to production and pull requests get preview URLs.

`vercel git connect <url>` fails with *"Make sure you have access to the repository"* until step 1
is done — that error means the App is not installed, not that the URL is wrong.

### Vercel via the dashboard (recommended)

1. **Add New → Project**, import this repository
2. Set **Root Directory** to `app`
3. Framework preset: **Other**. Build command: leave empty. Output directory: leave default
4. Deploy

Every push to `main` then redeploys automatically. Pull requests get preview URLs.

> ⚠️ If you forget to set Root Directory to `app`, the deployment succeeds but the URL returns
> a 404 — Vercel serves the repo root, which has no `index.html`.

### Vercel via CLI

```bash
cd app
vercel link --project my-climate-story --yes
vercel --prod
```

Useful for a quick deploy, but it does not create a git link, so pushes will not auto-deploy.

### GitHub Pages (alternative)

Settings → Pages → *Deploy from a branch* → `main`, folder `/app`.
Both hosts work; Vercel is the one currently in use.

### After deploying

Put the repository URL into `CONFIG.repo` in `app/js/app.js` so the footer and the submission
block link to it, then redeploy. Test that link in a **private window** — judges score repository
access 0 or 1, and an unauthenticated 404 costs a point.

---

## Space Apps rules that affect the code

| Rule | What it means here |
|---|---|
| Event code stays open source | MIT licence, public repo, no obfuscation |
| Only public, login-free links | The repo and any Drive folder must open without a request |
| No faces or names of under-18s | No photographs of people anywhere in the app |
| Declare every AI tool | Keep the Method page AI block accurate; update it if you use a new tool |
| English subtitles on video demos | Not code, but it is checked at the same time |
| Do not use others' assets without consent | Every image in this repo is NASA public domain or generated in-repo |

If you are unsure whether something is allowed, ask before you commit it — not after.
