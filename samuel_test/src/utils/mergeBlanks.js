import { createPhraseAnswer, isPhraseAnswer, PHRASE_BLANK } from "./problemText";

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

function collectBlanks(problemText, answers) {
  const blanks = [];
  const re = /_+/g;
  let m;
  while ((m = re.exec(problemText)) !== null) {
    blanks.push({ index: m.index, length: m[0].length });
  }
  if (blanks.length !== answers.length) return null;
  return blanks.map((b, i) => ({ ...b, answerIndex: i }));
}

function answerTokensAt(answers, answerIndex) {
  const a = answers[answerIndex];
  return isPhraseAnswer(a) ? a.tokens : [a];
}

function buildPhraseAnswer(answers, blankEntries) {
  const tokens = blankEntries.flatMap((b) =>
    answerTokensAt(answers, b.answerIndex),
  );
  return createPhraseAnswer(tokens, PHRASE_BLANK);
}

/** 본문 빈칸 구간에 공개된 단어(한글·영문 등)가 끼어 있으면 true */
function bodySpanHasVisibleWords(text, bodyBlanks) {
  const start = bodyBlanks[0].index;
  const end =
    bodyBlanks[bodyBlanks.length - 1].index +
    bodyBlanks[bodyBlanks.length - 1].length;
  const span = text.slice(start, end).replace(/_+/g, "");
  return /[0-9A-Za-z가-힣]/.test(span);
}

/**
 * 연속 빈칸 단순 병합:
 * 1. 괄호 안 장절 빈칸 전체 → `( … )` (기호·괄호는 원문 그대로)
 * 2. 본문 빈칸 전체(공개 단어 없을 때만) → `…` 하나
 * 3. 빈칸 모드처럼 본문에 공개 단어가 있으면 본문은 `_` 유지
 */
export function mergeConsecutiveBlanks(problemText, answers) {
  if (!problemText || answers.length === 0) {
    return { problemText, answers };
  }

  const blanks = collectBlanks(problemText, answers);
  if (!blanks) return { problemText, answers };

  const refEnd = getReferenceEndIndex(problemText);
  const refBlanks =
    refEnd > 0 ? blanks.filter((b) => b.index < refEnd) : [];
  const bodyBlanks =
    refEnd > 0 ? blanks.filter((b) => b.index >= refEnd) : [...blanks];

  const bodyCanMerge =
    bodyBlanks.length > 0 &&
    !bodySpanHasVisibleWords(problemText, bodyBlanks);

  if (refBlanks.length === 0 && !bodyCanMerge) {
    return { problemText, answers };
  }

  let newText = "";
  let lastEnd = 0;
  const newAnswers = [];
  let blankIdx = 0;

  while (blankIdx < blanks.length) {
    const b = blanks[blankIdx];

    if (refBlanks.length > 0 && b === refBlanks[0]) {
      newText += problemText.slice(lastEnd, b.index);
      newAnswers.push(buildPhraseAnswer(answers, refBlanks));
      newText += PHRASE_BLANK;
      lastEnd =
        refBlanks[refBlanks.length - 1].index +
        refBlanks[refBlanks.length - 1].length;
      blankIdx += refBlanks.length;
      continue;
    }

    if (bodyCanMerge && b === bodyBlanks[0]) {
      newText += problemText.slice(lastEnd, b.index);
      newAnswers.push(buildPhraseAnswer(answers, bodyBlanks));
      newText += PHRASE_BLANK;
      lastEnd =
        bodyBlanks[bodyBlanks.length - 1].index +
        bodyBlanks[bodyBlanks.length - 1].length;
      blankIdx += bodyBlanks.length;
      continue;
    }

    if (
      refBlanks.some((r) => r.answerIndex === b.answerIndex) ||
      (bodyCanMerge &&
        bodyBlanks.some((r) => r.answerIndex === b.answerIndex))
    ) {
      blankIdx++;
      continue;
    }

    newText += problemText.slice(lastEnd, b.index);
    newAnswers.push(answers[b.answerIndex]);
    newText += "_";
    lastEnd = b.index + b.length;
    blankIdx++;
  }

  newText += problemText.slice(lastEnd);
  return { problemText: newText, answers: newAnswers };
}
