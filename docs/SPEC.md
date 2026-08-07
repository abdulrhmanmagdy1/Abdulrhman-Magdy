# SPEC.md — Requirements as testable assertions

Every line is a **binary, checkable claim**. Nothing ships until every applicable
line is `[x]`, verified by `qa-tester` (behaviour) or `design-auditor` (visual) —
never by the builder.

Status legend: `[ ]` open · `[x]` verified & signed off · `[~]` blocked/deferred (needs an ADR) · `[n/a]` ruled out of scope

Verifier column: **QA** = `qa-tester`, **DA** = `design-auditor`, **ORCH** = orchestrator.

---

## S0 — Environment & QA pipeline (this phase)

| # | Assertion | Verifier | Status |
|---|-----------|----------|--------|
| S0.1 | `CLAUDE.md`, `docs/SPEC.md`, `docs/PROGRESS.md`, `docs/DECISIONS.md` all exist and are non-empty. | ORCH | [x] |
| S0.2 | `.claude/agents/` contains `builder.md`, `qa-tester.md`, `design-auditor.md`, each with valid YAML frontmatter (`name`, `description`, `tools`). | ORCH | [x] |
| S0.3 | An untouched copy of Horizon 4.1.3 is present at the repo root (`sections/`, `blocks/`, `snippets/`, `assets/`, `templates/`, `config/`, `layout/`, `locales/`). | ORCH | [x] |
| S0.4 | `shopify theme dev --store=abdulrhman-magdy-48-teststore.myshopify.com` serves a 200 response on `http://127.0.0.1:9292/`. | ORCH | [x] |
| S0.5 | `npx playwright install chromium` completed; Playwright is a devDependency. | ORCH | [x] |
| S0.6 | `node scripts/screenshot.mjs` writes real, non-empty PNGs to `qa/screens/` at **1440**, **768**, and **375** px wide. | ORCH | [x] |
| S0.7 | Each captured PNG's actual pixel width equals its requested viewport width (proves the capture, not a stub). | ORCH | [x] |
| S0.8 | The screenshot script exits **non-zero** when the page emits console errors / pageerrors / failed requests, and reports them. | ORCH | [x] |
| S0.9 | `.gitignore` excludes `qa/`, `design-reference/`, and `node_modules/`. | ORCH | [x] |
| S0.10 | The full loop (`theme dev` → capture → PNG on disk) was proven on the **untouched** theme **before** any feature code was written. | ORCH | [x] |

---

## S1 — Section registration & merchant configuration

| # | Assertion | Verifier | Status |
|---|-----------|----------|--------|
| S1.1 | A section named "Tisso vison in the wild" is selectable from the theme-editor "Add section" list. | QA | [ ] |
| S1.2 | The section can be added to the homepage template, reordered, and removed without a Liquid error. | QA | [ ] |
| S1.3 | The section heading text is merchant-editable and defaults to "Tisso vison in the wild". | QA | [ ] |
| S1.4 | **The grid renders exactly 6 blocks**, each bound to a product picker. | QA | [ ] |
| S1.5 | Each block exposes: an image picker, a product picker, and hotspot X/Y position controls. | QA | [ ] |
| S1.6 | Block `max_blocks` is 6 — the editor refuses a 7th block. | QA | [ ] |
| S1.7 | With fewer than 6 blocks configured, the section renders without error and without a collapsed/broken grid. | QA | [ ] |
| S1.8 | With a block whose product picker is empty, the section renders without error (no `nil` output, no broken markup). | QA | [ ] |
| S1.9 | No merchant-facing string is hardcoded in Liquid; all live in schema defaults or `locales/en.default.json`. | QA | [ ] |
| S1.10 | Section presets exist so the section drops in pre-populated. | QA | [ ] |

---

## S2 — Layout & responsiveness

| # | Assertion | Verifier | Status |
|---|-----------|----------|--------|
| S2.1 | At **1440px**: grid is 3 columns × 2 rows. | DA | [ ] |
| S2.2 | At **768px**: grid is 2 columns × 3 rows. | DA | [ ] |
| S2.3 | At **375px**: grid is 2 columns × 3 rows (per `design-reference/mobile.png`). | DA | [ ] |
| S2.4 | Tiles keep a consistent aspect ratio across all breakpoints; no image is stretched or letterboxed. | DA | [ ] |
| S2.5 | `document.documentElement.scrollWidth <= window.innerWidth` at all three widths — **zero horizontal overflow**. | QA | [ ] |
| S2.6 | Cumulative Layout Shift attributable to the section is 0 (images carry intrinsic `width`/`height` or an `aspect-ratio` box). | QA | [ ] |
| S2.7 | Section heading typeface, size, weight, and letter-spacing match the reference within the tolerance in ADR-004. | DA | [ ] |
| S2.8 | Grid gutter and section padding match the reference proportionally within tolerance. | DA | [ ] |
| S2.9 | No layout regression on the rest of the homepage — hero, announcement bar, header unchanged vs the baseline capture. | DA | [ ] |

