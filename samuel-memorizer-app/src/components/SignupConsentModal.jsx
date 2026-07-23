import { useState } from "react";
import PrivacyPolicyBody from "./PrivacyPolicyBody";

export default function SignupConsentModal({
  busy,
  error,
  onAccept,
  onDecline,
}) {
  const [agreed, setAgreed] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);

  const handleAccept = async (e) => {
    e.preventDefault();
    if (!agreed || busy) return;
    await onAccept();
  };

  if (showPolicy) {
    return (
      <div className="modal-overlay auth-overlay" onClick={(e) => e.stopPropagation()}>
        <div
          className="modal-content auth-modal modal-content--privacy"
          onClick={(e) => e.stopPropagation()}
        >
          <h3>개인정보 처리 안내</h3>
          <PrivacyPolicyBody />
          <button
            type="button"
            className="full-width-btn"
            style={{ marginBottom: 0 }}
            onClick={() => setShowPolicy(false)}
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay auth-overlay" onClick={(e) => e.stopPropagation()}>
      <div className="modal-content auth-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="auth-modal-title">서비스 가입 안내</h3>
        <p className="auth-modal-sub">
          처음 이용하시는 계정입니다. 개인정보 처리 안내를 확인하고 동의해
          주세요.
        </p>

        <form className="auth-form" onSubmit={handleAccept}>
          <label className="auth-privacy-consent">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              disabled={busy}
            />
            <span>
              <button
                type="button"
                className="auth-privacy-link"
                onClick={() => setShowPolicy(true)}
              >
                개인정보 처리 안내
              </button>
              를 확인했으며, 서비스 이용(가입)에 동의합니다.
            </span>
          </label>

          {error && <p className="auth-error">{error}</p>}

          <button
            type="submit"
            className="full-width-btn auth-submit"
            disabled={busy || !agreed}
          >
            {busy ? "처리 중…" : "동의하고 시작하기"}
          </button>
          <button
            type="button"
            className="full-width-btn auth-close-btn"
            style={{ marginBottom: 0 }}
            disabled={busy}
            onClick={onDecline}
          >
            취소
          </button>
        </form>
      </div>
    </div>
  );
}
