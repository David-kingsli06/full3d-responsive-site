"use client";

import React, { useEffect, useRef, useState } from "react";

const MODELS =
  "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261102_042056_1a704ff7-b0e5-4a9f-bbda-62392b819fb6.png&w=3840&q=85";
const PIECES =
  "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261102_042057_080e85b0-b4aa-4072-8eb9-2304c7baf42b.png&w=2400&q=85";

// each model's box on the 960 x 540 sheet: x0, x1
const LOOKS: [number, number][] = [
  [12, 176],
  [178, 330],
  [331, 470],
  [476, 633],
  [634, 767],
  [767, 956],
];
const Y0 = 48;
const Y1 = 496;
const FIRST = 15;
const N = LOOKS.length;

// each piece's box on the 960 x 720 sheet: x0, x1, y0, y1, name, price
interface ItemData {
  box: [number, number, number, number];
  name: string;
  price: string;
}

const ITEMS: ItemData[] = [
  { box: [26, 224, 28, 214], name: "Feather Jacket", price: "$2,900" },
  { box: [304, 412, 22, 236], name: "Satin Wide Leg Trousers", price: "$1,450" },
  { box: [530, 666, 12, 242], name: "Pleated Dress", price: "$2,200" },
  { box: [752, 922, 100, 146], name: "Gold Waist Belt", price: "$420" },
  { box: [70, 176, 246, 466], name: "Satin Trench Dress", price: "$2,350" },
  { box: [294, 422, 294, 432], name: "Top Handle Bag", price: "$980" },
  { box: [508, 688, 240, 452], name: "Billow Sleeve Blouse", price: "$860" },
  { box: [780, 890, 252, 466], name: "Tie Waist Trousers", price: "$740" },
  { box: [64, 178, 484, 698], name: "Powder Long Coat", price: "$1,980" },
  { box: [316, 396, 482, 698], name: "Ivory Straight Trousers", price: "$690" },
  { box: [530, 672, 508, 682], name: "Sculpted Ruffle Top", price: "$1,120" },
  { box: [754, 916, 484, 700], name: "Pleated Maxi Skirt", price: "$1,340" },
];

// depth stops from d = -1 (leaving past the rail) to d = 5 (arriving out of the haze)
const KX = [1.2, 0.744, 0.496, 0.346, 0.235, 0.15, 0.085];
const KF = [1.14, 0.89, 0.777, 0.704, 0.651, 0.616, 0.59];
const KH = [1.18, 0.832, 0.574, 0.436, 0.334, 0.258, 0.19];
const KB = [0, 0, 1.5, 4, 8, 12, 17];
const KO = [1, 1, 1, 1, 0.86, 0.5, 0];

const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
const wrap = (x: number, n: number) => ((x % n) + n) % n;

