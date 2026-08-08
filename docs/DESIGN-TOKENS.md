# DESIGN-TOKENS.md — exact values extracted from Figma (Phase 2)

> **Purpose.** A builder must be able to implement `sections/banner.liquid` and
> `sections/product-grid.liquid` from this file **without reopening Figma**.
>
> **Source.** Figma file `EOnLQN0Q4BDBYH7Hh0N59T`, via Figma MCP
> (`get_metadata`, `get_design_context`, `get_variable_defs`, `get_motion_context`,
> `get_screenshot`). Frames: desktop `1:1588` "Desktop - 22" (1440×2000),
> mobile `1:1802` "Home page:M" (375.444×1200).
>
> **Every value below carries a label:**
>
> | Label | Meaning |
> |---|---|
> | `FIGMA` | Read directly out of the Figma node tree or a native-resolution Figma render. Trustworthy to the pixel. |
> | `MEASURED` | Measured off a **native 1440-wide Figma PNG render** (`get_screenshot` of `3:1125`, `1:1590`). Exact to ±1px (antialias). |
> | `REF` | Measured off `design-reference/desktop.png` (1037×1440, a **0.72× scaled** export). Divide by 0.72 to reach design px; carries ±1.4px error. Per ADR-004. |
> | `DERIVED` | Arithmetic on `FIGMA`/`MEASURED` values. The arithmetic is shown. |
> | `ASSUMPTION` | **Not extracted.** A stated guess with its reasoning. Must be re-checked or escalated to an ADR. |
> | `NOT EXTRACTED` | Blocked. Nothing is claimed. |
>
> **Never** treat an `ASSUMPTION` row as a measurement in a design audit.

---

## 0. Extraction status — read this first

### 0.1 Hard blocker: Figma MCP quota exhausted

Mid-extraction the Figma MCP returned, and continues to return:

```
You've reached the Figma MCP tool call limit on the Starter plan.
```

Approximately 12 successful calls were made before the cap. Retries after 90 s,
5 min and 10 min waits all failed identically, so this is a **plan-level quota**
(daily/monthly), not a short rate window.

**Everything in §1–§4 and §6–§9 was extracted before the cap and is solid.
§5 (the popup) is almost entirely missing.** See §10 for the exact re-run list.

### 0.2 What is fully extracted

- Desktop banner: geometry, typography, colours, button geometry — complete.
- Desktop product grid: geometry, tile sizes, gutters, all 6 hotspot coordinates — complete.
- Mobile: full geometry for banner + grid; typography sizes are `DERIVED`, families are `ASSUMPTION`.
- The **button two-state spec** (what changes between states) — complete. Timing is `ASSUMPTION`.

### 0.3 What is NOT extracted

| Gap | Impact | §  |
|---|---|---|
| **The popup / quick-view modal** — dimensions, layout, image treatment, title/price/description type, close affordance, backdrop colour + opacity | **High.** Blocks the whole popup build. | §5 |
| **The serif family used for the grid heading** ("Tisso vison in the wild") | **High.** It is visibly *not* Jost. Cannot be guessed. | §2.4 |
| Grid-heading font-size (range 36–40px established, not pinned) | Medium — a `MEASURED` acceptance test is given instead | §2.4 |
| Announcement-strip typography (`1:1613` / `1:1813`) | Medium | §1.4 |
| Mobile banner typography (`3:1669`, `3:1670`, `3:1672`) | Medium — sizes `DERIVED`, families `ASSUMPTION` | §6.2 |
| Hotspot marker fill / border / shadow / `+` stroke exact values | Medium | §2.6 |
| Button animation **duration and easing** | Medium — Figma genuinely does not carry it | §3.4 |
| Any tablet (768) design | **None exists in the file.** See §8. | §8 |

---

## 1. Desktop banner — `sections/banner.liquid`

Root frame `1:1589` "Frame 1957", **1440 × 878**, at y=0 of `1:1588`. `FIGMA`

Three stacked bands:

| Band | Node | y | height | background |
|---|---|---|---|---|
| Utility bar | `1:1590` | 0 | 64 | `#F5F5F5` |
| Hero | `3:1125` | 64 | 780 | `#FFFFFF` |
| Announcement strip | `1:1612` | 844 | 34 | `#F5F5F5` |

All `FIGMA` except the two background hexes, which are `MEASURED` (sampled from the
native Figma renders at `topbar.png(5,5)` → `#F5F5F5`, `banner.png(20,20)` → `#FFFFFF`)
and `REF` for the strip (`desktop.png(100,620)` → `#F5F5F5`).

### 1.1 Utility bar `1:1590` — 1440 × 64

`FIGMA` (from `get_design_context`, exact CSS emitted by Figma):

```
background: #F5F5F5;
display: flex; align-items: center; justify-content: center;
gap: 360px;
padding: 10px 50px;
height: 64px;
```

| Child | Node | x | y | w × h | Notes |
|---|---|---|---|---|---|
| Logo (SVG wordmark "TISSO VISON") | `1:1591` | 50.78 | 22.5 | 151.44 × 19 | 2 SVG paths; **site header asset, see §1.5** |
| Message text | `1:1604` | 562.22 | 25 | 260 × 14 | |
| CTA button | `1:1605` | 1182.22 | 10 | 207 × 44 | right edge 1389.22 → 50.78 right margin |

**Message `1:1604`** — `FIGMA`
```
content:        "Find the ideal gift for your loved ones."
font-family:    Jost
font-weight:    400 (Regular)
font-size:      16px
line-height:    13.424px      /* 0.839 — yes, sub-1. Figma emits it literally. */
color:          #000000
text-align:     center
white-space:    nowrap
```

**CTA `1:1605`** — `FIGMA`
```
width: 207px; height: 44px;
background: #FFF544;                       /* MEASURED confirms: topbar.png(1250,20) = #FFF544 */
label:  "choose gift"  →  rendered UPPERCASE
        Jost 400 / 16px / line-height 20.48px (1.28) / color #000000 / text-align center
label box inset:  top 26.51% (11.66px) · right 26.57% (55.0px) · bottom 25.76% (11.33px) · left 15.94% (33.0px)
        → label box x 33.0 … 152.0 (119.0 wide), y 11.66 … 32.67
arrow ("Line 15", SVG) inset: top 48.99% · right 10.63% (22.0px) · bottom 51.01% · left 77.78% (161.0px)
        → 24px wide, shaft vertically centred at y = 21.56 of 44
        SVG bleeds  -5.52px vertically, -3.13% horizontally  (that bleed is the arrowhead)
box-shadow: none in this state           /* see §3 */
```

A fourth child exists at `inset: 0 99.52% 0 0` (≈0.99px wide × full height, pinned
to the left edge, node `366:3891`). Figma emits **no fill** for it and it is
**not visible** in the native render. See §3.2 — it is the animation's collapsed
wipe layer. `FIGMA`

### 1.2 Hero `3:1125` — 1440 × 780 at y=64

Background: `#FFFFFF` full-bleed rect `3:1126` (rounded-rectangle, radius not emitted → treat as 0). `FIGMA` + `MEASURED`

**Decorative line-art illustration** `8593:227` — `FIGMA`

Two identical vector groups (≈39 paths each, black hairline outlines of gift
objects — cameras, watches, bows, pens):

| Node | x | y (frame-abs) | w × h |
|---|---|---|---|
| `3:1127` | 0 | 64 | 1440 × 390 |
| `3:1166` | 550 | 442 | 890 × 402 |

Net visual effect: line art fills the **top 390px full width** and the
**bottom-right quadrant**, leaving a clear white area mid-left where the copy sits.
There is **no scrim / overlay / tint** — the text sits directly on white.

