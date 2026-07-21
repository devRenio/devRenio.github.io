import { collection, getDocs } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { isAdminUser } from "../constants/admin";
import { normalizeProgressData } from "./progressPayload";

function requireAdmin() {
  const user = auth?.currentUser;
  if (!user || !isAdminUser(user)) {
    throw new Error("관리자 권한이 필요합니다.");
  }
  return user;
}

/** 관리자: users 컬렉션 요약 (Firestore Rules isAdmin 필요) */
export async function fetchAdminUserSummaries() {
  if (!db) throw new Error("Firebase가 설정되지 않았습니다.");
  requireAdmin();

  const snap = await getDocs(collection(db, "users"));
  return snap.docs
    .map((docSnap) => {
      const data = docSnap.data();
      const progress = normalizeProgressData(data.progress);
      return {
        uid: docSnap.id,
        name: data.name ?? "",
        church: data.church ?? "",
        email: data.email ?? "",
        updatedAt: data.updatedAt ?? null,
        progressSavedAt: progress?.savedAt ?? null,
        completedCount: progress?.completedVerseRefs?.length ?? 0,
        courseNum: progress?.courseNum ?? null,
        statsTotal: progress?.cumulativeStats?.total ?? 0,
      };
    })
    .sort((a, b) => (b.progressSavedAt ?? "").localeCompare(a.progressSavedAt ?? ""));
}
