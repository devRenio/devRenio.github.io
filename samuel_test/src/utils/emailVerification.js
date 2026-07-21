import { sendEmailVerification } from "firebase/auth";
import { auth } from "../lib/firebase";

/** 인증 완료 후 돌아올 URL (GitHub Pages base path 포함) */
export function getEmailVerificationContinueUrl() {
  if (typeof window === "undefined") return undefined;
  const base = import.meta.env.BASE_URL ?? "/";
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  return `${window.location.origin}${normalizedBase}`;
}

export async function sendVerificationEmail(user) {
  const continueUrl = getEmailVerificationContinueUrl();
  const actionCodeSettings = continueUrl ? { url: continueUrl } : undefined;
  await sendEmailVerification(user, actionCodeSettings);
}

export function readResendCooldownMs(uid, cooldownMs) {
  if (!uid) return 0;
  try {
    const raw = localStorage.getItem(`samuel_verify_resend_${uid}`);
    if (!raw) return 0;
    const last = Number(raw);
    if (!Number.isFinite(last)) return 0;
    return Math.max(0, cooldownMs - (Date.now() - last));
  } catch {
    return 0;
  }
}

export function recordResendTime(uid) {
  if (!uid) return;
  try {
    localStorage.setItem(`samuel_verify_resend_${uid}`, String(Date.now()));
  } catch {
    /* ignore */
  }
}

export async function reloadAuthUser() {
  if (!auth?.currentUser) return null;
  await auth.currentUser.reload();
  return auth.currentUser;
}

/** Firestore Rules의 email_verified 클레임 반영을 위해 ID 토큰 갱신 */
export async function refreshAuthSession() {
  const user = await reloadAuthUser();
  if (!user) return null;
  await user.getIdToken(true);
  return user;
}
