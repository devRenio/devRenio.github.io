import ProblemRenderer from "./ProblemRenderer";

export default function StudyArea({
  problemContainerRef,
  currentMode,
  currentProblem,
  isError,
  isEmpty,
  activeFontFamily,
  displayFontSize,
  isBold,
  typingMode,
  mergeBlanks,
  isMobile,
  isCompleted,
  userInput,
  inputRef,
  inputFontSize,
  courseName,
  leftVerse,
  onSkip,
  onDismissKeyboard,
  onInputChange,
  onKeyDown,
  onBeforeInput,
  onFocus,
  onBlur,
}) {
  const inputPlaceholder = (() => {
    if (mergeBlanks) {
      return isCompleted
        ? "Enter → 다음 구절"
        : "정답 입력 후 Enter로 제출";
    }
    if (isMobile) {
      return isCompleted
        ? "Enter/Space → 다음 구절"
        : "정답 입력 후 Enter/Space";
    }
    return isCompleted
      ? "Space/Enter를 눌러 다음 구절로"
      : "Space/Enter를 눌러 정답 입력";
  })();

  return (
    <div className="mobile-study-shell">
      <main className="problem-container" ref={problemContainerRef}>
        <div
          className="problem-box"
          data-tour="problem-box"
          style={{
            fontFamily: activeFontFamily,
            fontSize: `${displayFontSize}px`,
            fontWeight: isBold ? "bold" : "normal",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: typingMode ? "flex-start" : "center",
          }}
        >
          {currentMode !== 2 && currentMode !== 4 && currentProblem?.topic && (
            <div className="topic-display">{currentProblem.topic}</div>
          )}

          <div className="problem-text-wrapper">
            {currentProblem ? (
              <ProblemRenderer
                text={currentProblem.problemText}
                isError={isError}
              />
            ) : isEmpty ? (
              <div className="empty-queue-cta">
                <p className="empty-queue-title">암송할 구절이 없습니다</p>
                <p className="empty-queue-desc">
                  상단 메뉴에서 <strong>과정</strong>과 <strong>일차</strong>를
                  선택해 구절을 추가하세요.
                </p>
                <p className="empty-queue-hint">
                  구절을 추가한 뒤 원하는 <strong>모드</strong>를 눌러
                  시작합니다.
                </p>
              </div>
            ) : (
              "상단 메뉴에서 과정과 일차를 선택한 후 모드를 눌러 시작하세요."
            )}
          </div>
        </div>
      </main>

      <div className="input-dock">
        {typingMode && (
          <div className="keyboard-mini-bar">
            <span className="badge">{courseName}</span>
            <span className="keyboard-mini-stat">
              남은 <strong>{leftVerse}</strong>
            </span>
            <div className="keyboard-mini-actions">
              <button type="button" onClick={onSkip}>
                스킵
              </button>
              <button type="button" onClick={onDismissKeyboard}>
                키보드 닫기
              </button>
            </div>
          </div>
        )}

        <div className="input-area" data-tour="input-area">
          <input
            ref={inputRef}
            className={`answer-input ${isError ? "input-error" : ""}`}
            type="text"
            value={userInput}
            onChange={onInputChange}
            onKeyDown={onKeyDown}
            onBeforeInput={onBeforeInput}
            onFocus={onFocus}
            onBlur={onBlur}
            autoFocus={!isMobile}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            enterKeyHint={isCompleted ? "next" : "done"}
            placeholder={inputPlaceholder}
            style={{
              fontSize: `${inputFontSize}px`,
              fontFamily: activeFontFamily,
            }}
          />
        </div>
      </div>
    </div>
  );
}
