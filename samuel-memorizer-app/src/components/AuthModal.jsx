import { useState } from "react";
import { PASSWORD_MAX } from "../utils/authValidation";
import { APP_NAME_KO } from "../constants/appInfo";

const USERID_MAX = 64;

export default function AuthModal({
  jbchEnabled,
  busy,
  error,
  onLogin,
  onClearError,
}) {
  const [userid, setUserid] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");

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
        <h3 className="auth-modal-title">{APP_NAME_KO}</h3>

        <p className="auth-modal-sub">
          깨사모 계정으로 로그인해야 이용할 수 있습니다.
        </p>

        {!jbchEnabled && (
          <p className="auth-config-warning">
            지금은 로그인할 수 없습니다. 잠시 후 다시 시도하거나 교회·학교
            안내를 참고해 주세요.
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
      </div>
    </div>
  );
}