> **Build note.** S2.3 requires the image to be an `image_picker` setting. Ship this
> as a **single full-bleed 1440×780 background image** (`object-fit: cover`,
> `object-position: center`), not as 78 inline SVGs.

**Copy block** — all left-aligned at **x = 67px**. `FIGMA`

| Element | Node | x | y (frame-abs) | y (hero-local) | w × h |
|---|---|---|---|---|---|
| Heading | `3:1207` | 67 | 489 | 425 | 459 × 70 |
| Description | `3:1208` | 67 | 609 | 545 | 483 × 84 |
| Button | `3:1209` | 67 | 743 | 679 | 220 × 50 |
| *(empty duplicate)* | `3:1206` | 68 | 739 | 675 | 220 × 50 |

**Vertical rhythm inside the hero** (hero-local) — `DERIVED` from the table above:
```
425   heading top
495   heading bottom      (425 + 70)
 50   gap
545   description top
629   description bottom  (545 + 84)
 50   gap
679   button top
729   button bottom       (679 + 50)
 51   to hero bottom (780)
```
The two 50px gaps are exact. `DERIVED`

**Heading `3:1207`** — `FIGMA`
```
content:      "The Gift Guide"
font-family:  Jost
font-weight:  500 (Medium)
font-size:    70px
line-height:  70px            /* Figma: leading-none → 1.0 */
letter-spacing: 0             /* Figma emitted none */
color:        #000000
white-space:  nowrap
```
`MEASURED` cross-check on the native render: ink bbox x 67…522 (456 wide, box says
459), y 429…484 → ascender-top to baseline = **56px = 0.80em** at 70px. Ink starts
4px below the box top. Use this as the acceptance test.

**Description `3:1208`** — `FIGMA`
```
content:      "Discover Joy: Your Ultimate Holiday Gift Destination. Explore our
               curated selection and find the perfect gifts to delight your loved
               ones this holiday season."
font-family:  Jost
font-weight:  400 (Regular)
font-size:    20px
line-height:  1.4  (= 28px)
letter-spacing: 0
color:        #000000
width:        483px           /* wraps to exactly 3 lines: 3 × 28 = 84 ✓ */
```
`MEASURED`: ink bbox x 68…548 (481 wide), y 550…626 (77 tall = 2×28 + 21px
ascender-to-descender). Ink top is 5px below the box top.

**Button `3:1209`** — see §3 (it is a component with two states).

**The duplicate `3:1206`** ("Group 1000008102/Default", 220×50 at 68,739) renders
**completely empty** — `get_design_context` returns a bare `<div>` with no children,
no fill, no text. It is a stray prototype hotspot or a deprecated layer.
**Do not implement it.** `FIGMA`

### 1.3 Announcement strip `1:1612` — 1440 × 34 at y=844

```
background: #F5F5F5                    REF (desktop.png @ 100,620)
height:     34px                       FIGMA
```
Text `1:1613`: box **451 × 14** at x=494.5, y=10 (strip-local). Horizontally centred:
494.5 + 451/2 = 720 = 1440/2. `FIGMA` + `DERIVED`

```
content:        "SUSTAINABLE, ETHICALLY MADE CLOTHES IN SIZES XXS TO 6XL"    FIGMA
font-family:    Jost                    ASSUMPTION — every other text in this file is Jost
font-weight:    400                     ASSUMPTION
font-size:      16px                    ASSUMPTION
letter-spacing: 0                       ASSUMPTION
text-transform: uppercase               FIGMA (the string is stored uppercase)
color:          #000000                 ASSUMPTION
line-height:    14px                    DERIVED (box height)
```
> **Reasoning for the 16px assumption.** `REF` ink profile of the strip gives an
> uppercase cap-height band of **8–8.5 scaled rows**. The same measurement on the
> hero button label — which Figma states is **exactly 16px Jost uppercase** — gives
> **8 scaled rows**. Same cap height ⇒ same size. Ink width 323 scaled px (=448.5
> design px) also matches the 451px box. This is a *calibrated* estimate, not a
> guess, but it is still `ASSUMPTION` because the node itself was never read.

### 1.4 Does the utility bar belong to `banner.liquid`?

**Open question — needs an ADR.** `FIGMA` facts:

- On desktop, the logo, the message and the CTA share **one** 64px bar (`1:1590`).
- On mobile the equivalent bar (`1:1804`, "Component 189", 375.444×65) contains a
  **hamburger + centred wordmark only** — the message and the CTA are **absent**.

So structurally the bar is the **site header**, and the message + CTA are
desktop-only decorations inside it. C4 permits only two new sections, so if the
message and CTA are to be merchant-editable (they look like red-rectangle items),
they must be rendered by `banner.liquid` as a strip above the hero and hidden below
the mobile breakpoint. **Flag to the orchestrator; do not decide this silently.**

---

## 2. Desktop product grid — `sections/product-grid.liquid`

Section container `1:1662` "Frame 1000009744": **1337 × 981** at x=51.5, y=968. `FIGMA`

```
left margin:  51.5px   (1440 − 51.5 − 1337 = 51.5 right, per the container box)
gap above:    90px     DERIVED (banner bottom 878 → container top 968)
```

| Child | Node | x | y | w × h |
|---|---|---|---|---|
| Heading | `1:1663` | 0 | 0 | 372 × 43 |
| Grid | `1:1664` | 0 | 73 | **1339** × 908 |

Heading-box bottom (43) → grid top (73) = **30px gap**. `DERIVED`

### 2.1 ⚠ The 1337 / 1339 discrepancy — real, and visible

The grid frame is **1339px** wide but its parent container is **1337px**. `FIGMA`

`REF` verification (scan of `desktop.png` at y=900, near-white run detection):

| Feature | REF px | ÷0.72014 → design px | Figma says |
|---|---|---|---|
| left margin ends | 0…36 | 51.4 | 51.5 ✓ |
| tile 1 | 37…348 (312) | 433.3 | 433 ✓ |
| gutter 1 | 349…362 (14) | 19.4 | 20 ✓ |
| tile 2 | 363…674 (312) | 433.3 | 433 ✓ |
| gutter 2 | 675…688 (14) | 19.4 | 20 ✓ |
| tile 3 | 689…1001 (313) | 434.6 | 433 ✓ |
| grid right edge | 1001 | **1390.0** | 51.5 + 1339 = **1390.5** ✓ |

So the rendered right margin is **49.5px**, not 51.5px. The 2px asymmetry is in the
design, not a measurement error.

**Recommendation (`ASSUMPTION`, needs an ADR line):** build the container at
**1339px max-width** with `padding-inline: 50.5px` at 1440, and lay the grid out as
`grid-template-columns: repeat(3, 1fr); gap: 20px;` — this self-corrects to
`(1339 − 40) / 3 = 433` exactly and removes the asymmetry. Deviation from Figma:
**+1px on the left margin, −1px on the right.** Inside the ±2px ADR-004 tolerance.

### 2.2 Grid geometry `1:1664` — 1339 × 908 `FIGMA`

```
columns:        3
rows:           2
tile:           433 × 444
column gap:     20px      (453 − 433)
row gap:        20px      (464 − 444)
check:          433×3 + 20×2 = 1339 ✓     444×2 + 20 = 908 ✓
aspect-ratio:   433 / 444 = 0.97523       (h/w = 1.02540)
```

Tile origins (grid-local): `(0,0) (453,0) (906,0) (0,464) (453,464) (906,464)`.

