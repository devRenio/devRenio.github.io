import { useCallback, useEffect, useState } from "react";
import { jbchFetchMember } from "../lib/jbchApi";
import { getAdminUserids } from "../constants/admin";
import AdminMemberDetailModal from "./AdminMemberDetailModal";

function profileKey(profile) {
  return profile.userid || profile.mid || profile.email || profile.name;
}

function MemberListRow({ profile, onSelect }) {
  const displayName = profile.name || "—";
  const sexLabel = profile.sex?.trim();
  const church = profile.church || "—";

  return (
    <button
      type="button"
      className="admin-member-row"
      onClick={() => onSelect(profile)}
    >
      <span className="admin-member-row-main">
        <span className="admin-member-row-name">
          {displayName}
          {sexLabel && (
            <span className="info-account-sex">{sexLabel}</span>
          )}
        </span>
        <span className="admin-member-row-church">{church}</span>
      </span>
      <span className="admin-member-row-chevron" aria-hidden="true">
        ›
      </span>
    </button>
  );
}

export default function AdminModal({ memberProfile, onClose }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [profiles, setProfiles] = useState(() =>
    memberProfile ? [memberProfile] : [],
  );
  const [selectedProfile, setSelectedProfile] = useState(null);

  useEffect(() => {
    setProfiles(memberProfile ? [memberProfile] : []);
  }, [memberProfile]);

  const load = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const fresh = await jbchFetchMember();
      setProfiles([fresh]);
      setSelectedProfile((prev) => (prev ? fresh : prev));
    } catch (err) {
      console.error(err);
      setError(err.message || "회원 정보를 불러오지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }, []);

  return (
    <>
      <div className="modal-overlay admin-overlay" onClick={onClose}>
        <div
          className="modal-content admin-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <h3>관리자 콘솔</h3>
          <p className="admin-modal-desc">
            회원 목록입니다. 항목을 눌러 상세 정보를 확인하세요. 관리자(
            {getAdminUserids().join(", ") || "—"})만 이용할 수 있습니다.
          </p>

          {error && <p className="admin-error">{error}</p>}

          {busy && profiles.length === 0 ? (
            <p className="admin-loading">불러오는 중…</p>
          ) : profiles.length === 0 ? (
            <p className="admin-empty">표시할 회원이 없습니다.</p>
          ) : (
            <>
              <p className="admin-count">총 {profiles.length}명</p>
              <ul className="admin-member-list">
                {profiles.map((profile) => (
                  <li key={profileKey(profile)}>
                    <MemberListRow
                      profile={profile}
                      onSelect={setSelectedProfile}
                    />
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className="admin-actions">
            <button
              type="button"
              className="full-width-btn"
              style={{ marginBottom: 0 }}
              onClick={load}
              disabled={busy}
            >
              {busy ? "불러오는 중…" : "새로고침"}
            </button>
            <button
              type="button"
              className="full-width-btn auth-close-btn admin-close-btn"
              style={{ marginBottom: 0 }}
              onClick={onClose}
            >
              닫기
            </button>
          </div>
        </div>
      </div>

      {selectedProfile && (
        <AdminMemberDetailModal
          profile={selectedProfile}
          onClose={() => setSelectedProfile(null)}
        />
      )}
    </>
  );
}
