import { api, type Order, type User, type Measurements, type UserRole } from "../../api";

export interface StatTileData {
  label: string;
  value: string | number;
  sub?: string;
}

/** Per-role KPI tiles, shared between Overview.tsx and Profile.tsx so the
 * two screens never drift out of sync on what "active orders" etc. means
 * for a given role. */
export function computeRoleStats(role: UserRole, orders: Order[], users: User[], measurements: Measurements | null): StatTileData[] {
  switch (role) {
    case "client":
      return [
        { label: "Active Orders", value: orders.filter((o) => o.status !== "delivered").length },
        { label: "Delivered", value: orders.filter((o) => o.status === "delivered").length },
        { label: "Morphology", value: measurements?.morphology ? measurements.morphology.charAt(0).toUpperCase() + measurements.morphology.slice(1) : "—", sub: "body type" },
        {
          label: "Measurements",
          value: measurements ? "Scanned" : "Pending",
          sub: measurements ? new Date(measurements.scannedAt).toLocaleDateString() : "Upload photos to scan",
        },
      ];
    case "stylist":
      return [
        { label: "Active Clients", value: users.length },
        { label: "Open Orders", value: orders.filter((o) => o.status !== "delivered").length },
        { label: "Delivered", value: orders.filter((o) => o.status === "delivered").length },
      ];
    case "tailor":
      return [
        { label: "In Production", value: orders.filter((o) => o.status === "production").length },
        { label: "Ready to Ship", value: orders.filter((o) => o.status === "ready").length },
        { label: "Negotiating", value: orders.filter((o) => o.status === "negotiating").length },
      ];
    case "delivery_agent":
      return [
        { label: "Assigned to Me", value: orders.filter((o) => o.status === "assigned").length },
        { label: "Out for Delivery", value: orders.filter((o) => o.status === "out").length },
        { label: "Ready for Pickup", value: orders.filter((o) => o.status === "ready").length },
      ];
    case "admin":
      return [
        { label: "Total Users", value: users.length },
        { label: "Total Orders", value: orders.length },
        { label: "In Production", value: orders.filter((o) => o.status === "production").length },
        { label: "Delivered", value: orders.filter((o) => o.status === "delivered").length },
      ];
    default:
      return [];
  }
}

/** Fetches the (orders, users, measurements) triple a given role needs to
 * compute its stats — same endpoints Overview.tsx already called per role,
 * centralized so Profile.tsx doesn't have to re-derive the role->endpoint
 * mapping independently. */
export async function fetchRoleStatsData(
  role: UserRole
): Promise<{ orders: Order[]; users: User[]; measurements: Measurements | null }> {
  if (role === "client") {
    const [orders, measurements] = await Promise.all([api.client.orders(), api.client.measurements()]);
    return { orders, users: [], measurements };
  }
  if (role === "stylist") {
    const [orders, users] = await Promise.all([api.stylist.orders(), api.stylist.clients()]);
    return { orders, users, measurements: null };
  }
  if (role === "tailor") {
    const orders = await api.tailor.orders();
    return { orders, users: [], measurements: null };
  }
  if (role === "delivery_agent") {
    const orders = await api.delivery.orders();
    return { orders, users: [], measurements: null };
  }
  const [orders, users] = await Promise.all([api.admin.orders(), api.admin.users()]);
  return { orders, users, measurements: null };
}
