# CLAUDE.md — Project Constitution

> **Read this file first, every session.** It is the single source of truth for
> how this project is built, verified, and shipped. If this session was
> compacted, interrupted, or resumed: read this file, then `docs/PROGRESS.md`
> (what is done), then `docs/SPEC.md` (what is left), then `docs/DECISIONS.md`
> (why things are the way they are).

---

## 1. What this is

A timed, graded Shopify theme technical assessment. The deliverable is a
custom **"Tisso vison in the wild"** shoppable-UGC section built into a live
Shopify theme, matching the supplied Figma/PNG design references pixel-for-pixel
at three breakpoints.

- **Store:** `abdulrhman-magdy-48-teststore.myshopify.com`
- **Base theme:** Horizon `4.1.3` (theme id `196606689446`, currently `[live]`)
- **Design references:** `design-reference/desktop.png`, `design-reference/mobile.png`

Grading rewards **reasoning as much as output**. `docs/DECISIONS.md` is a
deliverable, not overhead.

---

## 2. Hard constraints

These are non-negotiable. A change that violates one of these is rejected on
sight, regardless of whether it "works".

| # | Constraint |
|---|---|
| C1 | **Liquid + CSS + vanilla JS only.** No React/Vue/Svelte, no jQuery, no CSS frameworks, no build step for theme assets. |
| C2 | **No external dependencies at runtime.** No CDN scripts, no web fonts from third parties, no remote images. Everything ships from `assets/` or Shopify's CDN. |
| C3 | **Merchant-configurable.** Every piece of content in the section is editable from the theme editor. Nothing user-visible is hardcoded in Liquid. |
| C4 | **The grid is exactly 6 blocks**, each bound to a product picker — see `docs/SPEC.md` for the full testable list. |
| C5 | **Responsive at 1440 / 768 / 375** with no horizontal overflow and no layout shift at any of the three widths. |
| C6 | **Accessible:** keyboard-operable hotspots, visible focus ring, correct ARIA roles/labels, alt text on every image, `prefers-reduced-motion` respected. |
| C7 | **Horizon conventions are followed, not fought.** Use Horizon's existing CSS custom properties, `{% schema %}` patterns, theme blocks (`{% content_for 'blocks' %}`), and section-group model. Do not reimplement what the theme already provides. |
| C8 | **No modification of stock Horizon files** unless a decision recorded in `docs/DECISIONS.md` justifies it. New work goes in new files. |
| C9 | **QA closes tasks, not the builder.** See §6. |

---

## 3. Tech stack

| Layer | Choice |
|-------|--------|
| Templating | Shopify Liquid (Online Store 2.0, theme blocks) |
| Styling | Plain CSS, scoped by section id, using Horizon's design tokens / CSS custom properties |
| Behaviour | Vanilla JS, ES modules, custom elements (`class X extends HTMLElement`), matching Horizon's existing web-component style |
| Local dev | Shopify CLI `4.6.x` → `shopify theme dev --store=abdulrhman-magdy-48-teststore.myshopify.com` |
| Visual QA | Playwright (chromium) → `scripts/screenshot.mjs` → `qa/screens/*.png` |
| Design diffing | `design-auditor` agent: rendered PNG vs `design-reference/*.png` |
| VCS | git (local) |

---

## 4. File layout

```
/                                  # theme root — shopify theme dev runs from here
├── CLAUDE.md                      # this file
├── .gitignore
├── package.json                   # dev-only; Playwright. NOT a theme build step.
├── .claude/
│   └── agents/                    # subagent definitions
│       ├── builder.md
│       ├── qa-tester.md
│       └── design-auditor.md
├── docs/
│   ├── SPEC.md                    # requirements as testable assertions
│   ├── PROGRESS.md                # append-only work log
│   └── DECISIONS.md               # ADR log
├── scripts/
│   └── screenshot.mjs             # Playwright capture at 1440/768/375
├── qa/                            # gitignored working artifacts
│   ├── screens/                   # rendered PNGs
│   └── reports/                   # QA + audit reports
├── design-reference/              # gitignored; supplied design PNGs
│
└── ...Horizon theme dirs (assets, blocks, config, layout, locales,
    sections, snippets, templates)
```

### Where our code goes

| Kind | Path | Notes |
|------|------|-------|
| Section | `sections/tisso-in-the-wild.liquid` | one file, own `{% schema %}` |
| Theme block | `blocks/tisso-wild-tile.liquid` | the repeated grid tile |
| CSS | `assets/tisso-in-the-wild.css` | loaded via `{{ 'tisso-in-the-wild.css' | asset_url | stylesheet_tag }}` |
| JS | `assets/tisso-in-the-wild.js` | loaded via `<script src=… type="module">` |
| Locale strings | `locales/en.default.json` under a `tisso` namespace | append only; never reorder existing keys |

