# Design system

Everything visual lives in `app/css/app.css` (~1,200 lines, organised in the same order as the
page). There are no inline styles except computed chart geometry and heatmap cell colours.

---

## Intent

> **An observatory, not a dashboard.**

Satellite imagery is the hero material, so the interface recedes into deep space and lets the
imagery glow. Two accents carry meaning and nothing else:

- **Aurora (teal)** — data, evidence, "this checks out"
- **Ember (orange)** — warming, heat, "pay attention"

Violet appears only for NASA-adjacent context and the AI disclosure. Gold is reserved for caution
and uncertainty. If you use these colours decoratively, the semantics stop working — that is the
one rule worth defending in review.

---

## Tokens

All in `:root`. Never hardcode a hex outside this block.

### Surfaces

| Token | Value | Use |
|---|---|---|
| `--void` | `#04060d` | page background |
| `--abyss` | `#060a14` | ticker, inset panels |
| `--panel` | `#0a101d` | cards, charts, passport |
| `--panel-2` | `#0c1424` | nested surfaces |
| `--glass` | `rgba(255,255,255,.035)` | subtle fills |
| `--line` | `rgba(255,255,255,.075)` | 1 px borders, dividers |
| `--line-2` | `rgba(255,255,255,.14)` | emphasised borders, inputs |

### Text

| Token | Value | Use |
|---|---|---|
| `--ink` | `#eef2fb` | headings, primary |
| `--ink-2` | `#bcc6d9` | body copy |
| `--muted` | `#8592ab` | secondary, descriptions |
| `--dim` | `#5c6880` | labels, captions, axis text |

Four levels, not more. If something needs a fifth grey, it probably needs a different size or weight
instead.

### Accents

| Token | Value | Meaning |
|---|---|---|
| `--aurora` | `#2ee6c5` | data, verified, positive action |
| `--aurora-d` | `#0fa08c` | pressed / gradient end |
| `--ember` | `#ff7a45` | warming, heat, temperature |
| `--ember-2` | `#ff4d3d` | error, wrong answer |
| `--violet` | `#8b7cf6` | global context, AI disclosure |
| `--gold` | `#ffc861` | caution, uncertainty, data-quality warning |

### Geometry

| Token | Value |
|---|---|
| `--r-xs` … `--r-xl` | `8 / 12 / 18 / 26 / 36 px` |
| `--maxw` | `1260px` |
| `--ease` | `cubic-bezier(.22,1,.36,1)` — the only easing curve |
| `--shadow-sm` / `--shadow` / `--shadow-lg` | progressively deeper, always negative-spread |

Radii encode hierarchy: pills for actions, 18 px for cards, 26 px for large panels, 36 px for the
full-width CTA.

---

## Typography

| Role | Family | Notes |
|---|---|---|
| Display | **Space Grotesk** | headings, numbers, big statements |
| Body | **Inter** | paragraphs, UI labels |
| Mono | **JetBrains Mono** | eyebrows, data labels, chips, axis text |
| Bangla | **Noto Sans Bengali** | appended to every stack as fallback |

All four are loaded from Google Fonts with `display=swap`. If you add a font, add it to the single
`<link>` in `index.html` — not a second request.

### Scale

| Element | Size | Treatment |
|---|---|---|
| Hero `h1` | `clamp(2.9rem, 5.1vw, 4.7rem)` | `line-height: 1.02`, `letter-spacing: -.042em` |
| Section `h2` | `clamp(1.9rem, 3.4vw, 3rem)` | `-.036em` |
| Card `h3` | `1.02rem` | `-.02em` |
| Body | `15–16px` | `line-height: 1.6–1.72` |
| `.lede` | `clamp(1.02rem, 1.32vw, 1.19rem)` | `weight 300`, `--ink-2` |
| `.eyebrow` | `11px` mono | uppercase, `letter-spacing: .16em`, aurora |

**Negative tracking on display type is deliberate.** Space Grotesk opens up at large sizes; the
negative letter-spacing is what makes it read as designed rather than default.

Eyebrows are the signature detail: a 26 px rule, uppercase mono, wide tracking, aurora. Every
section has one. Keep that rhythm.

---

## Component inventory

