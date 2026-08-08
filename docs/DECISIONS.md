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

---

## ADR-007 — Dawn 15.5.0 replaces Horizon as the base theme (supersedes ADR-001)

**Date:** 2026-08-07 · **Status:** Accepted · **Supersedes:** ADR-001

**Context.** ADR-001 chose Horizon because it was the store's live theme and the
directory held no theme at all. The full brief then arrived and mandates Dawn:
the assessment instructions assume Dawn, and Shopify changed the default theme
for new stores to Horizon after those instructions were written. Grading is
against Dawn's conventions, and one hard constraint is stated in terms of Dawn's
component library.

**Decision.** Install Dawn 15.5.0, publish it as the store's live theme, then
pull the *published* theme back into the repo as the baseline.

**Alternatives considered.**
1. *Keep building on Horizon.* Rejected — directly contradicts the brief.
   Horizon's theme-block architecture also differs enough from Dawn's that the
   "no ready-made components" constraint could not be assessed as written.
2. *Clone Dawn from GitHub and commit that, without publishing.* Rejected — the
   delivery workflow requires the live theme to be the one committed, and step 3
   of that workflow connects the repo to a published store theme. Committing a
   theme that is not the live theme would break the chain.
3. *Install Dawn from the Shopify Theme Store via the admin UI.* Equivalent in
   substance but requires browser actions we cannot take. `shopify theme init`
   clones the same Dawn source Shopify distributes; pushing and publishing it
   produces an identical live theme.

**Why this won.** The committed baseline is the store's real live theme, which
is exactly what the delivery workflow assumes, and it keeps `git diff master` a
precise record of authored work.

