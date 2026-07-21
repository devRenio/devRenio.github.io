import { formatCooldownRemaining } from "../utils/syncCooldown";
import { VERIFY_EMAIL_SPAM_HINT } from "../constants/auth";

function formatCloudSavedAt(iso) {
  if (!iso) return "저장 기록 없음";
  try {
    return new Date(iso).toLocaleString("ko-KR", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function saveButtonLabel({ syncBusy, saveCooldownMs }) {
  if (syncBusy) return "처리 중…";
  if (saveCooldownMs > 0) return "저장 대기 중";
  return "저장하기";
}

export default function AccountModal({
  isLoggedIn,
  emailVerified,
  userEmail,
  userDisplayName,
  userChurch,
  firebaseEnabled,
  cloudSavedAt,
  syncBusy,
  syncError,
  syncLastAction,
  saveCooldownMs,
  loadCooldownMs,
  verificationMessage,
  resendCooldownMs,
  verifyBusy,
  isAdmin,
  onOpenAdmin,
  onSaveProgress,
  onLoadProgress,
  onClearSyncFeedback,
  onResendVerification,
  onRefreshVerification,
  onClearVerificationMessage,
  onOpenLogin,
  onOpenSignup,
  onLogout,
  onOpenWithdraw,
  onClose,
}) {
  const syncDisabled = !emailVerified;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content account-modal" onClick={(e) => e.stopPropagation()}>
        <h3>계정</h3>

        {isLoggedIn ? (
          <div className="info-account-card">
            <div className="info-account-profile">
              <span className="info-account-avatar" aria-hidden="true">
                {(userDisplayName || userEmail || "?").charAt(0).toUpperCase()}
              </span>
              <div className="info-account-identity">
                <strong className="info-account-name">
                  {userDisplayName || "사용자"}
                </strong>
                {userEmail && (
                  <span className="info-account-email">{userEmail}</span>
                )}
              </div>
            </div>

            {userChurch && (
              <div className="info-account-meta">
                <span className="info-account-meta-label">교회</span>
                <span className="info-account-meta-value">{userChurch}</span>
              </div>
            )}

            {!emailVerified && (
              <div className="auth-verify-banner">
                <p className="auth-verify-banner-title">이메일 인증 필요</p>
                <p className="auth-verify-banner-desc">
                  클라우드 저장·불러오기는 이메일 인증 후 이용할 수 있습니다.
                  {userEmail && (
                    <>
                      <br />
                      <strong>{userEmail}</strong>
                    </>
                  )}
                </p>
                <p className="auth-verify-spam-notice">{VERIFY_EMAIL_SPAM_HINT}</p>
                {verificationMessage && (
                  <p className="auth-verify-message">{verificationMessage}</p>
                )}
                <div className="auth-verify-actions">
                  <button
                    type="button"
                    className="info-sync-btn info-sync-btn--save"
                    onClick={() => {
                      onClearVerificationMessage?.();
                      onRefreshVerification?.();
                    }}
                    disabled={verifyBusy}
                  >
                    {verifyBusy ? "확인 중…" : "인증 확인"}
                  </button>
                  <button
                    type="button"
                    className="info-sync-btn info-sync-btn--load"
                    onClick={() => {
                      onClearVerificationMessage?.();
                      onResendVerification?.();
                    }}
                    disabled={verifyBusy || resendCooldownMs > 0}
                  >
                    {resendCooldownMs > 0
                      ? `${formatCooldownRemaining(resendCooldownMs)} 후`
                      : "메일 재발송"}
                  </button>
                </div>
              </div>
            )}

            <div className="info-sync-section">
              <p className="info-sync-label">클라우드 진행</p>
              <p className="info-sync-desc">
                완료 구절·통계·과정 선택을 저장해 다른 기기에서 이어 할 수
                있습니다. 저장은 5분에 한 번만 가능합니다.
                {!emailVerified && " (이메일 인증 후 이용)"}
              </p>
              <p className="info-sync-meta">
                마지막 저장: {formatCloudSavedAt(cloudSavedAt)}
              </p>
              {saveCooldownMs > 0 && (
                <p className="info-sync-meta">
                  다음 저장까지 {formatCooldownRemaining(saveCooldownMs)}
                </p>
              )}
              {syncError && (
                <p className="info-sync-feedback info-sync-feedback--error">
                  {syncError}
                </p>
              )}
              {!syncError && syncLastAction === "saved" && (
                <p className="info-sync-feedback info-sync-feedback--ok">
                  클라우드에 저장했습니다.
                </p>
              )}
              {!syncError && syncLastAction === "loaded" && (
                <p className="info-sync-feedback info-sync-feedback--ok">
                  클라우드에서 불러왔습니다.
                </p>
              )}
              <div className="info-sync-actions">
                <button
                  type="button"
                  className="info-sync-btn info-sync-btn--save"
                  onClick={() => {
                    onClearSyncFeedback?.();
                    onSaveProgress?.();
                  }}
                  disabled={syncBusy || saveCooldownMs > 0 || syncDisabled}
                >
                  {saveButtonLabel({ syncBusy, saveCooldownMs })}
                </button>
                <button
                  type="button"
                  className="info-sync-btn info-sync-btn--load"
                  onClick={() => {
                    onClearSyncFeedback?.();
                    onLoadProgress?.();
                  }}
                  disabled={syncBusy || loadCooldownMs > 0 || syncDisabled}
                >
                  {loadCooldownMs > 0
                    ? `${formatCooldownRemaining(loadCooldownMs)} 후`
                    : "불러오기"}
                </button>
              </div>
            </div>

            {isAdmin && (
              <button
                type="button"
                className="info-link-btn info-admin-btn"
                onClick={onOpenAdmin}
              >
                관리자 콘솔
              </button>
            )}

            <div className="info-account-btns">
              <button
                type="button"
                className="info-logout-btn"
                onClick={onLogout}
              >
                로그아웃
              </button>
              <button
                type="button"
                className="info-withdraw-btn"
                onClick={onOpenWithdraw}
              >
                탈퇴
              </button>
            </div>
          </div>
        ) : (
          <div className="info-account-card info-account-card--guest">
            <p className="info-account-label">게스트 모드</p>
            <p className="info-account-guest-desc">
              진행 데이터는 이 기기·브라우저에만 저장됩니다. 로그인하면
              클라우드에 진행을 저장할 수 있습니다.
            </p>
            <div className="info-account-actions">
              <button
                type="button"
                className="info-auth-btn"
                onClick={onOpenLogin}
                disabled={!firebaseEnabled}
              >
                로그인
              </button>
              <button
                type="button"
                className="info-auth-btn info-auth-btn--signup"
                onClick={onOpenSignup}
                disabled={!firebaseEnabled}
              >
                회원가입
              </button>
            </div>
            {!firebaseEnabled && (
              <p className="info-account-guest-desc">
                Firebase 설정 후 이용할 수 있습니다.
              </p>
            )}
          </div>
        )}

        <button
          type="button"
          className="full-width-btn"
          style={{ marginBottom: 0, marginTop: "12px" }}
          onClick={onClose}
        >
          닫기
        </button>
      </div>
    </div>
  );
}
