export default function StatusBar({
  courseName,
  leftVerse,
  failNum,
  onSkip,
  onOpenWrong,
  onRequestReset,
}) {
  return (
    <footer className="status-bar">
      <div className="status-info" data-tour="status-info">
        <span className="badge">{courseName}</span>
        <span>
          남은 구절 : <strong>{leftVerse}</strong>
        </span>
        <span>
          틀린 개수 : <strong>{failNum}</strong>
        </span>
      </div>
      <div className="status-btns">
        <button data-tour="skip-btn" onClick={onSkip}>
          스킵
        </button>
        <button data-tour="wrong-btn" onClick={onOpenWrong}>
          틀린 구절
        </button>
        <button
          data-tour="reset-btn"
          onClick={onRequestReset}
          className="reset-btn"
        >
          초기화
        </button>
      </div>
    </footer>
  );
}
