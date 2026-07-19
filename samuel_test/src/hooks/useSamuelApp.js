import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { generateProblem, normToken } from "../utils/memorizeLogic";
import {
  DEFAULT_FONT,
  cssFontFamily,
  isBundledFont,
  preloadBundledFonts,
  resolveInitialFont,
} from "../utils/fonts";
import { TUTORIAL_STORAGE_KEY, getStepsForDevice } from "../data/tutorialSteps";
import { MOBILE_NOTICE_KEY } from "../constants/app";
import { BUNDLED_FONTS, INITIAL_FONTS, KOREAN_FONT_MAP } from "../constants/fonts";
import { loadStoredData, saveStoredData } from "../utils/storage";
import { mergeConsecutiveBlanks } from "../utils/mergeBlanks";
import {
  cleanText,
  createPhraseAnswer,
  isPhraseAnswer,
  partialSegmentsToText,
  phraseFailMarkers,
  phraseSuccessMarkers,
  replaceFirstBlank,
  replacePhraseBlank,
} from "../utils/problemText";
import { gradePhrase } from "../utils/phraseGrading";
import { formatScriptureData, getDayProgress } from "../utils/scriptureHelpers";
import { useIsMobile } from "./useIsMobile";
import { useKeyboardLayout } from "./useKeyboardLayout";

const EMPTY_SELECTED = [[], [], [], [], [], []];

