import { loadEnv } from "vite";
import { Buffer } from "node:buffer";
import { handleBffRequest } from "./server/jbchBffCore.js";

const BFF_PREFIX = "/api/jbch";

function buildAllowOrigins(env) {
  const raw = env.JBCH_CORS_ORIGINS ?? "";
  const fromEnv = raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (fromEnv.length > 0) return fromEnv;
  return ["http://localhost:5173", "http://127.0.0.1:5173"];
}

export function jbchBffPlugin() {
  return {
    name: "jbch-bff",
    configureServer(server) {
      const env = loadEnv(server.config.mode, server.config.envDir, "");
      const allowOrigins = buildAllowOrigins(env);

      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith(BFF_PREFIX)) {
          next();
          return;
        }

        const host = req.headers.host ?? "localhost";
        const url = new URL(req.url, `http://${host}`);
        const headers = new Headers();

        for (const [key, value] of Object.entries(req.headers)) {
          if (value != null) headers.set(key, String(value));
        }

        const init = {
          method: req.method,
          headers,
        };

        if (req.method !== "GET" && req.method !== "HEAD") {
          const chunks = [];
          for await (const chunk of req) chunks.push(chunk);
          if (chunks.length > 0) {
            init.body = Buffer.concat(chunks);
          }
        }

        const request = new Request(url, init);
        const response = await handleBffRequest(request, env, {
          allowOrigins,
          secure: false,
        });

        res.statusCode = response.status;
        response.headers.forEach((value, key) => {
          if (key.toLowerCase() === "set-cookie") {
            res.appendHeader(key, value);
          } else {
            res.setHeader(key, value);
          }
        });

        const body = await response.text();
        res.end(body);
      });
    },
  };
}
