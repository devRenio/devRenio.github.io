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

      <div className="mode-group merge-blank-toggle">
        <label className="merge-blank-label">
          <input
            type="checkbox"
            checked={mergeBlanks}
            onChange={(e) => onMergeBlanksChange(e.target.checked)}
          />
          <span>연속 빈칸</span>
        </label>
      </div>

      <div className="mode-group">
        <button className="mode-main-btn" onClick={onOpenHelp}>
          도움말
        </button>
      </div>
    </div>
  );
}
