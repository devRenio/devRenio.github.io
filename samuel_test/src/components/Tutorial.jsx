import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { MODE_GUIDE } from "../data/tutorialSteps";
import "./Tutorial.css";

const PAD = 8;
const RADIUS = 12;
const MASK_ID = "samuel-tutorial-mask";

function renderStepText(text) {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part.split("\n").map((line, j, arr) => (
      <span key={`${i}-${j}`}>
        {line}
        {j < arr.length - 1 && <br />}
      </span>
    ));
  });
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getTargetRect(el, target, isDesktop) {
  if (isDesktop && target === "mode-bar") {
    const groups = el.querySelectorAll(".mode-group");
    if (groups.length > 0) {
      let top = Infinity;
      let left = Infinity;
      let right = -Infinity;
      let bottom = -Infinity;

      groups.forEach((group) => {
        const r = group.getBoundingClientRect();
        top = Math.min(top, r.top);
        left = Math.min(left, r.left);
        right = Math.max(right, r.right);
        bottom = Math.max(bottom, r.bottom);
      });

      return DOMRect.fromRect({
        x: left,
        y: top,
        width: right - left,
        height: bottom - top,
      });
    }
  }

  return el.getBoundingClientRect();
}

function toSpotRect(rect) {
  return {
    top: rect.top - PAD,
    left: rect.left - PAD,
    width: rect.width + PAD * 2,
    height: rect.height + PAD * 2,
  };
}

export default function Tutorial({
  active,
  stepIndex,
  steps,
  onNext,
  onRequestSkip,
  isDesktop = false,
}) {
  const step = steps[stepIndex];
  const [spot, setSpot] = useState(null);
  const [cardPos, setCardPos] = useState({ top: 0, left: 0 });
  const [viewport, setViewport] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));

  const measure = useCallback(() => {
    if (!active || !step) return;

    setViewport({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    if (step.type === "center") {
      setSpot(null);
      setCardPos({ top: 0, left: 0 });
      return;
    }

    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (!el) {
      setSpot(null);
      return;
    }

    el.scrollIntoView({ block: "nearest", behavior: "instant" });

    const applySpot = () => {
      const rect = getTargetRect(el, step.target, isDesktop);
      const nextSpot = toSpotRect(rect);
      setSpot(nextSpot);

      const cardWidth = Math.min(420, window.innerWidth - 32);
      const cardHeightEstimate = step.type === "modes" ? 420 : 200;
      const gap = 16;
      let top;
      const left = clamp(
        nextSpot.left + nextSpot.width / 2 - cardWidth / 2,
        16,
        window.innerWidth - cardWidth - 16,
      );

      const preferBottom = step.placement !== "top";
      const spaceBelow = window.innerHeight - (nextSpot.top + nextSpot.height);
      const spaceAbove = nextSpot.top;

      if (preferBottom && spaceBelow > cardHeightEstimate + gap) {
        top = nextSpot.top + nextSpot.height + gap;
      } else if (spaceAbove > cardHeightEstimate + gap) {
        top = nextSpot.top - cardHeightEstimate - gap;
      } else {
        top = clamp(
          nextSpot.top + nextSpot.height + gap,
          16,
          window.innerHeight - cardHeightEstimate - 16,
        );
      }

      setCardPos({ top, left, width: cardWidth });
    };

    applySpot();
    window.requestAnimationFrame(applySpot);
  }, [active, step, isDesktop]);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [measure, stepIndex]);

  useEffect(() => {
    if (!active) return;
    document.body.classList.add("samuel-tutorial");
    return () => document.body.classList.remove("samuel-tutorial");
  }, [active]);

  if (!active || !step) return null;

  const isCenter = step.type === "center";
  const isLast = stepIndex === steps.length - 1;

  const content = (
    <div
      className="tutorial-root"
      role="dialog"
      aria-modal="true"
      aria-label="튜토리얼"
    >
      {spot ? (
        <svg
          className="tutorial-mask-svg"
          aria-hidden="true"
          width={viewport.width}
          height={viewport.height}
        >
          <defs>
            <mask id={MASK_ID}>
              <rect width="100%" height="100%" fill="white" />
              <rect
                x={spot.left}
                y={spot.top}
                width={spot.width}
                height={spot.height}
                rx={RADIUS}
                ry={RADIUS}
                fill="black"
              />
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            className="tutorial-mask-fill"
            mask={`url(#${MASK_ID})`}
          />
        </svg>
      ) : (
        <div className="tutorial-backdrop" />
      )}

      {spot && (
        <div
          className="tutorial-spotlight-ring"
          style={{
            top: spot.top,
            left: spot.left,
            width: spot.width,
            height: spot.height,
            borderRadius: RADIUS,
          }}
        />
      )}

      <div
        className="tutorial-click-layer"
        role="button"
        tabIndex={-1}
        aria-label="다음 단계"
        onClick={onNext}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onNext();
          }
        }}
      />

      <div
        className={[
          "tutorial-card",
          isCenter ? "tutorial-card--center" : "",
          step.type === "modes" ? "tutorial-card--modes" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        style={
          isCenter
            ? undefined
            : {
                top: cardPos.top,
                left: cardPos.left,
                width: cardPos.width,
              }
        }
        onClick={(e) => e.stopPropagation()}
      >
        <div className="tutorial-progress">
          <div className="tutorial-progress-bar">
            <div
              className="tutorial-progress-fill"
              style={{
                width: `${((stepIndex + 1) / steps.length) * 100}%`,
              }}
            />
          </div>
          <span className="tutorial-progress-text">
            {stepIndex + 1} / {steps.length}
          </span>
        </div>

        <h2 className="tutorial-title">{step.title}</h2>

        {step.type === "modes" ? (
          <div className="tutorial-modes">
            {MODE_GUIDE.map((mode) => (
              <div key={mode.name} className="tutorial-mode-item">
                <div className="tutorial-mode-head">
                  <span className="tutorial-mode-name">{mode.name}</span>
                  <span className="tutorial-mode-badge">{mode.badge}</span>
                </div>
                <p className="tutorial-mode-desc">{mode.desc}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="tutorial-desc">{renderStepText(step.description)}</p>
        )}

        <p className="tutorial-hint">
          {isLast ? "클릭하여 시작하기" : "화면을 클릭하면 다음으로"}
        </p>
      </div>

      <button
        type="button"
        className="tutorial-skip-btn"
        onClick={(e) => {
          e.stopPropagation();
          onRequestSkip();
        }}
      >
        건너뛰기
      </button>
    </div>
  );

  return createPortal(content, document.body);
}
