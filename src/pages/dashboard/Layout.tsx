import { NavLink, Outlet, useNavigate } from "react-router";
import { useAuth } from "../../AuthContext";
import type { UserRole } from "../../api";

const NAV_BY_ROLE: Record<UserRole, { label: string; to: string }[]> = {
  client: [
    { label: "Overview", to: "/dashboard" },
    { label: "My Orders", to: "/dashboard/orders" },
    { label: "Appointments", to: "/dashboard/appointments" },
    { label: "Measurements", to: "/dashboard/measurements" },
  ],
  stylist: [
    { label: "Overview", to: "/dashboard" },
    { label: "My Clients", to: "/dashboard/clients" },
    { label: "Orders", to: "/dashboard/orders" },
  ],
  tailor: [
    { label: "Overview", to: "/dashboard" },
    { label: "Orders", to: "/dashboard/orders" },
    { label: "Appointments", to: "/dashboard/appointments" },
  ],
  delivery_agent: [
    { label: "Overview", to: "/dashboard" },
    { label: "Deliveries", to: "/dashboard/orders" },
  ],
  admin: [
    { label: "Overview", to: "/dashboard" },
    { label: "All Users", to: "/dashboard/users" },
    { label: "All Orders", to: "/dashboard/orders" },
  ],
};

const ROLE_LABEL: Record<UserRole, string> = {
  client: "Client",
  stylist: "Stylist",
  tailor: "Tailor",
  delivery_agent: "Delivery Agent",
  admin: "Admin",
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;
  const nav = NAV_BY_ROLE[user.role] || [];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen md:flex" style={{ background: "var(--background)", fontFamily: "var(--font-sans)" }}>
      <aside className="hidden md:flex md:w-64 md:flex-col md:flex-shrink-0" style={{ background: "var(--card)", borderRight: "1px solid var(--border)" }}>
        <div style={{ padding: "2rem 1.5rem 1.75rem" }}>
          <NavLink to="/" style={{ fontFamily: "var(--font-serif)", fontSize: "1.35rem", color: "var(--primary)", letterSpacing: "0.04em", textDecoration: "none" }}>
            MorphoFit
          </NavLink>
          <div style={{ fontFamily: "var(--font-mono-face)", fontSize: "0.52rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--muted-foreground)", marginTop: "0.5rem" }}>
            Atelier workspace
          </div>
        </div>

        <div style={{ padding: "0 1rem", flex: 1 }}>
          <div style={{ padding: "0 0.75rem 0.75rem", fontFamily: "var(--font-mono-face)", fontSize: "0.52rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>
            {ROLE_LABEL[user.role]} dashboard
          </div>
          <nav className="flex flex-col gap-1">
            {nav.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === "/dashboard"} style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                padding: "0.7rem 0.75rem",
                borderLeft: `2px solid ${isActive ? "var(--primary)" : "transparent"}`,
                color: isActive ? "var(--foreground)" : "var(--muted-foreground)",
                background: isActive ? "var(--secondary)" : "transparent",
                fontSize: "0.8rem",
                letterSpacing: "0.04em",
                textDecoration: "none",
                transition: "all 0.15s",
              })}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div style={{ padding: "1.25rem 1.5rem", borderTop: "1px solid var(--border)" }}>
          <div style={{ fontSize: "0.82rem", color: "var(--foreground)", marginBottom: "0.15rem" }}>{user.name}</div>
          <div style={{ fontFamily: "var(--font-mono-face)", fontSize: "0.55rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--primary)", marginBottom: "1rem" }}>
            {ROLE_LABEL[user.role]}
          </div>
          <button onClick={handleLogout} style={{ width: "100%", padding: "0.55rem 0.75rem", border: "1px solid var(--border)", background: "transparent", color: "var(--muted-foreground)", borderRadius: "2px", fontSize: "0.7rem", fontFamily: "var(--font-sans)", letterSpacing: "0.06em", cursor: "pointer" }}>
            Sign Out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between md:hidden" style={{ padding: "1rem 1.25rem", background: "var(--card)", borderBottom: "1px solid var(--border)" }}>
          <NavLink to="/" style={{ fontFamily: "var(--font-serif)", fontSize: "1.15rem", color: "var(--primary)", textDecoration: "none" }}>MorphoFit</NavLink>
          <button onClick={handleLogout} style={{ padding: "0.35rem 0.65rem", border: "1px solid var(--border)", background: "transparent", color: "var(--muted-foreground)", borderRadius: "2px", fontSize: "0.68rem", cursor: "pointer" }}>Sign Out</button>
        </header>
        <nav className="flex gap-1 overflow-x-auto px-4 py-2 md:hidden" style={{ background: "var(--card)", borderBottom: "1px solid var(--border)" }}>
          {nav.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === "/dashboard"} style={({ isActive }) => ({ padding: "0.4rem 0.65rem", whiteSpace: "nowrap", color: isActive ? "var(--foreground)" : "var(--muted-foreground)", background: isActive ? "var(--secondary)" : "transparent", fontSize: "0.72rem", textDecoration: "none", borderRadius: "2px" })}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <main style={{ flex: 1, padding: "2rem", maxWidth: "1200px", width: "100%", margin: "0 auto" }}>
        <Outlet />
        </main>
      </div>
    </div>
  );
}
