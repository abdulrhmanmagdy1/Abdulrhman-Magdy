# PLAN.md — Phased execution plan

**Test ID** `3b29ca8db0d7812c8f29daf06ff66e7b` · EcomExperts, Shopify Front-End Developer
**Store** `abdulrhman-magdy-48-teststore.myshopify.com`
**Figma** fileKey `EOnLQN0Q4BDBYH7Hh0N59T` — desktop `1:1588` (1440×2000), mobile `1:1802` (375×1200)

---

## The binding constraint: time

Invitation received **5 Aug 2026**; planning against the shorter stated window
(3 days) gives a deadline of **8 Aug 2026**. Today is **7 Aug 2026**.
**Roughly one working day remains.**

Every sequencing decision below follows from that. The plan is ordered so that

1. the things that **disqualify** the submission if missed (public repo, live
   page, GitHub integration) are done **first**, not last;
2. a **deployed, working page exists by end of Phase 3** — integration is never
   left to the end;
3. everything after Phase 3 improves a submission that is already valid.

If we run out of time, we degrade in this order (last item sacrificed first):
**delivery rails → working page → cart rule → popup polish → pixel-perfection → docs prose.**

---

## Standing rules for every phase

- **Build → verify → log → commit.** No phase closes until `qa-tester` (and,
  where visual, `design-auditor`) has independently verified it with evidence,
  and `docs/PROGRESS.md` + `docs/DECISIONS.md` are updated.
- **The builder never closes its own task.** Only the orchestrator marks
  complete, and only on a QA PASS.
- **Figma values come from MCP, never from eyeballing.** A value that genuinely
  cannot be extracted becomes a stated assumption in `docs/DECISIONS.md`.
- **Nothing from Dawn.** Every time the builder reaches for an existing Dawn
  snippet, it stops and builds from scratch instead.
- **Commits are a graded deliverable.** Small, meaningful units, on the correct
  branch, messages that explain *why*.
- **Blockers are reported immediately.** If an action needs the user in the
  Shopify admin or a browser, stop, say exactly what to click, and continue with
  everything not blocked.

---

## Phase 0 — Working system ✅ COMPLETE

Memory files, agent team, and a *proven* visual-verification pipeline.
See `docs/PROGRESS.md` P0.1–P0.6. The pipeline was proven green on an untouched
theme (exit 0, real PNGs at 1440/768/375) **before** any feature code — and in
doing so caught three harness defects that would otherwise have produced false
passes all project long.

**Carried forward as debt:** the Horizon baseline captures and the Horizon-shaped
`CLAUDE.md` are superseded by the brief. Phase 1 repairs both.

---

## Phase 1 — Delivery rails & Dawn foundation

**Why first:** these are the only failures that are *unrecoverable*. A perfect
page in a private repo scores zero. This phase also contains the only steps that
may need the user's hands in a browser, so surfacing them early maximises the
time available to unblock.

**Goal.** Dawn is the live theme; a public GitHub repo `Abdulrhman-Magdy` holds
the untouched theme on `master`; `development` exists; the store is connected to
the repo; project memory is realigned from Horizon to Dawn.

**Work**
1. Install Dawn and publish it as the live theme.
2. Reset the working tree: remove the pulled Horizon theme, replace with Dawn.
3. Commit the **untouched** Dawn theme to `master` as the first real commit.
4. Create the public repo `Abdulrhman-Magdy`, push `master`.
5. Connect `master` to a store theme via the Shopify GitHub integration, publish it live.
6. Branch `development`, push.
7. Rewrite `CLAUDE.md` for Dawn + the new hard constraints; add ADR-007/008/009;
   rewrite `docs/SPEC.md` around the real feature set.
8. Recapture the baseline against Dawn.

