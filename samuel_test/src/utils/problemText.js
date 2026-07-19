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

/** blankDisplay 영역을 replacement로 치환 */
export function replaceAnswerRegion(text, blankDisplay, replacement) {
  if (!blankDisplay) return replaceFirstBlank(text, replacement);
  const idx = text.indexOf(blankDisplay);
  if (idx === -1) return replaceFirstBlank(text, replacement);
  return (
    text.slice(0, idx) + replacement + text.slice(idx + blankDisplay.length)
  );
}

/** 현재 답안에 맞는 blankDisplay 반환 */
export function getBlankDisplay(answer) {
  if (isPhraseAnswer(answer)) return answer.blankDisplay || "_".repeat(answer.tokens.length);
  return null;
}

/** blankDisplay의 각 '_'를 토큰 마커로 변환 (구두점 유지) */
export function phraseMarkersFromDisplay(blankDisplay, tokens, markerChar) {
  let ti = 0;
  let out = "";
  for (let i = 0; i < blankDisplay.length; i++) {
    if (blankDisplay[i] === "_") {
      out += `{{${markerChar}:${tokens[ti++]}}}`;
    } else {
      out += blankDisplay[i];
    }
  }
  return out;
}

export function phraseToSuccessMarkers(tokens, blankDisplay) {
  if (blankDisplay) {
    return phraseMarkersFromDisplay(blankDisplay, tokens, "S");
  }
  return tokens.map((t) => `{{S:${t}}}`).join(" ");
}

export function phraseToFailMarkers(tokens, blankDisplay) {
  if (blankDisplay) {
    return phraseMarkersFromDisplay(blankDisplay, tokens, "F");
  }
  return `{{F:${tokens.join(" ")}}}`;
}

/** 부분 채점 결과를 blankDisplay 기준으로 변환 (구두점 유지) */
export function partialSegmentsToDisplay(blankDisplay, segments) {
  let segIdx = 0;
  let out = "";
  for (let i = 0; i < blankDisplay.length; i++) {
    if (blankDisplay[i] === "_") {
      const seg = segments[segIdx++];
      out += seg.type === "correct" ? `{{S:${seg.text}}}` : "_";
    } else {
      out += blankDisplay[i];
    }
  }
  return out;
}

/** 부분 채점 후 남은 unmatched 토큰용 blankDisplay */
export function remainingBlankDisplay(blankDisplay, segments) {
  let segIdx = 0;
  let out = "";
  let pendingSep = "";

  for (let i = 0; i < blankDisplay.length; i++) {
    if (blankDisplay[i] === "_") {
      const seg = segments[segIdx++];
      if (seg.type === "blank") {
        out += pendingSep + "_";
        pendingSep = "";
      }
    } else {
      pendingSep += blankDisplay[i];
    }
  }
  return out;
}

/** @deprecated partialResultToText — partialSegmentsToDisplay 사용 */
export function partialResultToText(segments) {
  return segments
    .map((seg) => {
      if (seg.type === "correct") return `{{S:${seg.text}}}`;
      return "_";
    })
    .join(" ");
}

export function createPhraseAnswer(tokens, blankDisplay) {
  return { type: "phrase", tokens, blankDisplay };
}
