import { useCallback, useEffect, useState } from "react";
import { fetchAdminUserSummaries } from "../utils/adminUsers";

function formatWhen(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("ko-KR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export default function AdminModal({ onClose }) {
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);

  const load = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const rows = await fetchAdminUserSummaries();
      setUsers(rows);
    } catch (err) {
      console.error(err);
      setError(
        err?.message?.includes("권한")
          ? err.message
          : "회원 목록을 불러오지 못했습니다. Firestore Rules의 관리자 설정을 확인하세요.",
      );
      setUsers([]);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="modal-overlay admin-overlay" onClick={onClose}>
      <div
        className="modal-content admin-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <h3>관리자 콘솔</h3>
        <p className="admin-modal-desc">
          가입 회원의 프로필·클라우드 진행 요약입니다. 개인정보는 운영 목적 외
          사용·제공하지 마세요.
        </p>

        {error && <p className="admin-error">{error}</p>}

        {busy ? (
          <p className="admin-loading">불러오는 중…</p>
        ) : (
          <>
            <p className="admin-count">총 {users.length}명</p>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>이름</th>
                    <th>교회</th>
                    <th>이메일</th>
                    <th>과정</th>
                    <th>완료</th>
                    <th>시도</th>
                    <th>마지막 저장</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="admin-empty">
                        표시할 회원이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.uid}>
                        <td>{u.name || "—"}</td>
                        <td>{u.church || "—"}</td>
                        <td className="admin-email">{u.email || "—"}</td>
                        <td>{u.courseNum ? `${u.courseNum}과정` : "—"}</td>
                        <td>{u.completedCount}</td>
                        <td>{u.statsTotal}</td>
                        <td>{formatWhen(u.progressSavedAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
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
            새로고침
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
  );
}
