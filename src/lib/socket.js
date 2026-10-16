import { io } from "socket.io-client";
import { getAccessToken } from "./authSession.js";
import { performTokenRefresh } from "./authTokenRefresh.js";

/**
 * One Socket.IO connection for the whole app.
 *
 *   connectSocket() / disconnectSocket()   — driven by auth state (see useRealtimeConnection)
 *   onSocketEvent(event, handler)          — returns an unsubscribe function
 *   emitWithAck(event, payload)            — resolves with the server ack
 *   joinRoom(joinEvent, leaveEvent, payload) — joins now and after every reconnect; returns leave()
 *   isSocketConnected() / subscribeSocketStatus(listener)
 *
 * Event prefixes: `chat:*` for group chat, `call:*` reserved for video call signaling.
 */

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  new URL(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1").origin;

let socket = null;
let refreshing = false;
const statusListeners = new Set();
const activeRooms = new Map();
const eventHandlers = new Map();

const notifyStatus = () => {
  const connected = isSocketConnected();
  statusListeners.forEach((listener) => listener(connected));
};

const rejoinRooms = () => {
  activeRooms.forEach(({ joinEvent, payload }) => socket?.emit(joinEvent, payload));
};

/** Access token expired or was rejected: refresh it over REST, then reconnect. */
const reconnectWithFreshToken = async () => {
  if (refreshing || !socket) return;
  refreshing = true;
  try {
    const refreshed = await performTokenRefresh();
    if (refreshed?.accessToken) socket?.connect();
  } finally {
    refreshing = false;
  }
};

export function connectSocket() {
  if (socket) {
    if (!socket.connected) socket.connect();
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: (callback) => callback({ token: getAccessToken() }),
    transports: ["websocket", "polling"],
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
  });

  socket.onAny((event, ...args) => {
    eventHandlers.get(event)?.forEach((handler) => handler(...args));
  });
  socket.on("connect", () => {
    rejoinRooms();
    notifyStatus();
  });
  socket.on("disconnect", (reason) => {
    notifyStatus();
    if (reason === "io server disconnect") reconnectWithFreshToken();
  });
  socket.on("connect_error", (error) => {
    notifyStatus();
    if (error?.message === "unauthorized") reconnectWithFreshToken();
  });

  return socket;
}

export function disconnectSocket() {
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
  notifyStatus();
}

export const getSocket = () => socket;

export const isSocketConnected = () => Boolean(socket?.connected);

export function subscribeSocketStatus(listener) {
  statusListeners.add(listener);
  return () => statusListeners.delete(listener);
}

/** Works before the socket exists; handlers survive reconnects. */
export function onSocketEvent(event, handler) {
  if (!eventHandlers.has(event)) eventHandlers.set(event, new Set());
  eventHandlers.get(event).add(handler);
  return () => eventHandlers.get(event)?.delete(handler);
}

export function emitWithAck(event, payload, timeoutMs = 5000) {
  if (!socket?.connected) {
    return Promise.resolve({ ok: false, message: "Socket is not connected" });
  }
  return socket
    .timeout(timeoutMs)
    .emitWithAck(event, payload)
    .catch(() => ({ ok: false, message: "Socket request timed out" }));
}

/**
 * Keeps the socket in a room across reconnects. Several callers may join the
 * same room; it is left only when the last one calls the returned function.
 */
export function joinRoom(joinEvent, leaveEvent, payload) {
  const key = `${joinEvent}:${JSON.stringify(payload)}`;
  const existing = activeRooms.get(key);

  if (existing) {
    existing.refs += 1;
  } else {
    activeRooms.set(key, { joinEvent, payload, refs: 1 });
    if (socket?.connected) socket.emit(joinEvent, payload);
  }

  let left = false;
  return () => {
    if (left) return;
    left = true;
    const entry = activeRooms.get(key);
    if (!entry) return;
    entry.refs -= 1;
    if (entry.refs > 0) return;
    activeRooms.delete(key);
    if (socket?.connected) socket.emit(leaveEvent, payload);
  };
}

export const joinGroupChat = (groupId) => joinRoom("chat:join", "chat:leave", { groupId });
