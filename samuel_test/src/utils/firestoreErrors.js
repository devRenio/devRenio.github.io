export function formatSyncError(error, action = "save") {
  if (!error) {
    return action === "load"
      ? "불러오기에 실패했습니다."
      : "저장에 실패했습니다.";
  }

  const code = error.code ?? "";
  const message = error.message ?? "";

  if (message.includes("로그인")) return message;

  if (code === "permission-denied") {
    return action === "load"
      ? "불러오기 권한이 없습니다. 이메일 인증 후 ‘인증 확인’을 눌렀는지, Firestore 보안 규칙이 배포되었는지 확인해 주세요."
      : "저장 권한이 없습니다. 이메일 인증 후 ‘인증 확인’을 눌렀는지, Firestore 보안 규칙이 배포되었는지 확인해 주세요.";
  }

  if (code === "unavailable" || code === "auth/network-request-failed") {
    return "네트워크 오류입니다. 연결을 확인해 주세요.";
  }

  if (code === "failed-precondition" || message.includes("INVALID")) {
    return "저장 데이터 형식 오류입니다. 앱을 새로고침한 뒤 다시 시도해 주세요.";
  }

  return action === "load"
    ? "불러오기에 실패했습니다. 네트워크를 확인해 주세요."
    : "저장에 실패했습니다. 네트워크를 확인해 주세요.";
}
