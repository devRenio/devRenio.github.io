/**
 * 구절 reference → 일차(1~6) 매핑 테이블 생성
 */
export function buildReferenceDayMap(selectedScriptures) {
  const map = new Map();
  selectedScriptures.forEach((dayList, dayIndex) => {
    dayList.forEach((verse) => {
      map.set(verse.reference, dayIndex + 1);
    });
  });
  return map;
}

/** 일차별 진행률 { completed, total } */
export function getDayProgress(dayIndex, selectedScriptures, completedVerseRefs) {
  const verses = selectedScriptures[dayIndex] ?? [];
  if (verses.length === 0) return null;

  const completedSet = new Set(completedVerseRefs);
  const completed = verses.filter((v) => completedSet.has(v.reference)).length;
  return { completed, total: verses.length };
}

/** 일차별 구절 오답 목록 (오답 수 내림차순) */
export function getVerseWrongByDay(selectedScriptures, verseWrongCounts) {
  return selectedScriptures
    .map((dayList, dayIndex) => {
      const verses = dayList
        .map((v) => ({
          reference: v.reference,
          verse: v.verse,
          topic: v.topic,
          wrongCount: verseWrongCounts[v.reference] ?? 0,
        }))
        .filter((v) => v.wrongCount > 0)
        .sort((a, b) => b.wrongCount - a.wrongCount);

      return {
        day: dayIndex + 1,
        verses,
      };
    })
    .filter((d) => d.verses.length > 0);
}

/** fetch된 JSON을 6일 배열로 변환 */
export function formatScriptureData(data) {
  return [1, 2, 3, 4, 5, 6].map((d) => {
    const dayData = data.find((item) => item.day === d);
    if (!dayData) return [];

    return dayData.topics.flatMap((topic) =>
      topic.verses.map((v) => ({
        ...v,
        topic: topic.title,
      })),
    );
  });
}
