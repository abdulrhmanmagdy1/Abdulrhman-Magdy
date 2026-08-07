# SPEC.md — Requirements as testable assertions

Every line is a **binary, checkable claim**. Nothing ships until every applicable
line is `[x]`, verified by `qa-tester` (behaviour) or `design-auditor` (visual) —
never by the builder.

Status: `[ ]` open · `[x]` verified & signed off · `[~]` blocked/deferred (needs an ADR) · `[n/a]` out of scope
Verifier: **QA** = `qa-tester` · **DA** = `design-auditor` · **ORCH** = orchestrator · **USER** = requires a human in the admin

> **Rewritten 2026-08-07** following `qa-tester` finding MAJOR-2 on the Phase 1
> audit. The previous version described a Horizon build and mandated the retired
> `tisso-` prefix, which directly contradicted ADR-008 and constraint C4 — a
> builder obeying it would have shipped the wrong filenames. It also had no
> assertions at all for the graded feature set. Both are fixed here.

---

## S0 — Environment & QA pipeline

| # | Assertion | Verifier | Status |
|---|-----------|----------|--------|
| S0.1 | `CLAUDE.md`, `docs/PLAN.md`, `docs/SPEC.md`, `docs/PROGRESS.md`, `docs/DECISIONS.md` all exist, are non-empty, and describe **Dawn** (not Horizon). | ORCH | [x] |
| S0.2 | `.claude/agents/` contains `builder.md`, `qa-tester.md`, `design-auditor.md`, each with valid YAML frontmatter (`name`, `description`, `tools`). | ORCH | [x] |
| S0.3 | An untouched copy of **Dawn 15.5.0** is present at the repo root (`assets/`, `config/`, `layout/`, `locales/`, `sections/`, `snippets/`, `templates/`) and on `master`. | QA | [x] |
| S0.4 | `shopify theme dev --store-password=…` serves HTTP 200 on `http://127.0.0.1:9292/`. | ORCH | [x] |
| S0.5 | Playwright + chromium installed as a devDependency. | ORCH | [x] |
| S0.6 | `node scripts/screenshot.mjs` writes real, non-empty PNGs to `qa/screens/` at **1440**, **768**, **375**. | QA | [x] |
| S0.7 | Each PNG's actual pixel width equals its requested viewport width (proves capture, not stub). | QA | [x] |
| S0.8 | The script exits **non-zero** on console errors, page errors, failed requests, broken images, or horizontal overflow. | QA | [x] |
| S0.9 | `.gitignore` excludes `qa/`, `design-reference/`, `node_modules/`. | ORCH | [x] |
| S0.10 | The loop was proven on the **untouched** theme **before** any feature code. | ORCH | [x] |
| S0.11 | **The harness is deterministic within a valid dev-server session:** ≥5 consecutive runs against unchanged stock Dawn all exit 0. *(Added after MAJOR-1: one green run is not evidence — the Horizon-era `/api/collect` allowlist missed Dawn's `/api/event/collect`, a 1-in-5 false failure. Evidence: QA re-verify 5/5, ORCH 6/6 — `docs/PROGRESS.md` P1.10/P1.14.)* | QA | [x] |
| S0.12 | The noise allowlist suppresses **only** documented `theme dev` proxy events; **every entry carries a comment justifying it**, and suppressed counts print on every run. Proven by probe injection, not inspection: a URL merely *containing* "collect" is still caught. | QA | [x] |
| S0.13 | **Storefront-password session expiry is diagnosed, not misreported.** A 401/403 preflight, and 401/403 requests arriving mid-run, both produce an explicit "session expired — restart the dev server" message rather than a generic failure. | QA | [x] |

---

## S1 — Delivery workflow (mandatory — submission is disqualified without these)

| # | Assertion | Verifier | Status |
|---|-----------|----------|--------|
| S1.1 | A GitHub repo named exactly **`Abdulrhman-Magdy`** exists and is **PUBLIC**. | QA | [x] |
| S1.2 | `master` contains the untouched live theme, byte-faithful to pristine Dawn 15.5.0 apart from Shopify's push/pull artifacts (documented in ADR-010). | QA | [x] |
| S1.3 | Dawn is the store's **live** theme. | QA | [x] |
| S1.4 | Branch `development` exists on the remote and carries all feature work. | QA | [x] |
| S1.5 | **No feature commit lands directly on `master`.** | ORCH | [ ] |
| S1.6 | `master` is connected to a store theme via the **Shopify GitHub integration**, and that theme is published live. | USER | [ ] |
| S1.7 | A pull request `development` → `master` is open, with a description explaining the architecture. | ORCH | [ ] |
| S1.8 | The finished page is **visible live on the store** at a stated URL. | QA | [ ] |
| S1.9 | Local `development` is pushed — a fresh clone of the public repo gets current project memory, not stale docs. | QA | [ ] |
| S1.10 | Commit history reads as a deliberate narrative: small units, correct branch, messages explaining **why**. | ORCH | [ ] |

---

## S2 — `sections/banner.liquid`

| # | Assertion | Verifier | Status |
|---|-----------|----------|--------|
| S2.1 | The file exists at exactly `sections/banner.liquid`. | QA | [ ] |
| S2.2 | It is selectable in the theme editor and has a `{% schema %}` with a `presets` entry. | QA | [ ] |
| S2.3 | The **image** is a schema setting (`image_picker`), not hardcoded. | QA | [ ] |
| S2.4 | The **heading** is a schema setting and renders the merchant's value. | QA | [ ] |
| S2.5 | The **description** is a schema setting. | QA | [ ] |
| S2.6 | The **button label** and **button link** are schema settings. | QA | [ ] |
| S2.7 | **Every text inside a red rectangle in the Figma design** maps to a schema setting — enumerated in `docs/DESIGN-TOKENS.md` and checked one by one. | QA | [ ] |
| S2.8 | The **button animation** from Figma is implemented, matching the extracted spec (property, duration, easing, trigger). | DA | [ ] |
| S2.9 | The button animation is suppressed under `prefers-reduced-motion: reduce`. | QA | [ ] |
| S2.10 | Renders without Liquid error when image, heading, description, and link are each empty. | QA | [ ] |
| S2.11 | Long heading / long description do not overflow or clip at any breakpoint. | QA | [ ] |

---

## S3 — `sections/product-grid.liquid`

| # | Assertion | Verifier | Status |
|---|-----------|----------|--------|
| S3.1 | The file exists at exactly `sections/product-grid.liquid`. | QA | [ ] |
| S3.2 | **The grid renders exactly 6 blocks**, each bound to a `product` picker. | QA | [ ] |
| S3.3 | `max_blocks: 6` — the editor refuses a 7th block. | QA | [ ] |
| S3.4 | Each tile's image comes from **`product.featured_image`** — there is no separate image upload setting. | QA | [ ] |
| S3.5 | The 6 default products resolve **by handle**: `black-leather-bag`, `blue-silk-tuxedo`, `chequered-red-shirt`, `classic-leather-jacket`, `classic-varsity-top`, `silk-summer-top`. | QA | [ ] |
| S3.6 | **No product is resolved by title string anywhere in the codebase.** | QA | [ ] |
| S3.7 | Each block exposes **hotspot X and Y as percentage settings**; changing them moves the `+` marker. | QA | [ ] |
| S3.8 | The 6 hotspots sit at the per-product coordinates extracted from Figma — not a shared default. | DA | [ ] |
| S3.9 | Renders without error with 0 blocks, with 1 block, and with a block whose picker is empty. | QA | [ ] |
| S3.10 | Images use Shopify image filters with `srcset`/`sizes`; non-critical images are `loading="lazy"`. | QA | [ ] |
| S3.11 | A product title containing `<`, `&`, or `"` renders escaped, not as broken markup. | QA | [ ] |

---

## S4 — The popup

| # | Assertion | Verifier | Status |
|---|-----------|----------|--------|
| S4.1 | Clicking a `+` hotspot opens the popup. | QA | [ ] |
| S4.2 | The popup renders, **from real Shopify product data**: product image, name, price, description, and variants. | QA | [ ] |
| S4.3 | Data is per-product — opening a different hotspot shows that product's data, not the first one's. | QA | [ ] |
| S4.4 | Price renders in the store's currency via Shopify money filters, not a raw number. | QA | [ ] |
| S4.5 | Variant controls reflect the **real** option set (Size: XS/S/M/L, Color: Black/White) and update the selected variant. | QA | [ ] |
| S4.6 | Closes via its close control, via `Escape`, and via click outside / on the backdrop. | QA | [ ] |
| S4.7 | Focus moves into the popup on open and **returns to the triggering hotspot** on close. | QA | [ ] |
| S4.8 | Focus is trapped inside the popup while it is open. | QA | [ ] |
| S4.9 | Only one popup is open at a time; opening a second closes the first. | QA | [ ] |
| S4.10 | Background scroll is locked while open and restored on close, with no scroll-position jump. | QA | [ ] |
| S4.11 | A product with a missing image, missing description, or a sold-out variant renders without error. | QA | [ ] |

---

## S5 — Add to cart & the business rule

| # | Assertion | Verifier | Status |
|---|-----------|----------|--------|
| S5.1 | ADD TO CART posts to the **Shopify Ajax Cart API** (`/cart/add.js`) and receives a 2xx. | QA | [ ] |
| S5.2 | The added line item matches the **selected variant**, verified in `/cart.js`. | QA | [ ] |
| S5.3 | The cart count in the header updates without a page reload. | QA | [ ] |
| S5.4 | **Black + M ⇒ `dark-winter-jacket` is also added.** Evidence is raw `GET /cart.js` showing **both** line items. | QA | [ ] |
| S5.5 | **Negative case:** Black + L, or White + M, adds **only** the selected product — `/cart.js` shows one line item. | QA | [ ] |
| S5.6 | `M` and `Medium` both satisfy the size condition, **case-insensitively**. | QA | [ ] |
| S5.7 | Option matching is by **option name** (`Size`, `Color`), never by option index/position. | QA | [ ] |
| S5.8 | The auto-add does **not** recurse — adding `dark-winter-jacket` does not itself re-trigger the rule. | QA | [ ] |
| S5.9 | Rapid or double clicks do not double-add; the button is disabled/guarded during the request. | QA | [ ] |
| S5.10 | A failed cart request surfaces a user-visible error rather than failing silently. | QA | [ ] |
| S5.11 | `dark-winter-jacket` is auto-added using its **first available** variant (ADR to be recorded). | QA | [ ] |
| S5.12 | The cart is cleared before each assertion so results are not contaminated by prior runs. | QA | [ ] |

---

## S6 — Responsive & pixel fidelity

| # | Assertion | Verifier | Status |
|---|-----------|----------|--------|
| S6.1 | Desktop (**1440**) matches the Figma frame `1:1588` within ADR-004 tolerances. | DA | [ ] |
| S6.2 | Mobile (**375**) matches the Figma frame `1:1802` within ADR-004 tolerances. | DA | [ ] |
| S6.3 | Tablet (**768**) matches the documented interpolation (ADR to be recorded if no tablet frame exists). | DA | [ ] |
| S6.4 | `document.documentElement.scrollWidth <= window.innerWidth` at 1440, 768, 375 — **zero horizontal overflow**. | QA | [ ] |
| S6.5 | No overflow or overlap at the awkward widths 320, 767, 769, 1439. | QA | [ ] |
| S6.6 | Colours match Figma **exactly** (hex, no tolerance). | DA | [ ] |
| S6.7 | Typography (family, size, weight, line-height, letter-spacing) matches Figma within ±1px on size. | DA | [ ] |
| S6.8 | Spacing, gutters, and container widths match within ±2px after ADR-004 normalisation. | DA | [ ] |
| S6.9 | Grid column/row counts match the design exactly at each breakpoint. | DA | [ ] |
| S6.10 | Tile aspect ratio is consistent; no image stretched or letterboxed (±0.02). | DA | [ ] |
| S6.11 | No cumulative layout shift from our sections (images carry intrinsic dimensions or an `aspect-ratio` box). | QA | [ ] |
| S6.12 | No layout regression elsewhere on the page vs `qa/screens/baseline-dawn-*`. | DA | [ ] |

---

## S7 — Accessibility

| # | Assertion | Verifier | Status |
|---|-----------|----------|--------|
| S7.1 | Every hotspot is a real `<button>`, reachable by `Tab`, operable by `Enter` and `Space`. | QA | [ ] |
| S7.2 | Every hotspot has an accessible name identifying its product. | QA | [ ] |
| S7.3 | A visible focus indicator is present on every interactive element. | QA | [ ] |
| S7.4 | Every image has a meaningful `alt`. | QA | [ ] |
| S7.5 | The popup uses correct dialog semantics (`role="dialog"`, `aria-modal`, labelled). | QA | [ ] |
| S7.6 | Heading levels are correct and non-skipping for the page. | QA | [ ] |
| S7.7 | Contrast ≥ 4.5:1 for body text, ≥ 3:1 for the hotspot glyph against its backdrop. | QA | [ ] |
| S7.8 | Touch targets ≥ 44×44 CSS px at 375. | QA | [ ] |
| S7.9 | All motion suppressed under `prefers-reduced-motion: reduce`. | QA | [ ] |
| S7.10 | Zero axe-core violations of `serious` or `critical` impact within our sections. | QA | [ ] |

---

## S8 — Constraint compliance (C1 is the most likely thing to be graded)

| # | Assertion | Verifier | Status |
|---|-----------|----------|--------|
| S8.1 | **No authored file references any Dawn snippet** — grep proves zero `{% render %}`/`{% include %}` of a stock Dawn snippet. Specifically absent: `card-product`, `product-form`, `product-variant-picker`, `quick-add`, `quick-order-list*`, `modal-dialog`, `modal-opener`. | QA | [ ] |
| S8.2 | **No authored markup carries a Dawn CSS class** — grep proves no `.card`, `.button`, `.grid`, `.banner`, `.price`, `.quantity` etc. from Dawn's `base.css` appears in our Liquid. | QA | [ ] |
| S8.3 | Every authored class is `ee-` namespaced BEM (ADR-009). | QA | [ ] |
| S8.4 | **No stock Dawn file is modified** — `git diff master...development` touches only new files, or every modification has an ADR. | QA | [ ] |
| S8.5 | **No jQuery, no external library, no CDN request** at runtime. | QA | [ ] |
| S8.6 | No React/Vue/Tailwind/Bootstrap, no page builder, no build step for theme assets. | QA | [ ] |
| S8.7 | JS is vanilla ES module custom elements, deferred, and no-ops safely if the section is absent. | QA | [ ] |
| S8.8 | All CSS is scoped to the section; removing the section removes all styling side effects. | QA | [ ] |
| S8.9 | No `!important`, no inline layout styles, no fixed heights that break at 375. | QA | [ ] |
| S8.10 | No `console.log`, commented-out code, TODO, or dead code in shipped files. | QA | [ ] |
| S8.11 | Code is commented where non-obvious — grading explicitly rewards comments. | QA | [ ] |
| S8.12 | No merchant-facing string is hardcoded in Liquid; all come from schema settings or locale files. | QA | [ ] |

---

## S9 — Deliverable hygiene

| # | Assertion | Verifier | Status |
|---|-----------|----------|--------|
| S9.1 | `docs/PROGRESS.md` has one entry per closed task, each with files, evidence, timestamp. | ORCH | [ ] |
| S9.2 | Every non-obvious architectural choice has an ADR with alternatives and rationale. | ORCH | [ ] |
| S9.3 | `docs/DESIGN-TOKENS.md` records every extracted Figma value, each labelled `FIGMA` or `ASSUMPTION`. | DA | [ ] |
| S9.4 | Every line of this file is `[x]`, or `[~]`/`[n/a]` with a recorded reason. | ORCH | [ ] |
| S9.5 | Final capture set at 1440/768/375 archived in `qa/screens/`, with `design-auditor` sign-off. | DA | [ ] |
| S9.6 | No secret (store password, token) is committed to the public repo. | QA | [ ] |
