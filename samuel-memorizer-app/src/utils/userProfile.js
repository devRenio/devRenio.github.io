import { doc, deleteDoc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import {
  PROFILE_CHURCH_MAX,
  PROFILE_NAME_MAX,
  sanitizeProfileText,
} from "./authValidation";

function requireCurrentUid() {
  const uid = auth?.currentUser?.uid;
  if (!uid) {
    throw new Error("로그인이 필요합니다.");
  }
  return uid;
}

/** 회원가입 시 이름·교회명 저장 (users/{uid}) */
export async function saveUserProfile({ name, church, email }) {
  if (!db) return;

  const uid = requireCurrentUid();
  const authEmail = auth.currentUser?.email?.trim();
  const profileEmail = (email ?? authEmail ?? "").trim().slice(0, 254);

  if (authEmail && profileEmail !== authEmail) {
    throw new Error("이메일 정보가 일치하지 않습니다.");
  }

  await setDoc(doc(db, "users", uid), {
    name: sanitizeProfileText(name, PROFILE_NAME_MAX),
    church: sanitizeProfileText(church, PROFILE_CHURCH_MAX),
    email: authEmail || profileEmail,
    updatedAt: new Date().toISOString(),
  });
}

/** 탈퇴 시 Firestore 프로필 삭제 */
export async function deleteUserProfile() {
  if (!db) return;
  const uid = requireCurrentUid();
  await deleteDoc(doc(db, "users", uid));
}

/** 로그인 후 프로필 불러오기 */
export async function loadUserProfile(uid) {
  if (!db) return null;

  const currentUid = auth?.currentUser?.uid;
  if (!currentUid || currentUid !== uid) return null;

  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;

  const data = snap.data();
  return {
    name: sanitizeProfileText(data.name, PROFILE_NAME_MAX),
    church: sanitizeProfileText(data.church, PROFILE_CHURCH_MAX),
    email: String(data.email ?? auth.currentUser?.email ?? "").slice(0, 254),
  };
}