export default function MaisonVellPage() {
  const [cartCount, setCartCount] = useState(0);
  const [favorites, setFavorites] = useState<{ [key: number]: boolean }>({});
  const [activeTab, setActiveTab] = useState("Runway");
  const [isReady, setIsReady] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const rollRef = useRef<HTMLSpanElement>(null);
  const modelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);

  const stateRef = useRef({
    p: 0,
    target: 0,
    last: 0,
    dirty: true,
    W: 0,
    H: 0,
    base: 0,
    cardS: 0,
    side: false,
    mx: 0,
    my: 0,
    cx: 0,
    cy: 0,
    down: false,
    sx: 0,
    st: 0,
    moved: 0,
    wheelT: null as NodeJS.Timeout | null,
    calm: false,
    modelFilters: LOOKS.map(() => ""),
    modelOpacities: LOOKS.map(() => ""),
  });

  // Size handler
  const size = () => {
    const stage = stageRef.current;
    const rail = railRef.current;
    const roll = rollRef.current;
    if (!stage) return;

    const s = stateRef.current;
    s.W = stage.clientWidth;
    s.H = stage.clientHeight;
    s.base = s.H * 1.2;
    s.side = window.innerWidth <= 820;

    LOOKS.forEach(([a, b], i) => {
      const el = modelRefs.current[i];
      if (el) {
        const r = (b - a) / (Y1 - Y0);
        el.style.width = s.base * r + "px";
        el.style.height = s.base + "px";
      }
    });

    s.cardS = s.side ? 160 : (rail ? rail.clientHeight / 3 : 240);
    ITEMS.forEach((_, i) => {
      const c = cardRefs.current[i];
      if (c) {
        c.style.height = s.side ? "100%" : s.cardS + "px";
      }
    });

    if (roll && roll.firstChild) {
      roll.style.setProperty(
        "--h",
        String((roll.firstChild as HTMLElement).getBoundingClientRect().height)
      );
    }
    s.dirty = true;
  };

  // Paint loop
  const paint = () => {
    const s = stateRef.current;
    const W = s.W;
    const H = s.H;
    const base = s.base;
    const p = s.p;

    // Render Models
    LOOKS.forEach(([a, b], i) => {
      const el = modelRefs.current[i];
      if (!el) return;
      const r = (b - a) / (Y1 - Y0);

      let d = wrap(i - p, N);
      if (d > N - 1) d -= N;

      const k = clamp(d + 1, 0, 6);
      const idxA = Math.floor(k);
      const idxB = Math.min(6, idxA + 1);
      const t = k - idxA;
      const mix = (A: number[]) => A[idxA] + (A[idxB] - A[idxA]) * t;

      const h = mix(KH) * H;
      const scale = h / base;
      const w = h * r;
      const x = mix(KX) * W - w / 2;
      const y = mix(KF) * H - h;

      el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) scale(${scale.toFixed(4)})`;

      const f = mix(KB) / scale;
      const fs = f < 0.2 ? "none" : `blur(${f.toFixed(1)}px)`;
      const op = mix(KO).toFixed(3);

      if (fs !== s.modelFilters[i]) {
        s.modelFilters[i] = fs;
        el.style.filter = fs;
      }
      if (op !== s.modelOpacities[i]) {
        s.modelOpacities[i] = op;
        el.style.opacity = op;
      }
      el.style.zIndex = String(100 - Math.round(d * 10));
    });

    // Render Product Cards
    const cardS = s.cardS;
    const all = cardS * ITEMS.length;
    ITEMS.forEach((_, i) => {
      const c = cardRefs.current[i];
      if (!c) return;
      let y = wrap(i * cardS - p * 2 * cardS, all);
      if (y > all - cardS) y -= all;
      c.style.transform = s.side
        ? `translate3d(${y.toFixed(1)}px,0,0)`
        : `translate3d(0,${y.toFixed(1)}px,0)`;
    });

    // Render Rolling Look Number
    const roll = rollRef.current;
    if (roll && roll.firstChild) {
      const itemHeight = (roll.firstChild as HTMLElement).offsetHeight || 38;
      roll.style.transform = `translate3d(0,${(-wrap(p, N) * itemHeight).toFixed(1)}px,0)`;
    }
  };

  useEffect(() => {
    let animId: number;
    const s = stateRef.current;
    s.calm = window.matchMedia("(prefers-reduced-motion:reduce)").matches;

    size();

    const frame = (now: number) => {
      const dt = Math.min(50, now - (s.last || now)) || 16;
      s.last = now;
      const was = s.p;

      if (s.calm) s.p = s.target;
      else s.p += (s.target - s.p) * (1 - Math.exp(-dt * 0.0072));

      if (Math.abs(s.target - s.p) < 0.0004) s.p = s.target;

      if (s.p !== was || s.dirty) {
        s.dirty = false;
        paint();
      }

      s.cx += (s.mx - s.cx) * 0.32;
      s.cy += (s.my - s.cy) * 0.32;
      const ring = ringRef.current;
      if (ring) {
        ring.style.transform = `translate3d(${s.cx.toFixed(1)}px,${s.cy.toFixed(1)}px,0)`;
      }

      animId = requestAnimationFrame(frame);
    };

    animId = requestAnimationFrame(frame);

    // Preload both images and fonts
    Promise.all([
      new Promise<void>((res) => {
        const i = new Image();
        i.src = MODELS;
        i.decode().then(() => res()).catch(() => res());
      }),
      new Promise<void>((res) => {
        const i = new Image();
        i.src = PIECES;
        i.decode().then(() => res()).catch(() => res());
      }),
      document.fonts ? document.fonts.ready : Promise.resolve(),
    ]).then(() => {
      size();
      paint();
      setIsReady(true);
    });

    window.addEventListener("resize", size);

    const onKey = (e: KeyboardEvent) => {
      if (["ArrowRight", "ArrowDown"].includes(e.key)) {
        e.preventDefault();
        s.target = Math.round(s.target) + 1;
      }
      if (["ArrowLeft", "ArrowUp"].includes(e.key)) {
        e.preventDefault();
        s.target = Math.round(s.target) - 1;
      }
    };
    window.addEventListener("keydown", onKey);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", size);
      window.removeEventListener("keydown", onKey);
      if (s.wheelT) clearTimeout(s.wheelT);
    };
  }, []);

  // Stage pointer events
  const onPointerEnter = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && ringRef.current) {
      ringRef.current.classList.add("show");
    }
  };

  const onPointerLeave = () => {
    if (ringRef.current) {
      ringRef.current.classList.remove("show");
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const stage = stageRef.current;
    if (!stage) return;
    const r = stage.getBoundingClientRect();
    const s = stateRef.current;
    s.mx = e.clientX - r.left;
    s.my = e.clientY - r.top;

    if (!s.down) return;
    const dx = e.clientX - s.sx;
    s.moved = Math.max(s.moved, Math.abs(dx));
    const pull = Math.max(150, s.W * 0.2);
    s.target = s.st + dx / pull;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("a, button")) return;
    const s = stateRef.current;
    s.down = true;
    s.sx = e.clientX;
    s.st = s.target;
    s.moved = 0;
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
    if (ringRef.current) ringRef.current.classList.add("drag");
  };

  const release = (e: React.PointerEvent) => {
    const s = stateRef.current;
    if (!s.down) return;
    s.down = false;
    if (ringRef.current) ringRef.current.classList.remove("drag");

    if (s.moved < 6) {
      const hit = document
        .elementsFromPoint(e.clientX, e.clientY)
        .find((x) => x.classList && x.classList.contains("m"));
      if (hit) {
        const idx = Number(hit.getAttribute("data-i"));
        let d = wrap(idx - s.target, N);
        d = Math.round(d);
        if (d > 0 && d < N) s.target = Math.round(s.target) + d;
      }
    } else {
      s.target = Math.round(s.target);
    }
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const s = stateRef.current;
    s.target += clamp(e.deltaY + e.deltaX, -120, 120) / 420;
    if (s.wheelT) clearTimeout(s.wheelT);
    s.wheelT = setTimeout(() => {
      s.target = Math.round(s.target);
    }, 150);
  };

  const toggleFavorite = (i: number) => {
    setFavorites((prev) => ({ ...prev, [i]: !prev[i] }));
  };

  return (
    <div className="page">
      {/* Header */}
      <header>
        <div className="r1">
          <a className="brand wide" href="#" aria-label="Maison Vell">
            Maison Vell
          </a>
          <nav className="tabs wide" aria-label="Sections">
            {["Runway", "The Maison", "Lookbook", "Shop"].map((tab) => (
              <a
                key={tab}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab(tab);
                }}
                className={activeTab === tab ? "on" : ""}
                aria-current={activeTab === tab ? "page" : undefined}
              >
                {tab}
              </a>
            ))}
          </nav>
          <div className="acct wide">
            <a href="#">Login</a>
            <a href="#" aria-label="Search">
              <svg viewBox="0 0 24 24">
                <circle cx="10.5" cy="10.5" r="6.5" />
                <path d="m15.5 15.5 5 5" />
              </svg>
            </a>
            <a href="#" aria-label="Saved">
              <svg viewBox="0 0 24 24">
                <path d="M12 20S3.5 15 3.5 9A4.6 4.6 0 0 1 12 6.6 4.6 4.6 0 0 1 20.5 9C20.5 15 12 20 12 20Z" />
              </svg>
            </a>
            <a href="#" aria-label="Bag">
              <svg viewBox="0 0 24 24">
                <path d="M5 8h14l1 13H4Z" />
                <path d="M9 10V6a3 3 0 0 1 6 0v4" />
              </svg>
            </a>
            <a href="#">
              Cart (<span id="cart">{cartCount}</span>)
            </a>
          </div>
        </div>
        <nav className="r2 wide" aria-label="Departments">
          {[
            "Collections",
            "Clothing",
            "Lookbook",
            "Beauty",
            "Accessories",
            "Our World",
          ].map((dep) => (
            <a key={dep} href="#">
              {dep}
            </a>
          ))}
        </nav>
      </header>

      {/* Main Runway Stage + Product Rail */}
      <main>
        <section
          ref={stageRef}
          className="stage"
          id="stage"
          aria-label="Runway looks. Drag, scroll or use the arrow keys to change look."
          tabIndex={0}
          onPointerEnter={onPointerEnter}
          onPointerLeave={onPointerLeave}
          onPointerMove={onPointerMove}
          onPointerDown={onPointerDown}
          onPointerUp={release}
          onPointerCancel={release}
          onWheel={onWheel}
        >
          {/* Models Line */}
          <div className="line" id="line">
            {LOOKS.map(([a, b], i) => {
              const w = b - a;
              const h = Y1 - Y0;
              return (
                <div
                  key={i}
                  ref={(el) => {
                    modelRefs.current[i] = el;
                  }}
                  className="m"
                  data-i={i}
                >
                  <svg viewBox={`${a} ${Y0} ${w} ${h}`} aria-hidden="true">
                    <svg
                      x={a}
                      y={Y0}
                      width={w}
                      height={h}
                      viewBox={`${a} ${Y0} ${w} ${h}`}
                    >
                      <image href={MODELS} width={960} height={540} />
                    </svg>
                  </svg>
                </div>
              );
            })}
          </div>

          {/* Intro typography */}
          <div className="intro">
            <h2 className="wide">Spring Summer 2027</h2>
            <p>
              A study in softness and strength. The new season collection from
              Maison Vell blends delicate textures and modern silhouettes,
              crafted for a more beautiful tomorrow.
            </p>
          </div>

          {/* Look Roll Odometer */}
          <div className="tag">
            <div className="look wide" aria-live="polite">
              <span>Look</span>
              <span className="win">
                <span ref={rollRef} className="roll" id="roll">
                  {[15, 16, 17, 18, 19, 20, 15].map((num, i) => (
                    <b key={i}>{num}</b>
                  ))}
                </span>
              </span>
            </div>
            <a className="shop wide" href="#">
              Shop the look
            </a>
          </div>

          {/* Cursor Ring */}
          <div ref={ringRef} className="ring" id="ring" />
        </section>

        {/* Product Rail Column */}
        <aside ref={railRef} className="rail" id="rail" aria-label="Pieces in this look">
          {ITEMS.map((item, i) => {
            const [a, b, c, d] = item.box;
            const w = b - a;
            const h = d - c;
            const isAlt = i % 2 === 1;
            const isFav = !!favorites[i];

            return (
              <article
                key={i}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                className={`card${isAlt ? " alt" : ""}`}
              >
                <button
                  className="fav"
                  aria-pressed={isFav}
                  aria-label={`Save ${item.name}`}
                  onClick={() => toggleFavorite(i)}
                >
                  <svg viewBox="0 0 24 24">
                    <path d="M12 20S3.5 15 3.5 9A4.6 4.6 0 0 1 12 6.6 4.6 4.6 0 0 1 20.5 9C20.5 15 12 20 12 20Z" />
                  </svg>
                </button>
                <span className="shot">
                  <svg viewBox={`${a} ${c} ${w} ${h}`} aria-hidden="true">
                    <svg
                      x={a}
                      y={c}
                      width={w}
                      height={h}
                      viewBox={`${a} ${c} ${w} ${h}`}
                    >
                      <image href={PIECES} width={960} height={720} />
                    </svg>
                  </svg>
                </span>
                <div className="meta">
                  <h3 className="wide">{item.name}</h3>
                  <span>{item.price}</span>
                  <button
                    className="add"
                    aria-label={`Add ${item.name} to cart`}
                    onClick={() => setCartCount((c) => c + 1)}
                  />
                </div>
              </article>
            );
          })}
        </aside>
      </main>

      {/* Preload wait cover */}
      <div className={`wait ${isReady ? "gone" : ""}`} id="wait" />
    </div>
  );
}
