const MESSAGES = {
  "auth/invalid-email": "올바른 이메일 주소를 입력하세요.",
  "auth/user-disabled": "비활성화된 계정입니다.",
  "auth/user-not-found": "이메일 또는 비밀번호가 올바르지 않습니다.",
  "auth/wrong-password": "이메일 또는 비밀번호가 올바르지 않습니다.",
  "auth/invalid-credential": "이메일 또는 비밀번호가 올바르지 않습니다.",
  "auth/email-already-in-use":
    "회원가입할 수 없습니다. 입력 정보를 확인하거나 로그인해 보세요.",
  "auth/weak-password": "비밀번호는 6자 이상이어야 합니다.",
  "auth/too-many-requests": "요청이 너무 많습니다. 잠시 후 다시 시도하세요.",
  "auth/network-request-failed": "네트워크 오류입니다. 연결을 확인하세요.",
  "auth/operation-not-allowed": "이 로그인 방식이 활성화되지 않았습니다.",
  "auth/requires-recent-login": "보안을 위해 다시 로그인한 뒤 탈퇴해 주세요.",
};

export function formatAuthError(error) {
  if (!error) return "알 수 없는 오류가 발생했습니다.";
  return MESSAGES[error.code] ?? error.message ?? "알 수 없는 오류가 발생했습니다.";
}
