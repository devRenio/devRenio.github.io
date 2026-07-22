import { useState } from "react";
import { jbchSendMessage } from "../lib/jbchApi";
import { isJbchConfigured } from "../lib/jbchConfig";
import { MESSAGE_SUBJECT_PREFIX } from "../constants/appInfo";

const SUBJECT_MAX = 120;
const CONTENT_MAX = 4000;
const SUBJECT_INPUT_MAX = SUBJECT_MAX - MESSAGE_SUBJECT_PREFIX.length;

export default function ContactModal({ jbchEnabled, onClose }) {
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const contactReady = isJbchConfigured();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!subject.trim()) {
      setError("제목을 입력하세요.");
      return;
    }
    if (!content.trim()) {
      setError("내용을 입력하세요.");
      return;
    }

    setBusy(true);
    try {
      await jbchSendMessage({ subject, content });
      setSuccess(true);
      setSubject("");
      setContent("");
    } catch (err) {
      setError(err.message || "쪽지를 보내지 못했습니다.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content auth-modal contact-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <h3>문의하기</h3>
        <p className="contact-modal-desc">
          깨사모 쪽지로 문의를 보냅니다. 로그인한 계정으로 발송되며, 운영
          담당자에게 전달됩니다.
        </p>

        {!jbchEnabled && (
          <p className="auth-config-warning">
            지금은 문의 기능을 사용할 수 없습니다. 잠시 후 다시 시도하거나
            교회·학교 안내를 참고해 주세요.
          </p>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-field">
            <span>제목</span>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="문의 제목을 입력하세요."
              maxLength={SUBJECT_INPUT_MAX}
              disabled={busy || !contactReady}
              required
            />
          </label>

          <label className="auth-field">
            <span>내용</span>
            <textarea
              className="contact-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="문의 내용을 입력하세요."
              maxLength={CONTENT_MAX}
              rows={6}
              disabled={busy || !contactReady}
              required
            />
          </label>

          {error && <p className="auth-error">{error}</p>}
          {success && <p className="contact-success">쪽지를 보냈습니다.</p>}

          <button
            type="submit"
            className="full-width-btn auth-submit"
            disabled={busy || !contactReady}
          >
            {busy ? "보내는 중…" : "쪽지 보내기"}
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
