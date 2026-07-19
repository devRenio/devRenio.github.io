import { useEffect, useState } from "react";

export function useKeyboardLayout(isMobile, inputRef) {
  const [inputFocused, setInputFocused] = useState(false);
  const [viewport, setViewport] = useState(() => ({
    height: typeof window !== "undefined" ? window.innerHeight : 0,
    offsetTop: 0,
  }));

  useEffect(() => {
    if (!isMobile || !window.visualViewport) return;

    const vv = window.visualViewport;
    const update = () => {
      setViewport({
        height: vv.height,
        offsetTop: vv.offsetTop,
      });
    };

    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    update();

    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, [isMobile]);

  const keyboardHeight =
    typeof window !== "undefined"
      ? Math.max(0, window.innerHeight - viewport.height)
      : 0;

  const keyboardOpen = isMobile && inputFocused && keyboardHeight > 60;
  const typingMode = isMobile && inputFocused;

  useEffect(() => {
    if (!typingMode) return;
    document.body.classList.add("samuel-typing");
    return () => document.body.classList.remove("samuel-typing");
  }, [typingMode]);

  const handleInputFocus = () => setInputFocused(true);

  const handleInputBlur = () => {
    window.setTimeout(() => {
      if (document.activeElement !== inputRef.current) {
        setInputFocused(false);
      }
    }, 120);
  };

  const dismissKeyboard = () => {
    inputRef.current?.blur();
    setInputFocused(false);
  };

  return {
    typingMode,
    keyboardOpen,
    viewportHeight: viewport.height,
    viewportOffsetTop: viewport.offsetTop,
    handleInputFocus,
    handleInputBlur,
    dismissKeyboard,
  };
}