`REF` vertical verification: row gutter observed at scaled y 1070…1082, predicted
1069.2…1083.6 ✓; grid bottom observed 1403, predicted 1403.3 ✓.

### 2.3 Tile image treatment

Each tile is a **group** containing exactly one full-bleed `rounded-rectangle`
image fill + one hotspot frame. `FIGMA`

| Tile | Group | Image node | Hotspot node |
|---|---|---|---|
| 1 | `3:1291` | `38:128` | `70:147` |
| 2 | `3:1262` | `38:129` | `70:142` |
| 3 | `3:1263` | `38:130` | `70:143` |
| 4 | `3:1284` | `38:131` | `70:145` |
| 5 | `3:1270` | `38:132` | `70:146` |
| 6 | `3:1277` | `38:174` | `70:144` |

```
image size:     433 × 444, fills the tile exactly (object-fit: cover)
border-radius:  0            ASSUMPTION — node type is "rounded-rectangle" but Figma
                             emitted no radius; the REF render shows square corners
border:         none         REF
overlay/scrim:  none         REF
tile caption:   none — there is NO title, price or label on the tile   FIGMA
```

> Per C-note in `CLAUDE.md`: images come from `product.featured_image`. There is no
> separate image upload (S3.4).

### 2.4 Section heading `1:1663` — ⚠ family NOT EXTRACTED

```
content:  "Tisso vison in the wild"     FIGMA
box:      372 × 43                      FIGMA  (auto-width: the box is tight to the ink)
color:    #000000                       REF
family:   A SERIF. NOT Jost.            NOT EXTRACTED — this is the single most
                                        important missing value in this document.
weight:   Regular (400)                 ASSUMPTION — the REF render shows no bolding
```

`REF` ink metrics (scan of `desktop.png`, ÷0.72 to design px):

| Metric | scaled px | design px |
|---|---|---|
| ascender top → baseline | 21 | **28.5–29.2** |
| x-height | 12 | **16.7** |
| ink width | 267 | **370.8** (box says 372 ✓) |
| box top → ascender top | 3.0 | 4.2 |
| baseline → box bottom | 7.9 | 11.0 |

**Font size: 36–40px. NOT PINNED.** `ASSUMPTION`

Two defensible readings, and they disagree:

| Reading | Arithmetic | Result |
|---|---|---|
| Line-box: 43px box at a conventional 1.2 line-height | 43 / 1.2 | **36px** |
| Ink: 28.5px ascender at a conventional serif 0.72em ascender ratio | 28.5 / 0.72 | **40px** |

For calibration, Jost's ascender ink is **0.80em** (`MEASURED`: 56px ink at 70px).
At 36px the serif would need a 0.79em ascender (high for a serif); at 40px the line
box would be 1.075em (tight, but this file *does* use odd explicit line-heights —
13.424px on 16px, 20.48px on 16px). Neither can be eliminated.

**Acceptance test the builder can use instead of guessing:**
> Set family, weight and size so that the rendered `<h2>` text block for the exact
> string "Tisso vison in the wild" measures **372px × 43px at 1440**, with the
> ascender 4px below the box top and the baseline 32px below the box top.
> Then it is correct regardless of which size was authored.

Start from `font-size: 36px; line-height: 43px;` and adjust once the family is known.

### 2.5 Hotspot marker positions — **PARENT'S ARITHMETIC VERIFIED, ALL SIX CORRECT**

Tile groups are **Figma groups**, which are transparent to coordinates — their
children are expressed in the grid frame's space. The parent's formula is therefore
right:

```
hotspot_x % = (hotspot.x + 11 − tile.x) / 433 × 100
hotspot_y % = (hotspot.y + 11 − tile.y) / 444 × 100      /* +11 centres the 22×22 marker */
```

Recomputed independently from `get_metadata` on `1:1588`:

| # | Product handle | Tile node | tile x,y | Hotspot node | hs x,y | X % | Y % |
|---|---|---|---|---|---|---|---|
| 1 | `black-leather-bag` | `3:1291` | 0, 0 | `70:147` | 256.5, 238 | (267.5)/433 = **61.78** | (249)/444 = **56.08** |
| 2 | `blue-silk-tuxedo` | `3:1262` | 453, 0 | `70:142` | 808.5, 222 | (366.5)/433 = **84.64** | (233)/444 = **52.48** |
| 3 | `chequered-red-shirt` | `3:1263` | 906, 0 | `70:143` | 1167, 82 | (272)/433 = **62.82** | (93)/444 = **20.95** |
| 4 | `classic-leather-jacket` | `3:1284` | 0, 464 | `70:145` | 301.5, 535 | (312.5)/433 = **72.17** | (82)/444 = **18.47** |
| 5 | `classic-varsity-top` | `3:1270` | 453, 464 | `70:146` | 665.5, 568 | (223.5)/433 = **51.62** | (115)/444 = **25.90** |
| 6 | `silk-summer-top` | `3:1277` | 906, 464 | `70:144` | 1225.5, 628 | (330.5)/433 = **76.33** | (175)/444 = **39.41** |

**Every one of the parent's six pairs matches to 2 decimal places.** `DERIVED` from `FIGMA`.

Independent `REF` spot-check on tile 3: predicted marker centre at scaled
(885.4, 816.5); the actual white disc centre in `desktop.png` is at (886, 816). ✓

**These are per-block settings (C6, S3.7, S3.8). Use them as the six block defaults.**
Percentages are of the **tile**, so they survive every breakpoint unchanged — see §6.5.

### 2.6 Hotspot marker design

```
size:            22 × 22 px                     FIGMA (frame 70:14x)
shape:           filled circle                  REF
fill:            #FFFFFF                        ASSUMPTION — see below
border:          none visible                   REF
box-shadow:      none visible                   REF
glyph:           a "+", black                   REF
+ arm length:    ~10px                          REF (7 scaled px ÷ 0.72)
+ stroke width:  ~1.5–2px                       REF
hover state:     NOT EXTRACTED
```

> **Why the fill is `ASSUMPTION`.** `REF` sampling of the disc over three different
> backgrounds (dark bag, red shirt, blue denim) returns `#E4E4E4`…`#F5E1E6` —
> near-white but never `#FFFFFF`, with a slight tint of the underlying photo. That is
> consistent with **either** opaque `#FFFFFF` blurred by the 0.72× downscale **or**
> a semi-transparent white (~`rgba(255,255,255,0.92)`). The 1037px export cannot
> separate the two. Node `70:147` was never read (quota).
> **Use opaque `#FFFFFF`** — it is the safer default and matches the visual — and
> re-check `70:147` before the design audit.

Marker size is **fixed px per breakpoint**, not proportional: 22px on a 433px tile
(5.08% of tile width) desktop, 15.714px on a 169px tile (9.30%) mobile. `DERIVED`

**Not extracted:** hover/focus state of the marker, and whether the marker has a
pulse/scale animation. Design the focus ring yourself per C9.

---

## 3. THE BUTTON ANIMATION (S2.8) — full spec

### 3.1 The component

`3:1209` is an instance of **"Component 207"**, a Figma **variant set with exactly
two variants**. `FIGMA`

| Variant name | Nodes | Appearance |
|---|---|---|
| `Group 1000008196` | `1:20`…`1:24` | **black** bg, **white** label, **white** arrow, **no** shadow |
| `Group 1000007810` | `1:15`…`1:19` | **yellow `#FFF544`** bg over black, **black** label, **black** arrow, **drop-shadow** |

**Which is at rest?** The hero instance `3:1209` is set to `property1="Group 1000008196"`,
and both the native Figma render (`banner.png`) and `design-reference/desktop.png`
show the hero button **black with white text**. So:

