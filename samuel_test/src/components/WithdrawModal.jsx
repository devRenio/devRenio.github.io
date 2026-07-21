import { useState } from "react";

export default function WithdrawModal({ busy, error, onConfirm, onCancel, onClearError }) {
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");
    onClearError?.();

    if (!password) {
      setLocalError("비밀번호를 입력하세요.");
      return;
    }

    await onConfirm(password);
  };

  const displayError = localError || error;

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={onCancel}>
      <div className="modal-content auth-modal" onClick={(e) => e.stopPropagation()}>
        <h3>회원 탈퇴</h3>
        <p className="withdraw-desc">
          탈퇴하면 계정과 저장된 프로필(이름·교회명)이 삭제됩니다.
          <br />
          이 작업은 되돌릴 수 없습니다.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-field">
            <span>비밀번호 확인</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="현재 비밀번호"
              autoComplete="current-password"
              disabled={busy}
              required
            />
          </label>

          {displayError && <p className="auth-error">{displayError}</p>}

          <div className="withdraw-actions">
            <button
              type="button"
              className="full-width-btn auth-close-btn"
              onClick={onCancel}
              disabled={busy}
            >
              취소
            </button>
            <button
              type="submit"
              className="full-width-btn withdraw-submit-btn"
              disabled={busy}
            >
              {busy ? "처리 중…" : "탈퇴하기"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
