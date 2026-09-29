const configuredApiUrl = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  ""
)
  .trim()
  .replace(/\/$/, "");

const isProduction = process.env.NODE_ENV === "production";
const isLocalApi = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(?:\/.*)?$/i.test(
  configuredApiUrl
);

// Production is intentionally pinned to the new investment backend.
// This prevents an old/local NEXT_PUBLIC_* value from being baked into a production build.
const PRODUCTION_API_URL = "https://currentbackend.onrender.com";

export const API_BASE_URL =
  isProduction
    ? (!configuredApiUrl || isLocalApi ? PRODUCTION_API_URL : configuredApiUrl)
    : (configuredApiUrl || "http://localhost:5000");


import { io, Socket } from "socket.io-client";

let sharedSocket: Socket | null = null;
let sharedSocketUserId: string | null = null;

export const getSharedSocket = (userId: string) => {
  const normalized = String(userId || "");
  if (!normalized) return null;
  if (sharedSocket && sharedSocketUserId === normalized && (sharedSocket.connected || sharedSocket.active)) {
    return sharedSocket;
  }
  if (sharedSocket) sharedSocket.disconnect();
  sharedSocket = io(API_BASE_URL.replace(/\\/api\\/?$/, ""), { transports: ["websocket", "polling"] });
  sharedSocketUserId = normalized;
  const setup = () => sharedSocket?.emit("setup", { id: normalized });
  sharedSocket.on("connect", setup);
  if (sharedSocket.connected) setup();
  return sharedSocket;
};

export const disconnectSharedSocket = () => {
  sharedSocket?.disconnect();
  sharedSocket = null;
  sharedSocketUserId = null;
};