```
REST  = Group 1000008196  (black)
HOVER = Group 1000007810  (yellow)
```
`FIGMA` for the variant assignment; the rest/hover *mapping* is `DERIVED` (the
resting canvas state is the black one; a two-state set with no third state means the
other variant is the interaction state).

The utility-bar CTA `1:1605` uses the **inverse** resting state — it renders
**yellow with black text** (`MEASURED`: `topbar.png(1250,20)` = `#FFF544`). Its hover
is therefore the black state. Same mechanism, mirrored.

### 3.2 The exact delta between the two states

Layer-by-layer, from `get_design_context` on the variant set:

| Layer | REST (`…8196`, black) | HOVER (`…7810`, yellow) | Delta |
|---|---|---|---|
| base fill | `#000000`, `inset: 0` | `#000000`, `inset: 0` | **unchanged** |
| wipe overlay | `inset: 0 99.52% 0 0` → **≈1.06px wide**, full height, pinned left | `#FFF544`, `inset: 0` → **220px wide**, full height | **width 1px → 100%, left-anchored** |
| arrow (SVG) | `#FFFFFF` | `#000000` | **colour flip** |
| label | `#FFFFFF` | `#000000` | **colour flip** |
| container | no shadow | `drop-shadow(0px 2px 2px rgba(0,0,0,0.2))` | **shadow appears** |

Geometry (size, position, padding, font, letter-spacing) is **identical** in both
states. Only fill-extent, two text/icon colours, and the shadow change. `FIGMA`

> **Honest caveat on the wipe layer.** The 0.48%-wide element is present in both
> `1:1605` and the `…8196` variant, is pinned to the **left** edge, and Figma emits
> **no fill** for it — and it is **not visible** in the native render
> (`MEASURED`: `banner.png` x=67, y=700 is pure `#000000`, no yellow hairline).
> So at rest the button is *uniformly black* and the 1px element carries no ink.
> The reading that it is the collapsed yellow wipe is the **only** reading that
> explains (a) why a 1px full-height element exists in both instances, (b) why it is
> left-anchored, and (c) why the other variant is the same fill at `inset: 0`.
> It is `DERIVED`, not `FIGMA`. If a reviewer disputes the wipe, the fallback —
> a plain cross-fade of background + text colour — hits every extracted value except
> the direction of the transition.

### 3.3 Button geometry (both states) — `FIGMA` + `MEASURED`

```
size:            220 × 50 px
background:      #000000
label:           "Shop Now"  →  text-transform: uppercase
                 Jost 400 / 16px / line-height 20.48px / letter-spacing 0 / centred
label box:       x 55.07 … 142.08 (87.01 wide), y 14.26 … 35.25 (20.99 tall)
                 from Figma inset  top 28.51% · right 35.42% · bottom 29.49% · left 25.03%
arrow:           x 171.12 … 196.61 (25.5 wide), shaft vertically centred at y = 24.5
                 from Figma inset  top 48.99% · right 10.63% · bottom 51.01% · left 77.78%
```

`MEASURED` on the native render (button-local coords, button origin = 67,679):

| Ink | x | y | size |
|---|---|---|---|
| label "SHOP NOW" | 56 … 141 | 19 … 29 | 86 × 11 (cap height 11px) |
| arrow | 170 … 196 | 19 … 29 | 26 × 11 |

- shaft is a **1px** white line at y = 24 (button-local), `#FFFFFF`
- arrowhead occupies the last ~8px and spans the full 11px height
- gap between label ink and arrow ink: **29px**
- padding-left to label ink: **55px**; padding-right from arrow ink: **24px**

**Recommended CSS box (matches Figma to ≤1px and survives a longer merchant label):**
```css
.ee-banner__button {
  display: inline-flex;
  align-items: center;
  gap: 29px;
  min-width: 220px;
  height: 50px;
  padding: 0 24px 0 55px;
  background: #000;
  color: #fff;
}
```
> Do **not** use `justify-content: center` — that would place the label at x=39
> instead of x=55, a **16px** delta and an automatic ADR-004 FAIL.

### 3.4 Timing — Figma carries none

`get_motion_context` on `3:1206` with `recursive: true` returned **`{"nodes": []}`**.
There is **no prototype interaction, no Smart Animate, no keyframe track, no
duration and no easing** anywhere on these nodes. `FIGMA` (a negative result, but a
real one).

```
trigger:    :hover, and :focus-visible for keyboard parity   ASSUMPTION (C9 requires it)
duration:   300ms                                            ASSUMPTION
easing:     cubic-bezier(0.4, 0, 0.2, 1)                     ASSUMPTION
```
> **Reasoning.** 300 ms is the standard "medium" UI duration and is long enough for a
> 220px left-to-right wipe to read as directional without feeling sluggish; a
> decelerating ease matches the wipe's "arrives and settles" character. There is no
> Figma evidence for either number — **log both in `docs/DECISIONS.md`** per
> `CLAUDE.md` §8 rule 9.

Colour flips and the shadow should share the same duration so the states arrive together.

### 3.5 Reference implementation shape (S2.8 + S2.9)

```css
.ee-banner__button { position: relative; overflow: hidden; background: #000; }

.ee-banner__button::before {                 /* the wipe */
  content: ""; position: absolute; inset: 0 auto 0 0;
  width: 1px; background: #FFF544;
  transition: width 300ms cubic-bezier(.4,0,.2,1);
}
.ee-banner__button:hover::before,
.ee-banner__button:focus-visible::before { width: 100%; }

.ee-banner__button-label,
.ee-banner__button-icon {                    /* must sit ABOVE the wipe */
  position: relative; z-index: 1; color: #fff;
  transition: color 300ms cubic-bezier(.4,0,.2,1);
}
.ee-banner__button:hover  .ee-banner__button-label,
.ee-banner__button:hover  .ee-banner__button-icon { color: #000; }

.ee-banner__button { transition: box-shadow 300ms cubic-bezier(.4,0,.2,1); }
.ee-banner__button:hover { box-shadow: 0 2px 2px rgba(0,0,0,.2); }

@media (prefers-reduced-motion: reduce) {    /* S2.9 */
  .ee-banner__button::before,
  .ee-banner__button-label,
  .ee-banner__button-icon,
  .ee-banner__button { transition: none; }
}
```
The arrow must be an **SVG whose stroke is `currentColor`** so the colour flip
carries it. `FIGMA` confirms the arrow is a vector, not a glyph.

The utility-bar CTA is the same component with `#FFF544` / `#000000` swapped for
`#000000` / `#FFFFFF`.

---

## 4. Global tokens

### 4.1 Figma variables — there are none

`get_variable_defs(1:1588)` returned **`{}`**. `FIGMA`

The file defines **no** colour, spacing or typography variables. Every value in this
document is a raw literal read off a node. There is no token layer to mirror, so the
`--ee-*` custom properties in §4.2–§4.4 are **our** invention (ADR-009 naming),
seeded from the extracted literals.

### 4.2 Colour palette

| Token | Hex | Label | Used for |
|---|---|---|---|
| `--ee-color-black` | `#000000` | `FIGMA` | all body/heading text, hero button bg, selected variant pill |
| `--ee-color-white` | `#FFFFFF` | `FIGMA` | hero bg, label on black, unselected pill bg, hotspot disc |
| `--ee-color-accent` | `#FFF544` | `FIGMA` + `MEASURED` | utility CTA bg, button hover wipe |
| `--ee-color-surface` | `#F5F5F5` | `MEASURED` (top bar) / `REF` (strip) | utility bar bg, announcement strip bg |
| `--ee-shadow-button` | `0 2px 2px rgba(0,0,0,0.2)` | `FIGMA` | button hover only |