export function useSamuelApp() {
  const savedData = useMemo(() => loadStoredData(), []);

  const [originalScriptures, setOriginalScriptures] = useState([]);
  const [selectedScriptures, setSelectedScriptures] = useState(
    savedData.selectedScriptures || EMPTY_SELECTED.map((a) => [...a]),
  );
  const [activeMenu, setActiveMenu] = useState(null);
  const [scripture, setScripture] = useState(savedData.scripture || []);
  const [courseName, setCourseName] = useState(
    savedData.courseName || "과정 미선택",
  );
  const [leftVerse, setLeftVerse] = useState(
    savedData.scripture ? savedData.scripture.length : 0,
  );
  const [failNum, setFailNum] = useState(savedData.failNum || 0);
  const [wrongVerses, setWrongVerses] = useState(savedData.wrongVerses || []);
  const [cumulativeStats, setCumulativeStats] = useState(
    savedData.cumulativeStats || { total: 0, correct: 0, wrong: 0 },
  );
  const [verseWrongCounts, setVerseWrongCounts] = useState(
    savedData.verseWrongCounts || {},
  );
  const [completedVerseRefs, setCompletedVerseRefs] = useState(
    savedData.completedVerseRefs || [],
  );
  const [mergeBlanks, setMergeBlanks] = useState(savedData.mergeBlanks ?? false);

  const [currentProblem, setCurrentProblem] = useState(
    savedData.currentProblem || null,
  );
  const [userInput, setUserInput] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const [currentMode, setCurrentMode] = useState(savedData.currentMode || 1);
  const [blankNum, setBlankNum] = useState(savedData.blankNum || 5);
  const [wholeLevelNum, setWholeLevelNum] = useState(
    savedData.wholeLevelNum || 2,
  );

  const [fontSize, setFontSize] = useState(savedData.fontSize || 30);
  const [isBold, setIsBold] = useState(
    savedData.isBold !== undefined ? savedData.isBold : false,
  );
  const [fontFamilies, setFontFamilies] = useState(INITIAL_FONTS);
  const [fontFamily, setFontFamily] = useState(() =>
    resolveInitialFont(savedData.fontFamily, window.innerWidth < 768),
  );

  const [activeModal, setActiveModal] = useState(null);
  const [statsTab, setStatsTab] = useState("summary");

  const inputRef = useRef(null);
  const navRef = useRef(null);
  const problemContainerRef = useRef(null);
  const submitLockRef = useRef(false);
  const attemptsRef = useRef(0);
  const mergeBlanksRef = useRef(mergeBlanks);
  mergeBlanksRef.current = mergeBlanks;

  const isMobile = useIsMobile();
  const keyboard = useKeyboardLayout(isMobile, inputRef);

  const activeFontFamily = cssFontFamily(fontFamily);
  const displayFontSize = isMobile
    ? Math.min(fontSize, keyboard.typingMode ? 18 : 22)
    : fontSize;
  const inputFontSize = Math.max(16, displayFontSize * 0.7);

  const [theme, setTheme] = useState(savedData.theme || "light");
  const [isError, setIsError] = useState(false);
  const [hasFailedCurrent, setHasFailedCurrent] = useState(
    savedData.hasFailedCurrent || false,
  );

  const [alertMessage, setAlertMessage] = useState("");
  const [onConfirm, setOnConfirm] = useState(null);
  const [showMobileNotice, setShowMobileNotice] = useState(false);
  const [tutorialActive, setTutorialActive] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [showTutorialSkipConfirm, setShowTutorialSkipConfirm] = useState(false);
  const tutorialSteps = getStepsForDevice(isMobile);

  const toggleMenu = (menuName) => {
    setActiveMenu((prev) => (prev === menuName ? null : menuName));
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  const showConfirm = (message, onOk) => {
    setAlertMessage(message);
    setOnConfirm(() => onOk);
    setActiveModal("confirm");
  };

  const completeTutorial = useCallback(() => {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
    setTutorialActive(false);
    setTutorialStep(0);
    setShowTutorialSkipConfirm(false);
  }, []);

  const startTutorial = useCallback(() => {
    setTutorialStep(0);
    setTutorialActive(true);
    setShowTutorialSkipConfirm(false);
    setActiveModal(null);
    setActiveMenu(null);
  }, []);

  const advanceTutorial = useCallback(() => {
    if (tutorialStep >= tutorialSteps.length - 1) {
      completeTutorial();
      return;
    }
    setTutorialStep((prev) => prev + 1);
  }, [tutorialStep, tutorialSteps.length, completeTutorial]);

  const applyMergeIfEnabled = useCallback((problemText, answers) => {
    if (!mergeBlanksRef.current) return { problemText, answers };
    return mergeConsecutiveBlanks(problemText, answers);
  }, []);

  const buildProblemForVerse = useCallback(
    (selected, mode, bNum, wNum) => {
      const actualBlankNum = mode === 5 ? 10 : bNum;

      const problem = generateProblem(selected, mode === 5 ? 1 : mode, {
        blankNum: actualBlankNum,
        wholeLevelNum: wNum,
      });

      let finalProblemText = problem.problemText;
      let finalAnswers = [...problem.answers];

      if (mode === 5) {
        let bodyText = finalProblemText.replace(/^\(.+?\)\s*/, "");
        bodyText = bodyText.replace(/_+/g, "_");

        const match = selected.reference.match(/\((.+?) (\d+):(.+?)\)/);
        let maskedRefStr = selected.reference;

        if (match) {
          const [, book, chap, verse] = match;

          if (Math.random() > 0.5) {
            const maskedVerse = verse.replace(/\d+/g, "_");
            maskedRefStr = `(${book} ${chap}:${maskedVerse})`;
            const verseNumbers = verse.match(/\d+/g);
            if (verseNumbers) finalAnswers.unshift(...verseNumbers);
          } else {
            maskedRefStr = `(${book} _:${verse})`;
            finalAnswers.unshift(chap);
          }
        }

        finalProblemText = `${maskedRefStr} ${bodyText}`;
      }

      const merged = applyMergeIfEnabled(finalProblemText, finalAnswers);

      return {
        ...problem,
        problemText: merged.problemText,
        answers: merged.answers,
        raw: selected,
        topic: selected.topic,
      };
    },
    [applyMergeIfEnabled],
  );

  const displayProblem = useCallback(
    (mode, list = scripture, bNum = blankNum, wNum = wholeLevelNum) => {
      if (list.length === 0) {
        setCurrentProblem(null);
        setUserInput("");
        setAttempts(0);
        attemptsRef.current = 0;
        setIsCompleted(false);
        setHasFailedCurrent(false);
        return;
      }

      const problemNum = Math.floor(Math.random() * list.length);
      const selected = list[problemNum];
      const built = buildProblemForVerse(selected, mode, bNum, wNum);

      setCurrentProblem({
        ...built,
        indexInList: problemNum,
      });
      setAttempts(0);
      attemptsRef.current = 0;
      setIsCompleted(false);
      setUserInput("");
      setHasFailedCurrent(false);

      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 0);
    },
    [scripture, blankNum, wholeLevelNum, buildProblemForVerse],
  );

  const markVerseCompleted = useCallback((reference) => {
    setCompletedVerseRefs((prev) =>
      prev.includes(reference) ? prev : [...prev, reference],
    );
  }, []);

  const recordVerseWrong = useCallback((reference) => {
    setVerseWrongCounts((prev) => ({
      ...prev,
      [reference]: (prev[reference] || 0) + 1,
    }));
  }, []);

  const advanceToNextVerse = useCallback(
    (reference, indexInList) => {
      if (reference) markVerseCompleted(reference);
      const newList = scripture.filter((_, i) => i !== indexInList);
      setScripture(newList);
      setLeftVerse(newList.length);
      displayProblem(currentMode, newList);
    },
    [scripture, currentMode, displayProblem, markVerseCompleted],
  );

  const handleCorrect = useCallback(
    (answer) => {
      const isPhrase = isPhraseAnswer(answer);
      const base = cleanText(currentProblem.problemText);
      const marker = isPhrase
        ? phraseSuccessMarkers(answer.tokens)
        : `{{S:${answer}}}`;

      const updatedText = isPhrase
        ? replacePhraseBlank(base, marker)
        : replaceFirstBlank(base, marker);

      const remainingAnswers = currentProblem.answers.slice(1);

      setCurrentProblem({
        ...currentProblem,
        problemText: updatedText,
        answers: remainingAnswers,
      });
      setUserInput("");
      setAttempts(0);
      attemptsRef.current = 0;

      if (remainingAnswers.length === 0) {
        setIsCompleted(true);
        if (!hasFailedCurrent) {
          setCumulativeStats((prev) => ({
            ...prev,
            total: prev.total + 1,
            correct: prev.correct + 1,
          }));
        }
      }
    },
    [currentProblem, hasFailedCurrent],
  );

  const handlePartialPhrase = useCallback(
    (segments, unmatchedTokens) => {
      const base = cleanText(currentProblem.problemText);
      const partialText = partialSegmentsToText(segments);
      const updatedText = replacePhraseBlank(base, partialText);

      const remainingAnswers =
        unmatchedTokens.length > 0 ? [createPhraseAnswer(unmatchedTokens)] : [];

      setCurrentProblem({
        ...currentProblem,
        problemText: updatedText,
        answers: [...remainingAnswers, ...currentProblem.answers.slice(1)],
      });
      setUserInput("");
      setAttempts(0);
      attemptsRef.current = 0;
    },
    [currentProblem],
  );

  const handleWrong = useCallback(
    (answer) => {
      const isPhrase = isPhraseAnswer(answer);
      const failMarker = isPhrase
        ? phraseFailMarkers(answer.tokens)
        : `{{F:${answer}}}`;

      const newAttempts = attemptsRef.current + 1;
      attemptsRef.current = newAttempts;
      setAttempts(newAttempts);
      setUserInput("");

      if (newAttempts >= 3) {
        setIsError(false);

        if (
          !wrongVerses.some((v) => v.reference === currentProblem.reference)
        ) {
          setWrongVerses((prev) => [...prev, currentProblem.raw]);
        }
        setFailNum((prev) => prev + 1);
        recordVerseWrong(currentProblem.reference);

        if (!hasFailedCurrent) {
          setHasFailedCurrent(true);
          setCumulativeStats((prev) => ({
            ...prev,
            total: prev.total + 1,
            wrong: prev.wrong + 1,
          }));
        }

        const base = cleanText(currentProblem.problemText);
        const updatedText = isPhrase
          ? replacePhraseBlank(base, failMarker)
          : replaceFirstBlank(base, failMarker);
        const remainingAnswers = currentProblem.answers.slice(1);

        setCurrentProblem({
          ...currentProblem,
          problemText: updatedText,
          answers: remainingAnswers,
        });

        setAttempts(0);
        attemptsRef.current = 0;
        if (remainingAnswers.length === 0) setIsCompleted(true);
      } else {
        setIsError(true);
        setTimeout(() => setIsError(false), 400);
      }
    },
    [currentProblem, wrongVerses, hasFailedCurrent, recordVerseWrong],
  );

  const submitAnswer = useCallback(
    (inputOverride) => {
      if (!currentProblem) return;

      const input = inputOverride ?? userInput;
      const shouldAdvance =
        isCompleted || currentProblem.answers.length === 0;

      if (shouldAdvance) {
        advanceToNextVerse(
          currentProblem.reference,
          currentProblem.indexInList,
        );
        return;
      }

      if (submitLockRef.current) return;
      submitLockRef.current = true;
      window.setTimeout(() => {
        submitLockRef.current = false;
      }, 300);

      const currentAnswer = currentProblem.answers[0];

      if (isPhraseAnswer(currentAnswer)) {
        const result = gradePhrase(currentAnswer.tokens, input);
        if (result.allCorrect) {
          handleCorrect(currentAnswer);
        } else if (result.anyCorrect) {
          handlePartialPhrase(result.segments, result.unmatchedTokens);
        } else {
          handleWrong(currentAnswer);
        }
        return;
      }

      if (normToken(input) === normToken(currentAnswer)) {
        handleCorrect(currentAnswer);
      } else {
        handleWrong(currentAnswer);
      }
    },
    [
      currentProblem,
      userInput,
      isCompleted,
      advanceToNextVerse,
      handleCorrect,
      handlePartialPhrase,
      handleWrong,
    ],
  );

  const handleBlankLevel = (num) => {
    const newLevel = num + 1;
    setBlankNum(newLevel);
    setCurrentMode(1);
    displayProblem(1, scripture, newLevel, wholeLevelNum);
    setActiveModal(null);
  };

  const handleWholeLevel = (num) => {
    setWholeLevelNum(num);
    setCurrentMode(4);
    displayProblem(4, scripture, blankNum, num);
    setActiveModal(null);
  };

  const selectCourse = (num) => {
    const newSelected = EMPTY_SELECTED.map(() => []);
    originalScriptures.forEach((dayList, i) => {
      dayList.forEach((v) => {
        if (v.course <= num) newSelected[i].push(v);
      });
    });
    setSelectedScriptures(newSelected);
    setCourseName(`${num}과정`);
  };

  const selectDay = (num) => {
    let toAdd = [];
    if (num === 7) {
      selectedScriptures.forEach((list) => {
        toAdd = [...toAdd, ...list];
      });
    } else {
      toAdd = selectedScriptures[num - 1];
    }

    const newList = [...scripture, ...toAdd];
    setScripture(newList);
    setLeftVerse(newList.length);
    displayProblem(currentMode, newList);
  };

  const dayReset = () => {
    setScripture([]);
    setLeftVerse(0);
    setFailNum(0);
    setWrongVerses([]);
    setCurrentProblem(null);
    setUserInput("");
    setHasFailedCurrent(false);
  };

  const requestDayReset = () => {
    showConfirm(
      "암송 목록과 진행 상황을 초기화하시겠습니까?\n틀린 구절 목록도 함께 삭제됩니다.",
      dayReset,
    );
  };

  const handleKeyDown = (e) => {
    if (e.nativeEvent.isComposing) return;

    const isEnter =
      e.key === "Enter" || e.code === "Enter" || e.keyCode === 13;
    const isSpace =
      e.code === "Space" || e.key === " " || e.key === "Spacebar";

    if (isEnter) {
      e.preventDefault();
      submitAnswer();
      return;
    }

    if (isSpace) {
      if (mergeBlanksRef.current) return;
      e.preventDefault();
      submitAnswer();
    }
  };

  const handleBeforeInput = (e) => {
    if (e.nativeEvent.isComposing) return;

    const isLineBreak = e.inputType === "insertLineBreak";
    const isSpaceInsert =
      e.inputType === "insertText" &&
      (e.data === " " || e.data === "\u00a0");

    if (mergeBlanksRef.current) {
      if (isLineBreak) {
        e.preventDefault();
        submitAnswer();
      }
      return;
    }

    if (isLineBreak || isSpaceInsert) {
      e.preventDefault();
      submitAnswer();
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;

    if (mergeBlanksRef.current) {
      setUserInput(value);
      return;
    }

    if (
      isMobile &&
      !e.nativeEvent.isComposing &&
      value.endsWith(" ")
    ) {
      if (isCompleted || currentProblem?.answers.length === 0) {
        setUserInput("");
        submitAnswer();
        return;
      }

      const trimmed = value.trimEnd();
      if (trimmed.length > 0) {
        setUserInput(trimmed);
        submitAnswer(trimmed);
        return;
      }

      setUserInput("");
      return;
    }

    setUserInput(value);
  };

  const loadSystemFonts = async () => {
    if (isMobile) {
      setAlertMessage(
        "모바일에서는 앱에 포함된 글꼴만 사용할 수 있습니다. 목록에서 선택해 주세요.",
      );
      setActiveModal("alert");
      return;
    }

    if (!window.queryLocalFonts) {
      setAlertMessage("이 브라우저는 시스템 폰트 접근을 지원하지 않습니다.");
      setActiveModal("alert");
      return;
    }

    try {
      const availableFonts = await window.queryLocalFonts();
      const krRegex = /[ㄱ-ㅎㅏ-ㅣ가-힣]/;
      const fontMap = new Map();

      BUNDLED_FONTS.forEach((f) => {
        fontMap.set(f.realName, f);
      });

      availableFonts.forEach((f) => {
        if (f.family.startsWith("@")) return;
        if (fontMap.has(f.family)) return;

        let displayName = f.family;
        if (KOREAN_FONT_MAP[f.family]) {
          displayName = KOREAN_FONT_MAP[f.family];
        } else if (krRegex.test(f.fullName)) {
          displayName = f.fullName;
        } else if (krRegex.test(f.family)) {
          displayName = f.family;
        }

        fontMap.set(f.family, {
          realName: f.family,
          displayName,
        });
      });

      const combinedList = Array.from(fontMap.values());
      combinedList.sort((a, b) =>
        a.displayName.localeCompare(b.displayName, "ko"),
      );

      setFontFamilies(combinedList);
      setAlertMessage(
        `${combinedList.length - BUNDLED_FONTS.length}개의 시스템 폰트를 불러왔습니다.`,
      );
      setActiveModal("alert");
    } catch (err) {
      console.error(err);
      setAlertMessage("폰트 접근 권한 승인이 필요합니다.");
      setActiveModal("alert");
    }
  };

  const handleMergeBlanksChange = (checked) => {
    mergeBlanksRef.current = checked;
    setMergeBlanks(checked);
    if (currentProblem && scripture.length > 0) {
      displayProblem(currentMode, scripture, blankNum, wholeLevelNum);
    }
  };

  const dismissMobileNotice = (permanent = false) => {
    if (permanent) {
      localStorage.setItem(MOBILE_NOTICE_KEY, "true");
    }
    setShowMobileNotice(false);
  };

  const dayProgressLabels = useMemo(() => {
    return [1, 2, 3, 4, 5, 6].map((dayNum) => {
      const progress = getDayProgress(
        dayNum - 1,
        selectedScriptures,
        completedVerseRefs,
      );
      if (!progress) return `${dayNum}일차`;
      return `${dayNum}일차 (${progress.completed}/${progress.total})`;
    });
  }, [selectedScriptures, completedVerseRefs]);

  useEffect(() => {
    if (isMobile) return;
    if (localStorage.getItem(MOBILE_NOTICE_KEY) === "true") return;
    setShowMobileNotice(true);
  }, [isMobile]);

  useEffect(() => {
    if (localStorage.getItem(TUTORIAL_STORAGE_KEY) === "true") return;
    if (showMobileNotice) return;
    const timer = window.setTimeout(() => {
      setTutorialActive(true);
      setTutorialStep(0);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [showMobileNotice]);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/scriptures.json`)
      .then((res) => res.json())
      .then((data) => setOriginalScriptures(formatScriptureData(data)));
  }, []);

  useEffect(() => {
    preloadBundledFonts();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!isMobile) return;
    setFontFamilies(
      BUNDLED_FONTS.sort((a, b) =>
        a.displayName.localeCompare(b.displayName, "ko"),
      ),
    );
    setFontFamily((prev) => (isBundledFont(prev) ? prev : DEFAULT_FONT));
  }, [isMobile]);

  useEffect(() => {
    if (!activeMenu) return;
    const handleClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [activeMenu]);

  useEffect(() => {
    if (!keyboard.typingMode || !problemContainerRef.current) return;

    const scrollActiveBlankIntoView = () => {
      const activeBlank = problemContainerRef.current?.querySelector(
        ".active-blank, .text-error-flash",
      );
      if (activeBlank) {
        activeBlank.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    };

    scrollActiveBlankIntoView();
    const timer = window.setTimeout(scrollActiveBlankIntoView, 320);
    return () => window.clearTimeout(timer);
  }, [keyboard.typingMode, keyboard.keyboardOpen, currentProblem?.problemText]);

  useEffect(() => {
    saveStoredData({
      theme,
      fontFamily,
      fontSize,
      isBold,
      courseName,
      failNum,
      wrongVerses,
      scripture,
      selectedScriptures,
      currentMode,
      blankNum,
      wholeLevelNum,
      currentProblem,
      cumulativeStats,
      hasFailedCurrent,
      verseWrongCounts,
      completedVerseRefs,
      mergeBlanks,
    });
  }, [
    theme,
    fontFamily,
    fontSize,
    isBold,
    courseName,
    failNum,
    wrongVerses,
    scripture,
    selectedScriptures,
    currentMode,
    blankNum,
    wholeLevelNum,
    currentProblem,
    cumulativeStats,
    hasFailedCurrent,
    verseWrongCounts,
    completedVerseRefs,
    mergeBlanks,
  ]);

  return {
    isMobile,
    theme,
    keyboard,
    navRef,
    inputRef,
    problemContainerRef,
    activeMenu,
    toggleMenu,
    courseName,
    leftVerse,
    failNum,
    scripture,
    wrongVerses,
    currentMode,
    blankNum,
    wholeLevelNum,
    currentProblem,
    userInput,
    isCompleted,
    isError,
    mergeBlanks,
    fontSize,
    isBold,
    fontFamily,
    fontFamilies,
    activeFontFamily,
    displayFontSize,
    inputFontSize,
    activeModal,
    setActiveModal,
    statsTab,
    setStatsTab,
    alertMessage,
    onConfirm,
    showMobileNotice,
    tutorialActive,
    tutorialStep,
    tutorialSteps,
    showTutorialSkipConfirm,
    setShowTutorialSkipConfirm,
    cumulativeStats,
    setCumulativeStats,
    verseWrongCounts,
    setVerseWrongCounts,
    selectedScriptures,
    completedVerseRefs,
    dayProgressLabels,
    toggleTheme,
    toggleFullscreen,
    displayProblem,
    selectCourse,
    selectDay,
    requestDayReset,
    submitAnswer,
    handleKeyDown,
    handleBeforeInput,
    handleInputChange,
    handleBlankLevel,
    handleWholeLevel,
    handleMergeBlanksChange,
    loadSystemFonts,
    setFontFamily,
    setFontSize,
    setIsBold,
    setCurrentMode,
    setScripture,
    setLeftVerse,
    setFailNum,
    setWrongVerses,
    showConfirm,
    startTutorial,
    advanceTutorial,
    completeTutorial,
    dismissMobileNotice,
  };
}
