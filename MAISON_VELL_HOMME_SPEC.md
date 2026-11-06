# Maison Vell Homme — Runway Depth Lookbook (Complete Engineering & Visual Direction Spec)

Give me a single-file, full-viewport luxury menswear fashion page called **Maison Vell Homme**. Six male models stand in one continuous spatial perspective line that recedes from the right foreground of the screen into an atmospheric, blurred architectural distance on the left. Dragging with mouse/touch, scrolling with wheel, or pressing keyboard arrow keys walks the entire line forward: the foreground model expands and glides out smoothly behind a live product rail column, each model advances to the next depth station, and a new model emerges from the atmospheric haze in the background. The curated garment and accessory rail on the right scrolls in mathematical sync, and a luxury rolling look odometer rolls over at the bottom left. The experience loops infinitely with continuous easing and direct physics.

Build this using strictly **TypeScript, Next.js (App Router), and Tailwind CSS**, embedding complete craft principles from **Emil Kowalski Design Engineering**, **Impeccable**, and **tasteskill (anti-slop frontend)**. No third-party animation libraries (no GSAP, no Framer Motion, no Three.js); all depth transforms and physics are driven natively via a single parameter mathematical engine and hardware-accelerated CSS transforms.

---

## 1. Design Philosophy & Skill Integration

### Emil Kowalski Design Engineering Principles
- **Unseen details compound**: Sub-pixel precision rendering, exact transform origins, and exponential chase curves ensure natural tactile physics.
- **Physical spatial consistency**: Easing uses direct drag with zero lag during touch, smooth exponential decay on handoff `(1 - exp(-dt * 0.0072))`, and magnetic snapping to integer stops within 150ms of inertia decay.
- **Property specificity**: Animate strictly composite-only properties (`transform`, `opacity`, `filter`). Model containers never resize or cause reflow; they scale via `transform: scale()` while blur values are divided by the local scale factor so visual focal blur remains optically constant in screen pixels.
- **Micro-press feedback**: Interactive buttons feature immediate `:active` scale reduction (`scale(0.97)`), and plus icons rotate 90° on hover.

### Impeccable & Taste (Anti-Slop) Principles
- **Mode = Experience / Persuade**: The interface recedes; the garments, texture, silhouette, and spatial runway depth lead.
- **Visual hierarchy**: Sharp, high-contrast monochrome and mineral palette (`#0d0f12` obsidian ink, `#171a20` charcoal, `#717984` slate, `#e2e8f0` titanium rail).
- **Typography discipline**: 
  - `Michroma` (uppercase, wide tracking `0.14em` to `0.24em`) for the house identity, navigational telemetry, look odometer, and piece nomenclature.
  - `Inter` (regular / medium) for technical fabrication specifications, pricing, and editorial paragraphs.
- **Mobile craftsmanship**: Fluid transition from dual-column spatial stage to a unified vertical stack with an ergonomic horizontal piece rail at `<= 820px`.

---

## 2. Core Mathematical Engine (Six Immutable Laws)

1. **One number drives everything (`p`)**:
   `p` represents the continuous floating-point look position. For any model index `i` (0 to 5), its relative depth position is:
   $$\text{depth} = \text{wrap}(i - p, 6) \quad \text{where depth} \in [-1, 5]$$
   Every model's 3D translation, scale, blur, opacity, the product rail position, and the rolling look counter are calculated deterministically from `p` alone.

2. **Depth is a lookup table, not a formula**:
   Positions and visual parameters are interpolated linearly across seven discrete stops from $d = -1$ (exiting past the right rail) to $d = 5$ (emerging from the distant haze):
   - **Center X (`KX`)**: `[1.200, 0.744, 0.496, 0.346, 0.235, 0.150, 0.085]` (fraction of stage width)
   - **Feet Y (`KF`)**: `[1.140, 0.890, 0.777, 0.704, 0.651, 0.616, 0.590]` (fraction of stage height)
   - **Height Scale (`KH`)**: `[1.180, 0.832, 0.574, 0.436, 0.334, 0.258, 0.190]` (fraction of stage height)
   - **Blur px (`KB`)**: `[0, 0, 1.5, 4.0, 8.0, 12.0, 17.0]` (optical screen blur in pixels)
   - **Opacity (`KO`)**: `[1.0, 1.0, 1.0, 1.0, 0.86, 0.50, 0.0]`

