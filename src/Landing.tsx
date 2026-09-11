import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "./AuthContext";
import { AppIcon, type IconName } from "./components/ui/icons";
import { Card } from "./components/ui/primitives";
import { Chip } from "./components/ui/Chip";
import MannequinViewer3D, { type MorphologyShape } from "./components/visualizer/MannequinViewer3D";

const NAV_LINKS = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Morphology", href: "#morphology" },
  { label: "Roles", href: "#roles" },
  { label: "Order Flow", href: "#order-flow" },
];

const MORPHOLOGY_TYPES = [
  {
    id: "hourglass",
    name: "Hourglass",
    description: "Balanced shoulders and hips with a defined waist. Structured bodices, wrap silhouettes, and belted cuts accentuate natural curves.",
    tags: ["Wrap Dress", "Peplum Top", "Belted Coat"],
    svg: (
      <svg viewBox="0 0 80 120" fill="none" className="h-full w-full">
        <ellipse cx="40" cy="18" rx="22" ry="10" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M18 18 Q14 50 22 60 Q28 68 40 70 Q52 68 58 60 Q66 50 62 18" fill="currentColor" opacity="0.08" stroke="currentColor" strokeWidth="1.5"/>
        <ellipse cx="40" cy="70" rx="18" ry="8" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M22 70 Q16 90 18 108" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <path d="M58 70 Q64 90 62 108" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <ellipse cx="40" cy="108" rx="22" ry="8" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    id: "rectangle",
    name: "Rectangle",
    description: "Shoulders, waist, and hips in alignment. A-line skirts, draped fabrics, and ruched details create gentle movement and definition.",
    tags: ["A-line Skirt", "Draped Blouse", "Ruched Dress"],
    svg: (
      <svg viewBox="0 0 80 120" fill="none" className="h-full w-full">
        <ellipse cx="40" cy="18" rx="20" ry="10" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="20" y="18" width="40" height="52" rx="2" fill="currentColor" opacity="0.08" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="20" y="70" width="40" height="38" rx="2" fill="currentColor" opacity="0.08" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    id: "pear",
    name: "Pear",
    description: "Narrower shoulders, fuller hips. Boat necks, statement sleeves, and structured tops draw focus upward and balance proportions.",
    tags: ["Boat Neck", "Puff Sleeve", "Dark Trouser"],
    svg: (
      <svg viewBox="0 0 80 120" fill="none" className="h-full w-full">
        <ellipse cx="40" cy="18" rx="16" ry="10" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M24 18 Q22 40 24 55 Q28 65 40 68 Q52 65 56 55 Q58 40 56 18" fill="currentColor" opacity="0.08" stroke="currentColor" strokeWidth="1.5"/>
        <ellipse cx="40" cy="90" rx="26" ry="14" fill="currentColor" opacity="0.12" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M14 90 Q16 105 18 112" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <path d="M66 90 Q64 105 62 112" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      </svg>
    ),
  },
  {
    id: "inverted-triangle",
    name: "Inverted Triangle",
    description: "Broader shoulders tapering to narrower hips. V-necks, slim trousers, and flared hemlines soften the shoulder line and add base width.",
    tags: ["V-neck Top", "Flared Trouser", "Wrap Skirt"],
    svg: (
      <svg viewBox="0 0 80 120" fill="none" className="h-full w-full">
        <ellipse cx="40" cy="18" rx="28" ry="10" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M12 18 Q20 55 28 68 Q34 74 40 75 Q46 74 52 68 Q60 55 68 18" fill="currentColor" opacity="0.08" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M28 75 Q26 92 28 108" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <path d="M52 75 Q54 92 52 108" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <ellipse cx="40" cy="108" rx="14" ry="6" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    id: "oval",
    name: "Oval",
    description: "Fullness concentrated at the center with narrower extremities. Empire waists, vertical lines, and monochromatic looks elongate and streamline.",
    tags: ["Empire Waist", "Vertical Print", "Longline Jacket"],
    svg: (
      <svg viewBox="0 0 80 120" fill="none" className="h-full w-full">
        <ellipse cx="40" cy="18" rx="18" ry="9" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.5"/>
        <ellipse cx="40" cy="65" rx="28" ry="38" fill="currentColor" opacity="0.08" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M26 95 Q24 108 26 114" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <path d="M54 95 Q56 108 54 114" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      </svg>
    ),
  },
];

const HOW_IT_WORKS_STEPS: { number: string; title: string; description: string; icon: IconName }[] = [
  { number: "01", title: "Body Scan", description: "Upload two photos — front and side. Our system extracts precise measurements without a tape measure or tailor visit.", icon: "camera" },
  { number: "02", title: "Morphology Match", description: "Your measurements are classified into one of five morphology types. Each type unlocks curated style directions suited to your silhouette.", icon: "sparkles" },
  { number: "03", title: "3D Visualisation", description: "Browse recommended styles rendered on a 3D model calibrated to your measurements — see the garment before it exists.", icon: "layers" },
  { number: "04", title: "Stylist Session", description: "Your measurements and chosen direction go to a real stylist who refines the design, fabric, and detail choices with you.", icon: "message" },
  { number: "05", title: "Tailor Negotiation", description: "The confirmed design goes to a tailor who quotes a price. Negotiation is transparent and recorded — nothing verbal-only.", icon: "handshake" },
  { number: "06", title: "Smart Delivery", description: "When the garment is ready, the nearest available delivery agent is automatically matched. You track every stage in real time.", icon: "truck" },
];

const ORDER_STATUSES = [
  { id: "pending", label: "Pending", description: "Order placed, awaiting stylist review" },
  { id: "negotiating", label: "Negotiating", description: "Price and design under discussion" },
  { id: "confirmed", label: "Confirmed", description: "Terms agreed, production begins" },
  { id: "production", label: "In Production", description: "Tailor is crafting the garment" },
  { id: "ready", label: "Ready", description: "Garment complete, awaiting pickup" },
  { id: "assigned", label: "Assigned", description: "Nearest delivery agent matched" },
  { id: "out", label: "Out for Delivery", description: "Agent en route to your address" },
  { id: "delivered", label: "Delivered", description: "Garment received and complete" },
];

const ROLES: { role: string; icon: IconName; description: string; capabilities: string[] }[] = [
  { role: "Client", icon: "user", description: "Scans their body, receives morphology analysis, explores 3D-visualised styles, communicates with their stylist, and tracks the order from negotiation to doorstep.", capabilities: ["Body scan upload", "Morphology dashboard", "Style visualisation", "Design chat", "Order tracking"] },
  { role: "Stylist", icon: "sparkles", description: "Reviews the client's measurements and morphology, proposes design direction, selects fabric and silhouette, and coordinates handoff to the tailor.", capabilities: ["Measurement review", "Design proposal", "Fabric library", "Client chat", "Tailor handoff"] },
  { role: "Tailor", icon: "scissors", description: "Receives the finalised measurements and design, quotes a price through the recorded negotiation system, produces the garment, and marks it ready for delivery.", capabilities: ["Design intake", "Price quotation", "Negotiation log", "Production updates", "Ready confirmation"] },
  { role: "Delivery Agent", icon: "truck", description: "Automatically matched by proximity when a garment is ready. Collects from the tailor and delivers to the client with live status updates throughout.", capabilities: ["Auto-matching", "Pickup notification", "Live location", "Status updates", "Delivery confirmation"] },
];

function useIntersection(ref: React.RefObject<Element | null>, threshold = 0.15) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref, threshold]);
  return visible;
}

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useIntersection(ref);
  return (
    <div ref={ref} className={`reveal-up ${visible ? "in" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="h-px w-8 bg-forest" />
      <span className="font-data text-[11px] uppercase tracking-[0.3em] text-forest">{children}</span>
    </div>
  );
}

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeMorphology, setActiveMorphology] = useState(0);
  const [activeOrderStatus, setActiveOrderStatus] = useState(3);
  const [menuOpen, setMenuOpen] = useState(false);
  const [viewMode3D, setViewMode3D] = useState(true);

  const active = MORPHOLOGY_TYPES[activeMorphology];

  return (
    <div className="min-h-screen bg-cream font-body text-ink">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b border-parchment-dark/70 bg-surface/85 px-6 py-4 backdrop-blur-xl lg:px-8">
        <Link to="/" className="flex items-center gap-2.5 no-underline">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest text-white shadow-xs">
            <span className="font-display text-sm font-bold">M</span>
          </div>
          <span className="font-display text-lg font-semibold text-ink">MorphoFit</span>
          <span className="mt-0.5 font-data text-[10px] uppercase tracking-[0.2em] text-ink-subtle">Atelier</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="font-body text-[0.82rem] text-ink-muted no-underline transition-colors hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <button
              onClick={() => navigate("/dashboard")}
              className="rounded-full bg-forest px-5 py-2.5 font-body text-sm font-semibold text-white shadow-sm transition-transform hover:opacity-95 active:scale-95"
            >
              Dashboard
            </button>
          ) : (
            <>
              <Link
                to="/signin"
                className="hidden font-body text-[0.85rem] text-ink-muted no-underline transition-colors hover:text-ink md:block"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-forest px-5 py-2.5 font-body text-sm font-semibold text-white shadow-sm transition-transform hover:opacity-95 active:scale-95 no-underline"
              >
                Get Measured
              </Link>
            </>
          )}
          <button
            className="flex h-8 w-8 items-center justify-center rounded-full bg-parchment text-ink md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation menu"
          >
            <AppIcon name={menuOpen ? "close" : "grid"} size={16} />
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div
          className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-8 bg-surface/95 backdrop-blur-2xl md:hidden"
          onClick={() => setMenuOpen(false)}
        >
          {NAV_LINKS.map((link) => (
            <a key={link.label} href={link.href} className="font-display text-3xl text-ink no-underline">
              {link.label}
            </a>
          ))}
          <Link to="/signin" className="font-display text-2xl text-forest no-underline">
            Sign In
          </Link>
        </div>
      )}

      {/* HERO */}
      <section className="relative flex min-h-screen items-end overflow-hidden px-6 pb-20 pt-32 lg:px-8">
        <div className="absolute inset-0 bg-radial-at-c from-forest/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 hidden w-[38%] overflow-hidden lg:block">
          <img
            src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&h=1200&fit=crop&auto=format"
            alt="Tailored fashion garment"
            className="h-full w-full rounded-l-[40px] object-cover saturate-[0.9]"
          />
          <div className="absolute inset-0 rounded-l-[40px] bg-gradient-to-r from-cream via-cream/20 to-transparent" />
        </div>

        <div className="relative mx-auto grid w-full max-w-7xl grid-cols-1 items-end gap-12 lg:grid-cols-5">
          <FadeIn className="lg:col-span-3">
            <Eyebrow>Precision Tailoring Platform</Eyebrow>
            <h1 className="mb-6 font-display text-5xl font-bold leading-[1.02] tracking-tight text-ink sm:text-6xl lg:text-7xl">
              Your body.<br />
              <em className="italic text-forest">Your blueprint.</em><br />
              Your garment.
            </h1>
            <p className="mb-8 max-w-md font-body text-base leading-relaxed text-ink-muted">
              Two photos. A morphology analysis. A real stylist, a real tailor, and a garment made exactly for you — tracked from negotiation to your door.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/register"
                className="rounded-full bg-forest px-7 py-3.5 font-body text-sm font-semibold text-white shadow-md transition-transform hover:opacity-95 active:scale-95 no-underline"
              >
                Start Your Scan
              </Link>
              <a
                href="#morphology"
                className="rounded-full border border-parchment-dark bg-surface px-7 py-3.5 font-body text-sm font-semibold text-ink no-underline transition-colors hover:bg-parchment"
              >
                Explore Styles
              </a>
            </div>
          </FadeIn>

          <FadeIn delay={150} className="grid grid-cols-2 gap-3 lg:col-span-2">
            {[
              { value: "5", label: "Morphology Types" },
              { value: "8", label: "Order Stages" },
              { value: "24h", label: "Avg. Stylist Response" },
              { value: "100%", label: "Tracked Negotiation" },
            ].map((stat) => (
              <Card key={stat.label} className="p-5">
                <div className="font-display text-3xl font-bold leading-none text-forest">{stat.value}</div>
                <div className="mt-2 font-data text-[10px] uppercase tracking-[0.2em] text-ink-subtle">{stat.label}</div>
              </Card>
            ))}
          </FadeIn>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="px-6 py-28 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <FadeIn className="mb-14">
            <Eyebrow>The Process</Eyebrow>
            <h2 className="font-display text-4xl font-bold leading-tight text-ink sm:text-5xl">
              From scan to <em className="italic text-forest">delivery</em> in six stages.
            </h2>
          </FadeIn>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {HOW_IT_WORKS_STEPS.map((step, i) => (
              <FadeIn key={step.number} delay={i * 70}>
                <Card variant="interactive" className="h-full p-7">
                  <div className="mb-6 flex items-start justify-between">
                    <span className="font-data text-xs tracking-widest text-ink-subtle">{step.number}</span>
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-parchment text-forest">
                      <AppIcon name={step.icon} size={17} />
                    </span>
                  </div>
                  <h3 className="mb-2 font-display text-xl font-semibold text-ink">{step.title}</h3>
                  <p className="font-body text-sm leading-relaxed text-ink-muted">{step.description}</p>
                </Card>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* MORPHOLOGY */}
      <section id="morphology" className="bg-parchment px-6 py-28 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <FadeIn className="mb-12">
            <Eyebrow>Morphology System</Eyebrow>
            <h2 className="max-w-xl font-display text-4xl font-bold leading-tight text-ink sm:text-5xl">
              Five silhouettes. <em className="italic text-forest">Infinite directions.</em>
            </h2>
          </FadeIn>

          <Card className="grid grid-cols-1 overflow-hidden lg:grid-cols-5">
            <div className="flex flex-row overflow-x-auto border-b border-parchment-dark lg:col-span-2 lg:flex-col lg:overflow-visible lg:border-b-0 lg:border-r">
              {MORPHOLOGY_TYPES.map((m, i) => {
                const isActive = activeMorphology === i;
                return (
                  <button
                    key={m.id}
                    onClick={() => setActiveMorphology(i)}
                    className={`flex min-w-[160px] flex-shrink-0 items-center gap-3 border-b border-parchment-dark px-6 py-5 text-left transition-colors lg:min-w-0 ${
                      isActive ? "bg-surface" : "bg-transparent hover:bg-parchment/50"
                    }`}
                  >
                    <div className={`h-7 w-7 flex-shrink-0 transition-colors ${isActive ? "text-forest" : "text-ink-subtle"}`}>
                      {m.svg}
                    </div>
                    <span className={`font-display text-sm ${isActive ? "font-semibold text-ink" : "font-normal text-ink-muted"}`}>
                      {m.name}
                    </span>
                    {isActive && <span className="ml-auto h-6 w-1 flex-shrink-0 rounded-full bg-forest" />}
                  </button>
                );
              })}
            </div>

            <div className="bg-surface lg:col-span-3">
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="relative flex flex-col items-center justify-center border-b border-parchment-dark p-6 md:border-b-0 md:border-r">
                  <div className="absolute top-3 right-3 z-10 flex items-center gap-1 rounded-xl border border-parchment-dark bg-surface p-1 shadow-xs">
                    <button
                      onClick={() => setViewMode3D(true)}
                      className={`rounded-lg px-2 py-0.5 font-data text-[9px] font-bold uppercase transition-all ${
                        viewMode3D ? "bg-forest text-white shadow-xs" : "text-ink-muted hover:text-ink"
                      }`}
                    >
                      3D Model
                    </button>
                    <button
                      onClick={() => setViewMode3D(false)}
                      className={`rounded-lg px-2 py-0.5 font-data text-[9px] font-bold uppercase transition-all ${
                        !viewMode3D ? "bg-forest text-white shadow-xs" : "text-ink-muted hover:text-ink"
                      }`}
                    >
                      2D Silhouette
                    </button>
                  </div>

                  {viewMode3D ? (
                    <div className="w-full">
                      <MannequinViewer3D
                        morphology={active.id as MorphologyShape}
                        selectedStyleId={
                          active.id === "hourglass"
                            ? "wrap-dress"
                            : active.id === "rectangle"
                            ? "structured-blazer"
                            : active.id === "pear"
                            ? "boatneck-gown"
                            : active.id === "inverted-triangle"
                            ? "peplum-suit"
                            : "empire-maxi"
                        }
                        height={340}
                        interactive={false}
                      />
                    </div>
                  ) : (
                    <div className="my-8 flex h-52 w-40 items-center justify-center text-forest">
                      {active.svg}
                    </div>
                  )}
                </div>
                <div className="flex flex-col justify-between p-8">
                  <div>
                    <div className="mb-3 font-data text-[11px] uppercase tracking-[0.25em] text-forest">Morphology Type</div>
                    <h3 className="mb-3 font-display text-3xl font-bold text-ink">{active.name}</h3>
                    <p className="mb-6 font-body text-sm leading-relaxed text-ink-muted">{active.description}</p>
                    <div className="mb-3 font-data text-[10px] uppercase tracking-[0.2em] text-ink-subtle">Recommended Styles</div>
                    <div className="flex flex-wrap gap-2">
                      {active.tags.map((tag) => <Chip key={tag}>{tag}</Chip>)}
                    </div>
                  </div>
                  <Link
                    to="/register"
                    className="mt-8 inline-block self-start rounded-full bg-forest px-6 py-3 font-body text-xs font-semibold uppercase tracking-wider text-white no-underline shadow-xs hover:opacity-95"
                  >
                    See {active.name} Styles →
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* ROLES */}
      <section id="roles" className="px-6 py-28 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <FadeIn className="mb-12">
            <Eyebrow>Platform Roles</Eyebrow>
            <h2 className="font-display text-4xl font-bold leading-tight text-ink sm:text-5xl">
              Every expert, <em className="italic text-forest">in one system.</em>
            </h2>
          </FadeIn>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {ROLES.map((role, i) => (
              <FadeIn key={role.role} delay={i * 90}>
                <Card className="h-full p-7">
                  <span className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-parchment text-forest">
                    <AppIcon name={role.icon} size={18} />
                  </span>
                  <h3 className="mb-3 font-display text-xl font-semibold text-ink">{role.role}</h3>
                  <p className="mb-6 font-body text-sm leading-relaxed text-ink-muted">{role.description}</p>
                  <div className="flex flex-col gap-2">
                    {role.capabilities.map((cap) => (
                      <div key={cap} className="flex items-center gap-2">
                        <span className="h-1 w-1 flex-shrink-0 rounded-full bg-forest" />
                        <span className="font-data text-[11px] tracking-wide text-ink-subtle">{cap}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ORDER FLOW */}
      <section id="order-flow" className="bg-parchment px-6 py-28 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <FadeIn className="mb-12">
            <Eyebrow>Order Lifecycle</Eyebrow>
            <h2 className="font-display text-4xl font-bold leading-tight text-ink sm:text-5xl">
              Full traceability, <em className="italic text-forest">every stage.</em>
            </h2>
          </FadeIn>
          <FadeIn>
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
              <Card className="overflow-hidden lg:col-span-2">
                {ORDER_STATUSES.map((status, i) => {
                  const isActive = activeOrderStatus === i;
                  const isDone = i < activeOrderStatus;
                  return (
                    <button
                      key={status.id}
                      onClick={() => setActiveOrderStatus(i)}
                      className={`flex w-full items-center gap-4 border-b border-parchment-dark px-6 py-4 text-left transition-colors last:border-b-0 ${
                        isActive ? "bg-surface" : "bg-transparent hover:bg-parchment/40"
                      }`}
                    >
                      <div
                        className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full transition-colors ${
                          i <= activeOrderStatus ? "bg-forest text-white" : "bg-parchment-dark text-ink-muted"
                        }`}
                      >
                        {isDone && <AppIcon name="check" size={12} strokeWidth={2.5} />}
                        {isActive && <span className="h-2 w-2 rounded-full bg-white" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <span className={`font-display text-sm ${i <= activeOrderStatus ? "font-semibold text-ink" : "font-normal text-ink-muted"}`}>
                            {status.label}
                          </span>
                          <span className={`font-data text-[10px] tracking-widest ${isActive ? "text-forest font-semibold" : "text-ink-subtle"}`}>
                            {String(i + 1).padStart(2, "0")}/{String(ORDER_STATUSES.length).padStart(2, "0")}
                          </span>
                        </div>
                        {isActive && <p className="mt-1 font-body text-xs leading-relaxed text-ink-muted">{status.description}</p>}
                      </div>
                    </button>
                  );
                })}
              </Card>

              <Card className="p-7">
                <div className="mb-5 font-data text-[10px] uppercase tracking-[0.25em] text-forest">Order Preview</div>
                <div className="mb-1 font-display text-xl font-semibold text-ink">Evening Wrap Dress</div>
                <div className="mb-6 font-data text-[11px] tracking-wide text-ink-subtle">#MF-2024-0847</div>
                <div className="mb-5 rounded-2xl bg-parchment p-4 border border-parchment-dark/50">
                  <div className="mb-1.5 font-data text-[10px] uppercase tracking-[0.15em] text-ink-subtle">Current Status</div>
                  <div className="font-display text-lg font-semibold text-forest">{ORDER_STATUSES[activeOrderStatus].label}</div>
                  <div className="mt-1 font-body text-xs text-ink-muted">{ORDER_STATUSES[activeOrderStatus].description}</div>
                </div>
                <div className="flex flex-col gap-3">
                  {[
                    { label: "Morphology", value: "Hourglass" },
                    { label: "Tailor", value: "Amara Diouf, Dakar" },
                    { label: "Stylist", value: "Léa Fontaine" },
                    { label: "Agreed Price", value: "125,000 XAF" },
                    { label: "Ready", value: "Est. 14 days" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between border-b border-parchment-dark pb-2.5">
                      <span className="font-data text-[10px] uppercase tracking-wide text-ink-subtle">{item.label}</span>
                      <span className="font-body text-sm font-medium text-ink">{item.value}</span>
                    </div>
                  ))}
                </div>
                <Link
                  to="/signin"
                  className="mt-6 block rounded-full bg-forest py-3 text-center font-body text-xs font-semibold uppercase tracking-wider text-white no-underline shadow-xs hover:opacity-95"
                >
                  Sign In to Track
                </Link>
              </Card>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-28 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <FadeIn>
            <Eyebrow>Join MorphoFit</Eyebrow>
            <h2 className="mb-6 font-display text-4xl font-bold leading-tight text-ink sm:text-6xl">
              Ready to wear something <em className="italic text-forest">made for you?</em>
            </h2>
            <p className="mx-auto mb-10 max-w-md font-body text-base leading-relaxed text-ink-muted">
              Register as a client and start your first body scan today. Your morphology, your style, your tailor — all in one place.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                to="/register"
                className="rounded-full bg-forest px-8 py-4 font-body text-sm font-semibold text-white shadow-md transition-transform hover:opacity-95 active:scale-95 no-underline"
              >
                Create Account
              </Link>
              <Link
                to="/register"
                className="rounded-full border border-parchment-dark bg-surface px-8 py-4 font-body text-sm font-semibold text-ink no-underline transition-colors hover:bg-parchment"
              >
                Join as Stylist or Tailor
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-parchment-dark bg-parchment px-6 py-14 lg:px-8">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <div className="mb-1 font-display text-lg font-semibold text-ink">MorphoFit</div>
            <div className="mb-3 font-data text-[10px] uppercase tracking-[0.15em] text-ink-subtle">Precision Tailoring Platform</div>
            <p className="max-w-[200px] font-body text-xs leading-relaxed text-ink-muted">Custom clothing, measured from your body, made by real hands.</p>
          </div>
          {[
            { title: "Platform", links: ["How It Works", "Morphology Types", "3D Styles", "Order Tracking"] },
            { title: "Professionals", links: ["Stylist Portal", "Tailor Portal", "Delivery Network", "Partner Program"] },
            { title: "Company", links: ["About", "Careers", "Privacy", "Terms"] },
          ].map((col) => (
            <div key={col.title}>
              <div className="mb-3 font-data text-[10px] uppercase tracking-[0.2em] text-ink-subtle">{col.title}</div>
              <div className="flex flex-col gap-2">
                {col.links.map((link) => (
                  <a
                    key={link}
                    href="#"
                    className="font-body text-sm text-ink-muted no-underline transition-colors hover:text-ink"
                  >
                    {link}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-10 flex max-w-7xl flex-wrap items-center justify-between gap-3 border-t border-parchment-dark pt-6">
          <span className="font-data text-[10px] tracking-wide text-ink-subtle">© 2024 MorphoFit. All rights reserved.</span>
          <span className="font-data text-[10px] tracking-wide text-ink-subtle">Made for bodies that deserve better fits.</span>
        </div>
      </footer>
    </div>
  );
}
