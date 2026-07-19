import { createPhraseAnswer, isPhraseAnswer, PHRASE_BLANK } from "./problemText";

/** 공백만 있을 때만 빈칸 병합 — `:`, `-`, `,` 등 장절 기호는 유지 */
const WHITESPACE_ONLY = /^\s+$/;

/** `(참조)` 접두어의 끝 위치 — 없으면 0 */
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

function blankInReference(blank, refEnd) {
  return refEnd > 0 && blank.index < refEnd;
}

function shouldMergeBlanks(problemText, blanks, i, refEnd) {
  const prev = blanks[i - 1];
  const curr = blanks[i];
  const between = problemText.slice(prev.index + prev.length, curr.index);

  if (!WHITESPACE_ONLY.test(between)) return false;

  if (refEnd > 0) {
    if (blankInReference(prev, refEnd) !== blankInReference(curr, refEnd)) {
      return false;
    }
  }

  return true;
}

function toPhraseAnswer(answer) {
  if (isPhraseAnswer(answer)) return answer;
  return createPhraseAnswer([answer], PHRASE_BLANK);
}

/**
 * 연속 빈칸(공백으로만 구분)을 phrase 그룹으로 묶는다.
 * - 장절 `( … : … )` — 콜론·하이픈 등 기호 유지
 * - 장절 `( … )` 과 본문 `…` 분리
 * - 모든 phrase/단일 빈칸 → PHRASE_BLANK(…) 하나로 표시
 */
export function mergeConsecutiveBlanks(problemText, answers) {
  if (!problemText || answers.length === 0) {
    return { problemText, answers };
  }

  const blankPattern = /_+/g;
  const blanks = [];
  let match;
  while ((match = blankPattern.exec(problemText)) !== null) {
    blanks.push({ index: match.index, length: match[0].length });
  }

  if (blanks.length === 0 || blanks.length !== answers.length) {
    return { problemText, answers };
  }

  const refEnd = getReferenceEndIndex(problemText);

  const groups = [];
  let currentGroup = [0];

  for (let i = 1; i < blanks.length; i++) {
    if (shouldMergeBlanks(problemText, blanks, i, refEnd)) {
      currentGroup.push(i);
    } else {
      groups.push(currentGroup);
      currentGroup = [i];
    }
  }
  groups.push(currentGroup);

  let newText = "";
  let lastEnd = 0;
  const newAnswers = [];

  groups.forEach((group) => {
    const firstBlank = blanks[group[0]];
    const lastBlank = blanks[group.length - 1];

    newText += problemText.slice(lastEnd, firstBlank.index);

    if (group.length === 1) {
      newAnswers.push(toPhraseAnswer(answers[group[0]]));
    } else {
      const tokens = group.flatMap((idx) => {
        const ans = answers[idx];
        return isPhraseAnswer(ans) ? ans.tokens : [ans];
      });
      newAnswers.push(createPhraseAnswer(tokens, PHRASE_BLANK));
    }
    newText += PHRASE_BLANK;

    lastEnd = lastBlank.index + lastBlank.length;
  });

  newText += problemText.slice(lastEnd);
  return { problemText: newText, answers: newAnswers };
}
