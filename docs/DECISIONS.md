# DECISIONS.md — Architecture Decision Record

Format per entry: **Context → Decision → Alternatives considered → Why this won → Consequences.**
Newest at the bottom. An entry is never edited to hide a reversal; a reversal
gets its own entry that supersedes the old one.

---

## ADR-001 — Pull the live Horizon theme rather than scaffold a new one

**Date:** 2026-08-07 · **Status:** Accepted

**Context.** The working directory contained only `design-reference/`. The
assessment requires a live preview via
`shopify theme dev --store=abdulrhman-magdy-48-teststore.myshopify.com`, and
requires proving the QA loop "on the untouched theme". There was no theme to
serve. `shopify theme list` showed one theme: **Horizon 4.1.3 (#196606689446, live)**.

**Decision.** `shopify theme pull` the live Horizon theme into the repo root and
treat it as the untouched baseline. Repo root == theme root.

**Alternatives considered.**
1. *`shopify theme init` (fresh Dawn).* Rejected — the store's live theme is
   Horizon, not Dawn. Building against Dawn would mean the section is styled
   with tokens the real store does not have, and the rendered preview would not
   be the graded storefront.
2. *Keep the theme in a `theme/` subdirectory.* Rejected — `shopify theme dev`
   must run from theme root, so this only adds a `cd` to every command and a
   path prefix to every reference, buying nothing. Shopify CLI ignores
   unrecognised root directories (`docs/`, `scripts/`, `qa/`, `.claude/`), so
   co-locating is safe.
3. *Develop straight in the theme editor / online.* Rejected — no version
   control, no diffing, no automated verification.

**Why this won.** The baseline is byte-identical to what the grader sees, and
`git status` becomes a precise record of exactly what we authored.

**Consequences.** The repo contains ~465 vendor theme files. Constraint C8
("never edit stock Horizon files without an ADR") exists specifically so
`git status` stays a clean signal of our own work.

---

## ADR-002 — Build on Horizon's theme-block model, not a monolithic section

**Date:** 2026-08-07 · **Status:** Accepted

**Context.** The design is a 6-tile shoppable-UGC grid, each tile carrying an
image, a `+` hotspot, and a linked product. Horizon 4.1.3 ships the Online Store
2.0 theme-block architecture (`blocks/*.liquid`, `{% content_for 'blocks' %}`).

**Decision.** Implement as one section (`sections/tisso-in-the-wild.liquid`) that
renders repeated theme blocks (`blocks/tisso-wild-tile.liquid`), each block
owning its own image picker, `product` picker, and hotspot coordinates.
`max_blocks: 6`.

**Alternatives considered.**
1. *A section with 6 hardcoded setting groups* (`image_1`, `product_1`, …).
   Rejected — 24+ flat settings, no reordering, no add/remove, and it fails
   SPEC S1.4's requirement that each of the 6 be a real block bound to a
   product picker.
2. *A collection loop* (`collection.products | limit: 6`). Rejected — the
   design pairs *specific lifestyle photography* with *specific products*; a
   collection loop cannot express that pairing, and the merchant loses control
   of both image and position.
3. *Metaobjects.* Rejected for scope — genuinely the right answer for a
   multi-page shoppable-lookbook programme, but it pushes setup into the admin
   (definition + entries) that a grader cannot see in the theme code, and adds
   an API surface for no gain on a single section.

**Why this won.** Blocks give add/remove/reorder for free in the editor, keep
each tile's settings co-located, and are the idiomatic Horizon pattern —
satisfying C7 and C3 at once.

**Consequences.** The section must degrade gracefully at 1–5 blocks (SPEC S1.7),
since the merchant can delete blocks.

---

## ADR-003 — Verification is Playwright screenshots + health assertions, not eyeballing

**Date:** 2026-08-07 · **Status:** Accepted

**Context.** The brief: "a tester that cannot see the page is useless." A QA
agent that only reads Liquid cannot catch overflow, a wrong gutter, a JS error,
or a 404 image.

**Decision.** `scripts/screenshot.mjs` drives headless Chromium against the
running `shopify theme dev` server, captures each target width to
`qa/screens/`, **and** collects console errors, uncaught page errors, failed
requests, and the document scroll-width overflow check. It **exits non-zero**
when any of those fire, and writes a JSON sidecar per run.

**Alternatives considered.**
1. *Screenshots only.* Rejected — a page can render an image and still be
   throwing on every hotspot click. A green screenshot would be a false pass.
2. *A pixel-diff threshold gate (e.g. `pixelmatch` vs the reference).* Rejected
   as the *gate* — see ADR-004; the references are scaled exports of a different
   store's content, so a raw pixel diff would be ~100% "different" and
   meaningless. Pixel diffing is used inside `design-auditor` as an *attention
   director*, not a pass/fail.
3. *Lighthouse / full CI.* Rejected for a timed assessment — cost outweighs
   signal. Targeted assertions cover the graded criteria.

**Why this won.** It makes "PASS" mean something falsifiable: PNGs on disk at
the right widths **and** a clean console **and** no overflow.

**Consequences.** The script needs the dev server up; it fails fast with a clear
message if `127.0.0.1:9292` is not answering, rather than producing a blank PNG.

---

## ADR-004 — Design references are compared proportionally, with a stated tolerance

**Date:** 2026-08-07 · **Status:** Accepted

**Context.** `design-reference/desktop.png` is **1037×1440**; `mobile.png` is
**256×800**. Neither matches a real device width — they are scaled exports.
A 1440px-wide capture cannot be pixel-compared to a 1037px-wide reference, and
the reference content (products, photos, copy) differs from the test store's
catalogue.

**Decision.** The `design-auditor` normalises by **scale factor** (capture width
÷ reference width) and reports deltas as **ratios and normalised px**, e.g.
"gutter is 1.9% of container vs 1.4% in the reference → ~7px too wide at 1440".
Tolerances: **±2px** on spacing/size after normalisation, **±1px** on font-size,
**exact** on colour hex, **exact** on column counts and alignment.

**Alternatives considered.**
1. *Pixel-perfect diff against the raw PNG.* Rejected — mathematically
   impossible across a 1037↔1440 scale change with different content.
2. *Pull the live Figma frames via the Figma MCP for exact values.* **Preferred
   if a Figma file URL is supplied** — it yields exact tokens instead of
   measured estimates. Not available at setup time; no file URL was given.
   This ADR is superseded for any frame we can read from Figma directly.
3. *Ask the user for full-resolution exports.* Deferred — proceed with what
   exists; flag any value that is genuinely unreadable at 256px wide rather
   than silently guessing (see "never do this" #14).

**Why this won.** It keeps the audit concrete and falsifiable ("7px too wide")
without pretending to a precision the source material does not support, and it
makes every assumption visible to the grader.

**Consequences.** The mobile reference at 256px wide is too low-resolution to
read font sizes reliably. Any mobile type value taken from it is recorded as an
assumption in the audit report, not as a measurement.

---

## ADR-005 — Agent authority: builders propose, QA disposes

**Date:** 2026-08-07 · **Status:** Accepted

**Context.** The single largest failure mode in agentic builds is the
implementer marking its own work correct. Self-reported success is
unfalsifiable and, in a graded assessment, expensive.

**Decision.** Enforce separation of powers in the agent definitions themselves,
not just in prose:
- `builder` — has `Write`/`Edit`; its prompt forbids verdict language and
  requires it to end every report with an explicit "NOT VERIFIED" line.
- `qa-tester` — has **no** `Write`/`Edit` on theme files; can only run the
  browser, read code, and write reports under `qa/reports/`. Returns
  `PASS` or `REJECT` with evidence.
- `design-auditor` — read + screenshot only; reports numeric deltas.
- Only the orchestrator ticks `docs/SPEC.md` and appends to `docs/PROGRESS.md`.

**Alternatives considered.**
1. *One agent that builds and tests.* Rejected — it grades its own homework.
2. *Two agents (builder + a combined QA/design).* Rejected — behavioural QA and
   pixel auditing use different evidence (console/DOM vs. rendered PNG) and
   different failure vocabularies; merging them reliably loses one of the two.
3. *Trust-but-verify by the orchestrator alone.* Rejected — the orchestrator's
   context is already the plan; it is the least independent reviewer available.

**Why this won.** Tool permissions make the rule structural rather than
aspirational: the QA agent *cannot* fix what it finds, so it must report it.

**Consequences.** Round-trips are slower — a rejected task costs a full
builder→QA cycle. That is the intended trade: correctness over throughput.

---

## ADR-006 — Prove the QA pipeline on the untouched theme before writing any feature code

**Date:** 2026-08-07 · **Status:** Accepted

**Context.** A verification harness stood up *after* the feature exists is
untrustworthy: it was implicitly tuned until it passed.

**Decision.** Phase 0 ends only when `theme dev` + `screenshot.mjs` produce real
PNGs at 1440/768/375 from **stock Horizon 4.1.3** with zero feature code in the
tree, and the captures are archived as the **baseline** (`qa/screens/baseline-*`).

**Alternatives considered.**
1. *Build first, verify later.* Rejected — explicitly called out in the brief,
   and it removes the "before" half of every before/after comparison.
2. *Mock the storefront (static HTML fixture).* Rejected — it would not exercise
   Liquid, Horizon's CSS cascade, or Shopify's image CDN, which is where the
   real bugs live.

**Why this won.** The baseline captures double as the regression control for
SPEC S2.9 ("no layout regression on the rest of the homepage").

**Consequences.** The baseline must be recaptured if the store's catalogue or
theme settings change underneath us; the run's JSON sidecar records the capture
timestamp so drift is detectable.
