import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["symbol.png", "fonts/*.TTF"],
      manifest: {
        name: "사무엘학교 암송",
        short_name: "사무엘 암송",
        description: "사무엘학교 성경 암송 프로그램",
        theme_color: "#ffffff",
        background_color: "#ffffff",
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
