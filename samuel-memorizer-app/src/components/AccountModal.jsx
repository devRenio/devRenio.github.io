import MemberAvatar from "./MemberAvatar";

export default function AccountModal({
  isLoggedIn,
  userEmail,
  userDisplayName,
  userSex,
  userChurch,
  userAvatar,
  jbchEnabled,
  isAdmin,
  onOpenAdmin,
  onOpenLogin,
  onLogout,
  onClose,
}) {
  const displayName = userDisplayName || "사용자";
  const sexLabel = userSex?.trim();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content account-modal" onClick={(e) => e.stopPropagation()}>
        <h3>계정</h3>

        {isLoggedIn ? (
          <div className="info-account-card">
            <div className="info-account-profile">
              <MemberAvatar src={userAvatar} alt={`${displayName} 프로필`} />
              <div className="info-account-identity">
                <strong className="info-account-name">
                  {displayName}
                  {sexLabel && (
                    <span className="info-account-sex">{sexLabel}</span>
                  )}
                </strong>
                {userChurch && (
                  <span className="info-account-email">{userChurch}</span>
                )}
                {userEmail && (
                  <span className="info-account-email">{userEmail}</span>
                )}
              </div>
            </div>

            <p className="info-account-note">
              암송 진행은 이 기기·브라우저에 저장됩니다.
            </p>

            {isAdmin && (
              <button
                type="button"
                className="info-link-btn info-admin-btn"
                onClick={onOpenAdmin}
              >
                관리자 콘솔
              </button>
            )}

            <div className="info-account-btns">
              <button
                type="button"
                className="info-logout-btn"
                onClick={onLogout}
              >
                로그아웃
              </button>
            </div>
          </div>
        ) : (
          <div className="info-account-card info-account-card--guest">
            <p className="info-account-label">게스트 모드</p>
            <p className="info-account-guest-desc">
              진행 데이터는 이 기기·브라우저에만 저장됩니다. 깨사모 로그인하면
              문의(쪽지) 기능을 이용할 수 있습니다.
            </p>
            <div className="info-account-actions">
              <button
                type="button"
                className="info-auth-btn"
                onClick={onOpenLogin}
                disabled={!jbchEnabled}
              >
                깨사모 로그인
              </button>
            </div>
            {!jbchEnabled && (
              <p className="info-account-guest-desc">
                깨사모 API 설정 후 로그인할 수 있습니다.
              </p>
            )}
          </div>
        )}

        <button
          type="button"
          className="full-width-btn"
          style={{ marginBottom: 0, marginTop: "12px" }}
          onClick={onClose}
        >
          닫기
        </button>
      </div>
    </div>
  );
}
