import {
  getProfileStore,
  upsertMemberFromJbchResult,
} from "./memberProfileStore.js";

const JBCH_API_BASE = "https://api.jbch.org";
export const SESSION_COOKIE = "samuel_jbch_hash_v2";
/** HttpOnly 세션 쿠키 유지 기간 (14일) */
export const SESSION_MAX_AGE_SECONDS = 14 * 24 * 60 * 60;

const LOGIN_ERRORS = {
  "아이디나 비번값이 없습니다.": "아이디와 비밀번호를 입력하세요.",
  "디바이스 아이디가 없습니다.": "기기 정보를 확인할 수 없습니다.",
  "해당 정보의 사용자 계정을 찾지 못했습니다.":
    "아이디 또는 비밀번호가 올바르지 않습니다.",
};

export function readEnv(env) {
  const devName = String(env.JBCH_DEV_NAME ?? "").trim();
  const tokenId = String(env.JBCH_TOKEN_ID ?? "").trim();
  if (!devName || !tokenId) {
    throw new Error("JBCH_DEV_NAME / JBCH_TOKEN_ID가 설정되지 않았습니다.");
  }
  return { devName, tokenId };
}

export function parseAdminUserids(env) {
  return String(env.JBCH_ADMIN_USERIDS ?? "")
    .split(",")
    .map((id) => id.trim().toLowerCase())
    .filter(Boolean);
}

async function parseJsonResponse(res) {
  const text = await res.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    if (text.includes("@@")) {
      const parts = text.split("@@");
      return {
        status: parts[0] ?? "status",
        result: parts[1] ?? "",
        hash: parts[2] ?? "",
      };
    }
    throw new Error("서버 응답을 해석할 수 없습니다.");
  }
}

export async function jbchPost(env, path, payload) {
  const { devName, tokenId } = readEnv(env);

  const res = await fetch(`${JBCH_API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      dev_name: devName,
      tokenId,
      output: "1",
      ...payload,
    }),
  });

  const data = await parseJsonResponse(res);
  if (!res.ok && !data) {
    throw new Error(`jbch upstream ${res.status}`);
  }
  return data;
}

export function formatLoginError(data) {
  if (!data) return "로그인에 실패했습니다.";
  if (data.result === "Not_certification!" || data.status === "error") {
    return "API 토큰 인증에 실패했습니다.";
  }
  const comment = String(data.comment ?? "").trim();
  if (comment) {
    for (const [key, message] of Object.entries(LOGIN_ERRORS)) {
      if (comment.includes(key)) return message;
    }
    return comment;
  }
  if (data.result === "error") {
    return "아이디 또는 비밀번호가 올바르지 않습니다.";
  }
  return "로그인에 실패했습니다.";
}

export function formatApiError(data, fallback) {
  if (!data) return fallback;
  if (data.result === "Not_certification!" || data.status === "error") {
    if (typeof data.result === "string" && data.result !== "error") {
      return data.result;
    }
    return "API 인증에 실패했습니다.";
  }
  if (typeof data.result === "string" && data.result !== "ok") {
    return data.result;
  }
  if (data.status === "not") {
    return "요청한 정보를 찾을 수 없습니다.";
  }
  return fallback;
}

function encodeMessageField(value) {
  return encodeURIComponent(String(value ?? "").trim());
}

export function buildSessionCookie(hash, { secure }) {
  const parts = [
    `${SESSION_COOKIE}=${encodeURIComponent(hash)}`,
    "Path=/",
    "HttpOnly",
    secure ? "SameSite=None" : "SameSite=Lax",
  ];
  if (secure) parts.push("Secure");
  parts.push(`Max-Age=${SESSION_MAX_AGE_SECONDS}`);
  return parts.join("; ");
}

export function clearSessionCookie({ secure }) {
  const parts = [
    `${SESSION_COOKIE}=`,
    "Path=/",
    "HttpOnly",
    secure ? "SameSite=None" : "SameSite=Lax",
    "Max-Age=0",
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function readSessionHash(cookieHeader) {
  if (!cookieHeader) return "";
  const match = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`),
  );
  if (!match) return "";
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

