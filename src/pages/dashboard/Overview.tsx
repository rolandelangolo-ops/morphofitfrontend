import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../../AuthContext";
import { api, type Order, type Measurements, type User } from "../../api";

const STATUS_COLOR: Record<string, string> = {
  pending: "#7A7168",
  negotiating: "#9E8B7D",
  confirmed: "#8B9E8A",
  production: "#C9A96E",
  ready: "#7D8B9E",
  assigned: "#9E8B9E",
  out: "#8B9E8A",
  delivered: "#6B8B6B",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  negotiating: "Negotiating",
  confirmed: "Confirmed",
  production: "In Production",
  ready: "Ready",
  assigned: "Assigned",
  out: "Out for Delivery",
  delivered: "Delivered",
};

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ padding: "1.5rem", background: "var(--card)", border: "1px solid var(--border)" }}>
      <div style={{ fontFamily: "var(--font-mono-face)", fontSize: "0.55rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: "0.5rem" }}>
        {label}
      </div>
      <div style={{ fontFamily: "var(--font-serif)", fontSize: "2rem", color: "var(--primary)", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: "0.72rem", color: "var(--muted-foreground)", marginTop: "0.3rem" }}>{sub}</div>}
    </div>
  );
}

function OrderRow({ order }: { order: Order }) {
  const color = STATUS_COLOR[order.status] || "var(--muted-foreground)";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "1rem 1.25rem",
        borderBottom: "1px solid var(--border)",
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--secondary)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <div>
        <div style={{ fontSize: "0.875rem", color: "var(--foreground)", marginBottom: "0.2rem" }}>{order.item}</div>
        <div style={{ fontFamily: "var(--font-mono-face)", fontSize: "0.6rem", letterSpacing: "0.08em", color: "var(--muted-foreground)" }}>{order.id}</div>
      </div>
      <div className="flex items-center gap-4">
        {order.price && (
          <span style={{ fontSize: "0.82rem", color: "var(--foreground)" }}>
            {order.currency} {order.price.toLocaleString()}
          </span>
        )}
        <span
          style={{
            padding: "0.2rem 0.6rem",
            border: `1px solid ${color}40`,
            background: `${color}15`,
            borderRadius: "2px",
            fontFamily: "var(--font-mono-face)",
            fontSize: "0.55rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color,
          }}
        >
          {STATUS_LABEL[order.status] || order.status}
        </span>
      </div>
    </div>
  );
}

