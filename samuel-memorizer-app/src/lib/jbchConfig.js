/** 클라이언트는 BFF만 호출 — tokenId/dev_name은 서버(worker) env에만 둡니다. */

export function getJbchBffBase() {
  // dev: .env에 VITE_JBCH_BFF_URL이 있어도 Vite BFF(/api/jbch) 사용 (CORS 회피)
  if (import.meta.env.DEV) return "/api/jbch";

  const explicit = import.meta.env.VITE_JBCH_BFF_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");
  return "";
}

export function isJbchConfigured() {
  return Boolean(getJbchBffBase());
}

export { MESSAGE_SUBJECT_PREFIX } from "../constants/appInfo";
