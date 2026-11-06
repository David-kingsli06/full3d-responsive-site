"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

// Image sheet constants
const MODELS_SHEET =
  "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261102_042056_1a704ff7-b0e5-4a9f-bbda-62392b819fb6.png&w=3840&q=85";
const PIECES_SHEET =
  "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261102_042057_080e85b0-b4aa-4072-8eb9-2304c7baf42b.png&w=2400&q=85";

// Model bounding boxes on 960 x 540 sheet
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
const FIRST_LOOK_NUM = 15;
const N = LOOKS.length;

// Look titles / descriptions for luxury editorial depth
const LOOK_STORIES = [
  {
    title: "Look 15",
    theme: "Ethereal Structure",
    text: "Ostrich feather cropped bolero with high-waist fluid satin trousers.",
  },
  {
    title: "Look 16",
    theme: "Sculpted Architecture",
    text: "Micro-pleated sage evening gown accented with a hand-cast brass waist buckle.",
  },
  {
    title: "Look 17",
    theme: "Luminescent Tailoring",
    text: "Double-faced champagne silk trench dress styled with structured calfskin tote.",
  },
  {
    title: "Look 18",
    theme: "Botanical Draping",
    text: "Voluminous silk organza billow blouse with asymmetric wrap tie trousers.",
  },
  {
    title: "Look 19",
    theme: "Powder Minimalist",
    text: "Double-cashmere cocoon coat in glacial blue over architectural ivory slacks.",
  },
  {
    title: "Look 20",
    theme: "Monochrome Crescendo",
    text: "Tiered sculptural petal ruffles paired with a flowing weighted silk maxi skirt.",
  },
];

interface ProductItem {
  id: number;
  box: [number, number, number, number];
  name: string;
  price: string;
  category: string;
  material: string;
}

const ITEMS: ProductItem[] = [
  {
    id: 1,
    box: [26, 224, 28, 214],
    name: "Feather Jacket",
    price: "$2,900",
    category: "Outerwear",
    material: "Hand-applied ostrich plumes & silk lining",
  },
  {
    id: 2,
    box: [304, 412, 22, 236],
    name: "Satin Wide Leg Trousers",
    price: "$1,450",
    category: "Tailoring",
    material: "Heavy Italian mulberry silk satin",
  },
  {
    id: 3,
    box: [530, 666, 12, 242],
    name: "Pleated Dress",
    price: "$2,200",
    category: "Eveningwear",
    material: "Permanent sunburst pleated chiffon",
  },
  {
    id: 4,
    box: [752, 922, 100, 146],
    name: "Gold Waist Belt",
    price: "$420",
    category: "Accessories",
    material: "Polished brass with concealed magnetic closure",
  },
  {
    id: 5,
    box: [70, 176, 246, 466],
    name: "Satin Trench Dress",
    price: "$2,350",
    category: "Dresses",
    material: "Double-faced liquid silk duchesse",
  },
  {
    id: 6,
    box: [294, 422, 294, 432],
    name: "Top Handle Bag",
    price: "$980",
    category: "Leather Goods",
    material: "Box calf leather with palladium hardware",
  },
  {
    id: 7,
    box: [508, 688, 240, 452],
    name: "Billow Sleeve Blouse",
    price: "$860",
    category: "Shirts",
    material: "Sheer silk gazar with French seams",
  },
  {
    id: 8,
    box: [780, 890, 252, 466],
    name: "Tie Waist Trousers",
    price: "$740",
    category: "Tailoring",
    material: "Virgin wool crepe with self-tie belt",
  },
  {
    id: 9,
    box: [64, 178, 484, 698],
    name: "Powder Long Coat",
    price: "$1,980",
    category: "Outerwear",
    material: "Double-faced brushed Mongolian cashmere",
  },
  {
    id: 10,
    box: [316, 396, 482, 698],
    name: "Ivory Straight Trousers",
    price: "$690",
    category: "Tailoring",
    material: "Pressed Japanese triacetate wool blend",
  },
  {
    id: 11,
    box: [530, 672, 508, 682],
    name: "Sculpted Ruffle Top",
    price: "$1,120",
    category: "Tops",
    material: "Bonded silk organza with hand-cut flounces",
  },
  {
    id: 12,
    box: [754, 916, 484, 700],
    name: "Pleated Maxi Skirt",
    price: "$1,340",
    category: "Skirts",
    material: "Knife-pleated silk crepe de chine",
  },
];

