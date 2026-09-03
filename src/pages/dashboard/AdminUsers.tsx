import { useEffect, useState } from "react";
import { api, type User } from "../../api";

const ROLE_COLOR: Record<string, string> = {
  client: "#C9A96E",
  stylist: "#8B9E8A",
  tailor: "#9E8B7D",
  delivery_agent: "#7D8B9E",
  admin: "#9E8B9E",
};

const ROLE_LABEL: Record<string, string> = {
  client: "Client",
  stylist: "Stylist",
  tailor: "Tailor",
  delivery_agent: "Delivery Agent",
  admin: "Admin",
};

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.admin.users().then(setUsers).finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? users : users.filter((u) => u.role === filter);
  const roles = ["all", "client", "stylist", "tailor", "delivery_agent", "admin"];

  if (loading) return <div style={{ color: "var(--muted-foreground)", padding: "2rem" }}>Loading users…</div>;

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "1.8rem", fontWeight: 400, marginBottom: "2rem" }}>
        All Users
      </h1>

      {/* Role filter */}
      <div className="flex flex-wrap gap-2" style={{ marginBottom: "1.5rem" }}>
        {roles.map((r) => (
          <button
            key={r}
            onClick={() => setFilter(r)}
            style={{
              padding: "0.3rem 0.75rem",
              border: `1px solid ${filter === r ? "var(--primary)" : "var(--border)"}`,
              background: filter === r ? "rgba(201,169,110,0.12)" : "transparent",
              color: filter === r ? "var(--primary)" : "var(--muted-foreground)",
              borderRadius: "2px",
              fontSize: "0.72rem",
              fontFamily: "var(--font-mono-face)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {r === "all" ? "All" : ROLE_LABEL[r]}
          </button>
        ))}
      </div>

      <div style={{ border: "1px solid var(--border)", background: "var(--card)" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr auto auto",
            padding: "0.75rem 1.25rem",
            borderBottom: "1px solid var(--border)",
            gap: "1rem",
          }}
        >
          {["Name", "Email", "Role", "Joined"].map((h) => (
            <div key={h} style={{ fontFamily: "var(--font-mono-face)", fontSize: "0.55rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>
              {h}
            </div>
          ))}
        </div>
        {filtered.map((u) => {
          const color = ROLE_COLOR[u.role] || "var(--muted-foreground)";
          return (
            <div
              key={u.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr auto auto",
                padding: "1rem 1.25rem",
                borderBottom: "1px solid var(--border)",
                gap: "1rem",
                alignItems: "center",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--secondary)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <div style={{ fontSize: "0.875rem", color: "var(--foreground)" }}>{u.name}</div>
              <div style={{ fontFamily: "var(--font-mono-face)", fontSize: "0.65rem", letterSpacing: "0.06em", color: "var(--muted-foreground)" }}>{u.email}</div>
              <span style={{ padding: "0.2rem 0.6rem", border: `1px solid ${color}40`, background: `${color}15`, borderRadius: "2px", fontFamily: "var(--font-mono-face)", fontSize: "0.5rem", letterSpacing: "0.1em", textTransform: "uppercase", color, whiteSpace: "nowrap" }}>
                {ROLE_LABEL[u.role]}
              </span>
              <div style={{ fontFamily: "var(--font-mono-face)", fontSize: "0.6rem", color: "var(--muted-foreground)", whiteSpace: "nowrap" }}>
                {new Date(u.createdAt).toLocaleDateString("en-GB")}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