3. **Two transparent sprite sheets cropped with nested SVG `<viewBox>`**:
   All 6 male models reside on one transparent master sheet (3840 × 2160 or 960 × 540 reference coordinate system) and all 12 tailoring pieces on a secondary sheet (2400 × 1800 or 960 × 720 reference coordinate system). Cropping is achieved through nested `<svg viewBox>` viewports so that asset bounds remain razor-sharp without pixel leakage.

4. **Layers scale without layout reflow**:
   Models are measured at a base dimension of $1.2 \times \text{stage height}$. All depth positioning and sizing apply strictly via `translate3d(x, y, 0) scale(s)`. Floor shadows are rendered via soft radial gradients positioned directly beneath the feet (`radial-gradient(closest-side, rgba(20,25,35,0.28), transparent)`).

5. **Direct drag physics & exponential relaxation**:
   - During pointer drag: `target = start + dx / max(150, stageWidth * 0.2)`. Dragging to the right advances the runway forward.
   - On release or wheel debounce: `target = Math.round(target)`.
   - Each frame: `p += (target - p) * (1 - Math.exp(-dt * 0.0072))` where $dt \le 50\text{ms}$. When $|target - p| < 0.0004$, $p$ snaps to `target`.
   - If `prefers-reduced-motion` is active: $p = target$ immediately.

6. **Continuous infinite wrapping for product rail**:
   12 product cards loop continuously on a track of length $12 \times \text{cardHeight}$. Their offset is computed as:
   $$y = \text{wrap}(i \cdot \text{cardHeight} - p \cdot 2 \cdot \text{cardHeight}, 12 \cdot \text{cardHeight})$$
   Ensuring that as each look transitions to the front, its corresponding two garment pieces align seamlessly at the top of the rail.

---

## 3. Menswear Editorial Direction & Garment Catalog

### Collection Identity
- **Title**: Maison Vell Homme
- **Season**: Autumn / Winter 2027 — *Architectural Restraint & Fluid Monoliths*
- **Description**: An examination of sculptural masculinity. Double-faced cashmere, structured shoulders, heavy Italian wools, and liquid silk faille engineered for modern silhouettes.

### Model Looks & Silhouettes (6 Runway Looks)
1. **Look 01 (Index 0)**: Double-breasted cocoon overcoat in raw charcoal cashmere with wide pleated wool trousers.
2. **Look 02 (Index 1)**: Deconstructed sage wool blazer with structured brass hardware and fluid silk-crepe slacks.
3. **Look 03 (Index 2)**: Champagne bonded technical trench coat styled with a structured bridle leather tote.
4. **Look 04 (Index 3)**: Voluminous silk poplin tunic with asymmetric crossover waistband trousers.
5. **Look 05 (Index 4)**: Glacial powder-blue tailored wool chesterfield coat with relaxed ivory pleated slacks.
6. **Look 06 (Index 5)**: Monolithic sculpted ivory capelet and weighted floor-grazing dinner trousers.

### Curated 12-Piece Product Rail Table

