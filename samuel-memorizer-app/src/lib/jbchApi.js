import { getJbchBffBase, isJbchConfigured } from "./jbchConfig";
import { getJbchDeviceLabel } from "../utils/jbchDevice";
import { mapJbchMemberProfile } from "../utils/memberProfile";

export { mapJbchMemberProfile } from "../utils/memberProfile";

async function parseClientResponse(res) {
  const data = await res.json().catch(() => null);
  if (!data) {
    throw new Error("서버 응답을 해석할 수 없습니다.");
  }
  if (!res.ok) {
    throw new Error(data.error || `요청 실패 (${res.status})`);
  }
  return data;
}

async function bffFetch(path, options = {}) {
  if (!isJbchConfigured()) {
    throw new Error("깨사모 API(BFF) 설정이 없습니다.");
  }

  const url = `${getJbchBffBase()}${path}`;
  let res;
  try {
    res = await fetch(url, {
      credentials: "include",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers ?? {}),
      },
    });
  } catch (err) {
    if (err?.name === "TypeError") {
      throw new Error(
        "네트워크 오류입니다. BFF URL·CORS 설정을 확인하세요.",
      );
    }
    throw err;
  }

  return parseClientResponse(res);
}

export function mapJbchUser(profile) {
  if (!profile) return null;

  return {
    uid: profile.mid || profile.userid,
    email: profile.email,
    displayName: profile.name,
    userid: profile.userid,
  };
}

export async function jbchLogin(userid, password) {
  await bffFetch("/login", {
    method: "POST",
    body: JSON.stringify({
      Userid: userid.trim(),
      password,
      device: getJbchDeviceLabel(),
    }),
  });
}

export async function jbchLogout() {
  try {
    await bffFetch("/logout", { method: "POST", body: "{}" });
  } catch {
    /* 세션 쿠키는 BFF가 삭제 */
  }
}

export async function jbchFetchMember() {
  const data = await bffFetch("/member", { method: "GET" });
  const profile = mapJbchMemberProfile(data.result);
  if (!profile) {
    throw new Error("회원 정보를 불러오지 못했습니다.");
  }
  return profile;
}

export async function jbchCheckSession() {
  if (!isJbchConfigured()) return false;
  try {
    const data = await bffFetch("/session", { method: "GET" });
    return Boolean(data.loggedIn);
  } catch {
    return false;
  }
}

export async function jbchSendMessage({ subject, content }) {
  const trimmedSubject = String(subject ?? "").trim();
  const trimmedContent = String(content ?? "").trim();

  if (!trimmedSubject) throw new Error("제목을 입력하세요.");
  if (!trimmedContent) throw new Error("내용을 입력하세요.");

  await bffFetch("/message", {
    method: "POST",
    body: JSON.stringify({ subject: trimmedSubject, content: trimmedContent }),
  });
}
