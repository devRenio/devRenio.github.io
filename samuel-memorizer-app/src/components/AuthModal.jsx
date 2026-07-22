import { useState } from "react";
import { PASSWORD_MAX } from "../utils/authValidation";

const USERID_MAX = 64;

export default function AuthModal({
  variant = "welcome",
  jbchEnabled,
  busy,
  error,
  onLogin,
  onClose,
  onClearError,
}) {
  const [userid, setUserid] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");

  const isWelcome = variant === "welcome";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");
    onClearError?.();

    if (!userid.trim()) {
      setLocalError("깨사모 아이디를 입력하세요.");
      return;
    }
    if (!password) {
      setLocalError("비밀번호를 입력하세요.");
      return;
    }

    await onLogin(userid, password);
  };

  const displayError = localError || error;

  return (
    <div
      className="modal-overlay auth-overlay"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="modal-content auth-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="auth-modal-title">Samuel Memorizer</h3>

        <p className="auth-modal-sub">
          {isWelcome
            ? "깨사모 계정으로 로그인하거나, 닫기를 눌러 게스트로 이용할 수 있습니다."
            : "깨사모 계정으로 로그인하세요."}
        </p>

        {!jbchEnabled && (
          <p className="auth-config-warning">
            깨사모 API 설정이 없어 로그인을 사용할 수 없습니다. 닫기를 눌러
            게스트로 이용해 주세요.
          </p>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-field">
            <span>깨사모 아이디</span>
            <input
              type="text"
              value={userid}
              onChange={(e) => setUserid(e.target.value)}
              placeholder="깨사모 아이디"
              autoComplete="username"
              maxLength={USERID_MAX}
              disabled={busy || !jbchEnabled}
              required
            />
          </label>

          <label className="auth-field">
            <span>비밀번호</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호"
              autoComplete="current-password"
              maxLength={PASSWORD_MAX}
              disabled={busy || !jbchEnabled}
              required
            />
          </label>

          {displayError && <p className="auth-error">{displayError}</p>}

          <button
            type="submit"
            className="full-width-btn auth-submit"
            disabled={busy || !jbchEnabled}
          >
            {busy ? "로그인 중…" : "깨사모 로그인"}
          </button>
        </form>

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
