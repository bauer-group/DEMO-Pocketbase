import { defineConfig, loadEnv } from "vite";
import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// ----------------------------------------------------------------------------
// Vite-Konfiguration
//
// - React + Fast-Refresh via @vitejs/plugin-react
// - TailwindCSS v4 via @tailwindcss/vite (kein PostCSS-/Config-File nötig)
// - PWA: Service Worker + Web-App-Manifest via vite-plugin-pwa
// - Dev-Proxy: /api und /_/ werden zum PocketBase-Container weitergeleitet,
//   damit das Frontend im Dev-Modus exakt unter derselben Origin läuft wie
//   im späteren Production-Setup (kein CORS-Sonderpfad nötig).
// ----------------------------------------------------------------------------

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const pbTarget = env.VITE_PB_PROXY_TARGET || "http://localhost:8090";

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.svg", "robots.txt"],
        devOptions: {
          enabled: false, // SW im Dev aus -> kein Cache-Frust beim Entwickeln
        },
        workbox: {
          navigateFallbackDenylist: [/^\/api/, /^\/_\//],
          runtimeCaching: [
            {
              urlPattern: /^\/api\/files\/.*$/,
              handler: "CacheFirst",
              options: {
                cacheName: "pb-files",
                expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              },
            },
          ],
        },
        manifest: {
          name: "PocketBase Collab Workspace",
          short_name: "Collab",
          description:
            "Kollaborativer Workspace – Demo für PocketBase, Vite, React & PWA",
          theme_color: "#6366f1",
          background_color: "#0f172a",
          display: "standalone",
          start_url: "/",
          scope: "/",
          icons: [
            { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
            { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
            {
              src: "pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
      }),
    ],

    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },

    server: {
      host: "0.0.0.0",
      port: 5173,
      proxy: {
        "/api": { target: pbTarget, changeOrigin: true, ws: true },
        "/_": { target: pbTarget, changeOrigin: true },
      },
    },

    preview: { host: "0.0.0.0", port: 4173 },

    build: { target: "es2022", sourcemap: true, outDir: "dist" },
  };
});