**That is the entire palette.** No greys beyond `#F5F5F5`, no border colour, no
brand secondary. Anything else a builder needs (focus ring, disabled state, backdrop)
is **not in the design** and must be declared as an assumption.

### 4.3 Type ramp

Family is **Jost** everywhere except the grid section heading. `FIGMA`

| Role | Node | Family | Weight | Size | Line-height | Tracking | Colour | Label |
|---|---|---|---|---|---|---|---|---|
| Hero H1 (desktop) | `3:1207` | Jost | 500 | 70px | 70px (1.0) | 0 | `#000` | `FIGMA` |
| Hero H1 (mobile) | `3:1669` | Jost | 500 | **30px** | 30px (1.0) | 0 | `#000` | `DERIVED` §6.2 |
| Section H2 (desktop) | `1:1663` | **serif, unknown** | 400? | **36–40px** | 43px | ? | `#000` | `ASSUMPTION` §2.4 |
| Section H2 (mobile) | `1:1947` | same serif | 400? | **24px** | 29px | ? | `#000` | `DERIVED` §6.4 |
| Body / hero description (desktop) | `3:1208` | Jost | 400 | 20px | 28px (1.4) | 0 | `#000` | `FIGMA` |
| Body / hero description (mobile) | `3:1670` | Jost | 400 | **15px** | 21px (1.4) | 0 | `#000` | `ASSUMPTION` §6.2 |
| Button label | `3:1209`, `1:1605` | Jost | 400 | 16px | 20.48px (1.28) | 0 | `#FFF`/`#000` | `FIGMA` |
| Utility bar message | `1:1604` | Jost | 400 | 16px | 13.424px (0.839) | 0 | `#000` | `FIGMA` |
| Announcement strip | `1:1613` | Jost | 400 | 16px | 14px | 0 | `#000` | `ASSUMPTION` §1.3 |
| Variant option label (popup) | `116:532` | Jost | 400 | 16px | 1.0 | **−0.32px** | `#000`/`#FFF` | `FIGMA` |

Only **two weights** appear: Jost **400 Regular** and Jost **500 Medium** (the H1 only).
`−0.32px` on the variant option is the **only** non-zero letter-spacing found anywhere.

> **⚠ C2 (no CDN, no external dependency).** Do **not** add a Google Fonts `<link>`.
> **Jost is in Shopify's own font library** — load it via a `font_picker` setting
> defaulting to `jost_n4` (and `jost_n5` / `font_modify` for the Medium H1), rendered
> through `{{ font | font_face }}`. That keeps the design font **and** C2.
> The serif must be picked from Shopify's library the same way — once its family is
> known (§2.4).

### 4.4 Spacing

**No spacing scale is declared in the file** (no variables, no auto-layout grid
system beyond the two flex rows). These are the literals actually used:

| Value | Where | Label |
|---|---|---|
| 4px | mobile grid gutter (both axes) | `FIGMA` |
| 10px | utility bar vertical padding | `FIGMA` |
| 20px | desktop grid gutter (both axes); mobile heading→grid; mobile button side padding | `FIGMA` |
| 24px | mobile heading→description; button right padding | `FIGMA` / `MEASURED` |
| 29px | button label→arrow gap | `MEASURED` |
| 30px | desktop heading→grid | `DERIVED` |
| 40px | mobile strip→grid section | `DERIVED` |
| 50px | utility bar horizontal padding; desktop hero H1→description and description→button | `FIGMA` / `DERIVED` |
| 51.5px | desktop grid container side margin | `FIGMA` |
| 55px | button left padding | `MEASURED` |
| 67px | desktop hero copy left inset | `FIGMA` |
| 90px | desktop banner→grid section | `DERIVED` |
| 360px | utility bar flex gap | `FIGMA` |
| 16.5px | mobile page side margin | `DERIVED` §6.1 |

> The hero copy sits at **67px** but the grid container at **51.5px**. That
> inconsistency is in the design. Do not "harmonise" it — it would fail the audit.

### 4.5 Breakpoints

**No breakpoint is declared anywhere in the file.** `FIGMA`

Only two frames exist: `1:1588` at **1440** and `1:1802` at **375.444**.
See §8 for tablet.

---

## 5. The popup / quick-view modal — ⚠ NOT EXTRACTED

**The Figma quota was exhausted before any popup node could be read.** Nodes
`3:2077`–`3:2197`, `43:351`–`43:501`, `77:226` and `103:85` were **never opened**.

**Nothing is claimed about:** popup dimensions, layout (columns/stacking), image
treatment, title / price / description typography, ADD TO CART button styling, the
close affordance, the backdrop colour or its opacity, entry/exit animation, or the
mobile popup.

### 5.1 The two popup fragments that WERE read

**`116:532` "Component 212" — the variant option chip** `FIGMA`

A 2-variant set, both **271 × 36**:

| Variant | Background | Label colour |
|---|---|---|
| `Group 1000008197` (unselected) | `#FFFFFF` | `#000000` |
| `Group 1000008198` (selected) | `#000000` | `#FFFFFF` |

```
label:          "XS"                       (sample content)
font:           Jost 400 / 16px / line-height 1.0 / letter-spacing -0.32px / centred
label inset:    top 27.78% · right 46.49% · bottom 27.78% · left 46.86%
border:         none emitted
border-radius:  none emitted → 0
```
This is the **only** hard evidence about the variant selector. It answers part of the
question the parent asked: options are rendered as **full-width rectangular rows /
pills, not swatches and not a `<select>`**, and selection is a solid black fill with
inverted text. The 271px width strongly implies a **271px popup content column**.

**`116:553` "Component 213" — a collapsible group** `FIGMA`

An 8-variant set, all **271** wide, in two heights:

| Height | Variants |
|---|---|
| **64px** | `Group 1000008185`, `Variant3`, `Variant4`, `Variant5`, `Variant6`, `Variant7` (6 of them) |
| **163px** | `Group 1000008186`, `Variant8` (2 of them) |

Consistent with a **collapsed (64px) / expanded (163px) accordion or dropdown** at a
271px content width. **Its contents were never read** — do not infer the option list
length, the chevron, or the labels from this.

### 5.2 What the builder must do

1. **Re-run the extraction in §10 before building the popup.** Do not build it from
   this document — there is nothing here to build from.
2. If the quota cannot be restored in time, the popup design must be **declared an
   ADR** (`docs/DECISIONS.md`) stating that it was designed from the `116:532` /
   `116:553` fragments plus the §4 palette and type ramp, and listing every invented
   value. `CLAUDE.md` §8 rule 9 requires exactly this.

---

## 6. Mobile — frame `1:1802` (375.444 × 1200)

### 6.1 Coordinate artifact — normalise first

The mobile frame is **375.444px** wide and several children carry a **+0.222px**
offset (`3:1629` at x=0.222, `1:1812` at x=0.222). These are Figma drift, not design.
**Subtract 0.222 and treat the viewport as 375.** `DERIVED`

After normalisation the grid container `1:1946` sits at **x = 16.5** with width 342:
`16.5 + 342 + 16.5 = 375` ✓ → **mobile page margin = 16.5px** (recommend `16px`;
0.5px delta, well inside tolerance).

### 6.2 Mobile banner

`1:1803` "Frame 1000008132", 375.444 × 520. Bands: `FIGMA`

| Band | Node | y | height |
|---|---|---|---|
| Header (hamburger + wordmark) | `1:1804` "Component 189" | 0 | 65 |
| Hero | `3:1629` | 65 | 421 |
| Announcement strip | `1:1812` | 486 | 34 |

