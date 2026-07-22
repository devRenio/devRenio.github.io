/** 클라이언트는 BFF만 호출 — tokenId/dev_name은 서버(worker) env에만 둡니다. */

export function getJbchBffBase() {
  const explicit = import.meta.env.VITE_JBCH_BFF_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");
  if (import.meta.env.DEV) return "/api/jbch";
  return "";
}

export function isJbchConfigured() {
  return Boolean(getJbchBffBase());
}

export const MESSAGE_SUBJECT_PREFIX = "[Samuel Memorizer] ";

export function getContactRecipientLabel() {
  return (
    import.meta.env.VITE_JBCH_SUPPORT_LABEL?.trim() || "서울양천 공은호 형제"
  );
}

export function isContactConfigured() {
  return isJbchConfigured();
}
