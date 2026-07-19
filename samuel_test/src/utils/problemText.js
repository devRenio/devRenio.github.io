export function cleanText(text) {
  if (!text) return "";
  return text.replace(/\{\{[SF]:(.*?)\}\}/g, "$1");
}

/** 첫 번째 활성 빈칸(_+)을 치환 */
export function replaceFirstBlank(text, replacement) {
  return text.replace(/_+/, replacement);
}

/** 답안 항목이 연속 구절(phrase)인지 판별 */
export function isPhraseAnswer(answer) {
  return answer && typeof answer === "object" && answer.type === "phrase";
}

/** 답안 항목을 표시/채점용 토큰 배열로 변환 */
export function answerTokens(answer) {
  if (isPhraseAnswer(answer)) return answer.tokens;
  return [answer];
}

/** phrase 정답을 problemText 마커 문자열로 변환 */
export function phraseToSuccessMarkers(tokens) {
  return tokens.map((t) => `{{S:${t}}}`).join(" ");
}

/** 부분 채점 결과를 problemText 조각으로 변환 */
export function partialResultToText(segments) {
  return segments
    .map((seg) => {
      if (seg.type === "correct") return `{{S:${seg.text}}}`;
      return "_";
    })
    .join(" ");
}