**⚠ The desktop utility bar's message and CTA do not exist on mobile.** The mobile
header has only a hamburger and the centred wordmark — confirmed in both `1:1804`'s
metadata (a single 375×65 component instance) and `design-reference/mobile.png`.
So `1:1604` and `1:1605` must be **hidden below the mobile breakpoint**. `FIGMA`

**Hero `3:1629` — 375 × 421** (hero-local coordinates) `FIGMA`

| Element | Node | x | y | w × h | Centring |
|---|---|---|---|---|---|
| Illustration | `3:1630` | **−140** | 157 | 686 × 264 | bleeds 140px left, 171px right |
| Heading | `3:1669` | 88.777 | 49 | 197 × 30 | centred (88.78 + 98.5 = 187.28 ≈ 187.5) |
| Description | `3:1670` | 16.777 | 103 | 340 × 42 | centred; 17.5px side margins |
| Button | `3:1671` | 90.777 | 337 | 193 × 45 | centred |

Everything is **centre-aligned** on mobile, vs left-aligned at 67px on desktop. `FIGMA`

Vertical rhythm (hero-local): `DERIVED`
```
 49  heading top      →  79 bottom
 24  gap
103  description top  → 145 bottom
157  illustration band begins (behind the copy)
337  button top       → 382 bottom      ← the button overlaps the illustration
 39  to hero bottom (421)
```

**Mobile heading `3:1669`** — `DERIVED`
```
font-size:   30px      /* 197 / 459 = 0.4292 × 70px = 30.05, and the 30px box height
                          matches line-height 1.0 exactly — two independent confirmations */
line-height: 30px (1.0)
family/weight: Jost 500 Medium        ASSUMPTION (same component as desktop)
color: #000000                        ASSUMPTION
```

**Mobile description `3:1670`** — box 340 × 42, **2 lines** → **line-height 21px** `DERIVED`
```
font-size:   15px      ASSUMPTION — preserves desktop's 1.4 ratio exactly (15 × 1.4 = 21).
                       Alternative reading: 16px with line-height 1.3125. Not resolvable
                       without reading the node.
content:     "Discover Joy: Your Ultimate Holiday Gift Destination."   FIGMA
             ← NOTE: this is SHORTER than the desktop string. See §7.
```

**Mobile button `3:1671`** — a plain frame (**not** the Component 207 instance) `FIGMA`

| Part | Node | x (frame-local) | y | w × h |
|---|---|---|---|---|
| frame | `3:1671` | — | — | 193 × 45 |
| label | `3:1672` | 20 | 13 | 119 × 19 |
| arrow "Line 15" | `3:1673` | 149 | 22.5 | 24 × 0 |

```
padding-left:  20px      DERIVED
label slot:    119px     FIGMA
gap:           10px      DERIVED (149 − 139)
arrow:         24px      FIGMA, shaft vertically centred (22.5 of 45 = exact middle)
padding-right: 20px      DERIVED (193 − 173)
check:         20 + 119 + 10 + 24 + 20 = 193 ✓
background:    #000000   REF (mobile.png)
label colour:  #FFFFFF   REF
label type:    Jost 400 / ~16px uppercase / line-height 19px    ASSUMPTION
```
> The 119px label slot is **wider** than the desktop label box (87px) for the same
> string at (presumed) the same size. Either the mobile label carries positive
> letter-spacing (~+1.5px/char) or the text frame is fixed-width with slack.
> **Not resolvable without reading `3:1672`.** Flagged.

**Mobile strip `1:1812`** — 375 × 34 at y=486; text `1:1813` **288 × 14** at x=43.5,
y=10, centred (43.5 + 144 = 187.5 ✓). `FIGMA`
Content: `"SUSTAINABLE, ETHICALLY MADE ACTIVEWEAR"` — **a different string from
desktop.** See §7.

### 6.3 Mobile grid — **2 columns × 3 rows CONFIRMED**

Container `1:1946` "Frame 1000009745": **342 × 616.26** at (16.722, 560). `FIGMA`

| Child | Node | x | y | w × h |
|---|---|---|---|---|
| Heading | `1:1947` | 47 | 0 | 248 × 29 (centred: 47 + 124 = 171 = 342/2) |
| Grid | `1:1948` | 0 | 49 | 342 × 567.26 |

```
gap strip→section:  40px    DERIVED (520 → 560)
gap heading→grid:   20px    DERIVED (29 → 49)
```

Grid `1:1948` — `FIGMA`
```
columns:      2
rows:         3
tile:         169 × 186.42
column gap:   4px       (173 − 169)
row gap:      4px       (190.42 − 186.42)
check:        169×2 + 4 = 342 ✓      186.42×3 + 4×2 = 567.26 ✓
aspect-ratio: 169 / 186.42 = 0.90656
```

Tile origins: `(0,0) (173,0) (0,190.42) (173,190.42) (0,380.84) (173,380.84)`
Tile groups: `1:1949 · 1:1952 · 1:1956 · 1:1959 · 1:1963 · 1:1966`
Image nodes: `38:177 · 38:178 · 38:179 · 38:180 · 38:181 · 38:182`

**Product order is identical to desktop reading order** (bag, tuxedo, red shirt,
leather jacket, varsity, denim) — confirmed in `design-reference/mobile.png`. `REF`

### 6.4 Mobile section heading `1:1947`

Box **248 × 29** for the same string. `FIGMA`
```
248 / 372 = 0.66667   (exactly 2/3 of desktop)
 29 /  43 = 0.67442
```
If the desktop size is 36px, mobile is exactly **24px** and both line-heights land on
**1.19–1.21** — self-consistent. If desktop is 40px, mobile is 26.67px, which is not a
round value. **This is the strongest single argument for 36 / 24.** `DERIVED`
Recommend `font-size: 24px; line-height: 29px;` at mobile. `ASSUMPTION`

### 6.5 ⚠ Mobile hotspots are placeholders — use the desktop percentages

`FIGMA`. Marker size **15.714286 × 15.714286** (= 22 × 5/7 exactly).

| Tile | Hotspot node | grid-local x,y | **tile-local** x,y |
|---|---|---|---|
| 1 | `70:195` | 101.286, 18 | 101.286, 18 |
| 2 | `70:193` | 274.286, 18 | 101.286, 18 |
| 3 | `70:191` | 101.286, 209.42 | 101.286, **19** |
| 4 | `70:189` | 274.286, 209.42 | 101.286, **19** |
| 5 | `70:187` | 101.286, 398.84 | 101.286, 18 |
| 6 | `70:185` | 274.286, 398.84 | 101.286, 18 |

**All six mobile markers sit in the same spot** (≈64.58%, 13.87%). The mobile frame
therefore carries **no** per-product hotspot data — it is a placeholder layout.

**Consequence for the build:** the six per-block X/Y percentages in §2.5 come from
**desktop only** and are used **at every breakpoint**. Because they are percentages of
the tile, they scale automatically. This satisfies C6/S3.7 with **one** X/Y pair per
block — do **not** add breakpoint-specific hotspot settings. `DERIVED`

**Consequence for the audit:** at 375 the markers will *not* match `mobile.png`.
That is correct behaviour; the reference is wrong, not the build. Record it.

### 6.6 ⚠ Mobile tile aspect ratio differs from desktop

```
desktop  433 / 444    = 0.97523
mobile   169 / 186.42 = 0.90656
delta    0.0687
```
ADR-004 tolerates **±0.02** on aspect ratio, so a single ratio **cannot** satisfy both.
`aspect-ratio` must be switched at the breakpoint:

