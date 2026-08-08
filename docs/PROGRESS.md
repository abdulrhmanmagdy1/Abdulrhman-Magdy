# PROGRESS.md — Append-only work log

One entry per **completed** unit of work. A unit is complete only when the
orchestrator has reviewed it — a builder's self-report never closes a task
(`CLAUDE.md` §6). Never edit or delete a past entry; corrections get a new
entry that supersedes the old one.

Entry template:

```
## [YYYY-MM-DD HH:MM TZ] <task id> — <title>
**Done:**      what changed, in plain terms
**Files:**     every path touched
**Verified:**  who verified, how, with what evidence
**SPEC:**      lines ticked
**Notes:**     anything the next session needs to know
```

---

## [2026-08-07 · Phase 0] P0.1 — Working directory surveyed, baseline theme pulled

**Done:** Working directory contained only `design-reference/` (two PNGs) and no
theme, so there was nothing to serve or verify against. Confirmed tooling
(node 24.18.0, npm 11.16.0, git 2.50.1, Shopify CLI 4.6.0 → auto-upgraded to
4.6.1), confirmed the CLI is already authenticated for
`abdulrhman-magdy-48-teststore.myshopify.com`, and listed the store's themes:
one theme, **Horizon 4.1.3 (#196606689446, live)**. Initialised git and pulled
that theme to the repo root as the untouched baseline.

**Files:**
- `.git/` (initialised)
- `assets/` (124), `blocks/` (95), `config/` (2), `layout/` (2), `locales/` (51),
  `sections/` (42), `snippets/` (138), `templates/` (13) — pulled, unmodified

**Verified:** ORCH — `shopify theme pull` reported success for theme #196606689446;
directory counts confirm a complete Online Store 2.0 theme;
`config/settings_schema.json` reports `theme_name: Horizon`, `theme_version: 4.1.3`.

**SPEC:** S0.3

**Notes:** Repo root == theme root (ADR-001). The pull used `--nodelete`, and the
tree is byte-identical to the live theme, so `git status` is now a precise record
of exactly what we author from here.

---

## [2026-08-07 · Phase 0] P0.2 — Project memory established

**Done:** Wrote the four persistent documents that survive compaction or a
resumed session: the project constitution, the testable requirements checklist,
the ADR log, and this work log.

**Files:**
- `CLAUDE.md` — hard constraints C1–C9, tech stack, file layout, naming
  conventions, the orchestrator/builder/QA workflow, the QA loop commands, the
  14-item "never do this" list, known environment facts
- `docs/SPEC.md` — 6 sections (S0–S6), 52 assertions, each with an assigned
  verifier and a status box
- `docs/DECISIONS.md` — ADR-001 … ADR-006
- `docs/PROGRESS.md` — this file

**Verified:** ORCH — all four files exist and are non-empty; SPEC assertions are
each binary and checkable; every ADR carries context, decision, alternatives,
rationale, and consequences.

**SPEC:** S0.1

**Notes:** Read order for any future session: `CLAUDE.md` → `docs/PROGRESS.md` →
`docs/SPEC.md` → `docs/DECISIONS.md`.

---

## [2026-08-07 · Phase 0] P0.3 — Agent team defined

**Done:** Created three Claude Code subagent definitions enforcing separation of
powers (ADR-005). Authority is enforced through *tool permissions*, not just
prose: `builder` can write theme files but is forbidden verdict language and must
end every report with `STATUS: IMPLEMENTED — NOT VERIFIED`; `qa-tester` can only
write to `qa/reports/`, so it must report bugs rather than fix them;
`design-auditor` reports normalised numeric deltas and may consult Figma MCP when
a file URL exists.

**Files:**
- `.claude/agents/builder.md` — implements Liquid/CSS/vanilla JS; forbidden verdict vocabulary; mandatory report format
- `.claude/agents/qa-tester.md` — adversarial verification; evidence standard; 30-item attack list; PASS/REJECT rules (any BLOCKER or MAJOR, or any untested assigned SPEC line ⇒ REJECT)
- `.claude/agents/design-auditor.md` — normalisation maths, tolerance table, honesty rules forbidding "looks close"

**Verified:** ORCH — each file parses as YAML frontmatter with `name`,
`description`, `tools`; tool grants match the intended authority boundaries
(`qa-tester` and `design-auditor` hold no theme-file write path by policy;
neither may tick `docs/SPEC.md`).

**SPEC:** S0.2

**Notes:** Only the orchestrator marks a task complete and appends here.

---

## [2026-08-07 · Phase 0] P0.4 — Screenshot pipeline authored

**Done:** Installed Playwright + Chromium as a devDependency and wrote the
capture script. Per ADR-003 the script is a *health harness*, not just a camera:
it preflights the dev server (refusing to capture a blank page against a dead
server), captures viewport and full-page PNGs at each width, emulates touch and
a mobile UA at ≤480px, scrolls to settle lazy images, then collects console
errors, uncaught page errors, failed/4xx/5xx requests, broken images, and a
`scrollWidth` vs `innerWidth` overflow measurement — exiting non-zero if any
fire. Writes a JSON sidecar per run so QA can read the health data, not just
look at pixels.

**Files:**
- `package.json` — `type: module`, devDependency `playwright`
- `scripts/screenshot.mjs` — flags: `--url --base --path --label --widths --height --out --selector --no-full --lenient`
- `.gitignore` — excludes `qa/`, `design-reference/`, `node_modules/`, `.shopify/`

**Verified:** ORCH — `npx playwright install chromium` exited 0; script written.
**End-to-end capture is NOT yet verified — see P0.5.**

**SPEC:** S0.5, S0.9

**Notes:** Default target `http://127.0.0.1:9292/`. Shopify's own beacons
(`wpm@`, `monorail-edge`, favicon, `.well-known`) are excluded from the failed
request list so they cannot produce a false REJECT.

---

## [2026-08-07 · Phase 0] P0.5 — QA loop end-to-end on the untouched theme

**Status:** BLOCKED — awaiting storefront password.

**Blocker:** The store's storefront is password-protected.
`https://abdulrhman-magdy-48-teststore.myshopify.com/` returns `302 → /password`.
`shopify theme dev` therefore requires `--store-password=<value>` and aborted with
"Failed to prompt: Enter your store password" when run non-interactively.

Not worked around deliberately: capturing a stub or a static fixture instead of
the real Liquid render would be exactly the fake verification ADR-006 exists to
prevent, and disabling the store's password protection is an outward-facing
change to the merchant's store that is the owner's call, not ours.

**SPEC:** S0.4, S0.6, S0.7, S0.8, S0.10 — all open pending this.

---

## [2026-08-07 19:15 EEST] P0.5 — QA loop proven end-to-end on the untouched theme

**Supersedes the BLOCKED status above.** Storefront password supplied by the user.

**Done:** Started `shopify theme dev --store-password=… --live-reload off`, which
created development theme **#196651712678** and served stock Horizon on
`http://127.0.0.1:9292`. Ran the capture at 1440/768/375. Three defects in the
harness surfaced and were fixed — which is the entire point of proving the
pipeline before writing features:

1. **`waitUntil: 'networkidle'` never fired.** The Shopify storefront holds
   long-lived connections open (web pixels, analytics, hot reload), so every
   capture timed out at 60s. Replaced with `load` + an explicit
   "every `<img>` is `complete`" wait.
2. **The harness was unusable from noise.** Stock Horizon, with zero feature
   code, produced 6–8 console errors and 8–11 failed requests per width — all
   caused by `theme dev` proxying the storefront from `127.0.0.1` instead of the
   real domain (Login-with-Shop / shop.app CSP, `origin_trials` CORS, Storefront
   API 400s, analytics beacons, a customer-account menu the store hasn't
   configured). Left as-is, every future run would be a false REJECT. Calibrated
   an allowlist keyed on **specific URLs and messages**, never blanket: a generic
   "Failed to load resource" is matched on the offending URL from its console
   location. Suppressed counts are printed on every run so nothing hides.
3. **Intermittent 502s from the dev proxy on Shopify's image CDN** — a
   *different* asset each run. Handled with a **retry**, not an allowlist entry,
   because a persistently broken image is a real defect the harness must still
   catch. Retry fires only when every problem in the attempt is transient-class.

**Files:**
- `scripts/screenshot.mjs` — rewritten: `captureOnce()` extracted, retry loop,
  `IGNORED_REQUEST_PATTERNS` / `IGNORED_CONSOLE_PATTERNS` /
  `IGNORED_CONSOLE_ORIGINS` / `TRANSIENT_PATTERNS`, `brokenSrcs` reporting
- `qa/screens/baseline-{1440,768,375}{,-full}.png` — 6 PNGs
- `qa/screens/baseline-report.json`

**Verified:** ORCH — final run exited **0** with `✓ all 3 width(s) captured clean`.
Measured evidence:

| width | PNG | actual px | scrollWidth/innerWidth | console errors | page errors | failed reqs | broken images |
|---|---|---|---|---|---|---|---|
| 1440 | `baseline-1440.png` 466KB | 1440×900 | 1440 / 1440 | 0 | 0 | 0 | 0/16 |
| 768  | `baseline-768.png` 325KB  | 768×900  | 768 / 768   | 0 | 0 | 0 | 0/16 |
| 375  | `baseline-375.png` 215KB  | 375×900  | 375 / 375   | 0 | 0 | 0 | 0/16 |

PNG dimensions read with `sips`, confirming each capture is at its requested
viewport width and not a stub. `baseline-1440.png` visually inspected: renders
the real storefront (announcement bar, header, hero, Products grid).

**SPEC:** S0.4, S0.6, S0.7, S0.8, S0.10 ✓ (and S0.5, S0.9 from P0.4)

**Notes:** These captures are the **regression control** for SPEC S2.9. They are
of *Horizon*, which the brief now supersedes — see P1.x, they must be recaptured
against Dawn once Dawn is live.

---

## [2026-08-07 19:20 EEST] P0.6 — Full brief received; Horizon baseline superseded

**Done:** Received the complete assessment brief (Test ID
`3b29ca8db0d7812c8f29daf06ff66e7b`, EcomExperts, Shopify Front-End Developer).
It materially changes the foundation established in P0.1–P0.5. Recorded here so
the pivot is traceable rather than silent.

**What changed:**
- **Base theme: Dawn, not Horizon.** The brief mandates installing Dawn and
  publishing it as the live theme. ADR-001 (pull Horizon as baseline) is
  superseded by ADR-007.
- **Section names are mandated:** `sections/banner.liquid` and
  `sections/product-grid.liquid`. The `tisso-*` file prefix in `CLAUDE.md` §5 no
  longer applies to section files — superseded by ADR-008.
- **New hard constraint:** no ready-made Dawn sections, snippets, or components,
  and no reliance on Dawn's CSS classes. This is stricter than C7/C8 and is the
  single most likely thing to be graded.
- **New scope:** a popup rendering real product data, Ajax cart add-to-cart, and
  a business rule (Color=Black + Size=M also adds `dark-winter-jacket`).
- **Delivery is part of the deliverable:** public GitHub repo `Abdulrhman-Magdy`,
  untouched theme on `master`, GitHub-integration connection, `development`
  branch, PR to `master`, page live.

**Verified:** ORCH — two of the brief's five stated facts independently
re-confirmed against the running store rather than taken on trust:
`GET /products/dark-winter-jacket.js` → **200**;
`GET /products/soft-winter-jacket.js` → **404**. Confirms fact #2 (resolve by
handle, never by title). `gh auth status` → logged in as `abdulrhmanmagdy1`;
`gh repo view abdulrhmanmagdy1/Abdulrhman-Magdy` → does not exist yet.

