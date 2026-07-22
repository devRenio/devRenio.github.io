import AuthModal from "./components/AuthModal";
import AccountModal from "./components/AccountModal";
import AdminModal from "./components/AdminModal";
import WithdrawModal from "./components/WithdrawModal";
import Tutorial from "./components/Tutorial";
import Navbar from "./components/Navbar";
import ModeBar from "./components/ModeBar";
import StudyArea from "./components/StudyArea";
import StatusBar from "./components/StatusBar";
import ModalHost, { DEFAULT_FONT } from "./components/ModalHost";
import { useSamuelApp } from "./hooks/useSamuelApp";
import { useAuth } from "./hooks/useAuth";
import { useProgressSync } from "./hooks/useProgressSync";
import { isAdminUser } from "./constants/admin";

function App() {
  const auth = useAuth();
  const app = useSamuelApp({ onboardingBlocked: auth.onboardingBlocked });
  const progressSync = useProgressSync({
    uid: auth.user?.uid ?? null,
    firebaseEnabled: auth.firebaseEnabled,
    emailVerified: auth.emailVerified,
    getSnapshot: app.getProgressSnapshot,
    applySnapshot: app.applyProgressSnapshot,
  });

  const handleLogout = async () => {
    app.setActiveModal(null);
    await auth.logout();
  };

  const handleOpenLoginFromAccount = () => {
    app.setActiveModal(null);
    auth.openAuthModal("login");
  };

  const handleOpenSignupFromAccount = () => {
    app.setActiveModal(null);
    auth.openAuthModal("signup");
  };

  const handleOpenWithdraw = () => {
    auth.setError("");
    app.setActiveModal("withdraw");
  };

  const handleWithdrawConfirm = async (password) => {
    const ok = await auth.withdrawAccount(password);
    if (ok) app.setActiveModal(null);
  };

  if (!auth.ready) {
    return (
      <div className="app-loading" data-theme={app.theme ?? "light"}>
        불러오는 중…
      </div>
    );
  }

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

  const handleSaveProgress = async () => {
    progressSync.clearError();
    await progressSync.save();
  };

  const handleLoadProgress = () => {
    progressSync.clearError();
    app.showConfirm(
      "클라우드에 저장된 진행을 이 기기로 불러옵니다.\n현재 기기의 암송 진행·통계가 덮어씌워집니다.",
      () => {
        progressSync.load();
      },
    );
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
      style={{
        "--study-font-size": `${app.displayFontSize}px`,
        "--study-input-font-size": `${app.inputFontSize}px`,
        ...(app.keyboard.keyboardOpen
          ? {
              "--vv-height": `${app.keyboard.viewportHeight}px`,
              "--vv-offset-top": `${app.keyboard.viewportOffsetTop}px`,
            }
          : {}),
      }}
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
          onOpenAccount={() => app.setActiveModal("account")}
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
        cumulativeStats={app.cumulativeStats}
        verseWrongCounts={app.verseWrongCounts}
        selectedScriptures={app.selectedScriptures}
        statsTab={app.statsTab}
        onStatsTabChange={app.setStatsTab}
        onResetStats={handleResetStats}
        onStartTutorial={app.startTutorial}
        onBlankLevel={app.handleBlankLevel}
        onWholeLevel={app.handleWholeLevel}
        onOpenPrivacy={() => app.setActiveModal("privacy")}
      />

      {app.activeModal === "account" && (
        <AccountModal
          isLoggedIn={auth.isLoggedIn}
          emailVerified={auth.emailVerified}
          isAdmin={isAdminUser(auth.user)}
          userEmail={auth.user?.email ?? ""}
          userDisplayName={
            auth.userProfile?.name || auth.user?.displayName || ""
          }
          userChurch={auth.userProfile?.church ?? ""}
          firebaseEnabled={auth.firebaseEnabled}
          cloudSavedAt={progressSync.cloudSavedAt}
          syncBusy={progressSync.busy}
          syncError={progressSync.error}
          syncLastAction={progressSync.lastAction}
          saveCooldownMs={progressSync.saveCooldownMs}
          loadCooldownMs={progressSync.loadCooldownMs}
          verificationMessage={auth.verificationMessage}
          resendCooldownMs={auth.resendCooldownMs}
          verifyBusy={auth.busy}
          onSaveProgress={handleSaveProgress}
          onLoadProgress={handleLoadProgress}
          onClearSyncFeedback={() => {
            progressSync.clearError();
            progressSync.clearLastAction();
          }}
          onResendVerification={auth.resendVerificationEmail}
          onRefreshVerification={auth.refreshEmailVerification}
          onClearVerificationMessage={() => auth.setVerificationMessage("")}
          onOpenLogin={handleOpenLoginFromAccount}
          onOpenSignup={handleOpenSignupFromAccount}
          onLogout={handleLogout}
          onOpenWithdraw={handleOpenWithdraw}
          onOpenAdmin={() => app.setActiveModal("admin")}
          onClose={() => app.setActiveModal(null)}
        />
      )}

      {app.activeModal === "admin" && isAdminUser(auth.user) && (
        <AdminModal onClose={() => app.setActiveModal("account")} />
      )}

      {app.activeModal === "withdraw" && (
        <WithdrawModal
          busy={auth.busy}
          error={auth.error}
          onConfirm={handleWithdrawConfirm}
          onCancel={() => {
            auth.setError("");
            app.setActiveModal("account");
          }}
          onClearError={() => auth.setError("")}
        />
      )}

      {auth.showAuthModal && (
        <AuthModal
          view={auth.authView}
          onViewChange={auth.setAuthView}
          variant={auth.authModalVariant}
          firebaseEnabled={auth.firebaseEnabled}
          busy={auth.busy}
          error={auth.error}
          verificationMessage={auth.verificationMessage}
          pendingVerifyEmail={auth.pendingVerifyEmail}
          resendCooldownMs={auth.resendCooldownMs}
          onLogin={auth.login}
          onSignup={auth.signup}
          onResendVerification={auth.resendVerificationEmail}
          onRefreshVerification={auth.refreshEmailVerification}
          onClose={auth.closeAuthModal}
          onClearError={() => auth.setError("")}
          onOpenPrivacy={() => app.setActiveModal("privacy")}
        />
      )}

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
              Samuel Memorizer가 모바일 환경에서도 사용할 수 있도록
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
