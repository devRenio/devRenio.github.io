export default function ModeBar({
  currentMode,
  blankNum,
  wholeLevelNum,
  mergeBlanks,
  onModeSelect,
  onOpenBlankModal,
  onOpenWholeModal,
  onOpenHelp,
  onMergeBlanksChange,
}) {
  const modes = [
    {
      id: 1,
      n: "빈칸 모드",
      subText: `${blankNum * 10}%`,
      subAction: onOpenBlankModal,
    },
    { id: 2, n: "구절 모드", subText: null, subAction: null },
    { id: 3, n: "장절 모드", subText: null, subAction: null },
    {
      id: 4,
      n: "전체 모드",
      subText: `${wholeLevelNum}어절`,
      subAction: onOpenWholeModal,
    },
    { id: 5, n: "주제 모드", subText: null, subAction: null },
  ];

  return (
    <div className="mode-bar">
      <div className="mode-bar-tour" data-tour="mode-bar">
        {modes.map((m) => (
          <div key={m.id} className="mode-group">
            <button
              className={`mode-main-btn ${currentMode === m.id ? "active" : ""}`}
              onClick={() => onModeSelect(m.id)}
            >
              {m.n}
            </button>
            {m.subText && (
              <button
                className="mode-sub-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  m.subAction();
                }}
              >
                {m.subText}
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="mode-bar-options">
        <label
          className={`merge-blank-toggle ${mergeBlanks ? "on" : ""}`}
          data-tour="merge-blanks"
          title="인접 빈칸을 하나로 병합해 한 번에 입력 (Enter로 제출)"
        >
          <input
            type="checkbox"
            className="merge-blank-input"
            checked={mergeBlanks}
            onChange={(e) => onMergeBlanksChange(e.target.checked)}
          />
          <span className="merge-blank-switch" aria-hidden="true" />
          <span className="merge-blank-text">빈칸 병합</span>
        </label>

        <button className="mode-main-btn mode-help-btn" onClick={onOpenHelp}>
          도움말
        </button>
      </div>
    </div>
  );
}
