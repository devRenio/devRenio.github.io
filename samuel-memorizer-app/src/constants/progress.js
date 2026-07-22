export const PROGRESS_VERSION = 1;

/** 클라우드 저장 최소 간격 (5분) */
export const SAVE_COOLDOWN_MS = 5 * 60 * 1000;

/** 불러오기 최소 간격 (15초) */
export const LOAD_COOLDOWN_MS = 15 * 1000;

export const MAX_COMPLETED_REFS = 150;
export const MAX_WRONG_REFS = 100;
export const MAX_VERSE_WRONG_KEYS = 150;
export const MAX_VERSE_WRONG_COUNT = 9999;
export const MAX_REF_LENGTH = 32;
export const MAX_STAT_VALUE = 1_000_000;
export const MIN_COURSE_NUM = 1;
export const MAX_COURSE_NUM = 4;

export function saveCooldownStorageKey(uid) {
  return `samuel_progress_save_${uid}`;
}

export function loadCooldownStorageKey(uid) {
  return `samuel_progress_load_${uid}`;
}
