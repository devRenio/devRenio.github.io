import { handleBffRequest } from "../server/jbchBffCore.js";

function parseAllowOrigins(value) {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/jbch")) {
      return new Response("Not found", { status: 404 });
    }

    return handleBffRequest(request, env, {
      allowOrigins: parseAllowOrigins(env.JBCH_CORS_ORIGINS),
      secure: true,
    });
  },
};
