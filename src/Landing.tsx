import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "./AuthContext";

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
      <svg viewBox="0 0 80 120" fill="none" className="w-full h-full">
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
    description: "Shoulders, waist, and hips in alignment. A/‑line skirts, draped fabrics, and ruched details create gentle movement and definition.",
    tags: ["A-line Skirt", "Draped Blouse", "Ruched Dress"],
    svg: (
      <svg viewBox="0 0 80 120" fill="none" className="w-full h-full">
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
      <svg viewBox="0 0 80 120" fill="none" className="w-full h-full">
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
    description: "Broader shoulders tapering to narrower hips. V‑necks, slim trousers, and flared hemlines soften the shoulder line and add base width.",
    tags: ["V-neck Top", "Flared Trouser", "Wrap Skirt"],
    svg: (
      <svg viewBox="0 0 80 120" fill="none" className="w-full h-full">
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
      <svg viewBox="0 0 80 120" fill="none" className="w-full h-full">
        <ellipse cx="40" cy="18" rx="18" ry="9" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.5"/>
        <ellipse cx="40" cy="65" rx="28" ry="38" fill="currentColor" opacity="0.08" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M26 95 Q24 108 26 114" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <path d="M54 95 Q56 108 54 114" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      </svg>
    ),
  },
];

const HOW_IT_WORKS_STEPS = [
  { number: "01", title: "Body Scan", description: "Upload two photos — front and side. Our system extracts precise measurements without a tape measure or tailor visit.", icon: "⬡" },
  { number: "02", title: "Morphology Match", description: "Your measurements are classified into one of five morphology types. Each type unlocks curated style directions suited to your silhouette.", icon: "◈" },
  { number: "03", title: "3D Visualisation", description: "Browse recommended styles rendered on a 3D model calibrated to your measurements — see the garment before it exists.", icon: "◎" },
  { number: "04", title: "Stylist Session", description: "Your measurements and chosen direction go to a real stylist who refines the design, fabric, and detail choices with you.", icon: "◇" },
  { number: "05", title: "Tailor Negotiation", description: "The confirmed design goes to a tailor who quotes a price. Negotiation is transparent and recorded — nothing verbal-only.", icon: "◫" },
  { number: "06", title: "Smart Delivery", description: "When the garment is ready, the nearest available delivery agent is automatically matched. You track every stage in real time.", icon: "◉" },
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

const ROLES = [
  { role: "Client", color: "#C9A96E", description: "Scans their body, receives morphology analysis, explores 3D-visualised styles, communicates with their stylist, and tracks the order from negotiation to doorstep.", capabilities: ["Body scan upload", "Morphology dashboard", "Style visualisation", "Design chat", "Order tracking"] },
  { role: "Stylist", color: "#8B9E8A", description: "Reviews the client's measurements and morphology, proposes design direction, selects fabric and silhouette, and coordinates handoff to the tailor.", capabilities: ["Measurement review", "Design proposal", "Fabric library", "Client chat", "Tailor handoff"] },
  { role: "Tailor", color: "#9E8B7D", description: "Receives the finalised measurements and design, quotes a price through the recorded negotiation system, produces the garment, and marks it ready for delivery.", capabilities: ["Design intake", "Price quotation", "Negotiation log", "Production updates", "Ready confirmation"] },
  { role: "Delivery Agent", color: "#7D8B9E", description: "Automatically matched by proximity when a garment is ready. Collects from the tailor and delivers to the client with live status updates throughout.", capabilities: ["Auto-matching", "Pickup notification", "Live location", "Status updates", "Delivery confirmation"] },
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
    <div ref={ref} className={className} style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(24px)", transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms` }}>
      {children}
    </div>
  );
}

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeMorphology, setActiveMorphology] = useState(0);
  const [activeOrderStatus, setActiveOrderStatus] = useState(3);
  const [menuOpen, setMenuOpen] = useState(false);

  const active = MORPHOLOGY_TYPES[activeMorphology];

  return (
    <div className="min-h-screen" style={{ background: "var(--background)", color: "var(--foreground)", fontFamily: "var(--font-sans)" }}>
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5" style={{ background: "rgba(10,9,8,0.85)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border)" }}>
        <Link to="/" className="flex items-center gap-3 no-underline">
          <span style={{ fontFamily: "var(--font-serif)", fontSize: "1.25rem", fontWeight: 600, color: "var(--primary)", letterSpacing: "0.04em" }}>MorphoFit</span>
          <span style={{ fontFamily: "var(--font-mono-face)", fontSize: "0.6rem", color: "var(--muted-foreground)", letterSpacing: "0.12em", textTransform: "uppercase", marginTop: "2px" }}>Atelier</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <a key={link.label} href={link.href} className="no-underline transition-colors duration-200" style={{ fontSize: "0.8rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted-foreground)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--foreground)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted-foreground)")}>
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <button onClick={() => navigate("/dashboard")}
              style={{ fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase", padding: "0.5rem 1.25rem", background: "var(--primary)", color: "var(--primary-foreground)", border: "none", borderRadius: "2px", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 500, transition: "opacity 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
              Dashboard
            </button>
          ) : (
            <>
              <Link to="/signin" className="hidden md:block no-underline transition-colors duration-200"
                style={{ fontSize: "0.8rem", letterSpacing: "0.06em", color: "var(--muted-foreground)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--foreground)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted-foreground)")}>
                Sign In
              </Link>
              <Link to="/register"
                style={{ fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase", padding: "0.5rem 1.25rem", background: "var(--primary)", color: "var(--primary-foreground)", border: "none", borderRadius: "2px", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 500, textDecoration: "none", transition: "opacity 0.2s" }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
                Get Measured
              </Link>
            </>
          )}
          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--foreground)", fontSize: "1.2rem" }}>
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-8 md:hidden" style={{ background: "rgba(10,9,8,0.97)" }} onClick={() => setMenuOpen(false)}>
          {NAV_LINKS.map((link) => (
            <a key={link.label} href={link.href} style={{ fontFamily: "var(--font-serif)", fontSize: "2rem", color: "var(--foreground)", textDecoration: "none" }}>{link.label}</a>
          ))}
          <Link to="/signin" style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem", color: "var(--primary)", textDecoration: "none" }}>Sign In</Link>
        </div>
      )}

      {/* HERO */}
      <section className="relative min-h-screen flex items-end pb-24 px-8 pt-32" style={{ overflow: "hidden" }}>
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 70% at 75% 40%, rgba(201,169,110,0.06) 0%, transparent 70%), radial-gradient(ellipse 40% 50% at 20% 80%, rgba(139,158,138,0.04) 0%, transparent 60%)" }} />
        <div className="absolute left-1/3 top-0 bottom-0" style={{ width: "1px", background: "linear-gradient(to bottom, transparent, var(--border) 20%, var(--border) 80%, transparent)" }} />
        <div className="absolute right-0 top-0 bottom-0 hidden lg:block" style={{ width: "38%", overflow: "hidden" }}>
          <img src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&h=1200&fit=crop&auto=format" alt="Tailored fashion garment" className="w-full h-full" style={{ objectFit: "cover", objectPosition: "center", filter: "brightness(0.4) sepia(0.2)" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to right, var(--background) 0%, transparent 30%)" }} />
        </div>

        <div className="relative max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-5 gap-12 items-end">
          <div className="lg:col-span-3">
            <div className="mb-8 inline-flex items-center gap-3" style={{ opacity: 0, animation: "fadeUp 0.8s ease 0.1s forwards" }}>
              <span style={{ width: "32px", height: "1px", background: "var(--primary)" }} />
              <span style={{ fontFamily: "var(--font-mono-face)", fontSize: "0.65rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--primary)" }}>Precision Tailoring Platform</span>
            </div>
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(3rem, 8vw, 7rem)", fontWeight: 400, lineHeight: 1.0, letterSpacing: "-0.02em", marginBottom: "2rem", opacity: 0, animation: "fadeUp 0.9s ease 0.25s forwards" }}>
              Your body.<br />
              <em style={{ fontStyle: "italic", color: "var(--primary)" }}>Your blueprint.</em><br />
              Your garment.
            </h1>
            <p style={{ fontSize: "1.05rem", lineHeight: 1.7, color: "var(--muted-foreground)", maxWidth: "480px", marginBottom: "3rem", opacity: 0, animation: "fadeUp 0.9s ease 0.4s forwards" }}>
              Two photos. A morphology analysis. A real stylist, a real tailor, and a garment made exactly for you — tracked from negotiation to your door.
            </p>
            <div className="flex flex-wrap gap-4" style={{ opacity: 0, animation: "fadeUp 0.9s ease 0.55s forwards" }}>
              <Link to="/register"
                style={{ padding: "0.875rem 2rem", background: "var(--primary)", color: "var(--primary-foreground)", border: "none", borderRadius: "2px", fontSize: "0.8rem", fontFamily: "var(--font-sans)", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", textDecoration: "none", display: "inline-block", transition: "opacity 0.2s" }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
                Start Your Scan
              </Link>
              <a href="#morphology"
                style={{ padding: "0.875rem 2rem", background: "none", color: "var(--foreground)", border: "1px solid var(--border)", borderRadius: "2px", fontSize: "0.8rem", fontFamily: "var(--font-sans)", fontWeight: 400, letterSpacing: "0.1em", textTransform: "uppercase", textDecoration: "none", display: "inline-block", transition: "border-color 0.2s, color 0.2s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--primary)"; (e.currentTarget as HTMLElement).style.color = "var(--primary)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.color = "var(--foreground)"; }}>
                Explore Styles
              </a>
            </div>
          </div>

          <div className="lg:col-span-2 grid grid-cols-2 gap-px" style={{ border: "1px solid var(--border)", opacity: 0, animation: "fadeUp 0.9s ease 0.65s forwards" }}>
            {[
              { value: "5", label: "Morphology Types" },
              { value: "8", label: "Order Stages" },
              { value: "↯", label: "Smart Delivery Matching" },
              { value: "∞", label: "Design Combinations" },
            ].map((stat, i) => (
              <div key={i} style={{ padding: "1.75rem", background: "var(--card)", borderRight: i % 2 === 0 ? "1px solid var(--border)" : "none", borderBottom: i < 2 ? "1px solid var(--border)" : "none" }}>
                <div style={{ fontFamily: "var(--font-serif)", fontSize: "2.5rem", color: "var(--primary)", lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontFamily: "var(--font-mono-face)", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted-foreground)", marginTop: "0.5rem" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="px-8 py-32" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="max-w-7xl mx-auto">
          <FadeIn className="mb-20">
            <div className="flex items-center gap-4 mb-4">
              <span style={{ width: "32px", height: "1px", background: "var(--primary)" }} />
              <span style={{ fontFamily: "var(--font-mono-face)", fontSize: "0.65rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--primary)" }}>The Process</span>
            </div>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 400, lineHeight: 1.1 }}>
              From scan to <em style={{ fontStyle: "italic", color: "var(--primary)" }}>delivery</em><br />in six stages.
            </h2>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px" style={{ border: "1px solid var(--border)" }}>
            {HOW_IT_WORKS_STEPS.map((step, i) => (
              <FadeIn key={step.number} delay={i * 80}>
                <div style={{ padding: "2.5rem", background: "var(--card)", height: "100%", borderRight: (i % 3 !== 2) ? "1px solid var(--border)" : "none", borderBottom: i < 3 ? "1px solid var(--border)" : "none", transition: "background 0.2s", cursor: "default" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--secondary)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "var(--card)")}>
                  <div className="flex items-start justify-between mb-6">
                    <span style={{ fontFamily: "var(--font-mono-face)", fontSize: "0.65rem", letterSpacing: "0.15em", color: "var(--muted-foreground)" }}>{step.number}</span>
                    <span style={{ fontSize: "1.2rem", color: "var(--primary)", opacity: 0.7 }}>{step.icon}</span>
                  </div>
                  <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.3rem", fontWeight: 500, marginBottom: "0.75rem" }}>{step.title}</h3>
                  <p style={{ fontSize: "0.875rem", lineHeight: 1.7, color: "var(--muted-foreground)" }}>{step.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* MORPHOLOGY */}
      <section id="morphology" className="px-8 py-32" style={{ borderTop: "1px solid var(--border)", background: "var(--secondary)" }}>
        <div className="max-w-7xl mx-auto">
          <FadeIn className="mb-16">
            <div className="flex items-center gap-4 mb-4">
              <span style={{ width: "32px", height: "1px", background: "var(--primary)" }} />
              <span style={{ fontFamily: "var(--font-mono-face)", fontSize: "0.65rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--primary)" }}>Morphology System</span>
            </div>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 400, lineHeight: 1.1, maxWidth: "600px" }}>
              Five silhouettes.<br /><em style={{ fontStyle: "italic", color: "var(--primary)" }}>Infinite directions.</em>
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-px" style={{ border: "1px solid var(--border)" }}>
            <div className="lg:col-span-2 flex flex-row lg:flex-col" style={{ borderRight: "1px solid var(--border)", overflowX: "auto" }}>
              {MORPHOLOGY_TYPES.map((m, i) => (
                <button key={m.id} onClick={() => setActiveMorphology(i)}
                  style={{ padding: "1.5rem 2rem", background: activeMorphology === i ? "var(--card)" : "transparent", border: "none", borderBottom: i < MORPHOLOGY_TYPES.length - 1 ? "1px solid var(--border)" : "none", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: "1rem", transition: "background 0.2s", minWidth: "160px" }}
                  onMouseEnter={(e) => { if (activeMorphology !== i) e.currentTarget.style.background = "rgba(201,169,110,0.04)"; }}
                  onMouseLeave={(e) => { if (activeMorphology !== i) e.currentTarget.style.background = "transparent"; }}>
                  <div style={{ width: "28px", height: "28px", color: activeMorphology === i ? "var(--primary)" : "var(--muted-foreground)", flexShrink: 0, transition: "color 0.2s" }}>{m.svg}</div>
                  <div>
                    <div style={{ fontFamily: "var(--font-serif)", fontSize: "0.95rem", fontWeight: activeMorphology === i ? 500 : 400, color: activeMorphology === i ? "var(--foreground)" : "var(--muted-foreground)", transition: "color 0.2s" }}>{m.name}</div>
                  </div>
                  {activeMorphology === i && <div style={{ marginLeft: "auto", width: "3px", height: "24px", background: "var(--primary)", flexShrink: 0 }} />}
                </button>
              ))}
            </div>

            <div className="lg:col-span-3" style={{ background: "var(--card)" }}>
              <div className="grid grid-cols-1 md:grid-cols-2 h-full">
                <div className="flex items-center justify-center p-12" style={{ borderBottom: "1px solid var(--border)", borderRight: "1px solid var(--border)" }}>
                  <div style={{ width: "160px", height: "220px", color: "var(--primary)", opacity: 0.85 }}>{active.svg}</div>
                </div>
                <div className="p-8 flex flex-col justify-between">
                  <div>
                    <div style={{ fontFamily: "var(--font-mono-face)", fontSize: "0.6rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--primary)", marginBottom: "0.75rem" }}>Morphology Type</div>
                    <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "2rem", fontWeight: 400, marginBottom: "1rem" }}>{active.name}</h3>
                    <p style={{ fontSize: "0.875rem", lineHeight: 1.75, color: "var(--muted-foreground)", marginBottom: "2rem" }}>{active.description}</p>
                    <div>
                      <div style={{ fontFamily: "var(--font-mono-face)", fontSize: "0.6rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: "0.75rem" }}>Recommended Styles</div>
                      <div className="flex flex-wrap gap-2">
                        {active.tags.map((tag) => (
                          <span key={tag} style={{ padding: "0.3rem 0.75rem", border: "1px solid var(--border)", borderRadius: "1px", fontSize: "0.75rem", fontFamily: "var(--font-mono-face)", color: "var(--muted-foreground)", letterSpacing: "0.06em" }}>{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Link to="/register"
                    style={{ marginTop: "2rem", padding: "0.7rem 1.5rem", background: "var(--primary)", color: "var(--primary-foreground)", border: "none", borderRadius: "2px", fontSize: "0.75rem", fontFamily: "var(--font-sans)", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", alignSelf: "flex-start", textDecoration: "none", display: "inline-block", transition: "opacity 0.2s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
                    See {active.name} Styles →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ROLES */}
      <section id="roles" className="px-8 py-32" style={{ borderTop: "1px solid var(--border)", background: "var(--secondary)" }}>
        <div className="max-w-7xl mx-auto">
          <FadeIn className="mb-16">
            <div className="flex items-center gap-4 mb-4">
              <span style={{ width: "32px", height: "1px", background: "var(--primary)" }} />
              <span style={{ fontFamily: "var(--font-mono-face)", fontSize: "0.65rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--primary)" }}>Platform Roles</span>
            </div>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 400, lineHeight: 1.1 }}>
              Every expert,<br /><em style={{ fontStyle: "italic", color: "var(--primary)" }}>in one system.</em>
            </h2>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px" style={{ border: "1px solid var(--border)" }}>
            {ROLES.map((role, i) => (
              <FadeIn key={role.role} delay={i * 100}>
                <div style={{ padding: "2.5rem 2rem", background: "var(--card)", height: "100%", borderRight: i < 3 ? "1px solid var(--border)" : "none", transition: "background 0.2s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--background)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "var(--card)")}>
                  <div style={{ width: "36px", height: "3px", background: role.color, marginBottom: "1.5rem" }} />
                  <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", fontWeight: 500, marginBottom: "1rem" }}>{role.role}</h3>
                  <p style={{ fontSize: "0.82rem", lineHeight: 1.75, color: "var(--muted-foreground)", marginBottom: "2rem" }}>{role.description}</p>
                  <div className="flex flex-col gap-2">
                    {role.capabilities.map((cap) => (
                      <div key={cap} className="flex items-center gap-2">
                        <span style={{ width: "4px", height: "4px", background: role.color, flexShrink: 0, opacity: 0.7 }} />
                        <span style={{ fontFamily: "var(--font-mono-face)", fontSize: "0.65rem", letterSpacing: "0.08em", color: "var(--muted-foreground)" }}>{cap}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ORDER FLOW */}
      <section id="order-flow" className="px-8 py-32" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="max-w-7xl mx-auto">
          <FadeIn className="mb-16">
            <div className="flex items-center gap-4 mb-4">
              <span style={{ width: "32px", height: "1px", background: "var(--primary)" }} />
              <span style={{ fontFamily: "var(--font-mono-face)", fontSize: "0.65rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--primary)" }}>Order Lifecycle</span>
            </div>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 400, lineHeight: 1.1 }}>
              Full traceability,<br /><em style={{ fontStyle: "italic", color: "var(--primary)" }}>every stage.</em>
            </h2>
          </FadeIn>
          <FadeIn>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
              <div className="lg:col-span-2">
                <div className="flex flex-col" style={{ border: "1px solid var(--border)" }}>
                  {ORDER_STATUSES.map((status, i) => (
                    <button key={status.id} onClick={() => setActiveOrderStatus(i)}
                      style={{ padding: "1.25rem 1.5rem", background: activeOrderStatus === i ? "var(--card)" : "transparent", border: "none", borderBottom: i < ORDER_STATUSES.length - 1 ? "1px solid var(--border)" : "none", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: "1.25rem", transition: "background 0.2s" }}
                      onMouseEnter={(e) => { if (activeOrderStatus !== i) e.currentTarget.style.background = "rgba(201,169,110,0.03)"; }}
                      onMouseLeave={(e) => { if (activeOrderStatus !== i) e.currentTarget.style.background = "transparent"; }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                        <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: `2px solid ${i <= activeOrderStatus ? "var(--primary)" : "var(--border)"}`, background: i <= activeOrderStatus ? "var(--primary)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s" }}>
                          {i < activeOrderStatus && <span style={{ color: "var(--primary-foreground)", fontSize: "0.55rem", fontWeight: 700 }}>✓</span>}
                          {i === activeOrderStatus && <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--primary-foreground)" }} />}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontFamily: "var(--font-serif)", fontSize: "0.95rem", fontWeight: i === activeOrderStatus ? 500 : 400, color: i <= activeOrderStatus ? "var(--foreground)" : "var(--muted-foreground)", transition: "color 0.2s" }}>{status.label}</span>
                          <span style={{ fontFamily: "var(--font-mono-face)", fontSize: "0.55rem", letterSpacing: "0.12em", textTransform: "uppercase", color: i === activeOrderStatus ? "var(--primary)" : "var(--muted-foreground)" }}>{String(i + 1).padStart(2, "0")} / {String(ORDER_STATUSES.length).padStart(2, "0")}</span>
                        </div>
                        {activeOrderStatus === i && <p style={{ fontSize: "0.8rem", color: "var(--muted-foreground)", marginTop: "0.25rem", lineHeight: 1.5 }}>{status.description}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ border: "1px solid var(--border)", background: "var(--card)", padding: "2rem" }}>
                <div style={{ fontFamily: "var(--font-mono-face)", fontSize: "0.55rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: "1.5rem" }}>Order Preview</div>
                <div style={{ fontFamily: "var(--font-serif)", fontSize: "1.3rem", marginBottom: "0.5rem" }}>Evening Wrap Dress</div>
                <div style={{ fontFamily: "var(--font-mono-face)", fontSize: "0.6rem", color: "var(--muted-foreground)", letterSpacing: "0.1em", marginBottom: "2rem" }}>#MF-2024-0847</div>
                <div style={{ border: "1px solid var(--border)", borderRadius: "2px", padding: "1rem", marginBottom: "1.5rem", background: "var(--secondary)" }}>
                  <div style={{ fontFamily: "var(--font-mono-face)", fontSize: "0.55rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: "0.5rem" }}>Current Status</div>
                  <div style={{ fontFamily: "var(--font-serif)", fontSize: "1.1rem", color: "var(--primary)" }}>{ORDER_STATUSES[activeOrderStatus].label}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", marginTop: "0.25rem" }}>{ORDER_STATUSES[activeOrderStatus].description}</div>
                </div>
                <div className="flex flex-col gap-3">
                  {[
                    { label: "Morphology", value: "Hourglass" },
                    { label: "Tailor", value: "Amara Diouf, Dakar" },
                    { label: "Stylist", value: "Léa Fontaine" },
                    { label: "Agreed Price", value: "€ 480" },
                    { label: "Ready", value: "Est. 14 days" },
                  ].map((item) => (
                    <div key={item.label} style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.5rem", borderBottom: "1px solid var(--border)" }}>
                      <span style={{ fontFamily: "var(--font-mono-face)", fontSize: "0.6rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>{item.label}</span>
                      <span style={{ fontSize: "0.8rem", color: "var(--foreground)" }}>{item.value}</span>
                    </div>
                  ))}
                </div>
                <Link to="/signin" style={{ display: "block", marginTop: "1.5rem", padding: "0.6rem", background: "var(--primary)", color: "var(--primary-foreground)", border: "none", borderRadius: "2px", fontSize: "0.7rem", fontFamily: "var(--font-sans)", letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", textAlign: "center", textDecoration: "none", transition: "opacity 0.2s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
                  Sign In to Track
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* CTA */}
      <section className="px-8 py-32" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="max-w-4xl mx-auto text-center">
          <FadeIn>
            <div style={{ fontFamily: "var(--font-mono-face)", fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--primary)", marginBottom: "1.5rem" }}>Join MorphoFit</div>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(2.5rem, 7vw, 5.5rem)", fontWeight: 400, lineHeight: 1.05, letterSpacing: "-0.02em", marginBottom: "2rem" }}>
              Ready to wear something<br /><em style={{ fontStyle: "italic", color: "var(--primary)" }}>made for you?</em>
            </h2>
            <p style={{ fontSize: "0.95rem", lineHeight: 1.75, color: "var(--muted-foreground)", maxWidth: "480px", margin: "0 auto 3rem" }}>
              Register as a client and start your first body scan today. Your morphology, your style, your tailor — all in one place.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/register"
                style={{ padding: "1rem 2.5rem", background: "var(--primary)", color: "var(--primary-foreground)", border: "none", borderRadius: "2px", fontSize: "0.8rem", fontFamily: "var(--font-sans)", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", textDecoration: "none", display: "inline-block", transition: "opacity 0.2s" }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
                Create Account
              </Link>
              <Link to="/register"
                style={{ padding: "1rem 2.5rem", background: "none", color: "var(--foreground)", border: "1px solid var(--border)", borderRadius: "2px", fontSize: "0.8rem", fontFamily: "var(--font-sans)", fontWeight: 400, letterSpacing: "0.12em", textTransform: "uppercase", textDecoration: "none", display: "inline-block", transition: "border-color 0.2s, color 0.2s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--primary)"; (e.currentTarget as HTMLElement).style.color = "var(--primary)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.color = "var(--foreground)"; }}>
                Join as Stylist or Tailor
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-8 py-12" style={{ borderTop: "1px solid var(--border)", background: "var(--card)" }}>
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div style={{ fontFamily: "var(--font-serif)", fontSize: "1.1rem", color: "var(--primary)", letterSpacing: "0.04em", marginBottom: "0.5rem" }}>MorphoFit</div>
            <div style={{ fontFamily: "var(--font-mono-face)", fontSize: "0.55rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: "1rem" }}>Precision Tailoring Platform</div>
            <p style={{ fontSize: "0.78rem", lineHeight: 1.7, color: "var(--muted-foreground)", maxWidth: "200px" }}>Custom clothing, measured from your body, made by real hands.</p>
          </div>
          {[
            { title: "Platform", links: ["How It Works", "Morphology Types", "3D Styles", "Order Tracking"] },
            { title: "Professionals", links: ["Stylist Portal", "Tailor Portal", "Delivery Network", "Partner Program"] },
            { title: "Company", links: ["About", "Careers", "Privacy", "Terms"] },
          ].map((col) => (
            <div key={col.title}>
              <div style={{ fontFamily: "var(--font-mono-face)", fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: "1rem" }}>{col.title}</div>
              <div className="flex flex-col gap-2">
                {col.links.map((link) => (
                  <a key={link} href="#" style={{ fontSize: "0.8rem", color: "var(--muted-foreground)", textDecoration: "none", transition: "color 0.2s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--foreground)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted-foreground)")}>
                    {link}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ borderTop: "1px solid var(--border)", marginTop: "3rem", paddingTop: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <span style={{ fontFamily: "var(--font-mono-face)", fontSize: "0.55rem", letterSpacing: "0.1em", color: "var(--muted-foreground)" }}>© 2024 MorphoFit. All rights reserved.</span>
          <span style={{ fontFamily: "var(--font-mono-face)", fontSize: "0.55rem", letterSpacing: "0.1em", color: "var(--muted-foreground)" }}>Made for bodies that deserve better fits.</span>
        </div>
      </footer>

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </div>
  );
}
