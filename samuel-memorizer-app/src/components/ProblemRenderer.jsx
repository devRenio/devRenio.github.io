import { PHRASE_BLANK } from "../utils/problemText";

/**
 * 문제 텍스트 렌더링.
 * - `{{S:..}}` 정답(초록), `{{F:..}}` 오답(빨강)
 * - 활성 빈칸(빈칸 병합 ON이면 첫 `…`, OFF면 첫 `_+`) 하나만 깜빡임
 */
const ProblemRenderer = ({ text, isError, activeBlankDisplay }) => {
  if (!text) return null;

  const parts = text.split(/(\{\{[SF]:.*?\}\})/g);
  const usePhrase = activeBlankDisplay === PHRASE_BLANK;
  let highlighted = false;

  const activeClass = isError
    ? usePhrase
      ? "text-error-flash phrase-blank"
      : "text-error-flash"
    : usePhrase
      ? "active-blank phrase-blank"
      : "active-blank";

  const renderPlainPart = (part, key) => {
    if (highlighted) return part;

    let idx = -1;
    let len = 0;

    if (usePhrase) {
      idx = part.indexOf(PHRASE_BLANK);
      len = PHRASE_BLANK.length;
    } else {
      const m = part.match(/_+/);
      if (m) {
        idx = m.index;
        len = m[0].length;
      }
    }

    if (idx === -1) return part;

    highlighted = true;
    return (
      <span key={key}>
        {part.slice(0, idx)}
        <span className={activeClass}>{part.slice(idx, idx + len)}</span>
        {part.slice(idx + len)}
      </span>
    );
  };

  return (
    <>
      {parts.map((part, index) => {
        const key = `${index}-${part}`;

        if (part.startsWith("{{S:")) {
          return (
            <span key={key} className="text-success">
              {part.replace(/\{\{S:(.*)\}\}/, "$1")}
            </span>
          );
        }
        if (part.startsWith("{{F:")) {
          return (
            <span key={key} className="text-fail">
              {part.replace(/\{\{F:(.*)\}\}/, "$1")}
            </span>
          );
        }

        return renderPlainPart(part, key);
      })}
    </>
  );
};

export default ProblemRenderer;