**Exit criteria** — all must hold
- [ ] `shopify theme list` shows **Dawn** as `[live]`
- [ ] `github.com/abdulrhmanmagdy1/Abdulrhman-Magdy` exists and is **public**
- [ ] `master` = untouched Dawn, pushed, and `git status` clean
- [ ] Store↔repo GitHub integration connected, that theme published live
- [ ] `development` branch exists on the remote
- [ ] `CLAUDE.md` names Dawn, the no-Dawn-components rule, and the mandated file names
- [ ] ADR-007 (Dawn supersedes ADR-001), ADR-008 (naming), ADR-009 (CSS namespacing) written
- [ ] `node scripts/screenshot.mjs --label=baseline-dawn` exits **0** at all three widths

**Owner** orchestrator (git/CLI) + `builder` (doc rewrites) · **Verifier** `qa-tester`
(confirms live theme, repo visibility, branch state, green baseline — independently, not from my report)

**Risks**
| Risk | If it lands |
|---|---|
| Dawn install needs the Theme Store UI (browser-only) | Use `shopify theme init` (clones Dawn source) → `theme push --unpublished` → `theme publish` via CLI. Record in an ADR that the theme is stock Dawn from source, byte-identical in substance. If the grader requires a Theme Store install, ask the user for one click. |
| **GitHub integration is admin-only** — cannot be done from the CLI | **Expected blocker.** Stop, give the user the exact click path (Admin → Online Store → Themes → Add theme → Connect from GitHub), and continue with Phase 2 meanwhile. |
| Publishing Dawn wipes the store's current live theme | Horizon is not deleted, only unpublished; it remains restorable by id `#196606689446`. Recorded in the ADR. |
| Replacing the working tree loses Phase 0 work | `docs/`, `scripts/`, `.claude/`, `CLAUDE.md`, `.gitignore` are preserved explicitly; only theme directories are swapped. |

---

## Phase 2 — Figma truth extraction

**Why second:** it is the largest *technical unknown* (MCP access to a duplicated
file has not yet been exercised), and every line of CSS in Phases 3–5 depends on
its output. Finding out on day 2 that we cannot read the file would be fatal;
finding out now costs an hour.

**Goal.** A single document of exact values — no CSS written yet.

