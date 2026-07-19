/** 연속 빈칸(phrase) 전용 표시 문자 — 단어 수·글자 수 힌트 없음, 일반 '_' 와 구분 */
export const PHRASE_BLANK = "…";

export function cleanText(text) {
  if (!text) return "";
  return text.replace(/\{\{[SF]:(.*?)\}\}/g, "$1");
}

/** 첫 번째 활성 빈칸(_+)을 replacement로 치환 (연속 빈칸 OFF 경로) */
export function replaceFirstBlank(text, replacement) {
  return text.replace(/_+/, replacement);
}

/** 첫 번째 phrase 빈칸(…)을 replacement로 치환 (연속 빈칸 ON 경로) */
export function replacePhraseBlank(text, replacement) {
  const idx = text.indexOf(PHRASE_BLANK);
  if (idx === -1) return replaceFirstBlank(text, replacement);
  return (
    text.slice(0, idx) + replacement + text.slice(idx + PHRASE_BLANK.length)
  );
}

/** 답안 항목이 연속 구절(phrase)인지 판별 */
export function isPhraseAnswer(answer) {
  return answer && typeof answer === "object" && answer.type === "phrase";
}

export function createPhraseAnswer(tokens, blankDisplay = PHRASE_BLANK) {
  return { type: "phrase", tokens, blankDisplay };
}

/** 활성 답안의 표시 문자 — phrase면 '…', 아니면 null */
export function getBlankDisplay(answer) {
  return isPhraseAnswer(answer) ? PHRASE_BLANK : null;
}

/** phrase 토큰들을 정답 마커 문자열로 (모두 공개) */
export function phraseSuccessMarkers(tokens) {
  return tokens.map((t) => `{{S:${t}}}`).join(" ");
}

/** phrase 토큰들을 오답 마커 문자열로 (모두 공개) */
export function phraseFailMarkers(tokens) {
  return tokens.map((t) => `{{F:${t}}}`).join(" ");
}

/**
 * 부분 채점 결과를 표시 문자열로 변환.
 * 맞은 단어는 {{S:..}}, 연속된 미매칭 구간은 하나의 … 로 압축.
 */
export function partialSegmentsToText(segments) {
  const parts = [];
  let i = 0;
  while (i < segments.length) {
    if (segments[i].type === "correct") {
      parts.push(`{{S:${segments[i].text}}}`);
      i++;
    } else {
      while (i < segments.length && segments[i].type === "blank") i++;
      parts.push(PHRASE_BLANK);
    }
  }
  return parts.join(" ");
}
