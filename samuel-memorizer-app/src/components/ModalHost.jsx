import { useEffect, useState } from "react";
import { DEFAULT_FONT } from "../utils/fonts";
import { getVerseWrongByDay } from "../utils/scriptureHelpers";
import {
  APP_NAME_KO,
  APP_VERSE_LINE,
  APP_VERSE_REF,
} from "../constants/appInfo";
import PrivacyPolicyBody from "./PrivacyPolicyBody";

export default function ModalHost({
  activeModal,
  onClose,
  alertMessage,
  onConfirm,
  isMobile,
  fontFamily,
  fontFamilies,
  fontSize,
  isBold,
  onFontFamilyChange,
  onFontSizeChange,
  onBoldChange,
  onFontReset,
  onLoadSystemFonts,
  wrongVerses,
  onStartWrongReview,
  onClearWrongVerses,
  cumulativeStats,
  verseWrongCounts,
  selectedScriptures,
  statsTab,
  onStatsTabChange,
  onResetStats,
  onStartTutorial,
  onBlankLevel,
  onWholeLevel,
  onOpenPrivacy,
  onOpenContact,
  schoolLabel,
  scriptureVersions,
  scriptureVersionId,
  onSelectScriptureVersion,
  noticeUrl,
}) {
  const [versionListOpen, setVersionListOpen] = useState(false);

  useEffect(() => {
    if (activeModal !== "info") {
      setVersionListOpen(false);
    }
  }, [activeModal]);

  const activeScriptureVersion =
    scriptureVersions.find((version) => version.id === scriptureVersionId) ??
    scriptureVersions[0];

  if (
    !activeModal ||
    activeModal === "withdraw" ||
    activeModal === "account" ||
    activeModal === "admin" ||
    activeModal === "contact"
  ) {
    return null;
  }

  const verseWrongByDay = getVerseWrongByDay(
    selectedScriptures,
    verseWrongCounts,
  );

  const modalClass = [
    "modal-content",
    activeModal === "stats" && "modal-content--stats",
    activeModal === "privacy" && "modal-content--privacy",
  ]
    .filter(Boolean)
    .join(" ");

  const overlayClass = [
    "modal-overlay",
    activeModal === "privacy" && "modal-overlay--privacy",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={overlayClass} onClick={onClose}>
      <div className={modalClass} onClick={(e) => e.stopPropagation()}>
        {activeModal === "alert" && (
          <>
            <h3 style={{ marginBottom: "15px" }}>알림</h3>
            <p
              style={{
                textAlign: "center",
                marginBottom: "20px",
                lineHeight: "1.5",
                whiteSpace: "pre-line",
              }}
            >
              {alertMessage}
            </p>
            <button
              className="full-width-btn"
              style={{ marginBottom: 0 }}
              onClick={onClose}
            >
              확인
            </button>
          </>
        )}

        {activeModal === "confirm" && (
          <>
            <h3 style={{ marginBottom: "15px" }}>확인</h3>
            <p
              style={{
                textAlign: "center",
                marginBottom: "20px",
                lineHeight: "1.5",
                whiteSpace: "pre-line",
              }}
            >
              {alertMessage}
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                className="full-width-btn"
                style={{ marginBottom: 0 }}
                onClick={onClose}
              >
                취소
              </button>
              <button
                className="full-width-btn"
                style={{
                  marginBottom: 0,
                  backgroundColor: "var(--color-fail)",
                }}
                onClick={() => {
                  if (onConfirm) onConfirm();
                  onClose();
                }}
              >
                확인
              </button>
            </div>
          </>
        )}

        {activeModal === "help" && (
          <>
            <h3>도움말</h3>
            <p
              style={{
                textAlign: "center",
                lineHeight: "1.6",
                marginBottom: "20px",
              }}
            >
              1. 과정과 일차를 선택하세요.
              <br />
              2. 원하는 모드를 선택하여 암송을 시작하세요.
              <br />
              3. 정답을 입력하고 <strong>Space</strong>나 <strong>Enter</strong>
              를 누르세요.
              <br />
              4. 틀린 구절은 자동으로 저장됩니다.
              <br />
            </p>
            <button
              className="full-width-btn"
              style={{ marginBottom: 0 }}
              onClick={onClose}
            >
              닫기
            </button>
          </>
        )}

        {activeModal === "info" && (
          <>
            <h3>프로그램 정보</h3>
            <div className="info-about-body">
              <p className="info-about-title">{APP_NAME_KO}</p>
              <p className="info-about-school">{schoolLabel}</p>
              <p className="info-about-verse">{APP_VERSE_LINE}</p>
              <p className="info-about-ref">{APP_VERSE_REF}</p>
            </div>

            {scriptureVersions.length > 0 && (
              <div className="info-version-picker">
                <p className="info-version-label">암송 구절 버전</p>
                <button
                  type="button"
                  className={[
                    "info-version-toggle",
                    versionListOpen ? "is-open" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => setVersionListOpen((open) => !open)}
                  aria-expanded={versionListOpen}
                  aria-haspopup="listbox"
                >
                  <span className="info-version-toggle-label">
                    {activeScriptureVersion?.schoolLabel ||
                      activeScriptureVersion?.label ||
                      "버전 선택"}
                  </span>
                  <span className="info-version-chevron" aria-hidden="true">
                    {versionListOpen ? "▲" : "▼"}
                  </span>
                </button>
                {versionListOpen && (
                  <ul className="info-version-list" role="listbox">
                    {scriptureVersions.map((version) => (
                      <li key={version.id}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={version.id === scriptureVersionId}
                          className={[
                            "info-version-row",
                            version.id === scriptureVersionId ? "is-active" : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          onClick={() => {
                            setVersionListOpen(false);
                            onSelectScriptureVersion?.(version.id);
                          }}
                        >
                          <span className="info-version-row-label">
                            {version.schoolLabel || version.label}
                          </span>
                          {version.id === scriptureVersionId && (
                            <span
                              className="info-version-row-check"
                              aria-hidden="true"
                            >
                              ✓
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {noticeUrl && (
              <a
                className="info-link-btn info-notice-link"
                href={noticeUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                사무엘학교 공지글 보기
              </a>
            )}

            <button
              type="button"
              className="info-link-btn"
              onClick={onOpenContact}
            >
              문의하기 (깨사모 쪽지)
            </button>
            <button
              type="button"
              className="info-link-btn"
              onClick={onOpenPrivacy}
            >
              개인정보 처리 안내
            </button>
            <button
              type="button"
              className="tutorial-replay-btn"
              onClick={onStartTutorial}
            >
              튜토리얼 다시 보기
            </button>
            <button
              className="full-width-btn"
              style={{ marginBottom: 0, marginTop: "12px" }}
              onClick={onClose}
            >
              닫기
            </button>
          </>
        )}

        {activeModal === "no-wrong" && (
          <>
            <h3 style={{ marginBottom: "10px" }}>알림</h3>
            <p
              style={{
                textAlign: "center",
                marginBottom: "20px",
                fontSize: "16px",
              }}
            >
              틀린 구절이 없습니다! 🎉
            </p>
            <button
              className="full-width-btn"
              style={{ marginBottom: 0 }}
              onClick={onClose}
            >
              확인
            </button>
          </>
        )}

        {activeModal === "blank" && (
          <>
            <h3>빈칸 비율 선택</h3>
            <div className="modal-grid">
              <button onClick={() => onBlankLevel(-1)}>0% (암기용)</button>
              {[...Array(10)].map((_, i) => (
                <button key={i} onClick={() => onBlankLevel(i)}>
                  {(i + 1) * 10}%
                </button>
              ))}
            </div>
            <button
              className="full-width-btn"
              style={{ marginBottom: 0, marginTop: "10px" }}
              onClick={onClose}
            >
              닫기
            </button>
          </>
        )}

        {activeModal === "whole" && (
          <>
            <h3>공개할 어절 수 선택</h3>
            <div className="modal-grid">
              {[1, 2, 3, 4].map((n) => (
                <button key={n} onClick={() => onWholeLevel(n)}>
                  {n}어절
                </button>
              ))}
            </div>
            <button
              className="full-width-btn"
              style={{ marginBottom: 0, marginTop: "10px" }}
              onClick={onClose}
            >
              닫기
            </button>
          </>
        )}

        {activeModal === "font" && (
          <>
            <h3>글꼴 설정</h3>
            {isMobile && (
              <p className="font-modal-note">
                모바일에서는 앱에 포함된 글꼴만 적용됩니다.
              </p>
            )}
            {!isMobile && (
              <button onClick={onLoadSystemFonts} className="full-width-btn">
                시스템 폰트 불러오기
              </button>
            )}

            <select
              value={fontFamily}
              onChange={(e) => onFontFamilyChange(e.target.value)}
              className="font-selector"
            >
              {fontFamilies.map((f) => (
                <option key={f.realName} value={f.realName}>
                  {f.displayName}
                </option>
              ))}
            </select>

            <div className="font-size-control">
              <label>크기: {fontSize}px</label>
              <input
                type="range"
                min="16"
                max="50"
                value={fontSize}
                onChange={(e) => onFontSizeChange(Number(e.target.value))}
              />
            </div>

            <div style={{ margin: "16px 0" }}>
              <label
                style={{
                  display: "flex",
                  gap: "8px",
                  alignItems: "center",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={isBold}
                  onChange={(e) => onBoldChange(e.target.checked)}
                />
                <span style={{ fontSize: "14px" }}>진하게</span>
              </label>
            </div>

            <div className="modal-footer">
              <button
                className="modal-close-btn"
                onClick={() => {
                  onFontReset();
                }}
              >
                초기화
              </button>
              <button className="modal-close-btn" onClick={onClose}>
                닫기
              </button>
            </div>
          </>
        )}

        {activeModal === "wrong" && (
          <>
            <h3>틀린 구절 모음</h3>
            <div className="wrong-list">
              {wrongVerses.map((v, i) => (
                <p key={v.reference}>
                  {i + 1}. {v.reference} {v.verse}
                </p>
              ))}
            </div>

            <button className="full-width-btn" onClick={onStartWrongReview}>
              틀린 구절 복습 시작
            </button>

            <div className="modal-footer">
              <button className="modal-close-btn" onClick={onClearWrongVerses}>
                목록 초기화
              </button>
              <button className="modal-close-btn" onClick={onClose}>
                닫기
              </button>
            </div>
          </>
        )}

        {activeModal === "stats" && (
          <>
            <h3 style={{ marginBottom: "0px" }}>누적 학습 통계</h3>
            <div className="stats-tabs">
              <button
                type="button"
                className={`stats-tab-btn ${statsTab === "summary" ? "active" : ""}`}
                onClick={() => onStatsTabChange("summary")}
              >
                요약
              </button>
              <button
                type="button"
                className={`stats-tab-btn ${statsTab === "verse-wrong" ? "active" : ""}`}
                onClick={() => onStatsTabChange("verse-wrong")}
              >
                구절별 오답
              </button>
            </div>

            {statsTab === "summary" && (
              <>
                <h3
                  style={{
                    marginTop: "3px",
                    textAlign: "center",
                    fontSize: "12px",
                    fontWeight: "normal",
                  }}
                >
                  구절 기준 통계
                </h3>
                <div className="stats-summary">
                  <div className="stats-row">
                    <span style={{ color: "var(--text-secondary)" }}>
                      총 시도 횟수
                    </span>
                    <strong>{cumulativeStats.total.toLocaleString()}회</strong>
                  </div>
                  <div className="stats-row stats-correct">
                    <span>정답 횟수</span>
                    <strong>
                      {cumulativeStats.correct.toLocaleString()}회
                    </strong>
                  </div>
                  <div className="stats-row stats-wrong">
                    <span>오답 횟수</span>
                    <strong>{cumulativeStats.wrong.toLocaleString()}회</strong>
                  </div>
                  <div className="stats-rate">
                    정답률 :{" "}
                    {cumulativeStats.total === 0
                      ? "0%"
                      : `${((cumulativeStats.correct / cumulativeStats.total) * 100).toFixed(1)}%`}
                  </div>
                </div>
              </>
            )}

            {statsTab === "verse-wrong" && (
              <div className="verse-wrong-stats">
                {verseWrongByDay.length === 0 ? (
                  <p className="verse-list-empty">
                    기록된 구절별 오답이 없습니다.
                  </p>
                ) : (
                  verseWrongByDay.map((dayGroup) => (
                    <div key={dayGroup.day} className="verse-wrong-day">
                      <h4>{dayGroup.day}일차</h4>
                      <ul>
                        {dayGroup.verses.map((v) => (
                          <li key={v.reference}>
                            <span className="verse-wrong-count">
                              {v.wrongCount}회
                            </span>
                            <span className="verse-wrong-ref">
                              {v.reference}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                )}
              </div>
            )}

            <button className="full-width-btn" onClick={onResetStats}>
              기록 초기화
            </button>

            <button
              className="full-width-btn"
              style={{ marginBottom: 0 }}
              onClick={onClose}
            >
              닫기
            </button>
          </>
        )}

        {activeModal === "privacy" && (
          <>
            <h3>개인정보 처리 안내</h3>
            <PrivacyPolicyBody />
            <button
              className="full-width-btn"
              style={{ marginBottom: 0 }}
              onClick={onClose}
            >
              닫기
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export { DEFAULT_FONT };
