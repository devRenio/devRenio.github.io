import { isPhraseAnswer, PHRASE_BLANK } from "./problemText";

const SEPARATOR_ONLY = /^[\s,.\-:;!?'"()/]*$/;

/**
 * 연속 빈칸을 phrase 그룹으로 묶는다.
 * phrase 그룹은 단어 수 힌트 없이 PHRASE_BLANK(…) 하나로 표시한다.
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

  const groups = [];
  let currentGroup = [0];

  for (let i = 1; i < blanks.length; i++) {
    const prev = blanks[i - 1];
    const curr = blanks[i];
    const between = problemText.slice(prev.index + prev.length, curr.index);

    if (SEPARATOR_ONLY.test(between)) {
      currentGroup.push(i);
    } else {
      groups.push(currentGroup);
      currentGroup = [i];
    }
  }
  groups.push(currentGroup);

  const hasMerge = groups.some((g) => g.length > 1);
  if (!hasMerge) return { problemText, answers };

  let newText = "";
  let lastEnd = 0;
  const newAnswers = [];

  groups.forEach((group) => {
    const firstBlank = blanks[group[0]];
    const lastBlank = blanks[group[group.length - 1]];

    newText += problemText.slice(lastEnd, firstBlank.index);

    if (group.length === 1) {
      newAnswers.push(answers[group[0]]);
      newText += "_";
    } else {
      const tokens = group.flatMap((idx) => {
        const ans = answers[idx];
        return isPhraseAnswer(ans) ? ans.tokens : [ans];
      });
      newAnswers.push({ type: "phrase", tokens, blankDisplay: PHRASE_BLANK });
      newText += PHRASE_BLANK;
    }

    lastEnd = lastBlank.index + lastBlank.length;
  });

  newText += problemText.slice(lastEnd);
  return { problemText: newText, answers: newAnswers };
}
