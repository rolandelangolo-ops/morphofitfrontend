import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../AuthContext";

const ROLES = [
  { value: "client", label: "Client", description: "Get measured and commission garments" },
  { value: "stylist", label: "Stylist", description: "Propose designs for clients" },
  { value: "tailor", label: "Tailor", description: "Produce garments and quote prices" },
  { value: "delivery_agent", label: "Delivery Agent", description: "Pick up and deliver finished orders" },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("client");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      await register(name, email, password, role);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ background: "var(--background)", fontFamily: "var(--font-sans)" }}
    >
      {/* Left panel */}
      <div className="hidden lg:block flex-1 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=900&h=1200&fit=crop&auto=format"
          alt="Fashion atelier"
          className="w-full h-full"
          style={{ objectFit: "cover", filter: "brightness(0.3) sepia(0.2)" }}
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, transparent 60%, var(--background))" }} />
        <div className="absolute bottom-16 left-12">
          <div style={{ fontFamily: "var(--font-serif)", fontSize: "1.8rem", fontWeight: 400, color: "var(--foreground)", lineHeight: 1.2, maxWidth: "320px" }}>
            Join a platform where
            <br />
            <em style={{ fontStyle: "italic", color: "var(--primary)" }}>craft meets precision.</em>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-16 w-full">
        <div className="w-full max-w-sm">
          <Link
            to="/"
            style={{ fontFamily: "var(--font-serif)", fontSize: "1.3rem", color: "var(--primary)", letterSpacing: "0.04em", textDecoration: "none", display: "block", marginBottom: "3rem" }}
          >
            MorphoFit
          </Link>

          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "2rem", fontWeight: 400, marginBottom: "0.5rem" }}>
            Create account
          </h1>
          <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)", marginBottom: "2.5rem" }}>
            Join MorphoFit as a client, stylist, tailor, or delivery agent.
          </p>

          {/* Role selector */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ fontFamily: "var(--font-mono-face)", fontSize: "0.6rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--muted-foreground)", display: "block", marginBottom: "0.75rem" }}>
              I am a…
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  style={{
                    padding: "0.75rem",
                    border: `1px solid ${role === r.value ? "var(--primary)" : "var(--border)"}`,
                    background: role === r.value ? "rgba(201,169,110,0.08)" : "var(--card)",
                    borderRadius: "2px",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ fontSize: "0.82rem", fontWeight: 500, color: role === r.value ? "var(--primary)" : "var(--foreground)", marginBottom: "0.2rem" }}>
                    {r.label}
                  </div>
                  <div style={{ fontSize: "0.68rem", color: "var(--muted-foreground)", lineHeight: 1.3 }}>
                    {r.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {[
              { label: "Full Name", value: name, onChange: setName, type: "text", placeholder: "Sophie Martin" },
              { label: "Email", value: email, onChange: setEmail, type: "email", placeholder: "you@example.com" },
              { label: "Password", value: password, onChange: setPassword, type: "password", placeholder: "Min. 6 characters" },
            ].map((field) => (
              <div key={field.label}>
                <label style={{ fontFamily: "var(--font-mono-face)", fontSize: "0.6rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--muted-foreground)", display: "block", marginBottom: "0.5rem" }}>
                  {field.label}
                </label>
                <input
                  type={field.type}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  required
                  placeholder={field.placeholder}
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
            ))}

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
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <p style={{ fontSize: "0.8rem", color: "var(--muted-foreground)", marginTop: "2rem", textAlign: "center" }}>
            Already have an account?{" "}
            <Link to="/signin" style={{ color: "var(--primary)", textDecoration: "none" }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
