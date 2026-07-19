import { normToken } from "./memorizeLogic";

/**
 * 연속 구절 입력에 대한 부분 채점.
 * 맞힌 단어는 correct, 틀린/누락 단어는 blank으로 반환.
 */
export function gradePhrase(expectedTokens, userInput) {
  const userParts = userInput.trim().split(/\s+/).filter(Boolean);

  if (userParts.length === 0) {
    return {
      allCorrect: false,
      anyCorrect: false,
      segments: expectedTokens.map(() => ({ type: "blank" })),
      unmatchedTokens: [...expectedTokens],
    };
  }

  const segments = [];
  const unmatchedTokens = [];
  let ui = 0;
  let matchedCount = 0;

  for (const expected of expectedTokens) {
    const target = normToken(expected);
    let matched = false;

    if (ui < userParts.length && normToken(userParts[ui]) === target) {
      segments.push({ type: "correct", text: expected });
      ui++;
      matched = true;
      matchedCount++;
    } else {
      let combined = "";
      const startUi = ui;
      while (ui < userParts.length) {
        combined += normToken(userParts[ui]);
        ui++;
        if (combined === target) {
          segments.push({ type: "correct", text: expected });
          matched = true;
          matchedCount++;
          break;
        }
        if (combined.length > target.length) {
          ui = startUi + 1;
          break;
        }
      }
      if (!matched) {
        ui = startUi;
        segments.push({ type: "blank" });
        unmatchedTokens.push(expected);
      }
    }
  }

  const trailing = userParts.slice(ui);
  const allCorrect =
    matchedCount === expectedTokens.length && trailing.length === 0;

  return {
    allCorrect,
    anyCorrect: matchedCount > 0,
    segments,
    unmatchedTokens,
  };
}

/** 단일 문자열 phrase 정답과의 완전 일치 (공백·문장부호 무시) */
export function isFullPhraseMatch(expectedTokens, userInput) {
  const expected = expectedTokens.map(normToken).join("");
  const actual = userInput
    .trim()
    .split(/\s+/)
    .map(normToken)
    .join("");
  return expected === actual && expected.length > 0;
}
