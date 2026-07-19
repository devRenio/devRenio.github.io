import { isPhraseAnswer } from "./problemText";

/**
 * problemText에서 연속된 빈칸(_+)을 하나로 합치고,
 * answers 배열에서 해당 항목들을 phrase 객체로 병합.
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

    if (/^[\s,.\-:;!?'"()]*$/.test(between)) {
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
    newText += "_";

    if (group.length === 1) {
      newAnswers.push(answers[group[0]]);
    } else {
      const tokens = group.flatMap((idx) => {
        const ans = answers[idx];
        return isPhraseAnswer(ans) ? ans.tokens : [ans];
      });
      newAnswers.push({ type: "phrase", tokens });
    }

    lastEnd = lastBlank.index + lastBlank.length;
  });

  newText += problemText.slice(lastEnd);
  return { problemText: newText, answers: newAnswers };
}