| Look | Piece | Coordinates (x0, x1, y0, y1) | Garment / Object Name | Price | Fabrication & Atelier Notes |
|:---:|:---:|:---:|:---|:---:|:---|
| **01** | 1 | `[26, 224, 28, 214]` | **Double-Breasted Cashmere Overcoat** | \$3,450 | Raw-cut unlined Mongolian double-cashmere with horn buttons |
| **01** | 2 | `[304, 412, 22, 236]` | **Wide-Leg Pleated Wool Slacks** | \$1,280 | Heavy 420gsm Biella wool flannel with double inward pleats |
| **02** | 1 | `[530, 666, 12, 242]` | **Architectural Peak-Lapel Blazer** | \$2,650 | Structured canvas front, hand-padded lapels in sage barathea |
| **02** | 2 | `[752, 922, 100, 146]` | **Hand-Cast Brass Buckle Belt** | \$480 | Solid brushed raw brass buckle on 35mm saddle bridle calf |
| **03** | 1 | `[70, 176, 246, 466]` | **Bonded Silk-Cotton Trench** | \$2,890 | Water-repellent double-faced faille with storm flap yoke |
| **03** | 2 | `[294, 422, 294, 432]` | **Structured Bridle Leather Brief** | \$1,650 | Vegetable-tanned Tuscan calfskin with palladium-plated hardware |
| **04** | 1 | `[508, 688, 240, 452]` | **Asymmetric Poplin Overshirt** | \$920 | 140/2 Egyptian cotton poplin with concealed mother-of-pearl placket |
| **04** | 2 | `[780, 890, 252, 466]` | **Cross-Over Belted Trousers** | \$890 | Virgin wool gabardine with integrated martial wrap waistband |
| **05** | 1 | `[64, 178, 484, 698]` | **Powder Blue Tailored Chesterfield** | \$2,400 | Brushed wool-cashmere melton with velvet undercollar |
| **05** | 2 | `[316, 396, 482, 698]` | **Ivory Pressed Formal Trousers** | \$840 | Japanese triacetate wool blend with permanent crease line |
| **06** | 1 | `[530, 672, 508, 682]` | **Sculpted Evening Bolero** | \$1,850 | Bonded silk duchesse with architectural shoulder structure |
| **06** | 2 | `[754, 916, 484, 700]` | **Weighted Evening Trousers** | \$1,150 | Heavy silk-wool faille with satin side tuxedo braiding |

---

## 4. Layout Architecture & Viewport System

### Root Dimensions & The `--u` Unit
- Responsive base scaling unit: `--u: min(calc(100vw / 1600), calc(100vh / 900))`.
- When viewport width $\le 820\text{px}$, `--u` snaps to fixed `1px`.
- Overall canvas is locked to `100svh`, minimum height `520px`, `overflow: hidden`, with a two-row grid (Header: `auto`, Main Stage: `1fr`).

### Header Specifications
- **Padding**: `calc(18 * var(--u))` top, `calc(46 * var(--u))` horizontal, `calc(14 * var(--u))` bottom.
- **Row 1**: 3-column grid `1fr auto 1fr`:
  - **Left**: `MAISON VELL HOMME` logo in `Michroma`, tracking `0.22em`, font size `calc(15.5 * var(--u))`.
  - **Center**: Primary navigation tabs: `Runway` (active underline), `The Maison`, `Atelier`, `Bespoke`. Font size `calc(13.5 * var(--u))`, tracking `0.14em`, gap `calc(44 * var(--u))`.
  - **Right**: Client tools: `Client Login`, Search icon, Wishlist icon with live counter dot, Cart button showing `Bag (N)`.
- **Row 2**: Centered department sub-nav: `Haute Couture Homme`, `Prêt-à-Porter`, `Tailored Outerwear`, `Fine Leather`, `Timepieces`, `Atelier Archive`. Tracking `0.15em`, font size `calc(9.5 * var(--u))`, gap `calc(56 * var(--u))`.

### Runway Stage Section
- **Background**: Multi-layered luxury runway lighting:
  ```css
  background: 
    linear-gradient(transparent 55%, rgba(255, 255, 255, 0.75) 100%),
    linear-gradient(90deg, #edf3f8 0%, #e2ebf4 36%, #e9f0f7 64%, #f4f7fa 100%);
  ```
