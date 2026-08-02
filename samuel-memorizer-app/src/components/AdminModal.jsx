import { useCallback, useEffect, useMemo, useState } from "react";
import {
  jbchFetchAdminMemberDetail,
  jbchFetchAdminMembers,
} from "../lib/jbchApi";
import {
  ADMIN_MEMBER_SORT_OPTIONS,
  sortAdminMembers,
} from "../utils/adminMemberSort";
import AdminMemberDetailModal from "./AdminMemberDetailModal";
import MemberAvatar from "./MemberAvatar";

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
      <MemberAvatar
        src={profile.avatar}
        alt=""
        className="admin-member-row-avatar"
      />
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

function formatCacheTime(iso) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("ko-KR");
}

export default function AdminModal({ onClose }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [detailBusy, setDetailBusy] = useState(false);
  const [cacheInfo, setCacheInfo] = useState({
    cachedAt: null,
    lastFullRebuildAt: null,
  });
  const [sortBy, setSortBy] = useState("name");

  const sortedProfiles = useMemo(
    () => sortAdminMembers(profiles, sortBy),
    [profiles, sortBy],
  );

  const load = useCallback(async ({ rebuild = false } = {}) => {
    setBusy(true);
    setError("");
    try {
      const result = await jbchFetchAdminMembers({ rebuild });
      setProfiles(result.members);
      setCacheInfo({
        cachedAt: result.cachedAt,
        lastFullRebuildAt: result.lastFullRebuildAt,
      });
      setSelectedProfile((prev) => {
        if (!prev) return prev;
        return (
          result.members.find(
            (item) => profileKey(item) === profileKey(prev),
          ) ?? prev
        );
      });
    } catch (err) {
      console.error(err);
      setError(err.message || "회원 목록을 불러오지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }, []);

  const openMemberDetail = useCallback(async (profile) => {
    setDetailBusy(true);
    setError("");
    try {
      const detail = await jbchFetchAdminMemberDetail(profile.userid);
      setSelectedProfile(detail);
    } catch (err) {
      console.error(err);
      setError(err.message || "회원 상세 정보를 불러오지 못했습니다.");
    } finally {
      setDetailBusy(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <div className="modal-overlay admin-overlay" onClick={onClose}>
        <div
          className="modal-content admin-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <h3>관리자 콘솔</h3>
          <p className="admin-modal-desc">
            앱에 로그인·동의한 회원 목록입니다(KV 캐시). 항목을 눌러 상세
            정보를 확인하세요. 회원 정보는 해당 회원이 로그인할 때 갱신되며,
            목록 전체는 7일마다 자동으로 재구성됩니다.
          </p>
          {cacheInfo.lastFullRebuildAt && (
            <p className="admin-cache-meta">
              목록 기준 시각: {formatCacheTime(cacheInfo.lastFullRebuildAt)}
            </p>
          )}

          {error && <p className="admin-error">{error}</p>}

          {busy && profiles.length === 0 ? (
            <p className="admin-loading">불러오는 중…</p>
          ) : profiles.length === 0 ? (
            <p className="admin-empty">표시할 회원이 없습니다.</p>
          ) : (
            <>
              <div className="admin-list-toolbar">
                <p className="admin-count">총 {profiles.length}명</p>
                <div
                  className="admin-sort-bar"
                  role="group"
                  aria-label="회원 정렬"
                >
                  {ADMIN_MEMBER_SORT_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={[
                        "admin-sort-btn",
                        sortBy === option.id ? "is-active" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() => setSortBy(option.id)}
                      aria-pressed={sortBy === option.id}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <ul className="admin-member-list">
                {sortedProfiles.map((profile) => (
                  <li key={profileKey(profile)}>
                    <MemberListRow
                      profile={profile}
                      onSelect={openMemberDetail}
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
              onClick={() => load({ rebuild: true })}
              disabled={busy || detailBusy}
            >
              {busy ? "불러오는 중…" : "목록 재구성"}
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
