/** 프로필·인증 입력 상한 */
export const PROFILE_NAME_MAX = 40;
export const PROFILE_CHURCH_MAX = 60;
export const EMAIL_MAX = 254;
export const PASSWORD_MIN = 6;
export const PASSWORD_MAX = 128;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email) {
  const trimmed = email.trim();
  return trimmed.length > 0 && trimmed.length <= EMAIL_MAX && EMAIL_PATTERN.test(trimmed);
}

export function sanitizeProfileText(value, maxLen) {
  return String(value ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLen);
}

export function validatePassword(password) {
  if (password.length < PASSWORD_MIN) {
    return "비밀번호는 6자 이상이어야 합니다.";
  }
  if (password.length > PASSWORD_MAX) {
    return "비밀번호가 너무 깁니다.";
  }
  return null;
}