export async function handleLogin(env, body, cookieOptions) {
  const userid = String(body?.Userid ?? body?.userid ?? "").trim();
  const password = String(body?.password ?? "");
  const device = String(body?.device ?? "Web").trim() || "Web";

  if (!userid || !password) {
    return jsonResponse({ error: "아이디와 비밀번호를 입력하세요." }, 400);
  }

  const data = await jbchPost(env, "/in/login.php", {
    Userid: userid,
    password,
    device,
  });

  if (data?.result === "ok" && data.hash) {
    const hash = String(data.hash);
    return jsonResponse(
      { ok: true },
      200,
      { "Set-Cookie": buildSessionCookie(hash, cookieOptions) },
    );
  }

  return jsonResponse({ error: formatLoginError(data) }, 401);
}

export async function handleLogout(env, hash, cookieOptions) {
  if (hash) {
    try {
      await jbchPost(env, "/in/logout.php", { hash });
    } catch {
      /* ignore */
    }
  }
  return jsonResponse(
    { ok: true },
    200,
    { "Set-Cookie": clearSessionCookie(cookieOptions) },
  );
}

export async function handleMember(env, hash, profileStore) {
  if (!hash) {
    return jsonResponse({ error: "로그인이 필요합니다." }, 401);
  }

  const data = await jbchPost(env, "/in/member_json.php", { hash });
  if (data?.status === "ok" && data.result) {
    const userid = String(data.result?.userid ?? "").trim().toLowerCase();
    const isAdmin = parseAdminUserids(env).includes(userid);
    const hasConsent = await profileStore.hasConsent(userid);
    if (hasConsent) {
      try {
        await upsertMemberFromJbchResult(data.result, profileStore);
      } catch {
        /* ignore */
      }
    }
    return jsonResponse({
      ok: true,
      result: data.result,
      isAdmin,
      needsConsent: !hasConsent,
    });
  }
  return jsonResponse(
    { error: formatApiError(data, "회원 정보를 불러오지 못했습니다.") },
    401,
  );
}

async function requireAdmin(env, hash) {
  if (!hash) {
    return { error: jsonResponse({ error: "로그인이 필요합니다." }, 401) };
  }

  const data = await jbchPost(env, "/in/member_json.php", { hash });
  if (data?.status !== "ok" || !data.result) {
    return {
      error: jsonResponse(
        { error: formatApiError(data, "회원 정보를 불러오지 못했습니다.") },
        401,
      ),
    };
  }

  const userid = String(data.result?.userid ?? "").trim().toLowerCase();
  if (!parseAdminUserids(env).includes(userid)) {
    return { error: jsonResponse({ error: "권한이 없습니다." }, 403) };
  }

  return { ok: true };
}

export async function handleConsent(env, hash, profileStore) {
  if (!hash) {
    return jsonResponse({ error: "로그인이 필요합니다." }, 401);
  }

  const data = await jbchPost(env, "/in/member_json.php", { hash });
  if (data?.status !== "ok" || !data.result) {
    return jsonResponse(
      { error: formatApiError(data, "회원 정보를 불러오지 못했습니다.") },
      401,
    );
  }

  const userid = String(data.result?.userid ?? "").trim().toLowerCase();
  if (!userid) {
    return jsonResponse({ error: "회원 정보를 확인할 수 없습니다." }, 400);
  }

  await profileStore.recordConsent(userid);
  await upsertMemberFromJbchResult(data.result, profileStore);

  return jsonResponse({ ok: true, needsConsent: false });
}

export async function handleAdminMembers(env, hash, profileStore) {
  const auth = await requireAdmin(env, hash);
  if (auth.error) return auth.error;

  const members = await profileStore.listAll();
  return jsonResponse({ ok: true, members });
}

