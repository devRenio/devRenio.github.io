export default function Navbar({
  navRef,
  isMobile,
  activeMenu,
  toggleMenu,
  dayProgressLabels,
  onSelectCourse,
  onSelectDay,
  onRequestReset,
  onOpenFont,
  onOpenStats,
  onOpenInfo,
  onToggleTheme,
  onToggleFullscreen,
  theme,
}) {
  return (
    <nav className="navbar" ref={navRef}>
      <div className="menu-groups" data-tour="course-day">
        <div
          className="menu-group"
          onMouseEnter={() => !isMobile && toggleMenu("course")}
          onMouseLeave={() => !isMobile && toggleMenu(null)}
        >
          <button
            className="menu-trigger"
            onClick={(e) => {
              e.stopPropagation();
              toggleMenu("course");
            }}
          >
            과정 ▾
          </button>
          <div
            className="dropdown-content"
            style={{ display: activeMenu === "course" ? "flex" : "none" }}
          >
            {[1, 2, 3, 4].map((n) => (
              <button
                key={n}
                onClick={() => {
                  onSelectCourse(n);
                  toggleMenu(null);
                }}
              >
                {n}과정
              </button>
            ))}
          </div>
        </div>

        <div
          className="menu-group"
          onMouseEnter={() => !isMobile && toggleMenu("day")}
          onMouseLeave={() => !isMobile && toggleMenu(null)}
        >
          <button
            className="menu-trigger"
            onClick={(e) => {
              e.stopPropagation();
              toggleMenu("day");
            }}
          >
            일차 ▾
          </button>
          <div
            className="dropdown-content"
            style={{ display: activeMenu === "day" ? "flex" : "none" }}
          >
            {dayProgressLabels.map((label, i) => (
              <button
                key={i}
                onClick={() => {
                  onSelectDay(i + 1);
                  toggleMenu(null);
                }}
              >
                {label}
              </button>
            ))}
            <button
              onClick={() => {
                onSelectDay(7);
                toggleMenu(null);
              }}
            >
              전체
            </button>
            <hr />
            <button
              onClick={() => {
                onRequestReset();
                toggleMenu(null);
              }}
              style={{ color: "#ff6b6b" }}
            >
              초기화
            </button>
          </div>
        </div>

        <div className="menu-group">
          <button
            className="menu-trigger"
            data-tour="font-btn"
            onClick={onOpenFont}
          >
            글꼴
          </button>
        </div>
      </div>

      <div className="nav-actions">
        <button
          onClick={onToggleFullscreen}
          className="theme-toggle hide-mobile"
          data-tour="fullscreen-btn"
        >
          ⛶ 전체화면
        </button>
        <button
          onClick={onToggleTheme}
          className="theme-toggle"
          data-tour="theme-btn"
        >
          {theme === "light" ? "🌙 Dark" : "☀️ Light"}
        </button>
        <button
          className="theme-toggle"
          data-tour="stats-btn"
          onClick={onOpenStats}
        >
          통계
        </button>
        <button
          className="theme-toggle"
          data-tour="info-btn"
          onClick={onOpenInfo}
        >
          정보
        </button>
      </div>
    </nav>
  );
}
