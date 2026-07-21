import { useCallback, useEffect, useState } from "react";
import {
  loadCooldownStorageKey,
  saveCooldownStorageKey,
} from "../constants/progress";
import { buildProgressPayload } from "../utils/progressPayload";
import {
  getLoadCooldownRemainingMs,
  getSaveCooldownRemainingMs,
  loadCooldownMessage,
  recordLocalSyncTime,
  saveCooldownMessage,
} from "../utils/syncCooldown";
import { loadUserProgress, loadUserProgressMeta, saveUserProgress } from "../utils/userProgress";
import { refreshAuthSession } from "../utils/emailVerification";
import { formatSyncError } from "../utils/firestoreErrors";

export function useProgressSync({
  uid,
  firebaseEnabled,
  emailVerified,
  getSnapshot,
  applySnapshot,
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [cloudSavedAt, setCloudSavedAt] = useState(null);
  const [lastAction, setLastAction] = useState("");
  const [saveCooldownMs, setSaveCooldownMs] = useState(0);
  const [loadCooldownMs, setLoadCooldownMs] = useState(0);

  const refreshCooldowns = useCallback(() => {
    if (!uid) {
      setSaveCooldownMs(0);
      setLoadCooldownMs(0);
      return;
    }
    setSaveCooldownMs(getSaveCooldownRemainingMs(uid, cloudSavedAt));
    setLoadCooldownMs(getLoadCooldownRemainingMs(uid));
  }, [uid, cloudSavedAt]);

  const refreshMeta = useCallback(async () => {
    if (!uid || !firebaseEnabled || !emailVerified) {
      setCloudSavedAt(null);
      return;
    }
    try {
      const meta = await loadUserProgressMeta();
      setCloudSavedAt(meta?.savedAt ?? null);
    } catch {
      setCloudSavedAt(null);
    }
  }, [uid, firebaseEnabled, emailVerified]);

  useEffect(() => {
    refreshMeta();
  }, [refreshMeta]);

  useEffect(() => {
    refreshCooldowns();
    if (!uid) return undefined;

    const timer = window.setInterval(refreshCooldowns, 1000);
    return () => window.clearInterval(timer);
  }, [uid, refreshCooldowns]);

  const save = useCallback(async () => {
    if (!uid || !firebaseEnabled) {
      setError("로그인 후 이용할 수 있습니다.");
      return false;
    }

    if (!emailVerified) {
      setError("이메일 인증 후 클라우드 저장을 이용할 수 있습니다.");
      return false;
    }

    const remaining = getSaveCooldownRemainingMs(uid, cloudSavedAt);
    if (remaining > 0) {
      setError(saveCooldownMessage(remaining));
      setSaveCooldownMs(remaining);
      return false;
    }

    setBusy(true);
    setError("");
    setLastAction("");
    try {
      const currentUser = await refreshAuthSession();
      if (!currentUser?.emailVerified) {
        setError("이메일 인증 후 클라우드 저장을 이용할 수 있습니다. 계정 → 인증 확인을 눌러 주세요.");
        return false;
      }

      const payload = buildProgressPayload(getSnapshot());
      if (!payload) {
        setError("저장할 데이터를 만들 수 없습니다.");
        return false;
      }

      await saveUserProgress(payload);
      recordLocalSyncTime(saveCooldownStorageKey(uid));
      setCloudSavedAt(payload.savedAt);
      setSaveCooldownMs(getSaveCooldownRemainingMs(uid, payload.savedAt));
      setLastAction("saved");
      return true;
    } catch (err) {
      console.error(err);
      setError(formatSyncError(err, "save"));
      return false;
    } finally {
      setBusy(false);
    }
  }, [uid, firebaseEnabled, emailVerified, cloudSavedAt, getSnapshot]);

  const load = useCallback(async () => {
    if (!uid || !firebaseEnabled) {
      setError("로그인 후 이용할 수 있습니다.");
      return false;
    }

    if (!emailVerified) {
      setError("이메일 인증 후 클라우드 불러오기를 이용할 수 있습니다.");
      return false;
    }

    const remaining = getLoadCooldownRemainingMs(uid);
    if (remaining > 0) {
      setError(loadCooldownMessage(remaining));
      setLoadCooldownMs(remaining);
      return false;
    }

    setBusy(true);
    setError("");
    setLastAction("");
    try {
      const currentUser = await refreshAuthSession();
      if (!currentUser?.emailVerified) {
        setError("이메일 인증 후 클라우드 불러오기를 이용할 수 있습니다. 계정 → 인증 확인을 눌러 주세요.");
        return false;
      }

      const progress = await loadUserProgress();
      if (!progress?.savedAt) {
        setError("클라우드에 저장된 진행이 없습니다.");
        return false;
      }

      applySnapshot(progress);
      recordLocalSyncTime(loadCooldownStorageKey(uid));
      setCloudSavedAt(progress.savedAt);
      setLoadCooldownMs(getLoadCooldownRemainingMs(uid));
      setLastAction("loaded");
      return true;
    } catch (err) {
      console.error(err);
      setError(formatSyncError(err, "load"));
      return false;
    } finally {
      setBusy(false);
    }
  }, [uid, firebaseEnabled, emailVerified, applySnapshot]);

  const clearError = useCallback(() => setError(""), []);
  const clearLastAction = useCallback(() => setLastAction(""), []);

  return {
    busy,
    error,
    cloudSavedAt,
    lastAction,
    saveCooldownMs,
    loadCooldownMs,
    save,
    load,
    refreshMeta,
    clearError,
    clearLastAction,
  };
}