export async function handleMessage(env, hash, body, supportUserId) {
  if (!hash) {
    return jsonResponse({ error: "로그인이 필요합니다." }, 401);
  }
  if (!supportUserId) {
    return jsonResponse({ error: "문의 수신자 설정이 없습니다." }, 500);
  }

  const subject = String(body?.subject ?? "").trim();
  const content = String(body?.content ?? "").trim();
  const prefix = "[Samuel Memorizer] ";

  if (!subject) return jsonResponse({ error: "제목을 입력하세요." }, 400);
  if (!content) return jsonResponse({ error: "내용을 입력하세요." }, 400);

  const prefixedSubject = subject.startsWith(prefix.trim())
    ? subject
    : `${prefix}${subject}`;

  if (prefixedSubject.length > 120) {
    return jsonResponse({ error: "제목이 너무 깁니다." }, 400);
  }

  const data = await jbchPost(env, "/in/send_message_json2.php", {
    hash,
    toIds: supportUserId,
    subject: encodeMessageField(prefixedSubject),
    content: encodeMessageField(content),
  });

  if (data?.status === "ok") {
    return jsonResponse({ ok: true, result: data.result ?? null });
  }

  return jsonResponse(
    { error: formatApiError(data, "쪽지를 보내지 못했습니다.") },
    400,
  );
}

export function jsonResponse(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...extraHeaders,
    },
  });
}

export function corsHeaders(origin, allowOrigins) {
  const allowed = allowOrigins.length > 0 ? allowOrigins : [origin];
  const match =
    origin && allowed.some((item) => item === origin || item === "*")
      ? origin
      : allowed[0] ?? "";

  if (!match) return {};

  return {
    "Access-Control-Allow-Origin": match,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

export async function handleBffRequest(request, env, options = {}) {
  const url = new URL(request.url);
  const pathname = url.pathname.replace(/\/+$/, "") || "/";
  const origin = request.headers.get("Origin") ?? "";
  const allowOrigins = options.allowOrigins ?? [];
  const cors = corsHeaders(origin, allowOrigins);
  const cookieOptions = { secure: options.secure !== false };
  const supportUserId = String(env.JBCH_SUPPORT_USERID ?? "").trim();
  const profileStore = options.profileStore ?? getProfileStore(env);

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  try {
    let response;

    if (pathname.endsWith("/login") && request.method === "POST") {
      const body = await request.json();
      response = await handleLogin(env, body, cookieOptions);
    } else if (pathname.endsWith("/logout") && request.method === "POST") {
      const hash = readSessionHash(request.headers.get("Cookie"));
      response = await handleLogout(env, hash, cookieOptions);
    } else if (pathname.endsWith("/member") && request.method === "GET") {
      const hash = readSessionHash(request.headers.get("Cookie"));
      response = await handleMember(env, hash, profileStore);
    } else if (pathname.endsWith("/message") && request.method === "POST") {
      const hash = readSessionHash(request.headers.get("Cookie"));
      const body = await request.json();
      response = await handleMessage(env, hash, body, supportUserId);
    } else if (pathname.endsWith("/session") && request.method === "GET") {
      const hash = readSessionHash(request.headers.get("Cookie"));
      response = jsonResponse({ loggedIn: Boolean(hash) });
    } else if (
      pathname.endsWith("/admin/members") &&
      request.method === "GET"
    ) {
      const hash = readSessionHash(request.headers.get("Cookie"));
      response = await handleAdminMembers(env, hash, profileStore);
    } else if (pathname.endsWith("/consent") && request.method === "POST") {
      const hash = readSessionHash(request.headers.get("Cookie"));
      response = await handleConsent(env, hash, profileStore);
    } else {
      response = jsonResponse({ error: "Not found" }, 404);
    }

    for (const [key, value] of Object.entries(cors)) {
      response.headers.set(key, value);
    }
    return response;
  } catch (err) {
    const response = jsonResponse(
      { error: err.message || "서버 오류" },
      500,
    );
    for (const [key, value] of Object.entries(cors)) {
      response.headers.set(key, value);
    }
    return response;
  }
}