| Component | Root class | Notes |
|---|---|---|
| Nav | `.nav` | fixed, 76 px → 66 px on scroll, glass blur when stuck |
| Brand | `.brand`, `.brand-mark` | inline SVG, no image request |
| Language toggle | `.lang-toggle`, `.lt-thumb` | sliding pill, `data-lang` on the button |
| Buttons | `.btn` + `--primary` / `--ghost` / `--outline` / `-sm` / `-lg` | primary has a shine sweep on hover |
| Eyebrow | `.eyebrow`, `.eyebrow-line` | the section signature |
| Chip / badge | `.chip`, `.badge`, `.htag` | mono, uppercase, 7 px radius |
| Card | `.card`, `.card-head`, `.card-sub`, `.card-foot` | the workhorse container |
| Before/after | `.ba`, `.ba-before`, `.ba-handle`, `.ba-tag` | clip-path slider, see below |
| Evidence Passport | `.passport`, `.pp-grid`, `.pp-cell` | 4×2 mono spec sheet |
| Meaning card | `.meaning-card` | the plain-language payoff |
| Heatmap | `.heat`, `.hcell`, `.heat-detail` | 13-column CSS grid |
| Quiz | `.q-card`, `.q-opt`, `.q-imgpair`, `.qr-ring` | |
| Action card | `.act-card` | checkbox + filter |
| Comparison table | `.ctable` | teachers page, print-safe |
| Data source table | `.ds-table`, `.ds-row` | 3-column grid, collapses to cards |
| AI block | `.ai-block`, `.ai-grid` | violet-tinted |
| Submission | `.sub-block`, `.sub-grid` | teal-tinted |
| Toast | `.toast` | single instance, bottom centre |

### The before/after slider

```html
<div class="ba" style="--pos:50%">
  <img class="ba-img ba-after">
  <div class="ba-before"><img class="ba-img ba-before-img"></div>
  <div class="ba-line"></div><div class="ba-handle">…</div>
  <div class="ba-tag ba-tag-l">2000</div>
  <div class="ba-tag ba-tag-r">2024</div>
  <div class="ba-skel"><i></i><i></i><i></i></div>
</div>
```

The "before" image is **full size** and clipped with
`clip-path: inset(0 calc(100% - var(--pos)) 0 0)` — never set its width to 50%, or the image
squashes instead of revealing. The skeleton sits at `z-index: 0` behind both images and is hidden by
`.is-loaded`.

### Heatmap colours

Computed in JS, not CSS, because they are data-driven:

```js
v >= 0 ? mix([24,32,48], [255,122,69], |v|^0.75)   // warming
       : mix([24,32,48], [46,230,197], |v|^0.75)   // cooling
```

`v = slope / max|slope|` across the visible period, clamped to ±1. The `0.75` exponent lifts small
values so the grid does not read as mostly grey. Significance is a white dot, not a colour change —
the colour already means "how fast", so it cannot also mean "how sure".

---

## Motion

| Pattern | Duration | Where |
|---|---|---|
| Reveal on scroll | 850 ms, staggered 70 ms | `.reveal` + `data-d="1…5"` |
| View transition | 550 ms | `.view.is-active` |
| Chart draw-in | 1,500 ms | `stroke-dashoffset` |
| Hover lift | 300–450 ms | cards, buttons |
| Earth rotation | 150 s | hero |

Rules:

- **One easing curve.** Everything uses `--ease`. A second curve reads as a bug.
- **Never animate layout.** Transform and opacity only.
- **`body.lite` kills all motion** and drops imagery to 320 px. Test it.
- **`prefers-reduced-motion` is honoured** at the bottom of the stylesheet.

---

## Accessibility

| Requirement | How |
|---|---|
| Keyboard | slider is `tabindex="0"` with ← → support; all controls are real buttons |
| Focus | `:focus-visible` → 2 px aurora ring, 3 px offset, global |
| Contrast | body text ≥ 7:1 on `--void`; `--dim` is only for 9–11 px labels, never body copy |
| Motion | respects `prefers-reduced-motion` |
| Screen readers | `aria-label` on icon-only buttons, `aria-expanded` on the burger, `aria-pressed` on lite mode |
| Colour | never the sole carrier of meaning — significance also gets a dot, warming also gets a `+` sign |
| Under-18 rule | no photographs of people anywhere in the app |

---

## Bangla

Bangla is not English with different glyphs. It needs:

- **Line height 1.32–1.85** (matras sit above and below the baseline; tight leading clips them)
- **`letter-spacing: 0`** — negative tracking breaks conjuncts
- **Smaller display sizes** — Bangla runs ~20% longer, so the hero drops from 4.7 rem to 3.2 rem
- **No forced `<br>`** in headings — the line breaks fall differently

All handled by the `html[data-lang="bn"]` block at the end of `app.css`. **Every new heading must be
checked in Bangla before merge.** This is the most common way to break the layout.

---

## Do / don't

**Do**
- Use an eyebrow above every section heading
- Let one accent colour carry one meaning per view
- Keep the mono font for anything that is a *label* or a *number*
- Put a caveat next to any number that needs one

**Don't**
- Introduce a fifth grey, a second easing curve, or a new radius
- Use ember for decoration — it means warming
- Add a chart library
- Animate `height`, `width`, `top` or `left`
- Remove the skeleton from the slider
- Claim certainty the data does not support

---

## Extending

1. Add tokens to `:root` only if a value repeats three times.
2. Add the component in the matching section of `app.css`, following the existing comment banners.
3. Use `rem` for type, `px` for borders and radii.
4. Check at 1440 / 900 / 390 px, in both languages, and in lite mode.
5. If it is teacher-facing, check `@media print` too.
