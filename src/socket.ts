import { io, type Socket } from "socket.io-client";

// The backend API base is `${SOCKET_ORIGIN}/api/v1` (see api.ts) — Socket.IO
// connects to the bare origin, not the /api/v1 path.
const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api/v1";
const SOCKET_ORIGIN = API_BASE.replace(/\/api\/v1\/?$/, "") || "/";

let socket: Socket | null = null;

/** Singleton socket.io-client connection, authenticated with the same JWT
 * the REST API uses (see MorphofitBackend/src/sockets/index.js). Lazily
 * created on first use and torn down on logout via disconnectSocket(). */
export function getSocket(): Socket {
  if (socket) return socket;
  const token = localStorage.getItem("morphofit_token");
  socket = io(SOCKET_ORIGIN, {
    auth: { token },
    autoConnect: Boolean(token),
    // Start on polling and upgrade to websocket (Engine.IO's own default)
    // rather than websocket-first — through a dev-server proxy (Vite here),
    // an initial pure-websocket attempt can repeatedly fail the handshake
    // before falling back, producing console errors and slower first
    // connect even though it eventually works either way.
    transports: ["polling", "websocket"],
  });
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
