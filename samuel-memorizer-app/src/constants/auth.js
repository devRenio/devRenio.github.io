/** localStorage: 'guest' | 없음(로그인 세션) */
export const AUTH_CHOICE_KEY = "samuel_auth_choice";

/** 인증 메일 재발송 최소 간격 (1분) */
export const RESEND_VERIFICATION_COOLDOWN_MS = 60 * 1000;

/** Firebase 기본 발송 메일은 스팸함으로 분류될 수 있음 — UI 안내용 */
export const VERIFY_EMAIL_SPAM_HINT =
  "인증 메일이 스팸함·프로모션함·정크함으로 들어갈 수 있습니다. 받은편지함에 없으면 꼭 확인해 주세요.";

export const VERIFY_EMAIL_NEXT_STEP =
  "메일의 인증 링크를 누른 뒤, 아래 ‘인증 확인’을 눌러 주세요.";

export function verifyResendStorageKey(uid) {
  return `samuel_verify_resend_${uid}`;
}