**Consequences.** Horizon (#196606689446) is **unpublished, not deleted**, and
remains restorable. The Phase 0 baseline captures were of Horizon and are void;
they are recaptured against Dawn. `CLAUDE.md` is rewritten accordingly.

---

## ADR-008 — Mandated section filenames override the `tisso-` prefix convention

**Date:** 2026-08-07 · **Status:** Accepted · **Amends:** `CLAUDE.md` §5

**Context.** `CLAUDE.md` §5 required every authored file to carry a `tisso-`
prefix so our work was greppable in one command. The brief mandates exact
filenames: `sections/banner.liquid` and `sections/product-grid.liquid`.

**Decision.** Mandated names win for the two section files. The greppability the
prefix bought is recovered a better way: `master` holds untouched Dawn, so
`git diff --stat master...development` enumerates authored files exactly, with
no naming convention required to make it work.

**Alternatives considered.**
1. *Keep the prefix (`tisso-banner.liquid`).* Rejected — the brief names the
   files explicitly; renaming them risks an automated check not finding them.
2. *Prefix only the supporting assets.* Rejected as half-measure — the CSS/JS
   still need a namespace, which ADR-009 handles on its own terms.

**Why this won.** Explicit instructions beat internal conventions, and the
convention's actual purpose is served better by the git baseline.

**Consequences.** `CLAUDE.md` §5 is amended. Supporting assets stay namespaced
per ADR-009.

---

## ADR-009 — CSS is namespaced `ee-` to guarantee zero collision with Dawn

**Date:** 2026-08-07 · **Status:** Accepted

**Context.** The hardest constraint in the brief is that **no ready-made Dawn
section, snippet, component, or CSS class may be used**, and it is called out as
the single most likely thing to be checked. Dawn's `base.css` is loaded globally
on every page and already defines `.banner`, `.card`, `.grid`, `.button`,
`.price`, `.quantity`, and more. A section file literally named `banner.liquid`
that styles a `.banner` element would silently inherit Dawn's styling — visually
passing while violating the constraint.

**Decision.** Every class we author is namespaced **`ee-`** (EcomExperts) and
follows BEM: `.ee-banner`, `.ee-banner__title`, `.ee-grid`, `.ee-grid__tile`,
`.ee-hotspot`, `.ee-popup`, `.ee-popup__variants`. No authored markup carries a
bare Dawn class. Custom properties are `--ee-*`. Compliance is proven by grep,
not by inspection: no authored file may reference a class defined in Dawn's
`assets/base.css`.

**Alternatives considered.**
1. *Reuse Dawn's utility classes for speed.* Rejected — this is precisely the
   prohibited behaviour, and it is the cheapest thing for a grader to check.
2. *Bare BEM without a prefix (`.banner__title`).* Rejected — the block root
   `.banner` collides with Dawn head-on, and a collision that only manifests as
   "inherited some styling" is exactly the kind of failure that passes visual
   review and fails code review.
3. *Shadow DOM for hard isolation.* Rejected — genuinely airtight, but it
   complicates Liquid rendering, theme-editor live updates, and global font
   inheritance for a problem a prefix solves completely.

**Why this won.** A prefix makes the constraint mechanically verifiable, which
matters more than elegance when the constraint is pass/fail.

**Consequences.** Slightly more verbose class names, and we implement layout
primitives (grid, button, dialog) ourselves rather than inheriting them — which
is the intent of the constraint, not a side effect.

---

## ADR-010 — Shopify's push/pull artifacts in `master` are accepted, not "fixed"

**Date:** 2026-08-07 · **Status:** Accepted

**Context.** `master` must hold the untouched live theme. The `qa-tester` Phase 1
audit diffed all 360 files of `origin/master` against a pristine Dawn 15.5.0
clone and found the tree byte-faithful — every `.liquid`, `.css`, and `.js`
identical — with exactly two classes of difference, both machine-generated by
the push→publish→pull round trip:

1. An auto-generated Shopify banner comment prepended to some files.
2. Empty `"settings": {}` / `"blocks": {}` scaffolding added to some JSON, and in
   `sections/header-group.json` the announcement block losing `color_scheme` and
   `text_alignment` keys.

**Decision.** Accept these as the faithful baseline. Do not hand-edit `master`
to make it match the clone.

**Alternatives considered.**
1. *Hand-restore the dropped keys.* Rejected — it would make `master` differ from
   the theme actually running on the store, which is precisely what the delivery
   workflow says `master` must be. It also introduces a human edit into a commit
   whose entire value is being *not* human-edited.
2. *Commit the GitHub clone of Dawn instead of the pulled theme.* Rejected for
   the same reason (ADR-007): the workflow connects the repo to the live theme.

**Why this won.** The point of the untouched-theme commit is that
`git diff master...development` isolates authored work. Machine artifacts do not
compromise that; a hand-edit would.

**Consequences.** The dropped `header-group.json` keys have **zero render
impact**, verified against the schema: `sections/announcement-bar.liquid`
declares only `text` and `link` as block settings, and the Liquid reads only
`block.settings.text` / `block.settings.link`. The removed keys were stale, with
no schema behind them. Recorded here so a future reviewer does not mistake them
for tampering.

---

## ADR-011 — The seven red rectangles, and how the wordmark becomes editable

**Date:** 2026-08-07 · **Status:** Accepted

**Context.** The official instruction page (read directly, not summarised) shows
an annotated banner with **seven** red rectangles, all of which "should be
editable from the customizer": (1) TISSO VISON wordmark, (2) top-bar message,
(3) CHOOSE GIFT CTA, (4) The Gift Guide H1, (5) description, (6) SHOP NOW button,
(7) the bottom strip. Figma node `1:1591` shows the wordmark is a **group of
vector paths**, not a TEXT node — it is outlined artwork with no font behind it.

**Decision.** Six of the seven become `text`/`url` schema settings in
`banner.liquid`. The wordmark becomes an **`image_picker` + a text `alt`
setting**, defaulting to a bundled SVG in `assets/`, rendered via `asset_url`
when the picker is empty.

**Alternatives considered.**
1. *Make the wordmark a text setting styled to look like the logo.* Rejected —
   there is no font that reproduces it; `1:1591` is outlines. It would not be
   pixel perfect, which is the graded criterion.
2. *Hardcode the wordmark as an inline SVG.* Rejected — the instruction says all
   seven are editable from the customizer. Hardcoding fails that explicitly.
3. *Leave it to Dawn's header.* Rejected — C1 forbids reusing Dawn components,
   and the annotation places the wordmark inside the banner's red-rectangle set.

**Why this won.** An image picker is the only control that is both genuinely
merchant-editable and capable of reproducing outlined artwork exactly.

**Consequences.** Items 2 and 3 (top-bar message and CTA) are **hidden at mobile**
— the mobile frame `1:1802` shows only a hamburger and the wordmark. They remain
schema settings; only their visibility is breakpoint-dependent. The banner
line-art illustration is likewise a real asset that does **not** exist in the
store's catalogue and must ship in `assets/` with an `image_picker` override.

---

## ADR-012 — Verify against a cached Figma document, not against notes

**Date:** 2026-08-07 · **Status:** Accepted

**Context.** The MCP server's Starter-plan cap (~6–12 calls) made re-verification
prohibitively expensive, which is exactly how three wrong values — the popup
control structure, the hotspot disc fill, and a 36-vs-40 heading — survived into
`docs/DESIGN-TOKENS.md` as confident-sounding prose. The REST API has a separate
quota and returns `absoluteBoundingBox`, `style`, `fills`, `effects` directly.

**Decision.** Cache Figma subtrees once into `qa/figma/*.json` (gitignored) and
verify every built component against **the cache**, never against notes or a
downscaled PNG. Every value in `SPEC.md` / `DECISIONS.md` / `DESIGN-TOKENS.md`
cites `node-id.field`. A number with no citation is treated as unverified.
Tolerances: geometry ±1px at 1440, font-size and line-height **exact**, colour
**exact hex**. Outside tolerance is a REJECT, not a note.

**Alternatives considered.**
1. *Keep using the MCP.* Rejected — the quota is exhausted and is the root cause
   of the errors above.
2. *Measure the rendered PNGs.* Rejected as primary — `design-reference/desktop.png`
   is a 0.72× downscale, and the supplied `mobile.png` is 256px wide. Fine as a
   cross-check, useless as a source of truth.
3. *Trust the first extraction.* Rejected — three of its values were wrong.

**Why this won.** It makes re-verification nearly free, which removes the only
real excuse for skipping it, and it makes every claim traceable to a node id.

**Consequences.** The token is passed only as an environment variable and never
written to the repo; `qa/figma/`, `*.figma.json`, `figma-token*`, and `.env*` are
gitignored. **The token must be rotated after submission** — it appeared in the
working transcript.

---

## ADR-013 — Dawn's header/footer chrome is out of scope; do not suppress it

**Date:** 2026-08-08 · **Status:** Accepted

**Context.** Figma frame `1:1588` begins directly with our utility bar at y=0.
The rendered page carries Dawn's announcement bar + header above it (**124px at
1440, 123px at 768, 135px at 375**) and Dawn's footer below (294.78 / 292.19 /
253.17). So the page shows Dawn's nav *and* our utility bar — a doubling the
design does not have, and every element below is displaced.

