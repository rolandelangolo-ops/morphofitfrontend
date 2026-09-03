import { useEffect, useState } from "react";
import { useAuth } from "../../AuthContext";
import { api, type Order } from "../../api";

const STATUS_STEPS = ["pending", "negotiating", "confirmed", "production", "ready", "assigned", "out", "delivered"];

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

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selected, setSelected] = useState<Order | null>(null);
  const [updating, setUpdating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = () => {
      if (user.role === "client") return api.client.orders();
      if (user.role === "stylist") return api.stylist.orders();
      if (user.role === "tailor") return api.tailor.orders();
      if (user.role === "delivery_agent") return api.delivery.orders();
      return api.admin.orders();
    };
    fetch().then((data) => { setOrders(data); if (data.length) setSelected(data[0]); }).finally(() => setLoading(false));
  }, [user]);

  const handleStatusChange = async (newStatus: string) => {
    if (!selected || user?.role !== "tailor") return;
    setUpdating(true);
    try {
      const updated = await api.tailor.updateStatus(selected.id, newStatus);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      setSelected(updated);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div style={{ color: "var(--muted-foreground)", padding: "2rem" }}>Loading orders…</div>;

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "1.8rem", fontWeight: 400, marginBottom: "2rem" }}>
        {user?.role === "delivery_agent" ? "Deliveries" : "Orders"}
      </h1>

      {orders.length === 0 ? (
        <div style={{ padding: "4rem", border: "1px solid var(--border)", background: "var(--card)", textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-serif)", fontSize: "1.3rem", color: "var(--muted-foreground)" }}>No orders assigned</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order list */}
          <div style={{ border: "1px solid var(--border)", background: "var(--card)" }}>
            <div style={{ padding: "0.875rem 1.25rem", borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontFamily: "var(--font-mono-face)", fontSize: "0.55rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>
                {orders.length} {orders.length === 1 ? "Order" : "Orders"}
              </span>
            </div>
            {orders.map((order) => {
              const color = STATUS_COLOR[order.status] || "var(--muted-foreground)";
              return (
                <button
                  key={order.id}
                  onClick={() => setSelected(order)}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "1rem 1.25rem",
                    background: selected?.id === order.id ? "var(--secondary)" : "transparent",
                    border: "none",
                    borderBottom: "1px solid var(--border)",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => { if (selected?.id !== order.id) e.currentTarget.style.background = "rgba(201,169,110,0.03)"; }}
                  onMouseLeave={(e) => { if (selected?.id !== order.id) e.currentTarget.style.background = "transparent"; }}
                >
                  <div style={{ fontFamily: "var(--font-serif)", fontSize: "0.9rem", color: "var(--foreground)", marginBottom: "0.3rem" }}>{order.item}</div>
                  <div style={{ fontFamily: "var(--font-mono-face)", fontSize: "0.55rem", letterSpacing: "0.08em", color: "var(--muted-foreground)", marginBottom: "0.5rem" }}>{order.id}</div>
                  <span style={{ padding: "0.15rem 0.5rem", border: `1px solid ${color}40`, background: `${color}15`, borderRadius: "2px", fontFamily: "var(--font-mono-face)", fontSize: "0.5rem", letterSpacing: "0.1em", textTransform: "uppercase", color }}>
                    {STATUS_LABEL[order.status]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Order detail */}
          {selected && (
            <div className="lg:col-span-2 flex flex-col gap-4">
              <div style={{ border: "1px solid var(--border)", background: "var(--card)" }}>
                <div style={{ padding: "1.25rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                  <div>
                    <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", fontWeight: 400, marginBottom: "0.25rem" }}>{selected.item}</h2>
                    <div style={{ fontFamily: "var(--font-mono-face)", fontSize: "0.6rem", letterSpacing: "0.1em", color: "var(--muted-foreground)" }}>{selected.id}</div>
                  </div>
                  <span style={{ padding: "0.3rem 0.75rem", border: `1px solid ${STATUS_COLOR[selected.status] || "var(--border)"}40`, background: `${STATUS_COLOR[selected.status] || "transparent"}15`, borderRadius: "2px", fontFamily: "var(--font-mono-face)", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", color: STATUS_COLOR[selected.status] || "var(--muted-foreground)" }}>
                    {STATUS_LABEL[selected.status]}
                  </span>
                </div>

                {/* Progress bar */}
                <div style={{ padding: "1.25rem", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ fontFamily: "var(--font-mono-face)", fontSize: "0.55rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: "0.75rem" }}>
                    Order Progress
                  </div>
                  <div style={{ display: "flex", gap: "2px" }}>
                    {STATUS_STEPS.map((step, i) => {
                      const currentIdx = STATUS_STEPS.indexOf(selected.status);
                      const filled = i <= currentIdx;
                      return (
                        <div
                          key={step}
                          style={{
                            flex: 1,
                            height: "3px",
                            background: filled ? "var(--primary)" : "var(--border)",
                            borderRadius: "1px",
                            transition: "background 0.3s",
                          }}
                        />
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem" }}>
                    <span style={{ fontFamily: "var(--font-mono-face)", fontSize: "0.5rem", color: "var(--muted-foreground)" }}>Pending</span>
                    <span style={{ fontFamily: "var(--font-mono-face)", fontSize: "0.5rem", color: "var(--muted-foreground)" }}>Delivered</span>
                  </div>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-px" style={{ borderBottom: "1px solid var(--border)" }}>
                  {[
                    { label: "Fabric", value: selected.fabric },
                    { label: "Morphology", value: selected.morphology.charAt(0).toUpperCase() + selected.morphology.slice(1) },
                    { label: "Price", value: selected.price ? `${selected.currency} ${selected.price.toLocaleString()}` : "Pending" },
                    { label: "Updated", value: new Date(selected.updatedAt).toLocaleDateString("en-GB") },
                  ].map((item, i) => (
                    <div
                      key={item.label}
                      style={{
                        padding: "1rem 1.25rem",
                        background: "var(--card)",
                        borderRight: i % 2 === 0 ? "1px solid var(--border)" : "none",
                        borderBottom: i < 2 ? "1px solid var(--border)" : "none",
                      }}
                    >
                      <div style={{ fontFamily: "var(--font-mono-face)", fontSize: "0.55rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: "0.3rem" }}>{item.label}</div>
                      <div style={{ fontSize: "0.875rem", color: "var(--foreground)" }}>{item.value}</div>
                    </div>
                  ))}
                </div>

                {/* Notes */}
                <div style={{ padding: "1.25rem" }}>
                  <div style={{ fontFamily: "var(--font-mono-face)", fontSize: "0.55rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: "0.5rem" }}>Design Notes</div>
                  <div style={{ fontSize: "0.875rem", color: "var(--muted-foreground)", lineHeight: 1.6 }}>{selected.notes}</div>
                </div>
              </div>

              {/* Tailor status update */}
              {user?.role === "tailor" && (
                <div style={{ border: "1px solid var(--border)", background: "var(--card)", padding: "1.25rem" }}>
                  <div style={{ fontFamily: "var(--font-mono-face)", fontSize: "0.55rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: "1rem" }}>
                    Update Status
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {["negotiating", "confirmed", "production", "ready"].map((s) => (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(s)}
                        disabled={updating || selected.status === s}
                        style={{
                          padding: "0.4rem 0.875rem",
                          border: `1px solid ${selected.status === s ? "var(--primary)" : "var(--border)"}`,
                          background: selected.status === s ? "rgba(201,169,110,0.12)" : "transparent",
                          color: selected.status === s ? "var(--primary)" : "var(--muted-foreground)",
                          borderRadius: "2px",
                          fontSize: "0.72rem",
                          fontFamily: "var(--font-mono-face)",
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          cursor: updating || selected.status === s ? "default" : "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        {STATUS_LABEL[s]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