```css
.ee-grid__tile { aspect-ratio: 433 / 444; }
@media (max-width: 767px) { .ee-grid__tile { aspect-ratio: 169 / 186.42; } }
```
`DERIVED`

---

## 7. Theme Customizer settings — the "red rectangles" (S2.7 checklist)

Every merchant-editable string/asset the design contains. Check these off one by one.

### 7.1 `sections/banner.liquid`

| # | Setting | id (suggested) | type | Figma node | Default value | SPEC |
|---|---|---|---|---|---|---|
| 1 | Utility bar message | `utility_text` | `text` | `1:1604` | `Find the ideal gift for your loved ones.` | S2.7 |
| 2 | Utility bar CTA label | `utility_cta_label` | `text` | `1:1605` | `choose gift` | S2.7 |
| 3 | Utility bar CTA link | `utility_cta_url` | `url` | `1:1605` | *(blank)* | S2.7 |
| 4 | Hero background image | `image` | `image_picker` | `3:1126` / `8593:227` | *(blank)* | **S2.3** |
| 5 | Hero heading | `heading` | `text` | `3:1207` / `3:1669` | `The Gift Guide` | **S2.4** |
| 6 | Hero description | `description` | `richtext`/`textarea` | `3:1208` / `3:1670` | `Discover Joy: Your Ultimate Holiday Gift Destination. Explore our curated selection and find the perfect gifts to delight your loved ones this holiday season.` | **S2.5** |
| 7 | Hero button label | `button_label` | `text` | `3:1209` / `3:1672` | `Shop Now` | **S2.6** |
| 8 | Hero button link | `button_url` | `url` | `3:1209` | *(blank)* | **S2.6** |
| 9 | Announcement strip text | `strip_text` | `text` | `1:1613` / `1:1813` | `SUSTAINABLE, ETHICALLY MADE CLOTHES IN SIZES XXS TO 6XL` | S2.7 |

**Not a setting:** the logo (`1:1591`) — it is the theme header's asset, outside the
two permitted sections.

**⚠ Two strings differ between the desktop and mobile frames:**