// Exact 7 depth stops from d = -1 to d = 5
const KX = [1.2, 0.744, 0.496, 0.346, 0.235, 0.15, 0.085];
const KF = [1.14, 0.89, 0.777, 0.704, 0.651, 0.616, 0.59];
const KH = [1.18, 0.832, 0.574, 0.436, 0.334, 0.258, 0.19];
const KB = [0, 0, 1.5, 4, 8, 12, 17];
const KO = [1, 1, 1, 1, 0.86, 0.5, 0];

const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
const wrap = (x: number, n: number) => ((x % n) + n) % n;

export default function RunwayLookbookPage() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [favorites, setFavorites] = useState<{ [key: number]: boolean }>({});
  const [activeTab, setActiveTab] = useState("Runway");
  const [activeDepartment, setActiveDepartment] = useState("Collections");
  const [selectedPiece, setSelectedPiece] = useState<ProductItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // References
  const stageRef = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const rollRef = useRef<HTMLSpanElement>(null);
  const modelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);

  // Simulation state
  const stateRef = useRef({
    p: 0,
    target: 0,
    lastTime: 0,
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
    wheelTimeout: null as NodeJS.Timeout | null,
    calm: false,
    modelFilters: LOOKS.map(() => ""),
    modelOpacities: LOOKS.map(() => ""),
  });

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  }, []);

  const toggleFavorite = useCallback(
    (id: number, name: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setFavorites((prev) => {
        const next = !prev[id];
        showToast(next ? `Saved "${name}" to Wishlist` : `Removed "${name}"`);
        return { ...prev, [id]: next };
      });
    },
    [showToast]
  );

  const addToCart = useCallback(
    (item: ProductItem, e: React.MouseEvent) => {
      e.stopPropagation();
      setCartCount((c) => c + 1);
      showToast(`Added "${item.name}" to shopping bag`);
    },
    [showToast]
  );

  // Setup sizes and rendering
  const handleSize = useCallback(() => {
    const stage = stageRef.current;
    const rail = railRef.current;
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
        el.style.width = `${s.base * r}px`;
        el.style.height = `${s.base}px`;
      }
    });

    s.cardS = s.side ? 160 : (rail ? rail.clientHeight / 3 : 240);
    ITEMS.forEach((_, i) => {
      const c = cardRefs.current[i];
      if (c) {
        c.style.height = s.side ? "100%" : `${s.cardS}px`;
      }
    });

    s.dirty = true;
  }, []);

  const paint = useCallback(() => {
    const s = stateRef.current;
    const W = s.W;
    const H = s.H;
    const base = s.base;
    const p = s.p;

    // Paint Models
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
      const mix = (arr: number[]) => arr[idxA] + (arr[idxB] - arr[idxA]) * t;

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
      el.style.zIndex = `${100 - Math.round(d * 10)}`;
    });

    // Paint Cards
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

    // Paint Roll
    const roll = rollRef.current;
    if (roll && roll.firstChild) {
      const itemHeight = (roll.firstChild as HTMLElement).offsetHeight || 38;
      roll.style.transform = `translate3d(0,${(-wrap(p, N) * itemHeight).toFixed(1)}px,0)`;
    }
  }, []);

  // Main animation frame loop
  useEffect(() => {
    let animationFrameId: number;
    const s = stateRef.current;
    s.calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    handleSize();

    const frame = (now: number) => {
      const dt = Math.min(50, now - (s.lastTime || now)) || 16;
      s.lastTime = now;
      const was = s.p;

      if (s.calm) {
        s.p = s.target;
      } else {
        s.p += (s.target - s.p) * (1 - Math.exp(-dt * 0.0072));
      }

      if (Math.abs(s.target - s.p) < 0.0004) {
        s.p = s.target;
      }

      if (s.p !== was || s.dirty) {
        s.dirty = false;
        paint();
      }

      // Cursor follower
      const ring = ringRef.current;
      if (ring) {
        s.cx += (s.mx - s.cx) * 0.32;
        s.cy += (s.my - s.cy) * 0.32;
        ring.style.transform = `translate3d(${s.cx.toFixed(1)}px,${s.cy.toFixed(1)}px,0)`;
      }

      animationFrameId = requestAnimationFrame(frame);
    };

    animationFrameId = requestAnimationFrame(frame);

    // Image and font preloading
    Promise.all([
      new Promise<void>((resolve) => {
        const img1 = new Image();
        img1.src = MODELS_SHEET;
        img1.decode().then(() => resolve()).catch(() => resolve());
      }),
      new Promise<void>((resolve) => {
        const img2 = new Image();
        img2.src = PIECES_SHEET;
        img2.decode().then(() => resolve()).catch(() => resolve());
      }),
      document.fonts ? document.fonts.ready : Promise.resolve(),
    ]).then(() => {
      setIsLoaded(true);
      handleSize();
      paint();
    });

    window.addEventListener("resize", handleSize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleSize);
      if (s.wheelTimeout) clearTimeout(s.wheelTimeout);
    };
  }, [handleSize, paint]);

  // Stage pointer and wheel handlers
  const onPointerEnter = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && ringRef.current) {
      ringRef.current.classList.add("opacity-100");
      ringRef.current.classList.remove("opacity-0");
    }
  };

  const onPointerLeave = () => {
    if (ringRef.current) {
      ringRef.current.classList.remove("opacity-100");
      ringRef.current.classList.add("opacity-0");
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

    if (ringRef.current) {
      ringRef.current.classList.add("ring-drag");
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const s = stateRef.current;
    if (!s.down) return;
    s.down = false;

    if (ringRef.current) {
      ringRef.current.classList.remove("ring-drag");
    }

    if (s.moved < 6) {
      // Click jump detection
      const hit = document
        .elementsFromPoint(e.clientX, e.clientY)
        .find((x) => x.classList && x.classList.contains("model-entity"));
      if (hit) {
        const idx = Number(hit.getAttribute("data-i"));
        let d = wrap(idx - s.target, N);
        d = Math.round(d);
        if (d > 0 && d < N) {
          s.target = Math.round(s.target) + d;
        }
      }
    } else {
      s.target = Math.round(s.target);
    }
  };

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const s = stateRef.current;
    s.target += clamp(e.deltaY + e.deltaX, -120, 120) / 420;
    if (s.wheelTimeout) clearTimeout(s.wheelTimeout);
    s.wheelTimeout = setTimeout(() => {
      s.target = Math.round(s.target);
    }, 150);
  }, []);

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    const s = stateRef.current;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      s.target = Math.round(s.target) + 1;
    }
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      s.target = Math.round(s.target) - 1;
    }
  }, []);

  // Jump to specific look
  const jumpToLook = (lookIndex: number) => {
    const s = stateRef.current;
    let d = wrap(lookIndex - s.target, N);
    d = Math.round(d);
    s.target = Math.round(s.target) + d;
  };

  return (
    <div className="relative flex flex-col h-[100svh] min-h-[520px] w-full bg-white select-none overflow-hidden">
      {/* Toast Notification */}
      <div
        className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 pointer-events-none ${
          toastMessage
            ? "opacity-100 -translate-y-0"
            : "opacity-0 -translate-y-4"
        }`}
      >
        <div className="bg-[#16191f]/95 text-white backdrop-blur-md px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-3 border border-white/10">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[12px] tracking-[0.08em] font-medium">
            {toastMessage}
          </span>
        </div>
      </div>

      {/* Header */}
      <header className="relative z-20 bg-white border-b border-[#f1f4f8] px-[calc(46*var(--u))] pt-[calc(18*var(--u))] pb-[calc(14*var(--u))] max-[820px]:px-4 max-[820px]:py-3">
        {/* Row 1: Brand, Tabs, Account */}
        <div className="grid grid-cols-[1fr_auto_1fr] max-[820px]:grid-cols-[1fr_auto] items-center">
          <a
            href="#"
            className="brand wide text-[calc(15.5*var(--u))] max-[820px]:text-sm font-semibold tracking-[0.22em] text-[#16191f] hover:opacity-80 transition-opacity"
            aria-label="Maison Vell"
          >
            MAISON VELL
          </a>

          {/* Center Tabs */}
          <nav
            className="tabs wide flex gap-[calc(44*var(--u))] text-[calc(13.5*var(--u))] tracking-[0.14em] text-[#a4adb8] max-[820px]:hidden font-medium"
            aria-label="Sections"
          >
            {["Runway", "The Maison", "Lookbook", "Private Atelier"].map(
              (tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`relative py-1 transition-colors duration-200 ${
                      isActive ? "text-[#16191f]" : "hover:text-[#424851]"
                    }`}
                  >
                    {tab}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#16191f]" />
                    )}
                  </button>
                );
              }
            )}
          </nav>

          {/* Right Account Tools */}
          <div className="acct wide justify-self-end flex items-center gap-[calc(22*var(--u))] text-[calc(10*var(--u))] tracking-[0.12em] text-[#16191f]">
            <button
              onClick={() => showToast("Client Portal opened")}
              className="max-[820px]:hidden hover:text-[#737b86] transition-colors"
            >
              Client Login
            </button>
            <button
              onClick={() => showToast("Search runway collection")}
              aria-label="Search"
              className="p-1 hover:text-[#737b86] transition-colors max-[820px]:hidden"
            >
              <svg
                className="w-[calc(17*var(--u))] h-[calc(17*var(--u))] fill-none stroke-current stroke-[1.6]"
                viewBox="0 0 24 24"
              >
                <circle cx="10.5" cy="10.5" r="6.5" />
                <path d="m15.5 15.5 5 5" />
              </svg>
            </button>
            <button
              onClick={() =>
                showToast(
                  `Wishlist has ${
                    Object.values(favorites).filter(Boolean).length
                  } pieces`
                )
              }
              aria-label="Saved"
              className="p-1 hover:text-[#737b86] transition-colors relative max-[820px]:hidden"
            >
              <svg
                className="w-[calc(17*var(--u))] h-[calc(17*var(--u))] fill-none stroke-current stroke-[1.6]"
                viewBox="0 0 24 24"
              >
                <path d="M12 20S3.5 15 3.5 9A4.6 4.6 0 0 1 12 6.6 4.6 4.6 0 0 1 20.5 9C20.5 15 12 20 12 20Z" />
              </svg>
              {Object.values(favorites).filter(Boolean).length > 0 && (
                <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-[#d8a7a0]" />
              )}
            </button>
            <button
              onClick={() => showToast(`Shopping Bag: ${cartCount} items`)}
              aria-label="Bag"
              className="flex items-center gap-1.5 p-1 hover:text-[#737b86] transition-colors"
            >
              <svg
                className="w-[calc(17*var(--u))] h-[calc(17*var(--u))] fill-none stroke-current stroke-[1.6]"
                viewBox="0 0 24 24"
              >
                <path d="M5 8h14l1 13H4Z" />
                <path d="M9 10V6a3 3 0 0 1 6 0v4" />
              </svg>
              <span className="font-semibold text-[calc(11*var(--u))]">
                Bag ({cartCount})
              </span>
            </button>
          </div>
        </div>

        {/* Row 2: Secondary Department Links */}
        <nav
          className="r2 wide flex justify-center gap-[calc(56*var(--u))] mt-[calc(15*var(--u))] text-[calc(9.5*var(--u))] tracking-[0.15em] text-[#737b86] max-[820px]:hidden font-medium"
          aria-label="Departments"
        >
          {[
            "Haute Couture",
            "Prêt-à-Porter",
            "Tailored Outerwear",
            "Fine Leather",
            "Footwear",
            "Archive Exhibition",
          ].map((item) => (
            <button
              key={item}
              onClick={() => setActiveDepartment(item)}
              className={`transition-colors duration-150 ${
                activeDepartment === item
                  ? "text-[#16191f] font-semibold underline underline-offset-4 decoration-1"
                  : "hover:text-[#16191f]"
              }`}
            >
              {item}
            </button>
          ))}
        </nav>
      </header>

      {/* Main Experience Layout: Runway Stage + Product Rail */}
      <main className="relative flex-1 grid grid-cols-[1fr_calc(372*var(--u))] max-[820px]:grid-cols-1 max-[820px]:grid-rows-[1fr_210px] min-h-0 overflow-hidden">
        {/* Stage */}
        <section
          ref={stageRef}
          id="stage"
          tabIndex={0}
          onPointerEnter={onPointerEnter}
          onPointerLeave={onPointerLeave}
          onPointerMove={onPointerMove}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={onWheel}
          onKeyDown={onKeyDown}
          aria-label="Runway looks. Drag, scroll or use arrow keys to change look."
          className="relative min-w-0 h-full overflow-hidden focus:outline-none cursor-none max-[820px]:cursor-auto"
          style={{
            touchAction: "pan-y",
            background:
              "linear-gradient(transparent 60%, rgba(255,255,255,0.72) 100%), linear-gradient(90deg, #f1f5fa 0%, #e7eff6 38%, #eef4f9 62%, #f6f9fc 100%)",
          }}
        >
          {/* Subtle architectural stage grid / light line */}
          <div className="absolute inset-0 pointer-events-none opacity-40">
            <div className="absolute bottom-[22%] left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#cfd9e5] to-transparent" />
            <div className="absolute bottom-[35%] left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#cfd9e5]/40 to-transparent" />
          </div>

          {/* Line of Models */}
          <div className="absolute inset-0 pointer-events-none">
            {LOOKS.map(([x0, x1], i) => {
              const w = x1 - x0;
              const h = Y1 - Y0;
              return (
                <div
                  key={i}
                  ref={(el) => {
                    modelRefs.current[i] = el;
                  }}
                  data-i={i}
                  className="model-entity absolute left-0 top-0 origin-top-left will-change-transform cursor-none max-[820px]:cursor-auto pointer-events-auto select-none"
                >
                  {/* Floor soft elliptical drop shadow */}
                  <div
                    className="absolute left-[8%] right-[8%] -bottom-[1.6%] h-[3.6%] rounded-[50%] pointer-events-none"
                    style={{
                      background:
                        "radial-gradient(closest-side, rgba(70,85,105,0.24), transparent)",
                    }}
                  />
                  {/* Cropped SVG Sprite */}
                  <svg
                    viewBox={`${x0} ${Y0} ${w} ${h}`}
                    aria-hidden="true"
                    className="block relative w-full h-full"
                  >
                    <svg
                      x={x0}
                      y={Y0}
                      width={w}
                      height={h}
                      viewBox={`${x0} ${Y0} ${w} ${h}`}
                    >
                      <image
                        href={MODELS_SHEET}
                        width={960}
                        height={540}
                      />
                    </svg>
                  </svg>
                </div>
              );
            })}
          </div>

          {/* Stage Typography: Intro Top Left */}
          <div className="intro absolute z-10 left-[calc(46*var(--u))] top-[calc(36*var(--u))] w-[calc(420*var(--u))] max-[820px]:left-4 max-[820px]:top-4 max-[820px]:w-[calc(100%-32px)] pointer-events-none">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#16191f]/80" />
              <span className="wide text-[calc(9.5*var(--u))] max-[820px]:text-[10px] tracking-[0.24em] font-semibold text-[#16191f]/70">
                RUNWAY EDITORIAL NO. 06
              </span>
            </div>
            <h2 className="wide text-[calc(24*var(--u))] max-[820px]:text-lg font-light tracking-[0.16em] text-[#16191f] leading-tight">
              Spring Summer 2027
            </h2>
            <p className="mt-[calc(16*var(--u))] text-[calc(13.5*var(--u))] font-normal leading-[1.65] tracking-[0.012em] text-[#737b86] max-[820px]:hidden">
              A study in softness and sculptural strength. The new season
              collection from Maison Vell blends delicate textures, weighted
              drapes, and tailored silhouettes crafted for timeless poise.
            </p>
          </div>

          {/* Look Index & Rolling Number Bottom Left */}
          <div className="tag absolute z-10 left-[calc(46*var(--u))] bottom-[calc(44*var(--u))] max-[820px]:left-4 max-[820px]:bottom-4 pointer-events-auto">
            <div
              className="look wide flex items-baseline text-[calc(29*var(--u))] max-[820px]:text-[22px] max-[820px]:leading-[30px] leading-[calc(38*var(--u))] tracking-[0.14em] gap-3 text-[#16191f]"
              aria-live="polite"
            >
              <span className="font-light text-[#737b86]">LOOK</span>
              <span className="win h-[calc(38*var(--u))] max-[820px]:h-[30px] overflow-hidden inline-block align-bottom font-medium">
                <span
                  ref={rollRef}
                  className="roll block will-change-transform"
                >
                  {[15, 16, 17, 18, 19, 20, 15].map((num, idx) => (
                    <b
                      key={idx}
                      className="block font-medium h-[calc(38*var(--u))] max-[820px]:h-[30px]"
                    >
                      {num}
                    </b>
                  ))}
                </span>
              </span>
            </div>

            {/* Look Selector Pills */}
            <div className="flex items-center gap-1.5 mt-2.5 max-[820px]:hidden">
              {LOOK_STORIES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => jumpToLook(i)}
                  className="group px-2 py-1 flex items-center gap-1 text-[9px] tracking-[0.15em] wide text-[#737b86] hover:text-[#16191f] transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#a4adb8] group-hover:bg-[#16191f] transition-colors" />
                  <span>0{i + 1}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                showToast("Viewing runway curation pieces");
                const currentLookIndex =
                  wrap(Math.round(stateRef.current.p), N) || 0;
                setSelectedPiece(ITEMS[currentLookIndex * 2]);
              }}
              className="shop wide inline-flex items-center gap-2 mt-[calc(13*var(--u))] text-[calc(9.5*var(--u))] max-[820px]:text-[10px] tracking-[0.16em] pb-[calc(4*var(--u))] border-b border-[#16191f] hover:text-[#737b86] hover:border-[#737b86] transition-colors"
            >
              <span>INSPECT SILHOUETTE</span>
              <span>→</span>
            </button>
          </div>

          {/* Drag ring cursor */}
          <div
            ref={ringRef}
            className="ring fixed z-40 left-0 top-0 pointer-events-none opacity-0 transition-[width,height,margin,opacity] duration-200 ease-out max-[820px]:hidden"
            style={{
              width: "calc(46*var(--u))",
              height: "calc(46*var(--u))",
              margin: "calc(-23*var(--u)) 0 0 calc(-23*var(--u))",
              border: "calc(2.5*var(--u)) solid #16191f",
              borderRadius: "999px",
            }}
          />
        </section>

        {/* Product Rail Column */}
        <aside
          ref={railRef}
          id="rail"
          aria-label="Pieces in this look"
          className="rail relative overflow-hidden bg-[#f3f6fa] border-l border-[#e4ecf3] max-[820px]:border-l-0 max-[820px]:border-t max-[820px]:h-[210px] min-h-0"
        >
          {ITEMS.map((item, i) => {
            const [x0, x1, y0, y1] = item.box;
            const w = x1 - x0;
            const h = y1 - y0;
            const isAlt = i % 2 === 1;
            const isFav = !!favorites[item.id];

            return (
              <article
                key={item.id}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                onClick={() => setSelectedPiece(item)}
                className={`card absolute left-0 top-0 w-full flex flex-col will-change-transform cursor-pointer transition-colors duration-200 group ${
                  isAlt ? "bg-white" : "bg-[#f3f6fa]"
                } p-[calc(18*var(--u))] px-[calc(24*var(--u))] max-[820px]:p-3 max-[820px]:w-[160px]`}
              >
                {/* Save Heart Button */}
                <button
                  type="button"
                  onClick={(e) => toggleFavorite(item.id, item.name, e)}
                  aria-pressed={isFav}
                  aria-label={`Save ${item.name}`}
                  className="fav absolute left-[calc(22*var(--u))] top-[calc(18*var(--u))] max-[820px]:left-2.5 max-[820px]:top-2.5 w-[calc(22*var(--u))] h-[calc(22*var(--u))] z-10 text-[#16191f] transition-transform active:scale-90"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className={`w-full h-full stroke-current stroke-[1.4] transition-colors duration-200 ${
                      isFav
                        ? "fill-[#d8a7a0] stroke-[#b98179]"
                        : "fill-none hover:stroke-[#737b86]"
                    }`}
                  >
                    <path d="M12 20S3.5 15 3.5 9A4.6 4.6 0 0 1 12 6.6 4.6 4.6 0 0 1 20.5 9C20.5 15 12 20 12 20Z" />
                  </svg>
                </button>

                {/* Cropped Piece Image */}
                <span className="shot flex-1 min-h-0 block overflow-hidden py-1">
                  <svg
                    viewBox={`${x0} ${y0} ${w} ${h}`}
                    aria-hidden="true"
                    className="block w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                  >
                    <svg
                      x={x0}
                      y={y0}
                      width={w}
                      height={h}
                      viewBox={`${x0} ${y0} ${w} ${h}`}
                    >
                      <image
                        href={PIECES_SHEET}
                        width={960}
                        height={720}
                      />
                    </svg>
                  </svg>
                </span>

                {/* Card Meta & Quick Add */}
                <div className="meta grid grid-cols-[1fr_auto] items-end mt-[calc(8*var(--u))] max-[820px]:mt-1.5">
                  <div className="pr-2">
                    <span className="block text-[calc(8.5*var(--u))] max-[820px]:text-[8px] tracking-[0.18em] uppercase text-[#737b86] font-medium mb-0.5">
                      {item.category}
                    </span>
                    <h3 className="wide font-normal text-[calc(9.5*var(--u))] max-[820px]:text-[10px] tracking-[0.14em] text-[#16191f] truncate">
                      {item.name}
                    </h3>
                    <span className="block mt-[calc(4*var(--u))] max-[820px]:mt-0.5 text-[calc(12.5*var(--u))] max-[820px]:text-[11px] font-medium text-[#737b86] tracking-[0.03em]">
                      {item.price}
                    </span>
                  </div>

                  {/* Add to Cart button */}
                  <button
                    type="button"
                    onClick={(e) => addToCart(item, e)}
                    aria-label={`Add ${item.name} to cart`}
                    className="add relative w-[calc(26*var(--u))] h-[calc(26*var(--u))] max-[820px]:w-6 max-[820px]:h-6 rounded-full border border-[#cfd8e2] flex items-center justify-center transition-all duration-200 hover:rotate-90 hover:border-[#16191f] active:scale-95 group/btn"
                  >
                    <span className="absolute w-[calc(14*var(--u))] max-[820px]:w-3.5 h-[1.5px] bg-[#16191f]" />
                    <span className="absolute w-[calc(14*var(--u))] max-[820px]:w-3.5 h-[1.5px] bg-[#16191f] rotate-90" />
                  </button>
                </div>
              </article>
            );
          })}
        </aside>
      </main>

      {/* Product Detail Modal */}
      {selectedPiece && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#16191f]/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
          onClick={() => setSelectedPiece(null)}
        >
          <div
            className="relative w-full max-w-lg bg-white shadow-2xl p-8 max-[820px]:p-6 rounded-none border border-[#e4ecf3] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedPiece(null)}
              className="absolute top-5 right-5 text-[#737b86] hover:text-[#16191f] transition-colors p-2"
              aria-label="Close modal"
            >
              ✕
            </button>
            <div className="flex items-center gap-2 mb-2">
              <span className="wide text-[10px] tracking-[0.2em] font-semibold text-[#737b86]">
                {selectedPiece.category}
              </span>
            </div>
            <h2 className="wide text-xl font-normal tracking-[0.16em] text-[#16191f] mb-1">
              {selectedPiece.name}
            </h2>
            <p className="text-lg font-medium text-[#737b86] mb-6">
              {selectedPiece.price}
            </p>

            {/* Piece preview */}
            <div className="w-full h-56 bg-[#f3f6fa] flex items-center justify-center p-4 mb-6">
              <svg
                viewBox={`${selectedPiece.box[0]} ${selectedPiece.box[2]} ${
                  selectedPiece.box[1] - selectedPiece.box[0]
                } ${selectedPiece.box[3] - selectedPiece.box[2]}`}
                className="w-full h-full object-contain"
              >
                <image
                  href={PIECES_SHEET}
                  width={960}
                  height={720}
                />
              </svg>
            </div>

            <div className="space-y-4 mb-8 text-sm">
              <div>
                <span className="block wide text-[10px] tracking-[0.15em] text-[#a4adb8] mb-1">
                  MATERIAL & CRAFTSMANSHIP
                </span>
                <p className="text-[#424851] leading-relaxed">
                  {selectedPiece.material}
                </p>
              </div>
              <div>
                <span className="block wide text-[10px] tracking-[0.15em] text-[#a4adb8] mb-1">
                  ATELIER ORIGIN
                </span>
                <p className="text-[#424851]">Paris Atelier, France</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={(e) => {
                  addToCart(selectedPiece, e);
                  setSelectedPiece(null);
                }}
                className="flex-1 py-3.5 bg-[#16191f] text-white wide text-[11px] tracking-[0.18em] font-medium hover:bg-[#2b303a] active:scale-[0.99] transition-all"
              >
                ACQUIRE PIECE — {selectedPiece.price}
              </button>
              <button
                onClick={(e) => toggleFavorite(selectedPiece.id, selectedPiece.name, e)}
                className={`px-4 py-3.5 border transition-all ${
                  favorites[selectedPiece.id]
                    ? "border-[#d8a7a0] bg-[#faf0ef] text-[#b98179]"
                    : "border-[#cfd8e2] text-[#16191f] hover:border-[#16191f]"
                }`}
              >
                ♥
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Cover */}
      <div
        className={`wait fixed inset-0 z-50 bg-[#f1f5fa] flex items-center justify-center transition-opacity duration-500 pointer-events-none ${
          isLoaded ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="flex flex-col items-center gap-4">
          <span className="wide text-[14px] tracking-[0.25em] text-[#16191f] font-semibold animate-pulse">
            MAISON VELL
          </span>
          <span className="text-[11px] tracking-[0.18em] text-[#737b86]">
            RUNWAY DEPTH LOOKBOOK
          </span>
        </div>
      </div>

      {/* Ring Drag Style Helper */}
      <style jsx global>{`
        .ring-drag {
          width: calc(84 * var(--u)) !important;
          height: calc(34 * var(--u)) !important;
          margin: calc(-17 * var(--u)) 0 0 calc(-42 * var(--u)) !important;
          border-radius: 999px !important;
        }
      `}</style>
    </div>
  );
}