- **Editorial Typography (Top Left)**:
  - Eyebrow: `RUNWAY EDITORIAL NO. 06 — HOMME` with charcoal dot indicator.
  - Main Title: `Autumn / Winter 2027`, font size `calc(24 * var(--u))`, tracking `0.16em`.
  - Editorial Statement: `calc(13.5 * var(--u))` Inter, max-width `calc(420 * var(--u))`, color `#717984`.
- **Look Counter (Bottom Left)**:
  - Label: `LOOK` in light slate.
  - Odometer Window: Fixed height `calc(38 * var(--u))` with `overflow: hidden`.
  - Numbers stack: `[15, 16, 17, 18, 19, 20, 15]` translating along Y:
    $$\text{translate3d}(0, -\text{wrap}(p, 6) \cdot \text{lineHeight}, 0)$$
  - Direct look picker pills (`01`, `02`, `03`, `04`, `05`, `06`) to immediately jump to any runway station.
  - Call to action: Underlined `INSPECT SILHOUETTE →` which launches the deep garment inspection modal.
- **Cursor Ring (Mouse Viewports)**:
  - Idle: Circular ring of diameter `calc(46 * var(--u))`, border `calc(2.5 * var(--u))` solid `#16191f`. Follows pointer with exponential smooth delay ($32\%$ lerp per frame).
  - Dragging state: Seamlessly morphs into a pill `calc(84 * var(--u))` by `calc(34 * var(--u))` with easing curve `cubic-bezier(0.2, 0.8, 0.2, 1)`.

### Product Rail Column (Right)
- Width: Fixed `calc(372 * var(--u))`.
- Background: `#f3f6fa` with subtle `#e4ecf3` separation border.
- Layout: Exactly 3 cards visible simultaneously, each of height `railHeight / 3`. Alternating cards render with a pure `#ffffff` background.
- Card contents:
  - Wishlist Heart Button top-left: toggles active state and fills soft terracotta `#d8a7a0`.
  - SVG cropped garment image with subtle hover zoom (`scale(1.05)`).
  - Category label, garment title, and price in Inter.
  - Plus action button: Circular border with centered cross that rotates 90° on hover and adds directly to the bag counter.

---

## 5. Mobile Ergonomics (Width $\le 820\text{px}$)

- Scaling switches to strict pixels: `--u: 1px`.
- Secondary navigation row and client text links disappear to conserve vertical real estate.
- Primary grid shifts from horizontal columns to a 2-row vertical stack:
  `grid-template-columns: 1fr`, `grid-template-rows: 1fr 210px`.
- Product rail positions at the bottom of the screen as a horizontal scrolling track with 160px card widths using `translate3d(x, 0, 0)`.
- Ring cursor is hidden in favor of direct touch swipes (`touch-action: pan-y`).
- Look counter adjusts to `22px` on a `30px` line height.

---

## 6. Interactive Features & Atelier Modals

1. **Atelier Inspection Modal**: Clicking any card or clicking "Inspect Silhouette" opens an editorial modal with garment details, artisan material provenance, atelier origin (e.g. *Paris Atelier, France*), full high-res SVG crop, and an "Acquire Piece" CTA.
2. **Dynamic Cart & Wishlist Store**: Synchronized state across the header badge, product cards, modal actions, and toast feedback alerts.
3. **Floating Micro-Toasts**: Dark translucent pill with green glowing status indicator confirming additions and saves.
4. **Preloader Screen**: Smooth `#f1f5fa` curtain that fades out over 500ms once both image sheets have decoded and web fonts are active.

---

## 7. Implementation Checklist

- [x] Pure Next.js App Router (`layout.tsx`, `page.tsx`, `globals.css`).
- [x] Zero extraneous libraries (only TypeScript, Next.js, Tailwind CSS).
- [x] Mathematical depth table linearly interpolated across 7 stops.
- [x] Fully hardware-accelerated transforms (`translate3d`, `scale`, `filter`).
- [x] Complete mobile responsiveness down to 360px width.
- [x] Verified with production compilation (`npm run build`).
