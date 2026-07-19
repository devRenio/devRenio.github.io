import { PHRASE_BLANK } from "../utils/problemText";

const ProblemRenderer = ({ text, isError, activeBlankDisplay }) => {
  if (!text) return null;

  const parts = text.split(/(\{\{[SF]:.*?\}\})/g);

  const renderPlainPart = (part) => {
    if (!part.includes("_") && !part.includes(PHRASE_BLANK)) return part;

    const phraseIdx =
      activeBlankDisplay === PHRASE_BLANK
        ? part.indexOf(PHRASE_BLANK)
        : -1;

    if (phraseIdx !== -1) {
      return (
        <>
          {part.slice(0, phraseIdx)}
          <span
            className={
              isError ? "text-error-flash phrase-blank" : "active-blank phrase-blank"
            }
          >
            {PHRASE_BLANK}
          </span>
          {part.slice(phraseIdx + PHRASE_BLANK.length)}
        </>
      );
    }

    if (activeBlankDisplay && part.includes(activeBlankDisplay)) {
      const start = part.indexOf(activeBlankDisplay);
      return (
        <>
          {part.slice(0, start)}
          <span className={isError ? "text-error-flash" : "active-blank"}>
            {activeBlankDisplay}
          </span>
          {part.slice(start + activeBlankDisplay.length)}
        </>
      );
    }

    let highlighted = false;
    const subParts = part.split(/(_+)/);
    return (
      <>
        {subParts.map((subPart, subIndex) => {
          if (!highlighted && subPart.startsWith("_")) {
            highlighted = true;
            return (
              <span
                key={subIndex}
                className={isError ? "text-error-flash" : "active-blank"}
              >
                {subPart}
              </span>
            );
          }
          return subPart;
        })}
      </>
    );
  };

  return (
    <>
      {parts.map((part, index) => {
        const uniqueKey = `${index}-${part}`;

        if (part.startsWith("{{S:")) {
          const content = part.replace(/\{\{S:(.*)\}\}/, "$1");
          return (
            <span key={uniqueKey} className="text-success">
              {content}
            </span>
          );
        }
        if (part.startsWith("{{F:")) {
          const content = part.replace(/\{\{F:(.*)\}\}/, "$1");
          return (
            <span key={uniqueKey} className="text-fail">
              {content}
            </span>
          );
        }

        if (!part.includes("_") && !part.includes(PHRASE_BLANK)) return part;

        return <span key={uniqueKey}>{renderPlainPart(part)}</span>;
      })}
    </>
  );
};

export default ProblemRenderer;