**SPEC:** none — this entry records a scope change, not completed feature work.

**Notes:** **Deadline is the binding constraint.** Invitation 5 Aug 2026 + the
shorter 3-day window = **8 Aug 2026**. Today is 7 Aug. Roughly one working day
remains. `docs/PLAN.md` is sequenced accordingly: delivery rails and a live
walking skeleton first, polish last.


---

## [2026-08-07 19:45 EEST] P1.1–P1.5 — Dawn published live; delivery rails established

**Done:** Executed the highest-risk phase first, because these are the only
failures that are *unrecoverable* — a perfect page in a private repo scores zero.

1. Stopped the Horizon dev server; cloned Dawn (**15.5.0**) from
   `github.com/Shopify/dawn`.
2. `shopify theme push --unpublished` → theme **#196652761254**, then
   `shopify theme publish`. Dawn is now `[live]`; Horizon (#196606689446) is
   `[unpublished]`, **not deleted**, and restorable.
3. Removed the Horizon working tree and `shopify theme pull`ed the **live Dawn**
   back down, so the committed baseline is the store's actual live theme rather
   than a lookalike clone.
4. Created the **public** repo `abdulrhmanmagdy1/Abdulrhman-Magdy`, committed
   untouched Dawn to `master` (`0591ab4`, 366 files), pushed, set default branch.
5. Branched `development`, committed the Phase 0 tooling (`cedec23`), pushed.

**Files:**
- `assets/` (191), `config/` (2), `layout/` (2), `locales/` (51), `sections/` (55),
  `snippets/` (39), `templates/` (14) — Dawn 15.5.0, untouched, on `master`
- `.claude/`, `CLAUDE.md`, `docs/`, `scripts/`, `package.json` — on `development`

**Verified:** ORCH — `shopify theme list` shows `Dawn [live] #196652761254`;
`gh repo view` reports `"visibility":"PUBLIC"`; both branches pushed and tracking.
Independent QA verification dispatched separately (see P1.9).

**SPEC:** S0.3 (re-established against Dawn)

**Notes:** Confirmed the forbidden Dawn components are present in the tree and
must be avoided, not merely unused by accident: `snippets/card-product.liquid`,
`snippets/product-variant-picker.liquid`, `assets/quick-add.js`,
`snippets/quick-order-list*.liquid`.

---

## [2026-08-07 19:52 EEST] P1.7 — Project memory realigned from Horizon to Dawn

**Done:** Rewrote `CLAUDE.md` around the real brief: Dawn 15.5.0 as host theme,
C1 ("nothing from Dawn") promoted to the first and most emphasised constraint,
the mandated section filenames, the Black+M business rule with its `M`/`Medium`
normalisation and match-by-option-name requirement, and the verified product
handles. Added three ADRs.

**Files:** `CLAUDE.md` (rewritten), `docs/DECISIONS.md` (+ADR-007/008/009),
`docs/PLAN.md` (new), `docs/PROGRESS.md`

**Verified:** ORCH — `docs/DECISIONS.md` now holds 9 ADRs; ADR-007 explicitly
supersedes ADR-001 rather than editing it away, preserving the reversal trail.

**SPEC:** S0.1, S0.2

**Notes:** ADR-009 is the load-bearing one. Dawn's `base.css` is global and
already defines `.banner`, `.card`, `.grid`, `.button`, `.price` — a section
literally named `banner.liquid` styling a `.banner` element would silently
inherit Dawn styling and violate C1 while *looking* correct. Hence the `ee-`
namespace, verified by grep rather than by inspection.

---

## [2026-08-07 19:58 EEST] P1.8 — QA pipeline re-proven against Dawn

**Done:** First restart of the dev server returned **HTTP 500** on every request.
Cause: `shopify theme dev` reused development theme #196651712678, which had been
created from *Horizon*; serving Dawn files into it left the two themes' files
colliding. Deleted that ephemeral development theme (CLI-created, auto-expiring —
the disposable kind, not a graded one) and let the CLI create a fresh one.
Recaptured the baseline.

**Files:** `qa/screens/baseline-dawn-{1440,768,375}{,-full}.png`,
`qa/screens/baseline-dawn-report.json`

**Verified:** ORCH — capture exited **0**, `✓ all 3 width(s) captured clean`:

| width | scrollWidth/innerWidth | console errors | page errors | failed reqs | broken images |
|---|---|---|---|---|---|
| 1440 | 1440 / 1440 | 0 | 0 | 0 | 0 |
| 768  | 768 / 768   | 0 | 0 | 0 | 0 |
| 375  | 375 / 375   | 0 | 0 | 0 | 0 |

The allowlist calibrated against Horizon transferred cleanly to Dawn (8–9
suppressed platform events per width), which is evidence it was keyed to
`theme dev` proxy behaviour rather than fitted to one theme's quirks.

**SPEC:** S0.4, S0.6, S0.7, S0.8, S0.10 (re-established against Dawn)

**Notes:** These captures are the regression control for "no layout regression
outside our sections". The Horizon-era `baseline-*.png` set is now void.

---

## [2026-08-07 21:10 EEST] P1.9–P1.14 — Phase 1 audited, rejected, repaired, re-verified

**Done:** Dispatched `qa-tester` to verify the Phase 1 exit criteria independently.
It returned **REJECT** (2 MAJOR, 3 MINOR), then **PASS** on re-verification.
Recording what it caught, because the value of the agent separation is only
visible in the findings the orchestrator did not self-report.

**MAJOR-1 — the harness was non-deterministic and would have trained us to
ignore it.** The allowlist entry `/\/api\/collect/` was calibrated against
Horizon; Dawn's Web Pixels posts to `/api/event/collect`, so the pattern missed
and the aborted beacon surfaced as a failed request. QA's *first* run exited 1;
runs 2–5 exited 0. The orchestrator's single green run was luck, and had been
reported to the user as evidence that the allowlist "transferred cleanly to
Dawn" — a claim that was false and has been corrected. Fixed the regex; proved
determinism with consecutive runs rather than one.

**MAJOR-2 — `docs/SPEC.md` was actively dangerous.** `CLAUDE.md` was realigned
to Dawn in P1.7 and SPEC was not, despite `PLAN.md` Phase 1 item 7 mandating it.
It still asserted Horizon was at the repo root — **marked `[x]` verified, and
factually false** — and S5.9 still mandated the `tisso-` prefix that ADR-008
retired, so a builder obeying SPEC would have shipped `tisso-banner.liquid` and
failed constraint C4. It had no assertions at all for the graded feature set.
Rewritten: 9 sections, ~90 assertions, including S8 making "nothing from Dawn"
grep-checkable and S5.5 forcing the cart rule's **negative** case.

**MINOR-3/4/5:** `development` was unpushed (a clone of the public repo would
have received Horizon-era memory); ADR-010 added; void Horizon baselines deleted.

**Re-verification (PASS) raised four more minors, all now cleared:**
- **6** — S0.12 was ticked while 2 of 12 allowlist entries lacked justifying
  comments. Both now carry one; verified mechanically (`0` uncommented entries).
- **7** — the allowlist docblock still named Horizon as the calibration baseline,
  the exact debt that caused MAJOR-1. Rewritten to Dawn, with an explicit warning
  that the list is theme-specific and must be re-validated on any theme change.
- **8** — the docblock claimed suppression was never by message text, which the
  `ERR_FAILED` entry contradicted. Reworded to state the real rule: message-text
  patterns exist only where the console location carries no usable URL, and the
  URL-scoped request check remains authoritative.
- **9** — S0.11 had been ticked with no recorded evidence. Evidence now cited.

**A new failure mode was found while clearing these, and is now diagnosed:**
after ~1 hour the dev server began returning **401 on every request**.
`shopify theme dev` holds a `storefront_digest` cookie for a password-protected
store, and it expires. This produced two different symptoms that looked like two
different bugs: preflight `exit 2` once expired, and — when the session died
*mid-capture* — a spurious `exit 1` that looked exactly like the determinism bug
we had just fixed. The harness now names it explicitly in both cases rather than
reporting a generic failure.

**Files:** `scripts/screenshot.mjs` (allowlist comments, docblock rewrite,
preflight diagnosis for 401/403 and 500, mid-run 401/403 detection),
`docs/SPEC.md` (S0.11 evidence, S0.12 tightened, S0.13 added),
`docs/DECISIONS.md` (ADR-010), `docs/PROGRESS.md`

**Verified:** QA re-verification **PASS** — zero BLOCKER, zero MAJOR. Its
over-suppression check was stronger than the orchestrator's: it stood up a probe
server and injected five failure classes, including a URL *containing* "collect"
(`/collections/collect-me.js`) which was **still caught** (exit 1), proving the
suppression is anchored to `/api/[event/]collect` and is not a blanket match.
It also swept the full git history of every ref for the store password and six
token patterns — **zero matches**, which matters because the repo is public.
ORCH — determinism re-proven after the docblock edits: **6/6 exit 0** on a fresh
session.

**SPEC:** S0.1–S0.13, S1.1, S1.2, S1.3, S1.4, S9.6 ✓

**Notes:** **Phase 1 has exactly one item left: SPEC S1.6**, the Shopify GitHub
integration, which no CLI surface exposes and which needs a human in the admin.
Everything else in Phase 1 is closed.

---

## [2026-08-08] P3/P4 — Walking skeleton built, independently rejected twice, popup + cart built

**Done:** Built `sections/banner.liquid` and `sections/product-grid.liquid`, exported
the two real assets from Figma (`assets/ee-wordmark.svg` from `1:1591`,
`assets/ee-banner-art.png` from `8593:227`), stood the page up on preview theme
**#196660265126**, and built the Phase 4 popup + Ajax cart.

**Verification — both independent agents REJECTED, and both found the same
architectural hole from different directions.**

`design-auditor` → **FAIL, 11 findings.** `qa-tester` → **REJECT, 3 MAJOR + 7 MINOR.**

The convergent finding is the important one, and it is recorded as **ADR-014**:
**ADR-009's `ee-` namespace stops class *collisions* and does nothing about
Dawn's *inherited* and *element-level* styles.** Three separate leaks were
measured, none of which a class-name grep could ever have caught:

1. `base.css:258` `body { letter-spacing: 0.06rem }` inherited into our text
   against Figma's `letterSpacing: 0` — **+24.00px** of ink on the utility
   message, **+33.00px** on the strip. Diagnosed by counterfactual: forcing
   `letter-spacing: 0` snapped both inside ±1px of their Figma boxes.
2. `base.css:486` `div:empty { display: none }` — with the banner's text settings
   blank, `.ee-banner__content` became `:empty`, so `.ee-banner__hero` measured
   **1440×0** and the merchant's hero image vanished entirely.
3. Our CSS had **no wrap policy at all**; headings only survived a 55-char
   unbreakable token because *Dawn* sets `word-break: break-word` on h1–h6.

SPEC S8.2 is therefore amended: isolation must be proven by **computed style**
against the Figma node, not by grep. The grep assertion passed cleanly the entire
time Dawn was restyling our text.

**Two further convergences worth recording:** QA measured hero copy printed on the
line-art at 768/375 at **1.0:1 contrast** (darkest background pixel luma 0), while
the auditor independently found the build makes the art full-bleed 375×421 where
`3:1630` is a **686×264 band that does not sit behind the copy**. One fidelity fix
resolves both. And both agents independently hit Figma's
`absoluteBoundingBox.height` **ceil** artefact — the cause of the 14-vs-13.424 and
29-vs-28.8 errors — confirming the rule: read `style.lineHeightPx`, never a box.

**What held, measured against the running page:** grid geometry exact to Δ 0.00
(`433px 433px 433px`, gaps 20.00, frame 1339.00×908.00, aspect 0.975225 vs
0.975225); **all 36 hotspot readings within 0.008pp** — 0.035px on a 433px tile;
the button animation exact including the `#FFF544` overlay and
`rgba(0,0,0,0.2) 0 2px 2px` shadow; six products resolved by handle with zero
title lookups; zero Dawn snippets or classes; zero overflow at eight widths;
CLS 0.0022.

**Decisions recorded:** ADR-013 (Dawn chrome out of scope — the displacement is a
pure uniform translation, so once normalised every frame-relative y lands within
0.20px; suppressing it would require a forbidden `layout/theme.liquid` edit and
would delete the mobile hamburger the design asks for), ADR-014 (above).

**Notes:** Two fix agents are running on locked, disjoint file sets. Nothing is
committed — three rejections, all from agents that did not write the code.
