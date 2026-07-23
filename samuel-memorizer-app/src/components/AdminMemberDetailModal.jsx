import {
  ADMIN_MEMBER_DETAIL_FIELDS,
  getMemberFieldDisplay,
} from "../utils/memberProfile";

export default function AdminMemberDetailModal({ profile, onClose }) {
  if (!profile) return null;

  const displayName = profile.name || "—";
  const sexLabel = profile.sex?.trim();

  return (
    <div
      className="modal-overlay admin-detail-overlay"
      onClick={onClose}
    >
      <div
        className="modal-content admin-modal admin-detail-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <h3>회원 상세</h3>

        <div className="admin-profile-header">
          <div className="admin-profile-heading">
            <p className="admin-profile-name">
              {displayName}
              {sexLabel && (
                <span className="info-account-sex">{sexLabel}</span>
              )}
            </p>
            {profile.church && (
              <p className="admin-profile-sub">{profile.church}</p>
            )}
          </div>
        </div>

        <dl className="admin-profile-fields">
          {ADMIN_MEMBER_DETAIL_FIELDS.map(({ key, label }) => (
            <div key={key} className="admin-profile-row">
              <dt>{label}</dt>
              <dd>{getMemberFieldDisplay(key, profile)}</dd>
            </div>
          ))}
        </dl>

        <button
          type="button"
          className="full-width-btn auth-close-btn"
          style={{ marginBottom: 0, marginTop: "12px" }}
          onClick={onClose}
        >
          닫기
        </button>
      </div>
    </div>
  );
}
