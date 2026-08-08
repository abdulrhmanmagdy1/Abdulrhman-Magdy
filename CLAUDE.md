# CLAUDE.md — Project Constitution

> **Read this file first, every session.** It is the single source of truth for
> how this project is built, verified, and shipped. If this session was
> compacted, interrupted, or resumed, read in this order:
> `CLAUDE.md` → `docs/PLAN.md` (the phased plan) → `docs/PROGRESS.md` (what is
> done) → `docs/SPEC.md` (what is left) → `docs/DECISIONS.md` (why).

---

## 1. What this is

A timed, graded technical test for a **Shopify Front-End Developer** role at
**EcomExperts**. Test ID `3b29ca8db0d7812c8f29daf06ff66e7b`.

A Figma design must be implemented **pixel perfect** as a **new page** on a
Shopify store. Graded on **code structure, comments, efficiency, and reuse** —
so the reasoning artefacts in `docs/` are deliverables, not overhead.

- **Store:** `abdulrhman-magdy-48-teststore.myshopify.com`
- **Live theme:** **Dawn 15.5.0** (`#196652761254`)
- **Repo:** `github.com/abdulrhmanmagdy1/Abdulrhman-Magdy` (**public**, mandatory)
- **Figma:** fileKey `EOnLQN0Q4BDBYH7Hh0N59T` — desktop `1:1588` (1440×2000), mobile `1:1802` (375×1200)
- **Deadline:** **8 Aug 2026** (invitation 5 Aug + the shorter 3-day window)

> Horizon (`#196606689446`) was the store's original live theme. It is
> **unpublished, not deleted**, and remains restorable. See ADR-007.

---

## 2. Hard constraints

Non-negotiable. A change that violates one of these is rejected on sight,
regardless of whether it "works".

| # | Constraint |
|---|---|
| **C1** | **NOTHING FROM DAWN.** No ready-made Dawn section, snippet, or component. Specifically forbidden: `card-product.liquid`, `product-form.liquid`, `product-variant-picker.liquid`, `quick-add.js`, `modal-dialog` / `<modal-opener>`, `quick-order-list*`, and **any reliance on Dawn's `.card` / `.button` / `.grid` / `.banner` / `.price` CSS classes**. Everything is built from scratch with its own namespaced CSS. *The brief states this twice in one sentence — it is the single most likely thing to be checked.* |
| **C2** | **Vanilla JS only.** No jQuery, no React/Vue/Tailwind/Bootstrap, no page builders, no external libraries, no CDN, no runtime dependency. |
| **C3** | **Liquid + CSS + vanilla JS**, following Shopify theme best practices. |
| **C4** | **Exactly two new sections:** `sections/banner.liquid` and `sections/product-grid.liquid`. |
| **C5** | **Nothing hardcoded.** Every text in the design's red rectangles is editable from the Theme Customizer via section schema. The grid's 6 products come from product pickers. |
| **C6** | **Hotspot position is a per-block setting** (X/Y percentages). It differs in every image; hardcoding it fails both the design and the customizer requirement. |
| **C7** | **Resolve products by handle, never by title.** "Soft Winter Jacket" is `dark-winter-jacket` — verified: `/products/soft-winter-jacket.js` → 404. |
| **C8** | **Responsive:** desktop, tablet, and mobile all match the design. Zero horizontal overflow at 1440 / 768 / 375. |
| **C9** | **Accessible:** keyboard-operable hotspots, visible focus, dialog semantics, alt text, `prefers-reduced-motion`. |
| **C10** | **QA closes tasks, not the builder.** See §6. |

### The business rule (easy to get silently wrong)

Whenever a product is added to cart with **Color = Black AND Size = M**, the
product **`dark-winter-jacket`** ("Soft Winter Jacket") must **also** be added
automatically.

- Real option values: **Option1 = Size** → `XS, S, M, L`; **Option2 = Color** → `Black, White`.
- **"Medium" does not exist in the data.** Normalise so `M` *and* `Medium`
  both match, case-insensitively.
- **Match on option *name*, never on option *index*.** Position is not guaranteed.

---

## 3. Tech stack

| Layer | Choice |
|-------|--------|
| Base theme | Dawn 15.5.0 (used as a *host*, never as a component library) |
| Templating | Shopify Liquid, Online Store 2.0 sections + blocks |
| Styling | Plain CSS, `ee-` namespaced BEM, scoped per section (ADR-009) |
| Behaviour | Vanilla JS, ES modules, custom elements |
| Cart | Shopify **Ajax Cart API** (`/cart/add.js`, `/cart.js`) |
| Local dev | `shopify theme dev --store=… --store-password=… --live-reload off` |
| Visual QA | Playwright chromium → `scripts/screenshot.mjs` → `qa/screens/` |
| Design source | Figma MCP (`get_metadata`, `get_design_context`, `get_screenshot`) |
| VCS | git + GitHub, public repo, `master` ← PR ← `development` |

---

## 4. File layout

```
/                                  # repo root == theme root
├── CLAUDE.md                      # this file
├── .gitignore                     # ignores qa/, design-reference/, node_modules/
├── package.json                   # dev-only (Playwright). NOT a theme build step.
├── .claude/agents/                # builder.md · qa-tester.md · design-auditor.md
├── docs/
│   ├── PLAN.md                    # phased plan + risk register
│   ├── SPEC.md                    # requirements as testable assertions
│   ├── PROGRESS.md                # append-only work log
│   ├── DECISIONS.md               # ADR log
│   └── DESIGN-TOKENS.md           # exact values extracted from Figma (Phase 2)
├── scripts/screenshot.mjs         # capture + health harness
├── qa/                            # gitignored: screens/ + reports/
├── design-reference/              # gitignored: supplied design exports
│
└── Dawn 15.5.0: assets/ config/ layout/ locales/ sections/ snippets/ templates/
```