---

## S3 — Hotspot behaviour

| # | Assertion | Verifier | Status |
|---|-----------|----------|--------|
| S3.1 | Each tile renders exactly one circular `+` hotspot. | DA | [ ] |
| S3.2 | The hotspot sits at the merchant-configured X/Y percentage, and moves when those settings change. | QA | [ ] |
| S3.3 | Clicking/tapping a hotspot opens a product quick-view surface showing the linked product's title, price, and image. | QA | [ ] |
| S3.4 | The quick-view closes via its close control, via `Escape`, and via click on the backdrop/outside. | QA | [ ] |
| S3.5 | Focus moves into the quick-view on open and returns to the triggering hotspot on close. | QA | [ ] |
| S3.6 | Only one quick-view is open at a time. | QA | [ ] |
| S3.7 | The quick-view links through to the product page (`product.url`), which returns 200. | QA | [ ] |
| S3.8 | Interaction works identically at 375px (touch target ≥ 44×44 CSS px). | QA | [ ] |

---

## S4 — Accessibility

| # | Assertion | Verifier | Status |
|---|-----------|----------|--------|
| S4.1 | Every hotspot is a real `<button>` and is reachable and operable by `Tab` + `Enter`/`Space`. | QA | [ ] |
| S4.2 | Every hotspot has an accessible name naming its product (e.g. "View details for {product}"). | QA | [ ] |
| S4.3 | A visible focus indicator is present on every interactive element. | QA | [ ] |
| S4.4 | Every image has a meaningful `alt` (merchant-editable, defaulting to the image's own alt). | QA | [ ] |
| S4.5 | The quick-view uses correct dialog semantics and traps focus while open. | QA | [ ] |
| S4.6 | Section heading uses a correct, non-skipping heading level for its position on the page. | QA | [ ] |
| S4.7 | Text/background contrast ≥ 4.5:1 for body text and ≥ 3:1 for the hotspot glyph against its backdrop. | QA | [ ] |
| S4.8 | All motion is suppressed under `prefers-reduced-motion: reduce`. | QA | [ ] |
| S4.9 | Zero axe-core violations of `serious` or `critical` impact within the section. | QA | [ ] |

---

## S5 — Code quality & performance

| # | Assertion | Verifier | Status |
|---|-----------|----------|--------|
| S5.1 | Zero JS console errors or warnings on load and during interaction at all three widths. | QA | [ ] |
| S5.2 | Zero failed network requests (no 4xx/5xx) attributable to the section. | QA | [ ] |
| S5.3 | Non-critical images are `loading="lazy"` with correct `sizes`/`srcset` via Shopify's image filters. | QA | [ ] |
| S5.4 | No runtime third-party dependency is loaded (constraint C2). | QA | [ ] |
| S5.5 | All CSS is scoped to the section; removing the section removes all its styling side effects. | QA | [ ] |
| S5.6 | JS is an ES module custom element, deferred, and no-ops safely if the section is absent. | QA | [ ] |
| S5.7 | No stock Horizon 4.1.3 file is modified (`git status` shows only new files, or every modification has an ADR). | ORCH | [ ] |
| S5.8 | No `!important`, no inline layout styles, no leftover `console.log`/TODO/dead code. | QA | [ ] |
| S5.9 | Every file we authored is prefixed `tisso-`. | ORCH | [ ] |

---

## S6 — Deliverable hygiene

| # | Assertion | Verifier | Status |
|---|-----------|----------|--------|
| S6.1 | `docs/PROGRESS.md` has one entry per closed task, each with files changed + verification evidence + timestamp. | ORCH | [ ] |
| S6.2 | Every non-obvious architectural choice has an ADR in `docs/DECISIONS.md` with alternatives and rationale. | ORCH | [ ] |
| S6.3 | Every line in this file is `[x]` or has a recorded `[~]`/`[n/a]` justification. | ORCH | [ ] |
| S6.4 | Final capture set at 1440/768/375 exists in `qa/screens/` and matches the design references per `design-auditor` sign-off. | DA | [ ] |
