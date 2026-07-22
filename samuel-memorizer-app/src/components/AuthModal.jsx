import { useState } from "react";
import {
  EMAIL_MAX,
  PASSWORD_MAX,
  PROFILE_CHURCH_MAX,
  PROFILE_NAME_MAX,
} from "../utils/authValidation";
import { formatCooldownRemaining } from "../utils/syncCooldown";
import { VERIFY_EMAIL_NEXT_STEP, VERIFY_EMAIL_SPAM_HINT } from "../constants/auth";

export default function AuthModal({
  view,
  onViewChange,
  variant = "welcome",
  firebaseEnabled,
  busy,
  error,
  verificationMessage,
  pendingVerifyEmail,
  resendCooldownMs,
  onLogin,
  onSignup,
  onResendVerification,
  onRefreshVerification,
  onClose,
  onClearError,
  onOpenPrivacy,
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [name, setName] = useState("");
  const [church, setChurch] = useState("");
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [localError, setLocalError] = useState("");

  const isWelcome = variant === "welcome";
  const isVerifyView = view === "verify";

  const switchView = (next) => {
    onViewChange(next);
    setLocalError("");
    onClearError?.();
    setPassword("");
    setPasswordConfirm("");
    if (next !== "signup") setPrivacyAgreed(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");
    onClearError?.();

    if (!email.trim()) {
      setLocalError("이메일을 입력하세요.");
      return;
    }
    if (password.length < 6) {
      setLocalError("비밀번호는 6자 이상이어야 합니다.");
      return;
    }

    if (view === "signup") {
      if (!name.trim()) {
        setLocalError("이름을 입력하세요.");
        return;
      }
      if (!church.trim()) {
        setLocalError("교회명을 입력하세요.");
        return;
      }
      if (password !== passwordConfirm) {
        setLocalError("비밀번호 확인이 일치하지 않습니다.");
        return;
      }
      if (!privacyAgreed) {
        setLocalError("개인정보 처리 안내에 동의해 주세요.");
        return;
      }
      await onSignup(email, password, name, church);
      return;
    }

    await onLogin(email, password);
  };

  const displayError = localError || error;
  const verifyEmail = pendingVerifyEmail || email;

  return (
    <div
      className="modal-overlay auth-overlay"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className={`modal-content auth-modal${view === "signup" ? " auth-modal--signup" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="auth-modal-title">Samuel Memorizer</h3>

        {isVerifyView ? (
          <div className="auth-verify-panel">
            <p className="auth-modal-sub">
              <strong>이메일 인증</strong>
            </p>
            <p className="auth-verify-desc">
              {verifyEmail ? (
                <>
                  <strong>{verifyEmail}</strong>
                  (으)로 인증 메일을 보냈습니다.
                </>
              ) : (
                "인증 메일을 보냈습니다."
              )}
              <br />
              {VERIFY_EMAIL_NEXT_STEP}
            </p>
            <p className="auth-verify-spam-notice">{VERIFY_EMAIL_SPAM_HINT}</p>
            {verificationMessage && (
              <p className="auth-verify-message">{verificationMessage}</p>
            )}
            {displayError && <p className="auth-error">{displayError}</p>}
            <button
              type="button"
              className="full-width-btn auth-submit"
              onClick={onRefreshVerification}
              disabled={busy || !firebaseEnabled}
            >
              {busy ? "확인 중…" : "인증 확인"}
            </button>
            <button
              type="button"
              className="full-width-btn auth-verify-resend"
              onClick={onResendVerification}
              disabled={busy || !firebaseEnabled || resendCooldownMs > 0}
            >
              {resendCooldownMs > 0
                ? `${formatCooldownRemaining(resendCooldownMs)} 후 재발송`
                : "인증 메일 다시 보내기"}
            </button>
          </div>
        ) : (
          <>
            <p className="auth-modal-sub">
              {isWelcome
                ? "로그인하거나 회원가입할 수 있습니다. 닫으면 게스트로 이용합니다."
                : "계정으로 로그인하거나 새로 가입하세요."}
            </p>

            {!firebaseEnabled && (
              <p className="auth-config-warning">
                Firebase 설정이 없어 로그인·회원가입을 사용할 수 없습니다.
                닫기를 눌러 게스트로 이용해 주세요.
              </p>
            )}

            <div className="auth-tabs">
              <button
                type="button"
                className={view === "login" ? "auth-tab active" : "auth-tab"}
                onClick={() => switchView("login")}
                disabled={!firebaseEnabled}
              >
                로그인
              </button>
              <button
                type="button"
                className={view === "signup" ? "auth-tab active" : "auth-tab"}
                onClick={() => switchView("signup")}
                disabled={!firebaseEnabled}
              >
                회원가입
              </button>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              {view === "signup" && (
                <>
                  <label className="auth-field">
                    <span>이름</span>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="예: 홍길동"
                      autoComplete="name"
                      maxLength={PROFILE_NAME_MAX}
                      disabled={busy || !firebaseEnabled}
                      required
                    />
                  </label>
                  <label className="auth-field">
                    <span>교회</span>
                    <input
                      type="text"
                      value={church}
                      onChange={(e) => setChurch(e.target.value)}
                      placeholder="예: 서울양천교회"
                      autoComplete="organization"
                      maxLength={PROFILE_CHURCH_MAX}
                      disabled={busy || !firebaseEnabled}
                      required
                    />
                  </label>
                </>
              )}

              <label className="auth-field">
                <span>이메일</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  autoComplete="email"
                  maxLength={EMAIL_MAX}
                  disabled={busy || !firebaseEnabled}
                  required
                />
              </label>

              <label className="auth-field">
                <span>비밀번호</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="6자 이상"
                  autoComplete={
                    view === "signup" ? "new-password" : "current-password"
                  }
                  maxLength={PASSWORD_MAX}
                  disabled={busy || !firebaseEnabled}
                  required
                />
              </label>

              {view === "signup" && (
                <>
                  <label className="auth-field">
                    <span>비밀번호 확인</span>
                    <input
                      type="password"
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      placeholder="비밀번호 재입력"
                      autoComplete="new-password"
                      maxLength={PASSWORD_MAX}
                      disabled={busy || !firebaseEnabled}
                      required
                    />
                  </label>
                  <p className="auth-verify-hint">
                    회원가입 후 이메일 인증이 필요합니다. 인증 후 클라우드
                    저장을 이용할 수 있습니다.
                    <br />
                    <span className="auth-verify-hint-spam">
                      {VERIFY_EMAIL_SPAM_HINT}
                    </span>
                  </p>
                  <label className="auth-privacy-consent">
                    <input
                      type="checkbox"
                      checked={privacyAgreed}
                      onChange={(e) => setPrivacyAgreed(e.target.checked)}
                      disabled={busy || !firebaseEnabled}
                    />
                    <span>
                      {onOpenPrivacy ? (
                        <>
                          <button
                            type="button"
                            className="auth-privacy-link"
                            onClick={(e) => {
                              e.preventDefault();
                              onOpenPrivacy();
                            }}
                          >
                            개인정보 처리 안내
                          </button>
                          를 읽었으며 동의합니다.
                        </>
                      ) : (
                        "개인정보 처리 안내에 동의합니다."
                      )}
                    </span>
                  </label>
                </>
              )}

              {verificationMessage && view === "login" && (
                <p className="auth-verify-message">{verificationMessage}</p>
              )}

              {displayError && <p className="auth-error">{displayError}</p>}

              <button
                type="submit"
                className="full-width-btn auth-submit"
                disabled={
                  busy ||
                  !firebaseEnabled ||
                  (view === "signup" && !privacyAgreed)
                }
              >
                {busy ? "처리 중…" : view === "signup" ? "회원가입" : "로그인"}
              </button>
            </form>
          </>
        )}

        <button
          type="button"
          className="full-width-btn auth-close-btn"
          onClick={onClose}
          disabled={busy}
        >
          닫기
        </button>
      </div>
    </div>
  );
}
