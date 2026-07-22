import {
  LOAD_COOLDOWN_MS,
  SAVE_COOLDOWN_MS,
  loadCooldownStorageKey,
  saveCooldownStorageKey,
} from "../constants/progress";

function parseTimestamp(value) {
  if (value == null) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Date.parse(String(value));
  return Number.isNaN(parsed) ? null : parsed;
}

function readLocalTimestamp(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export function recordLocalSyncTime(key) {
  try {
    localStorage.setItem(key, String(Date.now()));
  } catch {
    /* ignore quota errors */
  }
}

/** 가장 최근 저장/불러오기 시각(로컬·클라oud) 기준 남은 쿨다운(ms) */
export function getSyncCooldownRemainingMs({
  uid,
  kind,
  cloudSavedAt,
  cooldownMs,
}) {
  if (!uid) return 0;

  const storageKey =
    kind === "save" ? saveCooldownStorageKey(uid) : loadCooldownStorageKey(uid);
  const localMs = readLocalTimestamp(storageKey);
  const cloudMs = kind === "save" ? parseTimestamp(cloudSavedAt) : null;

  const lastMs = Math.max(localMs ?? 0, cloudMs ?? 0);
  if (!lastMs) return 0;

  return Math.max(0, cooldownMs - (Date.now() - lastMs));
}

export function getSaveCooldownRemainingMs(uid, cloudSavedAt) {
  return getSyncCooldownRemainingMs({
    uid,
    kind: "save",
    cloudSavedAt,
    cooldownMs: SAVE_COOLDOWN_MS,
  });
}

export function getLoadCooldownRemainingMs(uid) {
  return getSyncCooldownRemainingMs({
    uid,
    kind: "load",
    cloudSavedAt: null,
    cooldownMs: LOAD_COOLDOWN_MS,
  });
}

export function formatCooldownRemaining(ms) {
  const totalSec = Math.ceil(ms / 1000);
  if (totalSec >= 60) {
    const min = Math.ceil(totalSec / 60);
    return `${min}분`;
  }
  return `${totalSec}초`;
}

export function saveCooldownMessage(remainingMs) {
  return `${formatCooldownRemaining(remainingMs)} 후에 다시 저장할 수 있습니다.`;
}

export function loadCooldownMessage(remainingMs) {
  return `${formatCooldownRemaining(remainingMs)} 후에 다시 불러올 수 있습니다.`;
}
