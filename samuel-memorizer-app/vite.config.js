import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { jbchBffPlugin } from "./vite-plugin-jbch-bff.js";

export default defineConfig({
  plugins: [react(), jbchBffPlugin(), VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["symbol.png", "fonts/*.TTF"],
      manifest: {
        name: "Samuel Memorizer",
        short_name: "Samuel Memo",
        description: "Samuel Memorizer — Bible verse memorization for Samuel School",
        theme_color: "#eef0f3",
        background_color: "#eef0f3",
        display: "standalone",
        start_url: "/samuel/",
        scope: "/samuel/",
        lang: "ko",
        icons: [
          {
            src: "symbol.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "symbol.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,json,png}"],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes("/fonts/"),
            handler: "CacheFirst",
            options: {
              cacheName: "samuel-fonts",
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.includes("/data/"),
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "samuel-data",
            },
          },
        ],
      },
    }),
  ],
  base: "/samuel/",
});
