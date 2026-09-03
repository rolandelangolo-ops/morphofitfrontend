import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../AuthContext";

const DEMO_ACCOUNTS = [
  { role: "Client", email: "client@morphofit.com" },
  { role: "Stylist", email: "stylist@morphofit.com" },
  { role: "Tailor", email: "tailor@morphofit.com" },
  { role: "Delivery", email: "delivery@morphofit.com" },
  { role: "Admin", email: "admin@morphofit.com" },
];

export default function SignIn() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("password123");
    setError("");
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ background: "var(--background)", fontFamily: "var(--font-sans)" }}
    >
      {/* Left panel — image */}
      <div className="hidden lg:block flex-1 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=900&h=1200&fit=crop&auto=format"
          alt="Fashion atelier"
          className="w-full h-full"
          style={{ objectFit: "cover", filter: "brightness(0.35) sepia(0.2)" }}
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, transparent 60%, var(--background))" }} />
        <div className="absolute bottom-16 left-12">
          <div style={{ fontFamily: "var(--font-serif)", fontSize: "2.5rem", fontWeight: 400, color: "var(--foreground)", lineHeight: 1.1, maxWidth: "360px" }}>
            Your body.
            <br />
            <em style={{ fontStyle: "italic", color: "var(--primary)" }}>Your blueprint.</em>
            <br />
            Your garment.
          </div>
          <div style={{ fontFamily: "var(--font-mono-face)", fontSize: "0.6rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--muted-foreground)", marginTop: "1rem" }}>
            MorphoFit Atelier
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-16 max-w-lg mx-auto w-full lg:max-w-none">
        <div className="w-full max-w-sm">
          <Link
            to="/"
            style={{ fontFamily: "var(--font-serif)", fontSize: "1.3rem", color: "var(--primary)", letterSpacing: "0.04em", textDecoration: "none", display: "block", marginBottom: "3rem" }}
          >
            MorphoFit
          </Link>

          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "2rem", fontWeight: 400, marginBottom: "0.5rem" }}>
            Welcome back
          </h1>
          <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)", marginBottom: "2.5rem" }}>
            Sign in to your atelier account.
          </p>

          {/* Demo shortcuts */}
          <div style={{ marginBottom: "2rem", padding: "1rem", border: "1px solid var(--border)", background: "var(--card)", borderRadius: "2px" }}>
            <div style={{ fontFamily: "var(--font-mono-face)", fontSize: "0.55rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: "0.75rem" }}>
              Demo Accounts (password: password123)
            </div>
            <div className="flex flex-wrap gap-2">
              {DEMO_ACCOUNTS.map((d) => (
                <button
                  key={d.email}
                  onClick={() => fillDemo(d.email)}
                  style={{
                    padding: "0.25rem 0.6rem",
                    border: "1px solid var(--border)",
                    background: email === d.email ? "var(--primary)" : "transparent",
                    color: email === d.email ? "var(--primary-foreground)" : "var(--muted-foreground)",
                    borderRadius: "2px",
                    fontSize: "0.7rem",
                    fontFamily: "var(--font-mono-face)",
                    cursor: "pointer",
                    letterSpacing: "0.06em",
                    transition: "all 0.15s",
                  }}
                >
                  {d.role}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label style={{ fontFamily: "var(--font-mono-face)", fontSize: "0.6rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--muted-foreground)", display: "block", marginBottom: "0.5rem" }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "2px",
                  color: "var(--foreground)",
                  fontSize: "0.875rem",
                  fontFamily: "var(--font-sans)",
                  outline: "none",
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </div>

            <div>
              <label style={{ fontFamily: "var(--font-mono-face)", fontSize: "0.6rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--muted-foreground)", display: "block", marginBottom: "0.5rem" }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "2px",
                  color: "var(--foreground)",
                  fontSize: "0.875rem",
                  fontFamily: "var(--font-sans)",
                  outline: "none",
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </div>

            {error && (
              <div style={{ padding: "0.75rem 1rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "2px", fontSize: "0.8rem", color: "#f87171" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "0.875rem",
                background: loading ? "var(--muted)" : "var(--primary)",
                color: "var(--primary-foreground)",
                border: "none",
                borderRadius: "2px",
                fontSize: "0.8rem",
                fontFamily: "var(--font-sans)",
                fontWeight: 500,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "opacity 0.2s",
                marginTop: "0.5rem",
              }}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <p style={{ fontSize: "0.8rem", color: "var(--muted-foreground)", marginTop: "2rem", textAlign: "center" }}>
            No account?{" "}
            <Link to="/register" style={{ color: "var(--primary)", textDecoration: "none" }}>
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
