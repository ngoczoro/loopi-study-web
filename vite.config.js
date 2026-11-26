import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const BACKEND_URL = "http://localhost:5000";
// The backend's CORS list includes the normal dev origin; proxied requests use it too.
const DEV_ORIGIN = "http://localhost:5173";

/**
 * Forwards API, Socket.IO and media requests to the local backend, so the whole app
 * works from one public URL (e.g. a Cloudflare tunnel to test calls from a phone).
 */
const toBackend = (extra = {}) => ({
  target: BACKEND_URL,
  changeOrigin: true,
  configure: (proxy) => {
    proxy.on("proxyReq", (proxyReq) => proxyReq.setHeader("origin", DEV_ORIGIN));
    proxy.on("proxyReqWs", (proxyReq) => proxyReq.setHeader("origin", DEV_ORIGIN));
  },
  ...extra,
});

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    // Quick tunnels get a random *.trycloudflare.com host.
    allowedHosts: [".trycloudflare.com"],
    proxy: {
      "/api": toBackend(),
      "/socket.io": toBackend({ ws: true }),
      "/media": toBackend(),
    },
  },
});
