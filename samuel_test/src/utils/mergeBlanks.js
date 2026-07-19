import { createPhraseAnswer, isPhraseAnswer, PHRASE_BLANK } from "./problemText";

/** `(참조)` 접두어의 끝 위치(닫는 괄호 다음) — 없으면 0 */
export function getReferenceEndIndex(text) {
  if (!text.startsWith("(")) return 0;

  let depth = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "(") depth++;
    if (text[i] === ")") {
      depth--;
      if (depth === 0) return i + 1;
    }
  }
  return 0;
}

/** i번째 빈칸 ↔ answers[i] 매핑을 위한 빈칸 위치 수집 */
function collectBlanks(problemText, answers) {
  const blanks = [];
  const re = /_+/g;
  let m;
  while ((m = re.exec(problemText)) !== null) {
    blanks.push({ index: m.index, length: m[0].length });
  }
  if (blanks.length !== answers.length) return null;
  return blanks;
}

function tokensOf(answer) {
  return isPhraseAnswer(answer) ? answer.tokens : [answer];
}

// 본문: 공백으로만 이어질 때 병합
const BODY_SEP = /^\s+$/;
// 장절 괄호 안: 공백·기호(: - , /)로 이어지면 병합, 기호는 버림
const REF_SEP = /^[\s:,\-/]*$/;

/**
 * 연속 빈칸 병합 (연속 빈칸 ON 전용).
 *
 * 규칙:
 *  1. 모든 빈칸은 길이 힌트 없이 PHRASE_BLANK(…) 로 표시.
 *  2. 장절 괄호 `(...)` 안: 빈칸이 공백/기호로 이어지면 한 덩어리 → 내부 기호 버리고 `(…)`.
 *     - 일부만 가려진 경우(예: `(창 8:_)`)는 보이는 부분 유지 → `(창 8:…)`.
 *  3. 본문: 공백으로만 이어진 빈칸끼리 한 덩어리 → `…`.
 *     - 공개 단어나 쉼표 등 기호를 만나면 덩어리가 끊김 → `…, …` (기호 유지, 정답 미포함).
 *  4. 각 덩어리는 phrase 정답(토큰 목록)으로 묶임.
 */
export function mergeConsecutiveBlanks(problemText, answers) {
  if (!problemText || answers.length === 0) {
    return { problemText, answers };
  }

  const blanks = collectBlanks(problemText, answers);
  if (!blanks) return { problemText, answers };

  const refEnd = getReferenceEndIndex(problemText);
  const inRef = (b) => refEnd > 0 && b.index < refEnd;

  const runs = [];
  let current = [0];

  for (let i = 1; i < blanks.length; i++) {
    const prev = blanks[i - 1];
    const curr = blanks[i];
    const between = problemText.slice(prev.index + prev.length, curr.index);

    const bothRef = inRef(prev) && inRef(curr);
    const bothBody = !inRef(prev) && !inRef(curr);
    const separator = bothRef ? REF_SEP : BODY_SEP;

    if ((bothRef || bothBody) && separator.test(between)) {
      current.push(i);
    } else {
      runs.push(current);
      current = [i];
    }
  }
  runs.push(current);

  let newText = "";
  let lastEnd = 0;
  const newAnswers = [];

  runs.forEach((run) => {
    const first = blanks[run[0]];
    const last = blanks[run[run.length - 1]];
    const tokens = run.flatMap((idx) => tokensOf(answers[idx]));

    // 장절 런: … 자리에 들어갈 원래 형식(괄호 제외 런 영역)을 보존
    // 예) 런 영역 "_ _:_,_" → "창 11:1,9" (감싸는 괄호는 … 바깥이라 제외)
    let displayFormat = null;
    if (inRef(first)) {
      const region = problemText.slice(first.index, last.index + last.length);
      let ti = 0;
      displayFormat = region.replace(/_+/g, () => tokens[ti++] ?? "_");
    }

    newText += problemText.slice(lastEnd, first.index);
    newText += PHRASE_BLANK;
    newAnswers.push(createPhraseAnswer(tokens, PHRASE_BLANK, displayFormat));

    lastEnd = last.index + last.length;
  });

  newText += problemText.slice(lastEnd);
  return { problemText: newText, answers: newAnswers };
}