### Where our code goes

| Kind | Path |
|------|------|
| Banner section | `sections/banner.liquid` |
| Grid section | `sections/product-grid.liquid` |
| CSS | `assets/ee-banner.css`, `assets/ee-product-grid.css` |
| JS | `assets/ee-product-grid.js` (hotspots, popup, cart) |
| Page template | `templates/page.<handle>.json` |
| Locale strings | `locales/en.default.json`, `ee.*` namespace, **append only** |

---

## 5. Naming conventions

- **Section files:** exactly as the brief mandates — `banner.liquid`,
  `product-grid.liquid`. The `tisso-` prefix convention is retired (ADR-008).
- **Supporting assets:** `ee-` prefixed (`ee-product-grid.css`).
- **CSS classes:** `ee-` namespaced BEM — `.ee-banner__title`, `.ee-grid__tile`,
  `.ee-hotspot`, `.ee-popup__variants`. **Never a bare Dawn class** (ADR-009).
- **Custom properties:** `--ee-*`.
- **Schema ids:** `snake_case` (`product`, `hotspot_x`, `hotspot_y`).
- **JS:** `ee-<name>` custom element tag, `Ee<Name>Element` class.
- **Scoping:** every rule scoped to the section instance
  (`#shopify-section-{{ section.id }}` or `[data-ee-grid]`). No global leakage.
- **Greppability:** `git diff --stat master...development` enumerates every
  authored file, because `master` is untouched Dawn.

---

## 6. Workflow — how a task gets closed

```
orchestrator → builder       : implement task N
builder      → orchestrator  : "implemented, files X/Y/Z"   ← NOT a completion
orchestrator → qa-tester     : verify against SPEC lines …
orchestrator → design-auditor: diff at 1440/768/375
             ← both must return PASS
orchestrator                 : mark complete, log to docs/PROGRESS.md, commit
```

- `builder` **may not** declare its own work correct; its report is a claim and
  must end `STATUS: IMPLEMENTED — NOT VERIFIED`.
- `qa-tester` **never** writes feature code — it can only write `qa/reports/`.
- `design-auditor` reports **numeric deltas**, never "looks close".
- A REJECT from either agent reopens the task.
- Build → verify → log → commit. Commits are a graded deliverable: small,
  meaningful, on the right branch, explaining **why**.

---

## 7. The QA loop

```bash
# terminal 1
shopify theme dev --store=abdulrhman-magdy-48-teststore.myshopify.com \
  --store-password=<storefront password> --live-reload off

# terminal 2
node scripts/screenshot.mjs --path=/ --label=baseline --widths=1440,768,375
node scripts/screenshot.mjs --path=/pages/<handle> --label=page --selector="[data-ee-grid]"
```

Exits non-zero on console errors, page errors, failed requests, broken images,
or horizontal overflow. Known `theme dev` proxy noise is allowlisted **by
specific URL**, and suppressed counts are always printed. Transient CDN 502s are
**retried, not allowlisted** — a persistently broken image must still fail.

**Never wait for `networkidle`** on a Shopify storefront; it never fires.

---

## 8. Never do this

1. **Never use anything from Dawn** — no snippet, section, component, or CSS class. (C1)
2. **Never let a builder close its own task.** QA closes tasks.
3. **Never report "done" without rendered PNGs at all three widths** and a QA sign-off.
4. **Never verify the cart rule from a cart badge.** Evidence is raw `/cart.js` JSON, positive **and** negative case.
5. **Never resolve a product by title.** Handle only. (C7)
6. **Never match a variant option by index.** Match by option name. (C7)
7. **Never hardcode merchant-facing content** or hotspot positions.
8. **Never add a runtime dependency** — no jQuery, no CDN, no library.
9. **Never eyeball a design value.** Extract from Figma via MCP; if genuinely unavailable, record it as a stated assumption in `docs/DECISIONS.md`.
10. **Never use `!important`**, inline layout styles, or fixed heights that break at 375px.
11. **Never edit stock Dawn files** without an ADR. New work goes in new files.
12. **Never commit to `master` directly.** Feature work is on `development`; `master` receives it by PR.
13. **Never delete or reorder existing locale keys.** Append only.
14. **Never commit `qa/` or `design-reference/`.**
15. **Never leave `console.log`, commented-out code, or TODOs in shipped files.**
16. **Never run destructive Shopify CLI commands** (`theme delete`, or publishing over the graded theme without cause).

---

## 9. Known environment facts

- `timeout(1)` is **not** available (macOS/zsh). Use node or background tasks.
- Shopify CLI is authenticated; `gh` is authenticated as `abdulrhmanmagdy1`.
- **The storefront is password-protected** (`/` → 302 → `/password`).
  `shopify theme dev` requires `--store-password`. Graders will need either the
  password or protection lifted — flagged to the user.
- `shopify theme dev` serves on `http://127.0.0.1:9292`.
- Design reference PNGs are **scaled exports** (desktop 1037×1440, mobile
  256×800) — compare proportionally, per ADR-004. Figma MCP is the primary
  source of truth; these exports are the fallback.
- Verified product handles, in design order:
  `black-leather-bag`, `blue-silk-tuxedo`, `chequered-red-shirt`,
  `classic-leather-jacket`, `classic-varsity-top`, `silk-summer-top`.
  Auto-add target: `dark-winter-jacket`.
- Grid images come from `product.featured_image` — there is **no** separate
  image upload.
