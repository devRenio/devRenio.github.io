import Tutorial from "./components/Tutorial";
import Navbar from "./components/Navbar";
import ModeBar from "./components/ModeBar";
import StudyArea from "./components/StudyArea";
import StatusBar from "./components/StatusBar";
import ModalHost, { DEFAULT_FONT } from "./components/ModalHost";
import { useSamuelApp } from "./hooks/useSamuelApp";

function App() {
  const app = useSamuelApp();

  const handleOpenWrong = () => {
    if (app.wrongVerses.length === 0) app.setActiveModal("no-wrong");
    else app.setActiveModal("wrong");
  };

  const handleStartWrongReview = () => {
    app.setScripture([...app.wrongVerses]);
    app.setLeftVerse(app.wrongVerses.length);
    app.setFailNum(0);
    app.setWrongVerses([]);
    app.setActiveModal(null);
    app.displayProblem(app.currentMode, [...app.wrongVerses]);
  };

  const handleResetStats = () => {
    app.showConfirm("통계 기록을 초기화하시겠습니까?", () => {
      app.setCumulativeStats({ total: 0, correct: 0, wrong: 0 });
      app.setVerseWrongCounts({});
    });
  };

  return (
    <div
      className={[
        "app-container",
        app.isMobile ? "is-mobile" : "",
        app.keyboard.typingMode ? "typing-mode" : "",
        app.keyboard.keyboardOpen ? "keyboard-open" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      data-theme={app.theme}
      style={
        app.keyboard.keyboardOpen
          ? {
              "--vv-height": `${app.keyboard.viewportHeight}px`,
              "--vv-offset-top": `${app.keyboard.viewportOffsetTop}px`,
            }
          : undefined
      }
    >
      <div className="app-chrome">
        <Navbar
          navRef={app.navRef}
          isMobile={app.isMobile}
          activeMenu={app.activeMenu}
          toggleMenu={app.toggleMenu}
          dayProgressLabels={app.dayProgressLabels}
          onSelectCourse={app.selectCourse}
          onSelectDay={app.selectDay}
          onRequestReset={app.requestDayReset}
          onOpenFont={() => app.setActiveModal("font")}
          onOpenStats={() => {
            app.setStatsTab("summary");
            app.setActiveModal("stats");
          }}
          onOpenInfo={() => app.setActiveModal("info")}
          onToggleTheme={app.toggleTheme}
          onToggleFullscreen={app.toggleFullscreen}
          theme={app.theme}
        />

        <ModeBar
          currentMode={app.currentMode}
          blankNum={app.blankNum}
          wholeLevelNum={app.wholeLevelNum}
          mergeBlanks={app.mergeBlanks}
          onModeSelect={(id) => {
            app.setCurrentMode(id);
            app.displayProblem(id);
          }}
          onOpenBlankModal={() => app.setActiveModal("blank")}
          onOpenWholeModal={() => app.setActiveModal("whole")}
          onOpenHelp={() => app.setActiveModal("help")}
          onMergeBlanksChange={app.handleMergeBlanksChange}
        />
      </div>

      <StudyArea
        problemContainerRef={app.problemContainerRef}
        currentMode={app.currentMode}
        currentProblem={app.currentProblem}
        isError={app.isError}
        isEmpty={app.scripture.length === 0}
        activeFontFamily={app.activeFontFamily}
        displayFontSize={app.displayFontSize}
        isBold={app.isBold}
        typingMode={app.keyboard.typingMode}
        mergeBlanks={app.mergeBlanks}
        isMobile={app.isMobile}
        isCompleted={app.isCompleted}
        userInput={app.userInput}
        inputRef={app.inputRef}
        inputFontSize={app.inputFontSize}
        courseName={app.courseName}
        leftVerse={app.leftVerse}
        onSkip={() => app.displayProblem(app.currentMode)}
        onDismissKeyboard={app.keyboard.dismissKeyboard}
        onInputChange={app.handleInputChange}
        onKeyDown={app.handleKeyDown}
        onBeforeInput={app.handleBeforeInput}
        onSubmit={() => app.submitAnswer()}
        onFocus={app.keyboard.handleInputFocus}
        onBlur={app.keyboard.handleInputBlur}
      />

      <StatusBar
        courseName={app.courseName}
        leftVerse={app.leftVerse}
        failNum={app.failNum}
        onSkip={() => app.displayProblem(app.currentMode)}
        onOpenWrong={handleOpenWrong}
        onOpenVerseList={() => app.setActiveModal("verse-list")}
        onRequestReset={app.requestDayReset}
      />

      <ModalHost
        activeModal={app.activeModal}
        onClose={() => app.setActiveModal(null)}
        alertMessage={app.alertMessage}
        onConfirm={app.onConfirm}
        isMobile={app.isMobile}
        fontFamily={app.fontFamily}
        fontFamilies={app.fontFamilies}
        fontSize={app.fontSize}
        isBold={app.isBold}
        onFontFamilyChange={app.setFontFamily}
        onFontSizeChange={app.setFontSize}
        onBoldChange={app.setIsBold}
        onFontReset={() => {
          app.setFontFamily(DEFAULT_FONT);
          app.setFontSize(30);
          app.setIsBold(false);
        }}
        onLoadSystemFonts={app.loadSystemFonts}
        wrongVerses={app.wrongVerses}
        onStartWrongReview={handleStartWrongReview}
        onClearWrongVerses={() => {
          app.setWrongVerses([]);
          app.setActiveModal(null);
        }}
        scripture={app.scripture}
        cumulativeStats={app.cumulativeStats}
        verseWrongCounts={app.verseWrongCounts}
        selectedScriptures={app.selectedScriptures}
        statsTab={app.statsTab}
        onStatsTabChange={app.setStatsTab}
        onResetStats={handleResetStats}
        onStartTutorial={app.startTutorial}
        onBlankLevel={app.handleBlankLevel}
        onWholeLevel={app.handleWholeLevel}
      />

      <Tutorial
        active={app.tutorialActive}
        stepIndex={app.tutorialStep}
        steps={app.tutorialSteps}
        onNext={app.advanceTutorial}
        onRequestSkip={() => app.setShowTutorialSkipConfirm(true)}
        isDesktop={!app.isMobile}
      />

      {app.showTutorialSkipConfirm && (
        <div
          className="modal-overlay"
          style={{ zIndex: 2600 }}
          onClick={() => app.setShowTutorialSkipConfirm(false)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: "15px" }}>튜토리얼 건너뛰기</h3>
            <p
              style={{
                textAlign: "center",
                marginBottom: "20px",
                lineHeight: "1.6",
              }}
            >
              튜토리얼을 건너뛰시겠습니까?
              <br />
              <span
                style={{ fontSize: "13px", color: "var(--text-secondary)" }}
              >
                나중에 정보 메뉴에서 다시 볼 수 있습니다.
              </span>
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                className="full-width-btn"
                style={{ marginBottom: 0 }}
                onClick={() => app.setShowTutorialSkipConfirm(false)}
              >
                계속 보기
              </button>
              <button
                className="full-width-btn"
                style={{
                  marginBottom: 0,
                  backgroundColor: "var(--color-fail)",
                }}
                onClick={app.completeTutorial}
              >
                건너뛰기
              </button>
            </div>
          </div>
        </div>
      )}

      {app.showMobileNotice && (
        <div
          className="modal-overlay notice-overlay"
          onClick={() => app.dismissMobileNotice(false)}
        >
          <div
            className="modal-content notice-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>업데이트 안내</h3>
            <p className="notice-body">
              사무엘학교 암송 프로그램이 모바일 환경에서도 사용할 수 있도록
              업데이트되었습니다.
            </p>
            <div className="notice-actions">
              <button
                type="button"
                className="full-width-btn"
                onClick={() => app.dismissMobileNotice(false)}
              >
                확인
              </button>
              <button
                type="button"
                className="notice-dismiss-btn"
                onClick={() => app.dismissMobileNotice(true)}
              >
                다시 보지 않기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
