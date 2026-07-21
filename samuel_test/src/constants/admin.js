/** VITE_ADMIN_EMAILS=email1@example.com,email2@example.com (firestore.rules isAdmin 목록과 동기화) */
export function getAdminEmails() {
  const raw = import.meta.env.VITE_ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminUser(user) {
  if (!user?.email || !user.emailVerified) return false;
  const admins = getAdminEmails();
  if (admins.length === 0) return false;
  return admins.includes(user.email.trim().toLowerCase());
}
