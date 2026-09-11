import { useState, useEffect, useMemo } from "react";
import PageShell from "../../components/ui/PageShell";
import { Card } from "../../components/ui/primitives";
import { AppIcon } from "../../components/ui/icons";
import { api, type Order, type User } from "../../api";

export default function AdminReports() {
  const [timeRange, setTimeRange] = useState<"30d" | "90d" | "all">("30d");
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReports = () => {
    setLoading(true);
    setError(null);
    Promise.all([api.admin.orders(), api.admin.users()])
      .then(([ordersData, usersData]) => {
        setOrders(ordersData);
        setUsers(usersData);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load intelligence metrics");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReports();
  }, []);

  // Filter orders by selected timeRange
  const filteredOrders = useMemo(() => {
    const now = Date.now();
    const daysLimit = timeRange === "30d" ? 30 : timeRange === "90d" ? 90 : Infinity;
    if (daysLimit === Infinity) return orders;
    return orders.filter((o) => {
      const created = new Date(o.createdAt).getTime();
      return now - created <= daysLimit * 24 * 60 * 60 * 1000;
    });
  }, [orders, timeRange]);

  // Aggregate Metrics
  const totalOrdersCount = filteredOrders.length;
  const gmv = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + (o.price || 0), 0);
  }, [filteredOrders]);

  const escrowAmount = useMemo(() => {
    return filteredOrders
      .filter((o) => ["production", "ready", "assigned", "out"].includes(o.status))
      .reduce((sum, o) => sum + (o.price || 0), 0);
  }, [filteredOrders]);

  // Morphology Archetype Aggregation from Clients
  const morphologyStats = useMemo(() => {
    const clients = users.filter((u) => u.role === "client");
    const counts: Record<string, number> = {
      Hourglass: 0,
      Pear: 0,
      Rectangle: 0,
      "Inverted Triangle": 0,
      Oval: 0,
      Unknown: 0,
    };

    clients.forEach((c) => {
      const morph = (c.morphology || "").toLowerCase();
      if (morph.includes("hourglass")) counts["Hourglass"]++;
      else if (morph.includes("pear")) counts["Pear"]++;
      else if (morph.includes("inverted")) counts["Inverted Triangle"]++;
      else if (morph.includes("oval") || morph.includes("apple")) counts["Oval"]++;
      else if (morph.includes("rectangle")) counts["Rectangle"]++;
      // Uncalibrated or unrecognized morphology strings get their own
      // bucket instead of being silently folded into Hourglass, which was
      // skewing the distribution chart.
      else counts["Unknown"]++;
    });

    const totalClients = Math.max(clients.length, 1);
    const colorMap: Record<string, string> = {
      Hourglass: "bg-[#1A4D3E]",
      Pear: "bg-[#B85D38]",
      Rectangle: "bg-[#1E2A4A]",
      "Inverted Triangle": "bg-[#6E1A2C]",
      Oval: "bg-[#C49A45]",
      Unknown: "bg-[#9A9088]",
    };

    return Object.entries(counts).map(([name, count]) => {
      const percentage = Math.round((count / totalClients) * 100);
      return {
        name,
        percentage,
        count,
        color: colorMap[name],
      };
    });
  }, [users]);

  // Order Funnel Lifecycle Stages
  const orderFunnelStages = useMemo(() => {
    const stages = [
      { label: "Pending", keys: ["pending"] },
      { label: "Negotiating", keys: ["negotiating", "quoted"] },
      { label: "Confirmed", keys: ["confirmed"] },
      { label: "In Production", keys: ["production"] },
      { label: "Ready", keys: ["ready"] },
      { label: "Assigned", keys: ["assigned"] },
      { label: "Out for Delivery", keys: ["out"] },
      { label: "Delivered", keys: ["delivered"] },
    ];

    const baseCount = Math.max(filteredOrders.length, 1);
    return stages.map((st) => {
      const count = filteredOrders.filter((o) => st.keys.includes(o.status)).length;
      const pct = Math.round((count / baseCount) * 100);
      return {
        label: st.label,
        count,
        pct: Math.min(100, pct),
      };
    });
  }, [filteredOrders]);

  const deliveredCount = filteredOrders.filter((o) => o.status === "delivered").length;
  const conversionRate = totalOrdersCount > 0 ? Math.round((deliveredCount / totalOrdersCount) * 100) : 100;

  const actions = (
    <div className="flex items-center gap-1 rounded-2xl border border-parchment-dark bg-surface p-1 shadow-xs">
      {(["30d", "90d", "all"] as const).map((r) => (
        <button
          key={r}
          onClick={() => setTimeRange(r)}
          className={`rounded-xl px-3 py-1 text-xs font-semibold uppercase tracking-wider font-data transition-all ${
            timeRange === r
              ? "bg-forest text-white shadow-xs"
              : "text-ink-muted hover:text-ink hover:bg-parchment/60"
          }`}
        >
          {r === "30d" ? "30 Days" : r === "90d" ? "Quarter" : "All Time"}
        </button>
      ))}
    </div>
  );

  return (
    <PageShell
      title="Platform Intelligence & Reporting"
      subtitle="Global metrics covering morphology adoption, tailor production velocity, courier turnaround, and GMV."
      actions={actions}
      loading={loading}
      error={error}
      onRetry={loadReports}
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-5">
          <span className="font-data text-[10px] uppercase tracking-wider text-ink-subtle">
            Total Orders Flow
          </span>
          <div className="mt-1 font-display text-3xl font-bold text-forest">
            {totalOrdersCount}
          </div>
          <span className="mt-1 block font-body text-xs font-semibold text-forest">
            Live database pipeline
          </span>
        </Card>

        <Card className="p-5">
          <span className="font-data text-[10px] uppercase tracking-wider text-ink-subtle">
            Gross Merchandising Value
          </span>
          <div className="mt-1 font-display text-3xl font-bold text-ink">
            {gmv.toLocaleString()} <span className="font-data text-xs font-normal text-ink-muted">XAF</span>
          </div>
          <span className="mt-1 block font-body text-xs text-ink-muted">
            Held in Escrow: {escrowAmount.toLocaleString()} XAF
          </span>
        </Card>

        <Card className="p-5">
          <span className="font-data text-[10px] uppercase tracking-wider text-ink-subtle">
            Avg Tailoring Turnaround <span className="text-ink-subtle/70 normal-case">(simulated)</span>
          </span>
          <div className="mt-1 font-display text-3xl font-bold text-ink">
            5.4 <span className="font-data text-xs font-normal text-ink-muted">days</span>
          </div>
          <span className="mt-1 block font-body text-xs text-ink-subtle">
            No per-stage timestamps recorded yet to compute this for real
          </span>
        </Card>

        <Card className="p-5">
          <span className="font-data text-[10px] uppercase tracking-wider text-ink-subtle">
            Smart Courier Speed <span className="text-ink-subtle/70 normal-case">(simulated)</span>
          </span>
          <div className="mt-1 font-display text-3xl font-bold text-amber">
            28 <span className="font-data text-xs font-normal text-ink-muted">min</span>
          </div>
          <span className="mt-1 block font-body text-xs text-ink-subtle">
            No delivery-routing data recorded yet to compute this for real
          </span>
        </Card>
      </div>

      {/* Main Analysis Grids */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left 6 cols: Morphology Distribution */}
        <div className="lg:col-span-6">
          <Card className="flex h-full flex-col justify-between p-5">
            <div>
              <div className="flex items-center justify-between border-b border-parchment-dark pb-3">
                <div>
                  <h3 className="font-display text-base font-bold text-ink">
                    Morphology Distribution Across Clients
                  </h3>
                  <span className="font-data text-[10px] uppercase tracking-wider text-ink-subtle">
                    Extracted via 2-Photo Vision Scans
                  </span>
                </div>
                <AppIcon name="barChart" size={18} className="text-forest" />
              </div>

              {/* Stacked Progress Visualizer Bar */}
              <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-parchment-dark/50">
                {morphologyStats.map((s) => (
                  <div
                    key={s.name}
                    className={`h-full ${s.color} transition-all`}
                    style={{ width: `${s.percentage}%` }}
                    title={`${s.name}: ${s.percentage}%`}
                  />
                ))}
              </div>

              {/* Table breakdown */}
              <div className="mt-4 space-y-3">
                {morphologyStats.map((stat) => (
                  <div key={stat.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className={`h-3 w-3 rounded-full ${stat.color}`} />
                      <span className="font-body font-semibold text-ink">
                        {stat.name} Archetype
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="font-data text-ink-subtle">{stat.count} clients</span>
                      <span className="w-12 text-right font-data font-bold text-ink">
                        {stat.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-xl bg-parchment p-3.5 border border-parchment-dark/60">
              <span className="mb-1 block font-data text-[10px] font-bold uppercase text-forest">
                Design Intelligence Insight
              </span>
              <p className="font-body text-xs leading-relaxed text-ink-muted">
                Morphology data dynamically aggregated across all registered clientele. Silhouette recommendations and bespoke pattern blueprints automatically adapt to these proportions.
              </p>
            </div>
          </Card>
        </div>

        {/* Right 6 cols: 8-Stage Order Funnel Pipeline */}
        <div className="lg:col-span-6">
          <Card className="flex h-full flex-col justify-between p-5">
            <div>
              <div className="flex items-center justify-between border-b border-parchment-dark pb-3">
                <div>
                  <h3 className="font-display text-base font-bold text-ink">
                    8-Stage Order Lifecycle Pipeline
                  </h3>
                  <span className="font-data text-[10px] uppercase tracking-wider text-ink-subtle">
                    Full Traceability from Negotiation to Delivery
                  </span>
                </div>
                <AppIcon name="receipt" size={18} className="text-forest" />
              </div>

              <div className="mt-4 space-y-2.5">
                {orderFunnelStages.map((stage) => (
                  <div key={stage.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-body font-medium text-ink">
                        {stage.label}
                      </span>
                      <span className="font-data text-[10px] text-ink-subtle">
                        {stage.count} orders ({stage.pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-parchment-dark">
                      <div
                        className="h-full rounded-full bg-forest transition-all"
                        style={{ width: `${stage.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-parchment-dark bg-parchment/40 p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-body font-semibold text-ink">
                  Overall Conversion Rate
                </span>
                <span className="font-data font-bold text-forest">
                  {conversionRate}% (Dispatched / Complete)
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
