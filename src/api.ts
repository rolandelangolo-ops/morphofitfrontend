const BASE = import.meta.env.VITE_API_BASE_URL || "/api/v1";

function getToken() {
  return localStorage.getItem("morphofit_token");
}

function normalizeIds<T>(data: T): T {
  if (!data || typeof data !== "object") return data;
  if (Array.isArray(data)) return data.map(normalizeIds) as unknown as T;
  const obj = { ...(data as Record<string, unknown>) };
  if ("_id" in obj && !("id" in obj)) {
    obj.id = String(obj._id);
  }
  for (const key of Object.keys(obj)) {
    if (obj[key] && typeof obj[key] === "object") {
      obj[key] = normalizeIds(obj[key]);
    }
  }
  return obj as T;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  // FormData (avatar/message-attachment uploads) must NOT get a manual
  // Content-Type — the browser sets its own multipart boundary.
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
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
  const data = (body?.data ?? body);
  return normalizeIds(data) as T;
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
    /** Always resolves for an existing OR unknown address — the backend
     * answers identically on purpose so this can't be used to discover
     * which emails have accounts. */
    forgotPassword: (email: string) =>
      request<{ success: boolean }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),
    resetPassword: (token: string, password: string) =>
      request<{ token: string; user: User }>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      }),
    verifyEmail: (token: string) =>
      request<{ success: boolean; email: string }>("/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ token }),
      }),
    resendVerification: () =>
      request<{ success: boolean; alreadyVerified?: boolean }>("/auth/resend-verification", { method: "POST" }),
  },
  client: {
    measurements: () => request<Measurements | null>("/client/measurements"),
    saveMeasurements: (measurements: Measurements) =>
      request<Measurements>("/client/measurements", {
        method: "POST",
        body: JSON.stringify(measurements),
      }),
    orders: () => request<Order[]>("/client/orders"),
    createOrder: (orderPayload: Partial<Order>) =>
      request<Order>("/client/orders", {
        method: "POST",
        body: JSON.stringify(orderPayload),
      }),
    updateOrder: (orderId: string, patch: Partial<Order>) =>
      request<Order>(`/client/orders/${orderId}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      }),
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
    updateOrder: (id: string, patch: { status?: string; price?: number; notes?: string }) =>
      request<Order>(`/tailor/orders/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      }),
  },
  delivery: {
    orders: () => request<Order[]>("/delivery/orders"),
    updateStatus: (id: string, status: string) =>
      request<Order>(`/delivery/orders/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
  },
  admin: {
    users: () => request<User[]>("/admin/users"),
    orders: () => request<Order[]>("/admin/orders"),
    getUser: (id: string) => request<AdminUserDetail>(`/admin/users/${id}`),
    createUser: (payload: { name: string; email: string; role: UserRole; city?: string; phone?: string; bio?: string; morphology?: string }) =>
      request<AdminUserDetail>("/admin/users", { method: "POST", body: JSON.stringify(payload) }),
    updateUser: (id: string, patch: Partial<{ name: string; email: string; city: string; phone: string; bio: string; morphology: string }>) =>
      request<AdminUserDetail>(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    changeRole: (id: string, role: UserRole) =>
      request<AdminUserDetail>(`/admin/users/${id}/role`, { method: "PATCH", body: JSON.stringify({ role }) }),
    setPassword: (id: string, newPassword: string) =>
      request<{ success: boolean }>(`/admin/users/${id}/password`, { method: "POST", body: JSON.stringify({ newPassword }) }),
    deactivateUser: (id: string) => request<AdminUserDetail>(`/admin/users/${id}/deactivate`, { method: "PATCH" }),
    reactivateUser: (id: string) => request<AdminUserDetail>(`/admin/users/${id}/reactivate`, { method: "PATCH" }),
    deleteUser: (id: string) =>
      request<{ success: boolean }>(`/admin/users/${id}`, { method: "DELETE", body: JSON.stringify({ confirm: "DELETE" }) }),
    activity: () => request<AdminActivityEntry[]>("/admin/activity"),
    support: {
      list: (params?: { status?: SupportRequestStatus; type?: SupportRequestType; category?: SupportRequestCategory; q?: string }) => {
        const query = new URLSearchParams(
          Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== "") as [string, string][]
        ).toString();
        return request<AdminSupportRequest[]>(`/admin/support${query ? `?${query}` : ""}`);
      },
      getOne: (id: string) => request<AdminSupportRequest>(`/admin/support/${id}`),
      updateStatus: (id: string, patch: { status?: SupportRequestStatus; priority?: SupportRequestPriority }) =>
        request<AdminSupportRequest>(`/admin/support/${id}/status`, { method: "PATCH", body: JSON.stringify(patch) }),
      respond: (id: string, message: string) =>
        request<AdminSupportRequest>(`/admin/support/${id}/responses`, { method: "POST", body: JSON.stringify({ message }) }),
    },
  },
  users: {
    me: () => request<UserRich>("/users/me"),
    updateMe: (
      patch: Partial<{
        name: string;
        bio: string;
        phone: string;
        city: string;
        notificationPrefs: Partial<NotificationPrefs>;
        emailPrefs: Partial<Omit<EmailPrefs, "account">>;
      }>
    ) =>
      request<UserRich>("/users/me", { method: "PATCH", body: JSON.stringify(patch) }),
    uploadAvatar: (file: File) => {
      const form = new FormData();
      form.append("avatar", file);
      return request<UserRich>("/users/me/avatar", { method: "POST", body: form });
    },
    changePassword: (currentPassword: string, newPassword: string) =>
      request<{ success: boolean }>("/users/me/password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      }),
    exportData: () => request<Record<string, unknown>>("/users/me/export"),
    deactivate: () => request<{ success: boolean }>("/users/me/deactivate", { method: "POST" }),
    getById: (id: string) => request<UserPublic>(`/users/${id}`),
    search: (q: string) => request<UserPublic[]>(`/users/search?q=${encodeURIComponent(q)}`),
  },
  notifications: {
    list: () => request<AppNotification[]>("/notifications"),
    unreadCount: () => request<{ count: number }>("/notifications/unread-count"),
    markRead: (id: string) => request<AppNotification>(`/notifications/${id}/read`, { method: "PATCH" }),
    markAllRead: () => request<{ success: boolean }>("/notifications/read-all", { method: "PATCH" }),
  },
  messaging: {
    conversations: () => request<Conversation[]>("/messaging/conversations"),
    createConversation: (userId: string) =>
      request<Conversation>("/messaging/conversations", { method: "POST", body: JSON.stringify({ userId }) }),
    messages: (conversationId: string) => request<ChatMessage[]>(`/messaging/conversations/${conversationId}/messages`),
    sendMessage: (conversationId: string, payload: { text?: string; file?: File; durationSec?: number }) => {
      if (payload.file) {
        const form = new FormData();
        if (payload.text) form.append("text", payload.text);
        form.append("attachment", payload.file);
        if (payload.durationSec) form.append("durationSec", String(payload.durationSec));
        return request<ChatMessage>(`/messaging/conversations/${conversationId}/messages`, { method: "POST", body: form });
      }
      return request<ChatMessage>(`/messaging/conversations/${conversationId}/messages`, {
        method: "POST",
        body: JSON.stringify({ text: payload.text }),
      });
    },
    markRead: (conversationId: string) =>
      request<{ success: boolean }>(`/messaging/conversations/${conversationId}/read`, { method: "PATCH" }),
    react: (conversationId: string, messageId: string, emoji: string) =>
      request<ChatMessage>(`/messaging/conversations/${conversationId}/messages/${messageId}/reactions`, {
        method: "POST",
        body: JSON.stringify({ emoji }),
      }),
    deleteMessage: (conversationId: string, messageId: string) =>
      request<ChatMessage>(`/messaging/conversations/${conversationId}/messages/${messageId}`, { method: "DELETE" }),
  },
  support: {
    create: (payload: {
      type: SupportRequestType;
      category: SupportRequestCategory;
      subject: string;
      description: string;
      context?: { path: string; screenLabel: string };
      files?: File[];
    }) => {
      const form = new FormData();
      form.append("type", payload.type);
      form.append("category", payload.category);
      form.append("subject", payload.subject);
      form.append("description", payload.description);
      if (payload.context) form.append("context", JSON.stringify(payload.context));
      for (const file of payload.files || []) form.append("attachments", file);
      return request<SupportRequest>("/support", { method: "POST", body: form });
    },
    mine: () => request<SupportRequest[]>("/support"),
    getOne: (id: string) => request<SupportRequest>(`/support/${id}`),
    addResponse: (id: string, message: string) =>
      request<SupportRequest>(`/support/${id}/responses`, { method: "POST", body: JSON.stringify({ message }) }),
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
  bio?: string;
  avatarUrl?: string;
  createdAt: string;
  measurements?: Measurements;
}

export interface NotificationPrefs {
  appointments: boolean;
  orders: boolean;
  messages: boolean;
  support: boolean;
}

/** Own-profile shape (Settings/Profile pages) */
/** Email channel, independent of the in-app NotificationPrefs above.
 * `account` (password changed, deactivation) is security mail and is
 * intentionally not user-disableable — the backend rejects changes to it. */
export interface EmailPrefs {
  account: boolean;
  appointments: boolean;
  orders: boolean;
  messages: boolean;
  support: boolean;
}

export interface UserRich extends User {
  bio: string;
  phone?: string;
  notificationPrefs: NotificationPrefs;
  emailPrefs: EmailPrefs;
  emailVerified: boolean;
}

/** Shape for viewing ANOTHER user (PublicProfile, chat headers, search results) */
export interface UserPublic {
  id: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  bio: string;
  city?: string;
}

export type NotificationType =
  | "appointment_requested"
  | "appointment_confirmed"
  | "appointment_declined"
  | "order_status_changed"
  | "message_received"
  | "support_request_created"
  | "support_reply_received"
  | "support_response_added"
  | "support_status_changed"
  | "account_updated_by_admin"
  | "role_changed_by_admin"
  | "account_deactivated_by_admin"
  | "account_reactivated_by_admin"
  | "password_reset_by_admin";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: { appointmentId?: string; orderId?: string; conversationId?: string; supportRequestId?: string };
  read: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participant: UserPublic | null;
  lastMessageAt?: string;
  lastMessagePreview: string;
  unreadCount: number;
}

export interface MessageReaction {
  userId: string;
  emoji: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  type: "text" | "image" | "voice";
  text: string;
  attachmentUrl?: string;
  attachmentDurationSec?: number;
  reactions: MessageReaction[];
  readBy: string[];
  deleted: boolean;
  createdAt: string;
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
  /** Populated people on the order, where the endpoint provides them:
   * GET /delivery/orders returns `client`/`tailor` (courier pickup/drop-off),
   * GET /client/orders returns `tailor`/`deliveryAgent` (order tracking). */
  client?: { name: string; city?: string };
  tailor?: { name: string; city?: string };
  deliveryAgent?: { name: string; city?: string };
  negotiationHistory: NegotiationEntry[];
}

/** One entry in an order's shared, persisted negotiation trail — both
 * parties read the exact same entries (see MorphofitBackend's
 * utils/negotiation.js). */
export interface NegotiationEntry {
  id: string;
  authorId: string;
  authorRole: UserRole;
  authorName: string;
  amount: number;
  notes: string;
  type: "quote" | "counter" | "acceptance";
  createdAt: string;
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

export type SupportRequestType = "bug" | "feedback" | "question";
export type SupportRequestCategory =
  | "account"
  | "orders"
  | "appointments"
  | "payments"
  | "messaging"
  | "measurements"
  | "visualizer"
  | "app_bug"
  | "feature_request"
  | "other";
export type SupportRequestStatus = "open" | "in_progress" | "resolved" | "closed";
export type SupportRequestPriority = "low" | "normal" | "high";

export interface SupportResponse {
  id: string;
  authorId: string;
  authorRole: UserRole;
  message: string;
  createdAt: string;
}

export interface SupportRequest {
  id: string;
  userId: string;
  type: SupportRequestType;
  category: SupportRequestCategory;
  subject: string;
  description: string;
  status: SupportRequestStatus;
  priority: SupportRequestPriority;
  context?: { path: string; screenLabel: string };
  attachments: string[];
  responses: SupportResponse[];
  createdAt: string;
  updatedAt: string;
}

/** Admin list/detail shape — includes the requester's public info. */
export interface AdminSupportRequest extends SupportRequest {
  requester: UserPublic | null;
}

/** Full user record as seen by an admin — includes email/phone/active state
 * that a normal cross-viewer (UserPublic) never gets. */
export interface AdminUserDetail {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  city?: string;
  phone?: string;
  bio: string;
  morphology?: string;
  avatarUrl?: string;
  active: boolean;
  createdAt: string;
}

export interface AdminActivityEntry {
  id: string;
  adminName: string;
  action: string;
  targetType: string;
  targetId?: string;
  detail: string;
  createdAt: string;
}
