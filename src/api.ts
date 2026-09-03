const BASE = import.meta.env.VITE_API_BASE_URL || "/api/v1";

function getToken() {
  return localStorage.getItem("morphofit_token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error("Backend is unavailable. Start the MorphofitBackend API with npm run dev.");
  }

  const contentType = res.headers.get("content-type") || "";
  const body = contentType.includes("application/json") ? await res.json() : null;
  if (!res.ok) throw new Error(body?.error?.message || `Request failed (${res.status})`);
  return (body?.data ?? body) as T;
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ token: string; user: User }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    register: (name: string, email: string, password: string, role: string) =>
      request<{ token: string; user: User }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password, role }),
      }),
    me: () => request<User>("/auth/me"),
  },
  client: {
    measurements: () => request<Measurements | null>("/client/measurements"),
    orders: () => request<Order[]>("/client/orders"),
  },
  appointments: {
    list: () => request<Appointment[]>("/appointments"),
    tailors: () => request<User[]>("/appointments/tailors"),
    create: (tailorId: string, date: string, time: string, notes: string) =>
      request<Appointment>("/appointments", {
        method: "POST",
        body: JSON.stringify({ tailorId, date, time, notes }),
      }),
    updateStatus: (id: string, status: AppointmentStatus) =>
      request<Appointment>(`/appointments/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
  },
  stylist: {
    orders: () => request<Order[]>("/stylist/orders"),
    clients: () => request<User[]>("/stylist/clients"),
  },
  tailor: {
    orders: () => request<Order[]>("/tailor/orders"),
    updateStatus: (id: string, status: string) =>
      request<Order>(`/tailor/orders/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
  },
  delivery: {
    orders: () => request<Order[]>("/delivery/orders"),
  },
  admin: {
    users: () => request<User[]>("/admin/users"),
    orders: () => request<Order[]>("/admin/orders"),
  },
};

export type UserRole = "client" | "stylist" | "tailor" | "delivery_agent" | "admin";
export type AppointmentStatus = "requested" | "confirmed" | "declined" | "completed";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  morphology?: string;
  city?: string;
  createdAt: string;
  measurements?: Measurements;
}

export interface Measurements {
  shoulder: number;
  chest: number;
  waist: number;
  hip: number;
  inseam: number;
  thigh: number;
  armLength: number;
  height: number;
  morphology: string;
  scannedAt: string;
}

export interface Order {
  id: string;
  clientId: string;
  stylistId: string;
  tailorId: string;
  item: string;
  morphology: string;
  status: string;
  price: number | null;
  currency: string;
  createdAt: string;
  updatedAt: string;
  fabric: string;
  notes: string;
}

export interface Appointment {
  id: string;
  clientId: string;
  tailorId: string;
  date: string;
  time: string;
  notes: string;
  status: AppointmentStatus;
  createdAt: string;
  client?: User;
  tailor?: User;
}
