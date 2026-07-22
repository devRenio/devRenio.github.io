import MemberAvatar from "./MemberAvatar";

export default function AccountModal({
  userEmail,
  userDisplayName,
  userSex,
  userChurch,
  userAvatar,
  isAdmin,
  onOpenAdmin,
  onLogout,
  onClose,
}) {
  const displayName = userDisplayName || "사용자";
  const sexLabel = userSex?.trim();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content account-modal" onClick={(e) => e.stopPropagation()}>
        <h3>계정</h3>

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