| Setting | Desktop | Mobile |
|---|---|---|
| Hero description (#6) | full 3-sentence copy | `Discover Joy: Your Ultimate Holiday Gift Destination.` (truncated) |
| Strip text (#9) | `…MADE CLOTHES IN SIZES XXS TO 6XL` | `…MADE ACTIVEWEAR` |

**Recommendation:** treat each as **one** setting rendering the same string at both
breakpoints (the desktop value). The divergence reads as unmaintained placeholder
copy in the mock, not as an intentional responsive-copy feature, and shipping two
settings per string doubles the customizer surface for no stated requirement.
**This is a judgement call — log it in `docs/DECISIONS.md`.** `ASSUMPTION`

### 7.2 `sections/product-grid.liquid`

| # | Setting | id (suggested) | type | Figma node | Default value | SPEC |
|---|---|---|---|---|---|---|
| 10 | Section heading | `heading` | `text` | `1:1663` / `1:1947` | `Tisso vison in the wild` | S2.7 |
| 11 | Product (× 6 blocks) | `product` | `product` | tiles `3:1291`… | the 6 handles in §2.5 | **S3.2 / S3.5** |
| 12 | Hotspot X (per block) | `hotspot_x` | `range` (%) | `70:14x` | per §2.5 | **S3.7 / S3.8** |
| 13 | Hotspot Y (per block) | `hotspot_y` | `range` (%) | `70:14x` | per §2.5 | **S3.7 / S3.8** |

**Not a setting (S3.4):** the tile image — it comes from `product.featured_image`.

### 7.3 Popup strings — ⚠ cannot be enumerated

The popup was never extracted (§5), so its red rectangles are **unknown**. At minimum
expect an **"ADD TO CART"** button label and the **option group labels** ("Size",
"Colour") to be customizer strings. **S2.7 cannot be signed off until §10 is re-run.**

---

## 8. Tablet (768) — **NO TABLET FRAME EXISTS IN THE FILE**

Stated plainly, because it matters: `get_metadata` on the document returns exactly
**one page** (`0:1`), and the only two viewport frames in it are

- `1:1588` "Desktop - 22" — **1440** × 2000
- `1:1802` "Home page:M " — **375.444** × 1200

**There is no 768 frame, no tablet frame, and no intermediate frame of any width.**
`FIGMA` Nothing below is extracted; every number in §8.1 is `ASSUMPTION`.

C8 nevertheless requires 768 to match "the design", and the `design-auditor`
structure check asserts **2 columns × 3 rows at 768**. So the tablet layout must be
**invented by interpolation and ratified by an ADR.**

### 8.1 Recommended interpolation — `ASSUMPTION`, requires an ADR

Linear interpolation factor at 768: `t = (768 − 375) / (1440 − 375) = 0.369`.

| Property | 375 | 1440 | **768 (recommended)** | Reasoning |
|---|---|---|---|---|
| Columns × rows | 2 × 3 | 3 × 2 | **2 × 3** | asserted by the audit spec; 3 columns at 704px content = 228px tiles, too small |
| Page side margin | 16.5 | 51.5 | **32px** | 16.5 + 35 × 0.369 = 29.4; rounded up to a clean 32 |
| Content width | 342 | 1339 | **704px** | 768 − 2 × 32 |
| Column gap | 4 | 20 | **10px** | 4 + 16 × 0.369 = 9.9 |
| Row gap | 4 | 20 | **10px** | same |
| Tile width | 169 | 433 | **347px** | (704 − 10) / 2 |
| Tile aspect ratio | 0.9066 | 0.9752 | **0.9066** (mobile ratio) | interpolation gives 0.932, which is >0.02 from *both* references and so fails either way; reuse the mobile ratio because 768 shares the mobile 2×3 structure |
| Hotspot marker | 15.71 | 22 | **19px** | 15.71 + 6.29 × 0.369 = 18.0; rounded to 19 to keep the `+` legible |
| Section H2 size | 24 | 36 | **28px** | 24 + 12 × 0.369 = 28.4 |
| Hero H1 size | 30 | 70 | **44px** | 30 + 40 × 0.369 = 44.8 |
| Hero body size | 15 | 20 | **17px** | 15 + 5 × 0.369 = 16.8 |
| Heading→grid gap | 20 | 30 | **24px** | 20 + 10 × 0.369 = 23.7 |
| Section top gap | 40 | 90 | **58px** | 40 + 50 × 0.369 = 58.5 |
| Hero copy alignment | centre | left | **left** | left-align returns as soon as there is room; the switch point is itself an assumption |
| Utility bar message + CTA | hidden | shown | **shown** | 768 has room; the hide point is the mobile breakpoint |

### 8.2 Required ADR

Open an ADR titled roughly *"Tablet (768) is interpolated, because the Figma file
contains no tablet frame"*, recording: the absence of the frame, the interpolation
factor, the whole of §8.1, and the fact that **no design audit at 768 can compare
against a reference** — it can only check the structure (2 × 3, no horizontal
overflow) and internal consistency. `CLAUDE.md` §8 rule 9 mandates this.

---

## 9. Quick reference — the numbers a builder needs most

```
COLOUR      #000000  #FFFFFF  #FFF544  #F5F5F5      shadow rgba(0,0,0,0.2)
FONT        Jost 400 / Jost 500 ; one unknown serif for the section H2

DESKTOP 1440
  banner            1440 × 878   =  64 utility (#F5F5F5) + 780 hero (#FFF) + 34 strip (#F5F5F5)
  hero copy inset   left 67px, first baseline block at hero-y 425, gaps 50 / 50
  H1                Jost 500 70/70            desc  Jost 400 20/28, width 483
  button            220 × 50, padding 0 24 0 55, gap 29, arrow 26 × 11
  grid container    1337 wide @ x 51.5, y 968 ; heading 372 × 43 ; grid at +73
  grid              1339 × 908 = 3 × (433 × 444), gutter 20/20
  tile ratio        433 / 444
  hotspot           22 × 22 white disc, black +

MOBILE 375
  banner            375 × 520   =  65 header + 421 hero + 34 strip
  page margin       16.5px      content 342
  hero              centred; H1 30/30 at y 49 ; desc 15/21 at y 103 ; button 193 × 45 at y 337
  button            padding 0 20, gap 10, arrow 24
  grid container    342 @ x 16.7, y 560 ; heading 248 × 29 ; grid at +49
  grid              342 × 567.26 = 2 × (169 × 186.42), gutter 4/4
  tile ratio        169 / 186.42
  hotspot           15.71 × 15.71

HOTSPOTS (% of tile, same at every breakpoint)
  1 black-leather-bag       61.78 / 56.08
  2 blue-silk-tuxedo        84.64 / 52.48
  3 chequered-red-shirt     62.82 / 20.95
  4 classic-leather-jacket  72.17 / 18.47
  5 classic-varsity-top     51.62 / 25.90
  6 silk-summer-top         76.33 / 39.41

BUTTON ANIMATION
  rest   black bg, white label + arrow, no shadow
  hover  #FFF544 wipe 1px → 100% from the left, label + arrow → black,
         box-shadow 0 2px 2px rgba(0,0,0,.2)
  300ms cubic-bezier(.4,0,.2,1)   ← ASSUMPTION; Figma carries no timing at all
```

---

## 10. Re-run list — exactly what to extract when the Figma quota resets

Ordered by value. Run them in this order and stop when the quota bites again.

| # | Call | Unblocks |
|---|---|---|
| 1 | `get_metadata(43:351)` then `get_design_context` on the popup root | **§5 — the entire popup.** Highest value by far. |
| 2 | `get_metadata(3:2077)`, `get_metadata(77:226)`, `get_metadata(103:85)` | popup variants / mobile popup / backdrop |
| 3 | `get_design_context(1:1663)` | **§2.4 — the serif family, size, weight, tracking, colour.** |
| 4 | `get_design_context(70:147)` | §2.6 — hotspot fill, border, shadow, `+` stroke |
| 5 | `get_design_context(1:1612)` | §1.3 — strip typography + background |
| 6 | `get_design_context(3:1629)` | §6.2 — all mobile banner typography in one call |
| 7 | `get_design_context(1:1946)` | §6.4 — mobile section heading |
| 8 | `get_design_context(116:553)` | §5.1 — the collapsed/expanded selector's contents |
| 9 | `get_screenshot(1:1662)` at `maxDimension: 1440` | a native-resolution grid render, so §2.4/§2.6 can be `MEASURED` instead of `REF` |

**Do not build the popup, and do not finalise the section heading, until #1 and #3
are done.**

---

# ⚠ CORRECTIONS — REST API supersedes the MCP-era extraction (2026-08-07)

The Figma REST API (separate quota from the MCP server) resolved every value
previously marked ASSUMPTION, and **corrected three that were wrong**. Everything
below cites `node-id.field`. Cache: `qa/figma/nodes-popup.json`,
`qa/figma/nodes-key.json` (gitignored).

## C1. Popup controls — PREVIOUS EXTRACTION WAS WRONG

**Superseded claim:** "options are full-width rectangular rows, not swatches,
not a `<select>`." That was inferred from two fragments (`116:532`, `116:553`)
after the MCP quota died. The official screenshot and the API both contradict it.

**Verified structure** (`43:351`, popup frame **311×447**, `fill #FFFFFF`,
`DROP_SHADOW 0,2 blur 4 #000000 @0.2`; content column **271** wide, 20px side padding):

| Element | Node | Spec |
|---|---|---|
| Close ✕ | `43:374` | 16.97×16.97 group of 2 vectors, 12.7px from top, 15.2px from right |
| Product image | `43:362` | **120×140**, IMAGE fill, at popup-relative (17, 36) |
| Title | `43:361` | **Jost 300 16/19.2**, `#000000`, x-offset 145 (8px right of image) |
| Price | `43:360` | **Lustria 400 16/19.2** ← serif |
| Description | `43:359` | **Jost 300 14/15.4, ls −0.14**, width **146** |
| "Color" label | `103:156` | **Jost 400 14/18.2**, `#333333` |
| **Color = TWO CHIPS SIDE BY SIDE** | `103:185` | one 271×40.44 box, `stroke #000000 w=0.5`, split in half. Each half carries a small colour bar at its left (`103:151` 5.81 wide white+stroke; `103:152` 4.84 wide `#000000`). Labels **Jost 400 18/18, ls −0.36** |
| "Size" label | `116:493` | **Jost 400 14/18.2**, `#333333` |
| **Size = DROPDOWN** | `116:954` | 271×40.44 box, `stroke #000000 w=0.5`, vertical divider `116:563` at x-offset 216, chevron `116:495` **12×6 stroke 1.5**, placeholder "Choose your size" **Jost 400 16/16, ls −0.32** |
| ADD TO CART | `43:377` | **271×45**, `fill #000000`, label **Jost 400 16/20.48 CENTER `#FFFFFF`**, arrow `43:379` 33.7 wide `stroke #FFFFFF w=1.5` |

**Vertical rhythm**, popup-relative: close 12.7 · image 36 · title 49 · price 88 ·
description 119 · Color label 186 · chips 210 · Size label 262 · size box 286 ·
ADD TO CART 377 (h45) · bottom padding 25.

**Note:** `43:377` is named `Group 1000007810` — the **same component as the
banner's top-bar CTA** (`1:1605`). The animated button is one shared component,
which is why the instructions say "buttons" plural.

**Real data note:** the Figma chips read **"White" / "black"**, matching the
store's actual Color options (Black, White). The instruction screenshot's
"Blue" does not exist in this catalogue — render from `product.options_with_values`.

## C2. Grid heading — RESOLVED, was 36 vs 40

`1:1663.style` = **Lustria 400, fontSize 36, lineHeightPx 43.2, ls 0**. It is
**36px**. No longer an assumption.

## C3. Serif family — RESOLVED

**Lustria** (`1:1663.style.fontFamily`, `43:360.style.fontFamily`). Used for the
grid heading and the popup price only. Everything else is Jost.

## C4. Hotspot disc — PREVIOUS RECOMMENDATION WAS WRONG

Previously recommended "opaque `#FFFFFF`". Verified: `70:128` ELLIPSE 22×22,
`fill #F8F8F8 @ opacity 0.9`. The `+` glyph (`70:130`/`70:131`) is two 8.46px
vectors, `stroke #000000 w=1.5`. Same ✕/+ vector group ID family as the popup close.

## C5. Strip + utility-bar type — RESOLVED

`1:1613` and `1:1604` are both **Jost 400, fontSize 16, lineHeightPx 13.424,
ls 0, CENTER**. The sub-unity line-height is real, not a misread.

## C6. Banner H1 / description — CONFIRMED

`3:1207` = **Jost 500 70/70**. `3:1208` = **Jost 400 20/28**, width 483.

## C7. The wordmark is VECTOR ART, not text

`1:1591` is a GROUP of 9 VECTOR nodes (151.44×19), not a TEXT node — "TISSO
VISON" is outlined artwork. Red rectangle #1 therefore cannot be a plain text
setting. See ADR-011.