**Work.** `get_metadata` to enumerate both frames and the popup/card component
nodes; `get_design_context` for typography, colour, spacing, and layout;
`get_variable_defs` for tokens; `get_screenshot` for visual anchors. Extract in
particular: the button animation spec, and the **six hotspot X/Y percentages**
(fact #5 — different in every image).

**Exit criteria**
- [ ] `docs/DESIGN-TOKENS.md` exists with, for desktop **and** mobile: colour hexes, font families/sizes/weights/line-heights/letter-spacing, spacing scale, container widths, grid gutters, image aspect ratios
- [ ] Popup spec captured: dimensions, layout, variant-control styling, close affordance
- [ ] Button animation captured precisely enough to implement (property, duration, easing, trigger)
- [ ] Six hotspot positions recorded as **percentages**, per product, in design order
- [ ] Every value is labelled `FIGMA` (extracted) or `ASSUMPTION` (with reasoning)

**Owner** `design-auditor` · **Verifier** `qa-tester` (spot-checks a sample of extracted values against `design-reference/` exports; a systematic mismatch fails the phase)

**Risks**
| Risk | If it lands |
|---|---|
| MCP cannot reach the duplicated file | Fall back to measuring `design-reference/` exports; every derived value is marked `ASSUMPTION` per ADR-004, and the tablet breakpoint is interpolated. Flag to the user immediately — they may need to re-share the file. |
| Stated node IDs are stale after duplication | Enumerate with `get_metadata` from the file root rather than trusting the IDs. |
| No tablet frame exists (only 1440 and 375) | Derive tablet from the desktop grid with a documented breakpoint choice, recorded as an ADR — do not invent a third design. |

---

## Phase 3 — Walking skeleton, deployed

**Why third:** this is the phase that converts "work in progress" into "a valid
submission". It retires integration risk — the failure mode the brief explicitly
warns against — while there is still a full cycle left to fix what it exposes.
Correctness of *wiring* is mandatory here; beauty is not.

**Goal.** A new page on the store, built from exactly the two mandated sections,
rendering real product data through customizer settings, publicly reachable.

**Work.** `sections/banner.liquid` (image, heading, description, button — every
red-rectangle string a schema setting). `sections/product-grid.liquid` (6 blocks,
`max_blocks: 6`, product picker only — image comes from
`product.featured_image` per fact #4). A page template JSON wiring both. Deploy.

**Exit criteria**
- [ ] `sections/banner.liquid` + `sections/product-grid.liquid` exist; **no Dawn snippet, section, component, or CSS class is referenced by either**
- [ ] Grid renders **exactly 6** blocks, each bound to a product picker; the 6 mapped products render their featured images
- [ ] Every banner string is editable in the Theme Customizer
- [ ] Renders with 0 blocks, with an empty picker, and with a 7th block refused
- [ ] The page is reachable on the store at a stated URL
- [ ] `node scripts/screenshot.mjs --path=<page>` exits **0** at 1440/768/375
- [ ] Committed to `development` in small units and pushed

**Owner** `builder` · **Verifier** `qa-tester` (works the attack list: empty pickers, block deletion, long strings, overflow at all three widths, and `grep` proving zero Dawn references)

**Risks**
| Risk | If it lands |
|---|---|
| GitHub-integration deploy is slow or silent | Fall back to `shopify theme push` to the connected theme so the page is visibly live; reconcile via the integration afterwards. |
| Storefront password hides the page from graders | Flag to the user: the page is live but gated. Their call whether to lift it before submission. |
| Product handles differ from the brief's mapping | Already partly verified (`dark-winter-jacket` 200 / `soft-winter-jacket` 404). Resolve all six by handle and fail loudly on a miss rather than rendering blanks. |

---

## Phase 4 — Popup, Ajax cart, and the business rule

**Why fourth:** the hardest *logic*, and the most likely place for a silent
wrong answer. It is sequenced after the skeleton so it is added to something
already deployed and verifiable.

**Goal.** Clicking a `+` opens a popup built from real product data; add-to-cart
works through the Ajax API; the Black+M rule fires.

**Work.** Hotspot buttons positioned from per-block X/Y settings. A from-scratch
popup (no `<modal-opener>`, no `quick-add.js`) rendering image, title, price,
description, variants. Variant resolution by **option name**, not index.
`POST /cart/add.js`. Rule: on Color=Black **and** Size∈{M, Medium}
(case-insensitive), also add `dark-winter-jacket`.

**Exit criteria**
- [ ] Popup renders real product data for all 6 products; opens/closes by control, `Escape`, and outside click; focus enters on open and returns on close; only one open at a time
- [ ] Add to cart succeeds via `/cart/add.js` (2xx) and the cart count updates
- [ ] **`GET /cart.js` shows both line items** after a Black+M add — the chosen product *and* `dark-winter-jacket`
- [ ] A non-Black or non-M selection adds **only** the chosen product (the negative case is tested, not assumed)
- [ ] `M` and `Medium` both match, case-insensitively
- [ ] Rapid/double clicks do not double-add
- [ ] Keyboard operable; zero console errors during interaction

**Owner** `builder` · **Verifier** `qa-tester` — **evidence is the raw `/cart.js` JSON**, both positive and negative case. A screenshot of a cart badge is not acceptable proof.

**Risks**
| Risk | If it lands |
|---|---|
| Option order is not guaranteed (`Option1`=Size, `Option2`=Color today) | Match on option **name**, never position. Non-negotiable. |
| "Medium" doesn't exist; only "M" | Normalisation layer accepting both, case-insensitive, tested both ways. |
| Which `dark-winter-jacket` variant to auto-add is unspecified | Pick first **available** variant; record the choice as an ADR rather than guessing silently. |
| Auto-add fires on the *auto-added* product, recursing | Guard the rule so it evaluates only the user-initiated add. Explicitly tested. |
| Cart state leaks between QA runs | Clear the cart before each assertion. |

---

## Phase 5 — Pixel + responsive

**Goal.** Desktop, tablet, and mobile match the Figma frames.

**Exit criteria**
- [ ] `design-auditor` returns **PASS** with no material deltas at 1440/768/375, using ADR-004 normalisation and tolerances
- [ ] Zero horizontal overflow at every width
- [ ] Button animation matches the Figma spec
- [ ] Hotspots sit at the extracted per-product coordinates
- [ ] `prefers-reduced-motion` respected; touch targets ≥44px at 375
- [ ] No `!important`, no inline layout styles, no dead code, no `console.log`

**Owner** `builder` · **Verifier** `design-auditor` (numeric deltas) **and** `qa-tester` (behaviour unbroken by styling changes)

**Risks**
| Risk | If it lands |
|---|---|
| Dawn's `base.css` bleeds into our sections (Dawn defines `.banner`, `.card`, `.grid`) | Namespace every class away from Dawn's — ADR-009. Verified by grep, not by hope. |
| Time runs out mid-polish | This phase is *designed* to be interruptible: it improves an already-valid submission. Stop at the deadline with the largest deltas fixed first. |

---

## Phase 6 — Delivery close

**Goal.** The submission is complete and provable.

**Exit criteria**
- [ ] PR `development` → `master` open, with a description explaining the architecture
- [ ] Repo public; page live and reachable
- [ ] Every line of `docs/SPEC.md` `[x]`, or `[~]`/`[n/a]` with a recorded reason
- [ ] `docs/PROGRESS.md` complete; `docs/DECISIONS.md` covers every non-obvious choice
- [ ] Final capture set at all three widths archived in `qa/screens/`
- [ ] Commit history reads as a deliberate narrative

**Owner** orchestrator · **Verifier** `qa-tester` (final full-SPEC sweep) + `design-auditor` (final visual sign-off)

---

## Consolidated risk register

| # | Risk | Severity | Phase | Mitigation |
|---|---|---|---|---|
| R1 | ~1 day to deadline | **Critical** | all | Delivery rails first; valid submission by end of Phase 3; polish is interruptible |
| R2 | GitHub integration is admin-only | **High** | 1 | Expected blocker — exact click path to user, continue unblocked work in parallel |
| R3 | Figma MCP can't read the duplicated file | **High** | 2 | Fall back to reference exports with every value marked `ASSUMPTION`; escalate at once |
| R4 | Accidental Dawn component reuse | **High** | 3–5 | Namespaced CSS, grep-verified, checked by QA on every phase — the most likely thing to be graded |
| R5 | Black+M rule silently wrong | **High** | 4 | Verified against raw `/cart.js`, positive **and** negative case |
| R6 | Publishing Dawn disrupts the store | Medium | 1 | Test store; Horizon unpublished not deleted, restorable by id |
| R7 | Storefront password hides the page from graders | Medium | 3 | Surface to the user early; their decision |
| R8 | No tablet frame in Figma | Low | 2 | Documented interpolation from the desktop grid, recorded as an ADR |

---

## Agent assignment summary

| Phase | Builds | Verifies |
|---|---|---|
| 1 Delivery rails | orchestrator + `builder` | `qa-tester` |
| 2 Figma extraction | `design-auditor` | `qa-tester` |
| 3 Walking skeleton | `builder` | `qa-tester` |
| 4 Popup + cart | `builder` | `qa-tester` (raw `/cart.js`) |
| 5 Pixel + responsive | `builder` | `design-auditor` + `qa-tester` |
| 6 Delivery close | orchestrator | `qa-tester` + `design-auditor` |
