import {
  MAX_COMPLETED_REFS,
  MAX_COURSE_NUM,
  MAX_REF_LENGTH,
  MAX_STAT_VALUE,
  MAX_VERSE_WRONG_COUNT,
  MAX_VERSE_WRONG_KEYS,
  MAX_WRONG_REFS,
  MIN_COURSE_NUM,
  PROGRESS_VERSION,
} from "../constants/progress";
import { EMPTY_STATS } from "../constants/app";

const REF_PATTERN = /^\([^)]+\)$/;

function sanitizeRef(ref) {
  if (typeof ref !== "string") return null;
  const trimmed = ref.trim().slice(0, MAX_REF_LENGTH);
  if (!trimmed || !REF_PATTERN.test(trimmed)) return null;
  return trimmed;
}

function sanitizeRefList(list, maxLen) {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  const out = [];
  for (const item of list) {
    const ref = sanitizeRef(item);
    if (!ref || seen.has(ref)) continue;
    seen.add(ref);
    out.push(ref);
    if (out.length >= maxLen) break;
  }
  return out;
}

function sanitizeStats(raw) {
  const clamp = (n) =>
    Math.min(MAX_STAT_VALUE, Math.max(0, Math.floor(Number(n) || 0)));
  return {
    total: clamp(raw?.total),
    correct: clamp(raw?.correct),
    wrong: clamp(raw?.wrong),
  };
}

function sanitizeVerseWrongCounts(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};

  const out = {};
  let count = 0;
  for (const [key, value] of Object.entries(raw)) {
    if (count >= MAX_VERSE_WRONG_KEYS) break;
    const ref = sanitizeRef(key);
    if (!ref) continue;
    const n = Math.min(
      MAX_VERSE_WRONG_COUNT,
      Math.max(0, Math.floor(Number(value) || 0)),
    );
    if (n <= 0) continue;
    out[ref] = n;
    count += 1;
  }
  return out;
}

function sanitizeCourseNum(value) {
  const n = Math.floor(Number(value));
  if (n < MIN_COURSE_NUM || n > MAX_COURSE_NUM) return null;
  return n;
}

/** 저장·불러오기 공통 — 악의적/비정상 데이터 정규화 */
export function sanitizeProgressData(raw) {
  if (!raw || typeof raw !== "object") return null;

  const savedAt =
    typeof raw.savedAt === "string" && raw.savedAt.length <= 40
      ? raw.savedAt
      : null;

  const courseNum = sanitizeCourseNum(raw.courseNum);

  return {
    version: PROGRESS_VERSION,
    savedAt,
    cumulativeStats: sanitizeStats(raw.cumulativeStats ?? EMPTY_STATS),
    completedVerseRefs: sanitizeRefList(raw.completedVerseRefs, MAX_COMPLETED_REFS),
    verseWrongCounts: sanitizeVerseWrongCounts(raw.verseWrongCounts),
    wrongVerseRefs: sanitizeRefList(raw.wrongVerseRefs, MAX_WRONG_REFS),
    ...(courseNum != null ? { courseNum } : {}),
  };
}

/** Firestore 업로드 직전 스냅샷 → progress 문서 */
export function buildProgressPayload(snapshot) {
  return sanitizeProgressData({
    version: PROGRESS_VERSION,
    savedAt: new Date().toISOString(),
    cumulativeStats: snapshot.cumulativeStats,
    completedVerseRefs: snapshot.completedVerseRefs,
    verseWrongCounts: snapshot.verseWrongCounts,
    courseNum: snapshot.courseNum,
    wrongVerseRefs: snapshot.wrongVerseRefs,
  });
}

export function normalizeProgressData(raw) {
  return sanitizeProgressData(raw);
}

export function parseCourseNum(courseName) {
  const match = /^(\d+)과정$/.exec(courseName ?? "");
  if (!match) return null;
  return sanitizeCourseNum(Number(match[1]));
}

/** originalScriptures에서 reference 목록으로 구절 객체 복원 */
export function findVersesByRefs(originalScriptures, refs) {
  const safeRefs = sanitizeRefList(refs, MAX_WRONG_REFS);
  if (!safeRefs.length || !originalScriptures?.length) return [];

  const refSet = new Set(safeRefs);
  const found = [];

  originalScriptures.forEach((dayList) => {
    dayList.forEach((verse) => {
      if (refSet.has(verse.reference)) {
        found.push({ ...verse });
      }
    });
  });

  return safeRefs
    .map((ref) => found.find((v) => v.reference === ref))
    .filter(Boolean);
}