**Decision.** Treat theme chrome as out of scope. Do not suppress it. Audit
fidelity is measured **frame-relative** (`frameY = pageY − bannerTop`).

**Alternatives considered.**
1. *Suppress the header/footer section groups.* Rejected on three grounds. The
   displacement is a **pure uniform translation** — the `design-auditor` measured
   that once normalised, *every* frame-relative y lands within **0.20px** of
   Figma, so the chrome costs **0.00px of intra-section fidelity**. Suppression
   would require editing `layout/theme.liquid`, which "never do this" #11
   forbids without cause. And it would delete the page's only navigation,
   including the hamburger the mobile design actually asks for
   (`I1:1804;484:8805`) — which our two sections cannot render, because C4 caps
   us at exactly two sections.
2. *A separate `layout/gift-guide.liquid` via `{% layout %}`.* Held in reserve.
   If the owner overrules this ADR, this is the cheapest correct form: it adds a
   new file and leaves `theme.liquid` untouched.
3. *Rebuild the header inside `banner.liquid`.* Rejected — it would duplicate
   navigation the theme already provides, and the brief asks for a page composed
   of two sections, not a theme replacement.

**Why this won.** The measurement settles it: fidelity inside our sections is
unaffected, and the alternatives all cost either a forbidden edit or the loss of
working navigation.

**Consequences.** All design-audit deltas are reported frame-relative. A grader
comparing a full-page screenshot to the Figma frame will see the chrome; the
report states why it is there.

---

## ADR-014 — Dawn's *inherited* styles leak even when no class name collides

**Date:** 2026-08-08 · **Status:** Accepted · **Extends:** ADR-009

**Context.** ADR-009 namespaced every authored class `ee-` so nothing could
collide with Dawn's `base.css`. That is necessary and it worked — the
`design-auditor` confirmed zero class collisions. It is **not sufficient**.
`assets/base.css:258` sets `body { letter-spacing: 0.06rem }`, which **inherits
into our sections regardless of class names**. Figma specifies
`letterSpacing: 0` on `1:1604`, `1:1613`, and `3:1208`. The leak added
**+0.6px per character** — **+24.00px** of ink on the utility message and
**+33.00px** on the strip, and it was the root cause of 3 of the 11 audit FAILs.

Diagnosed by counterfactual, not inference: forcing `letter-spacing: 0` moved the
utility-message ink to 259.55 against a `1:1604` box of 260 (Δ −0.45) and the
strip to 450.13 against `1:1613`'s 451 (Δ −0.87). Both snapped inside ±1px.

**Decision.** `.ee-scope` explicitly resets every **inheritable** property Dawn
sets globally — `letter-spacing`, and any of `font-family`, `line-height`,
`color`, `text-transform`, `word-spacing`, `font-weight` that `body`/`:root`
touch — rather than only avoiding class collisions. Compliance is verified by
reading `getComputedStyle` on our elements, not by reading our own CSS.

**Alternatives considered.**
1. *Override per element as each leak is discovered.* Rejected — that is how
   this one survived to the audit. It treats symptoms and guarantees the next
   inherited property leaks silently.
2. *`all: revert` / `all: initial` on `.ee-scope`.* Rejected — too blunt; it
   would also discard the Shopify font-family plumbing we deliberately use, and
   `initial` on `color` and `font-family` produces worse defaults than Dawn's.
3. *Shadow DOM.* Rejected again, for ADR-009's reasons — it would genuinely
   solve this, but breaks theme-editor live updates and Liquid rendering.

**Why this won.** It closes the whole class of defect rather than one instance,
and it keeps the verification honest: the check is on computed style, which is
what actually reaches the user.

**Consequences.** A "no Dawn classes" grep is necessary but **not** evidence of
isolation. SPEC S8.2 is amended: isolation must be proven by computed-style
comparison against the Figma node, not by grep alone.
