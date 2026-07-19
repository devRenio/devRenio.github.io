const ProblemRenderer = ({ text, isError }) => {
  if (!text) return null;

  const parts = text.split(/(\{\{[SF]:.*?\}\})/g);
  let targetLocation = null;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part.startsWith("{{") && part.includes("_")) {
      const subParts = part.split(/(_+)/);
      for (let j = 0; j < subParts.length; j++) {
        if (subParts[j].startsWith("_")) {
          targetLocation = { partIndex: i, subIndex: j };
          break;
        }
      }
    }
    if (targetLocation) break;
  }

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

        const subParts = part.split(/(_+)/);
        return (
          <span key={uniqueKey}>
            {subParts.map((subPart, subIndex) => {
              const isTarget =
                targetLocation &&
                targetLocation.partIndex === index &&
                targetLocation.subIndex === subIndex;

              if (isTarget) {
                return (
                  <span
                    key={`${subIndex}-${isTarget}`}
                    className={isError ? "text-error-flash" : "active-blank"}
                  >
                    {subPart}
                  </span>
                );
              }
              return subPart;
            })}
          </span>
        );
      })}
    </>
  );
};

export default ProblemRenderer;
