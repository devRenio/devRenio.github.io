import { DATA_VERSION, EMPTY_STATS, STORAGE_KEY } from "../constants/app";

function migrateFromV11(data) {
  return {
    ...data,
    version: DATA_VERSION,
    verseWrongCounts: data.verseWrongCounts ?? {},
    completedVerseRefs: data.completedVerseRefs ?? [],
    mergeBlanks: data.mergeBlanks ?? false,
  };
}

export function loadStoredData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw);

    if (parsed.version === DATA_VERSION) {
      return {
        ...parsed,
        verseWrongCounts: parsed.verseWrongCounts ?? {},
        completedVerseRefs: parsed.completedVerseRefs ?? [],
        mergeBlanks: parsed.mergeBlanks ?? false,
        cumulativeStats: parsed.cumulativeStats ?? { ...EMPTY_STATS },
      };
    }

    if (parsed.version === "v1.1") {
      console.log("데이터 v1.1 → v1.2 마이그레이션");
      return migrateFromV11(parsed);
    }

    console.log("알 수 없는 데이터 버전 — 기본값으로 시작합니다.");
    return {};
  } catch (err) {
    console.log(err);
    return {};
  }
}

export function buildStoragePayload(state) {
  return {
    version: DATA_VERSION,
    theme: state.theme,
    fontFamily: state.fontFamily,
    fontSize: state.fontSize,
    isBold: state.isBold,
    courseName: state.courseName,
    failNum: state.failNum,
    wrongVerses: state.wrongVerses,
    scripture: state.scripture,
    selectedScriptures: state.selectedScriptures,
    currentMode: state.currentMode,
    blankNum: state.blankNum,
    wholeLevelNum: state.wholeLevelNum,
    currentProblem: state.currentProblem,
    cumulativeStats: state.cumulativeStats,
    hasFailedCurrent: state.hasFailedCurrent,
    verseWrongCounts: state.verseWrongCounts,
    completedVerseRefs: state.completedVerseRefs,
    mergeBlanks: state.mergeBlanks,
  };
}

export function saveStoredData(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(buildStoragePayload(state)));
}