---

## 5. Naming conventions

- **Files:** `kebab-case`, prefixed `tisso-` so every file we authored is greppable
  in one command: `git ls-files | grep tisso`.
- **CSS classes:** BEM — `.tisso-wild`, `.tisso-wild__tile`, `.tisso-wild__hotspot`,
  `.tisso-wild__tile--wide`. No utility classes, no bare element selectors.
- **CSS custom properties:** `--tisso-wild-<prop>` for anything we introduce.
  Consume Horizon's existing tokens (e.g. `--color-foreground`, `--font-body--family`)
  rather than redefining colours or type.
- **Section/block schema ids:** `snake_case` (`product_reference`, `hotspot_x`).
- **Locale keys:** `tisso.in_the_wild.<key>`.
- **JS custom elements:** `tisso-<name>` tag, `Tisso<Name>Element` class.
- **Scoping:** every rule is scoped to the section instance
  (`#shopify-section-{{ section.id }}` or a `[data-tisso-wild]` attribute). No global leakage.

---

## 6. Workflow — how a task gets closed

The main session is the **orchestrator**. It decomposes work, dispatches to
agents, reviews returns, and is the only actor that marks a task complete.

```
orchestrator → builder      : implement task N
builder      → orchestrator : "implemented, files X/Y/Z"     ← NOT a completion
orchestrator → qa-tester    : verify task N against SPEC lines …
orchestrator → design-auditor: diff task N at 1440/768/375
             ← both must return PASS
orchestrator                : mark task N complete, append to docs/PROGRESS.md
```

- `builder` **may not** declare its own work correct. Its report is a claim.
- `qa-tester` **never** writes feature code. It signs off or it rejects with evidence.
- `design-auditor` reports **concrete deltas** (px, hex, font-size) — never
  "looks close".
- A **REJECT from either agent reopens the task.** No partial credit, no
  "good enough for now" without an entry in `docs/DECISIONS.md`.
- Every closed task appends one entry to `docs/PROGRESS.md` and ticks its
  `docs/SPEC.md` lines.

---

## 7. The QA loop (must be green before and after every change)

```bash
# terminal 1 — live preview
shopify theme dev --store=abdulrhman-magdy-48-teststore.myshopify.com

# terminal 2 — capture
node scripts/screenshot.mjs                      # defaults to / at 1440,768,375
node scripts/screenshot.mjs --path=/ --label=wild --widths=1440,768,375
```

Output: `qa/screens/<label>-<width>.png` (+ `-full.png` full-page).
The script fails loudly (non-zero exit) on console errors, page errors, or
failed network requests — a screenshot that renders is not the same as a page
that is healthy.

**Rule: the pipeline was proven on the untouched theme before any feature code
was written.** A verification pipeline stood up after the fact proves nothing.

---

## 8. Never do this

1. **Never let a builder close its own task.** QA closes tasks.
2. **Never report "done" without a rendered PNG** at all three widths and a QA sign-off.
3. **Never hardcode merchant-facing content** (headings, alt text, links, product handles) in Liquid.
4. **Never add a runtime dependency** — no CDN, no npm package shipped to the storefront.
5. **Never edit stock Horizon files** (`assets/*.css|js`, `sections/*`, `snippets/*` that came with 4.1.3) without an ADR.
6. **Never push to the live theme.** `shopify theme dev` creates a development theme; that is the only thing we deploy to. No `theme push` to `#196606689446`.
7. **Never use `!important`**, inline `style=` for layout, or fixed pixel heights that break at 375px.
8. **Never use `{% if %}` to fake a block loop** — the grid must be real theme blocks with real product pickers.
9. **Never delete or reorder existing locale keys.** Append only.
10. **Never commit `qa/` or `design-reference/`.** They are working artifacts.
11. **Never claim a visual match from a description.** Diff the PNGs.
12. **Never leave `console.log` / commented-out code / TODOs in shipped files.**
13. **Never run destructive Shopify CLI commands** (`theme delete`, `theme push --live`).
14. **Never guess at the design.** If a value is unreadable from the reference PNG, record the assumption in `docs/DECISIONS.md` and flag it in the report.

---

## 9. Known environment facts

- `timeout(1)` is **not** available (macOS/zsh). Use node/perl or background tasks.
- Shopify CLI is authenticated for this store already.
- Design reference PNGs are **scaled exports**: `desktop.png` is 1037×1440,
  `mobile.png` is 256×800. They must be compared **proportionally / by ratio**,
  not pixel-for-pixel against a 1440px capture. See `docs/DECISIONS.md` ADR-004.
- `shopify theme dev` serves on `http://127.0.0.1:9292` by default.
