import { normToken } from "./memorizeLogic";

/** 입력을 공백·장절 기호(- , /)로 쪼개 정규화된 토큰 배열로 */
function tokenizeInput(userInput) {
  return userInput
    .trim()
    .split(/[\s\-,/]+/)
    .map(normToken)
    .filter(Boolean);
}

/**
 * 연속 구절 입력 부분 채점 — 단어 단위 LCS 정렬.
 * 붙여쓰기(얻는+줄=얻는줄)는 인정하지 않음: 띄어쓰기가 다르면 오답.
 * 장절 범위는 "38 39"/"38-39" 모두 같은 토큰으로 정규화되어 정답 처리.
 */
export function gradePhrase(expectedTokens, userInput) {
  const userWords = tokenizeInput(userInput);
  const exp = expectedTokens.map(normToken);
  const n = exp.length;
  const m = userWords.length;

  if (m === 0) {
    return {
      allCorrect: false,
      anyCorrect: false,
      segments: expectedTokens.map(() => ({ type: "blank" })),
      unmatchedTokens: [...expectedTokens],
    };
  }

  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      dp[i][j] =
        exp[i - 1] === userWords[j - 1]
          ? dp[i - 1][j - 1] + 1
          : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  const matched = new Array(n).fill(false);
  let i = n;
  let j = m;
  while (i > 0 && j > 0) {
    if (exp[i - 1] === userWords[j - 1]) {
      matched[i - 1] = true;
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  const segments = [];
  const unmatchedTokens = [];
  let matchedCount = 0;

  for (let k = 0; k < n; k++) {
    if (matched[k]) {
      segments.push({ type: "correct", text: expectedTokens[k] });
      matchedCount++;
    } else {
      segments.push({ type: "blank" });
      unmatchedTokens.push(expectedTokens[k]);
    }
  }

  return {
    allCorrect: matchedCount === n,
    anyCorrect: matchedCount > 0,
    segments,
    unmatchedTokens,
  };
}
