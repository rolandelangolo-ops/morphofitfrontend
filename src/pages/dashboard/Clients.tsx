import { useEffect, useState } from "react";
import { api, type User } from "../../api";

export default function Clients() {
  const [clients, setClients] = useState<User[]>([]);
  const [selected, setSelected] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.stylist.clients().then((data) => { setClients(data); if (data.length) setSelected(data[0]); }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: "var(--muted-foreground)", padding: "2rem" }}>Loading clients…</div>;

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "1.8rem", fontWeight: 400, marginBottom: "2rem" }}>
        My Clients
      </h1>

      {clients.length === 0 ? (
        <div style={{ padding: "4rem", border: "1px solid var(--border)", background: "var(--card)", textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-serif)", fontSize: "1.3rem", color: "var(--muted-foreground)" }}>No clients assigned yet</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div style={{ border: "1px solid var(--border)", background: "var(--card)" }}>
            <div style={{ padding: "0.875rem 1.25rem", borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontFamily: "var(--font-mono-face)", fontSize: "0.55rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>
                {clients.length} Clients
              </span>
            </div>
            {clients.map((client) => (
              <button
                key={client.id}
                onClick={() => setSelected(client)}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "1rem 1.25rem",
                  background: selected?.id === client.id ? "var(--secondary)" : "transparent",
                  border: "none",
                  borderBottom: "1px solid var(--border)",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
              >
                <div style={{ fontSize: "0.875rem", color: "var(--foreground)", marginBottom: "0.2rem" }}>{client.name}</div>
                <div style={{ fontFamily: "var(--font-mono-face)", fontSize: "0.55rem", letterSpacing: "0.06em", color: "var(--muted-foreground)" }}>{client.email}</div>
                {client.measurements?.morphology && (
                  <div style={{ marginTop: "0.4rem", fontSize: "0.7rem", color: "var(--primary)" }}>
                    {client.measurements.morphology.charAt(0).toUpperCase() + client.measurements.morphology.slice(1)}
                  </div>
                )}
              </button>
            ))}
          </div>

          {selected && (
            <div className="lg:col-span-2 flex flex-col gap-4">
              <div style={{ border: "1px solid var(--border)", background: "var(--card)" }}>
                <div style={{ padding: "1.25rem", borderBottom: "1px solid var(--border)" }}>
                  <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", fontWeight: 400, marginBottom: "0.25rem" }}>{selected.name}</h2>
                  <div style={{ fontFamily: "var(--font-mono-face)", fontSize: "0.6rem", letterSpacing: "0.1em", color: "var(--muted-foreground)" }}>{selected.email}</div>
                </div>

                {selected.measurements ? (
                  <>
                    <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)" }}>
                      <div style={{ fontFamily: "var(--font-mono-face)", fontSize: "0.55rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: "0.5rem" }}>Morphology</div>
                      <div style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", color: "var(--primary)" }}>
                        {selected.measurements.morphology.charAt(0).toUpperCase() + selected.measurements.morphology.slice(1)}
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-px">
                      {[
                        { label: "Shoulder", value: `${selected.measurements.shoulder} cm` },
                        { label: "Chest", value: `${selected.measurements.chest} cm` },
                        { label: "Waist", value: `${selected.measurements.waist} cm` },
                        { label: "Hip", value: `${selected.measurements.hip} cm` },
                        { label: "Inseam", value: `${selected.measurements.inseam} cm` },
                        { label: "Thigh", value: `${selected.measurements.thigh} cm` },
                        { label: "Arm", value: `${selected.measurements.armLength} cm` },
                        { label: "Height", value: `${selected.measurements.height} cm` },
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
                          <div style={{ fontFamily: "var(--font-mono-face)", fontSize: "0.5rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: "0.3rem" }}>{m.label}</div>
                          <div style={{ fontFamily: "var(--font-serif)", fontSize: "1.1rem", color: "var(--primary)" }}>{m.value}</div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{ padding: "2rem", textAlign: "center", color: "var(--muted-foreground)", fontSize: "0.875rem" }}>
                    Client has not completed body scan yet.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
