const ProblemRenderer = ({ text, isError, activeBlankDisplay }) => {
  if (!text) return null;

  const parts = text.split(/(\{\{[SF]:.*?\}\})/g);

  const renderZone = (zone) => (
    <span
      className={`phrase-blank-zone ${isError ? "phrase-blank-error" : ""}`}
    >
      {zone.split("").map((ch, i) =>
        ch === "_" ? (
          <span
            key={i}
            className={isError ? "text-error-flash" : "active-blank"}
          >
            _
          </span>
        ) : (
          <span key={i} className="phrase-blank-sep">
            {ch}
          </span>
        ),
      )}
    </span>
  );

  const renderPlainPart = (part) => {
    if (!part.includes("_")) return part;

    if (activeBlankDisplay && part.includes(activeBlankDisplay)) {
      const start = part.indexOf(activeBlankDisplay);
      return (
        <>
          {part.slice(0, start)}
          {renderZone(activeBlankDisplay)}
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

        if (!part.includes("_")) return part;

        return <span key={uniqueKey}>{renderPlainPart(part)}</span>;
      })}
    </>
  );
};

export default ProblemRenderer;
