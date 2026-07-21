import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { normalizeProgressData } from "./progressPayload";

function requireCurrentUid() {
  const uid = auth?.currentUser?.uid;
  if (!uid) {
    throw new Error("로그인이 필요합니다.");
  }
  return uid;
}

export async function saveUserProgress(progress) {
  if (!db) throw new Error("Firebase가 설정되지 않았습니다.");

  const uid = requireCurrentUid();
  const sanitized = normalizeProgressData(progress);
  if (!sanitized?.savedAt) {
    throw new Error("저장할 진행 데이터가 올바르지 않습니다.");
  }

  await setDoc(
    doc(db, "users", uid),
    {
      progress: sanitized,
      progressUpdatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function loadUserProgress() {
  if (!db) return null;

  const uid = requireCurrentUid();
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;

  const data = snap.data();
  return normalizeProgressData(data.progress);
}

export async function loadUserProgressMeta() {
  const progress = await loadUserProgress();
  if (!progress?.savedAt) return null;
  return { savedAt: progress.savedAt };
}
