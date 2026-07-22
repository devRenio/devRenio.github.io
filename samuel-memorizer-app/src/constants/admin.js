/** VITE_ADMIN_USERIDS=eunho715,otherid (쉼표 구분) */
export function getAdminUserids() {
  const raw = import.meta.env.VITE_ADMIN_USERIDS ?? "";
  return raw
    .split(",")
    .map((id) => id.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminUser(user) {
  const userid = user?.userid?.trim().toLowerCase();
  if (!userid) return false;

  const admins = getAdminUserids();
  if (admins.length === 0) return false;

  return admins.includes(userid);
}
