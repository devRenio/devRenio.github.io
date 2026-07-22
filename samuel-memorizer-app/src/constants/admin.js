/** 관리자 여부 — BFF /member 응답의 isAdmin (서버 env JBCH_ADMIN_USERIDS) */
export function isAdminUser(user) {
  return Boolean(user?.isAdmin);
}