export default function Overview() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [measurements, setMeasurements] = useState<Measurements | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    if (!user) return;
    if (user.role === "client") {
      api.client.orders().then(setOrders).catch(() => {});
      api.client.measurements().then(setMeasurements).catch(() => {});
    } else if (user.role === "stylist") {
      api.stylist.orders().then(setOrders).catch(() => {});
      api.stylist.clients().then(setUsers).catch(() => {});
    } else if (user.role === "tailor") {
      api.tailor.orders().then(setOrders).catch(() => {});
    } else if (user.role === "delivery_agent") {
      api.delivery.orders().then(setOrders).catch(() => {});
    } else if (user.role === "admin") {
      api.admin.orders().then(setOrders).catch(() => {});
      api.admin.users().then(setUsers).catch(() => {});
    }
  }, [user]);

  if (!user) return null;

  return (
    <div>
      {/* Greeting */}
      <div style={{ marginBottom: "2.5rem" }}>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "2rem", fontWeight: 400, marginBottom: "0.25rem" }}>
          Good morning, <em style={{ fontStyle: "italic", color: "var(--primary)" }}>{user.name.split(" ")[0]}.</em>
        </h1>
        <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
          {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Stats */}
      {user.role === "client" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px" style={{ border: "1px solid var(--border)", marginBottom: "2rem" }}>
            <StatCard label="Active Orders" value={orders.filter((o) => o.status !== "delivered").length} />
            <StatCard label="Delivered" value={orders.filter((o) => o.status === "delivered").length} />
            <StatCard label="Morphology" value={measurements?.morphology ? measurements.morphology.charAt(0).toUpperCase() + measurements.morphology.slice(1) : "—"} sub="body type" />
            <StatCard label="Measurements" value={measurements ? "Scanned" : "Pending"} sub={measurements ? new Date(measurements.scannedAt).toLocaleDateString() : "Upload photos to scan"} />
          </div>
          {!measurements && (
            <div style={{ padding: "1.5rem", border: "1px solid var(--primary)", background: "rgba(201,169,110,0.06)", borderRadius: "2px", marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "0.875rem", color: "var(--foreground)", marginBottom: "0.25rem" }}>Start your body scan</div>
                <div style={{ fontSize: "0.78rem", color: "var(--muted-foreground)" }}>Upload two photos to generate your measurements and morphology profile.</div>
              </div>
              <button style={{ padding: "0.6rem 1.25rem", background: "var(--primary)", color: "var(--primary-foreground)", border: "none", borderRadius: "2px", fontSize: "0.75rem", fontFamily: "var(--font-sans)", letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", flexShrink: 0, marginLeft: "1rem" }}>
                Scan Now
              </button>
            </div>
          )}
        </>
      )}

      {user.role === "stylist" && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-px" style={{ border: "1px solid var(--border)", marginBottom: "2rem" }}>
          <StatCard label="Active Clients" value={users.length} />
          <StatCard label="Open Orders" value={orders.filter((o) => o.status !== "delivered").length} />
          <StatCard label="Delivered" value={orders.filter((o) => o.status === "delivered").length} />
        </div>
      )}

      {user.role === "tailor" && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-px" style={{ border: "1px solid var(--border)", marginBottom: "2rem" }}>
          <StatCard label="In Production" value={orders.filter((o) => o.status === "production").length} />
          <StatCard label="Ready to Ship" value={orders.filter((o) => o.status === "ready").length} />
          <StatCard label="Negotiating" value={orders.filter((o) => o.status === "negotiating").length} />
        </div>
      )}

      {user.role === "delivery_agent" && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-px" style={{ border: "1px solid var(--border)", marginBottom: "2rem" }}>
          <StatCard label="Assigned to Me" value={orders.filter((o) => o.status === "assigned").length} />
          <StatCard label="Out for Delivery" value={orders.filter((o) => o.status === "out").length} />
          <StatCard label="Ready for Pickup" value={orders.filter((o) => o.status === "ready").length} />
        </div>
      )}

      {user.role === "admin" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px" style={{ border: "1px solid var(--border)", marginBottom: "2rem" }}>
          <StatCard label="Total Users" value={users.length} />
          <StatCard label="Total Orders" value={orders.length} />
          <StatCard label="In Production" value={orders.filter((o) => o.status === "production").length} />
          <StatCard label="Delivered" value={orders.filter((o) => o.status === "delivered").length} />
        </div>
      )}

      {/* Orders table */}
      {orders.length > 0 && (
        <div style={{ border: "1px solid var(--border)", background: "var(--card)" }}>
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: "var(--font-mono-face)", fontSize: "0.6rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>
              {user.role === "delivery_agent" ? "Assigned Deliveries" : "Recent Orders"}
            </span>
            <Link
              to="/dashboard/orders"
              style={{ fontFamily: "var(--font-mono-face)", fontSize: "0.6rem", letterSpacing: "0.1em", color: "var(--primary)", textDecoration: "none" }}
            >
              View all →
            </Link>
          </div>
          {orders.slice(0, 5).map((o) => <OrderRow key={o.id} order={o} />)}
        </div>
      )}

      {orders.length === 0 && (
        <div style={{ padding: "3rem", border: "1px solid var(--border)", background: "var(--card)", textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-serif)", fontSize: "1.2rem", color: "var(--muted-foreground)", marginBottom: "0.5rem" }}>No orders yet</div>
          <div style={{ fontSize: "0.8rem", color: "var(--muted-foreground)" }}>
            {user.role === "client" ? "Commission your first garment to get started." : "Orders will appear here once assigned."}
          </div>
        </div>
      )}

      {/* Measurements card for client */}
      {user.role === "client" && measurements && (
        <div style={{ marginTop: "2rem", border: "1px solid var(--border)", background: "var(--card)" }}>
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontFamily: "var(--font-mono-face)", fontSize: "0.6rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>
              Your Measurements
            </span>
          </div>
          <div className="grid grid-cols-4 gap-px" style={{ borderTop: "1px solid var(--border)" }}>
            {[
              { label: "Shoulder", value: `${measurements.shoulder} cm` },
              { label: "Chest", value: `${measurements.chest} cm` },
              { label: "Waist", value: `${measurements.waist} cm` },
              { label: "Hip", value: `${measurements.hip} cm` },
              { label: "Inseam", value: `${measurements.inseam} cm` },
              { label: "Thigh", value: `${measurements.thigh} cm` },
              { label: "Arm Length", value: `${measurements.armLength} cm` },
              { label: "Height", value: `${measurements.height} cm` },
            ].map((m, i) => (
              <div
                key={m.label}
                style={{
                  padding: "1rem",
                  background: "var(--card)",
                  borderRight: i % 4 !== 3 ? "1px solid var(--border)" : "none",
                  borderBottom: i < 4 ? "1px solid var(--border)" : "none",
                }}
              >
                <div style={{ fontFamily: "var(--font-mono-face)", fontSize: "0.55rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: "0.35rem" }}>{m.label}</div>
                <div style={{ fontFamily: "var(--font-serif)", fontSize: "1.1rem", color: "var(--primary)" }}>{m.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
