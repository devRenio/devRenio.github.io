import { useState, useEffect, useRef, useCallback } from "react";
import { generateProblem, normToken } from "./utils/memorizeLogic";
import {
  DEFAULT_FONT,
  cssFontFamily,
  isBundledFont,
  preloadBundledFonts,
  resolveInitialFont,
} from "./utils/fonts";

const BUNDLED_FONTS = [
  { realName: "GmarketSansBold", displayName: "G마켓 산스 Bold" },
  { realName: "GmarketSansMedium", displayName: "G마켓 산스 Medium" },
  { realName: "GmarketSansLight", displayName: "G마켓 산스 Light" },
  {
    realName: "HakgyoansimAllimjangB",
    displayName: "학교안심 알림장 Bold",
  },
  {
    realName: "HakgyoansimAllimjangR",
    displayName: "학교안심 알림장 Regular",
  },
  { realName: "MaruBuriSemiBold", displayName: "마루 부리 SemiBold" },
  { realName: "MaruBuriBold", displayName: "마루 부리 Bold" },
  { realName: "MaruBuriRegular", displayName: "마루 부리 Regular" },
  { realName: "MaruBuriLight", displayName: "마루 부리 Light" },
  {
    realName: "MaruBuriExtraLight",
    displayName: "마루 부리 ExtraLight",
  },
  {
    realName: "NanumSquareRoundEB",
    displayName: "나눔스퀘어라운드 ExtraBold",
  },
  {
    realName: "NanumSquareRoundB",
    displayName: "나눔스퀘어라운드 Bold",
  },
  {
    realName: "NanumSquareRoundR",
    displayName: "나눔스퀘어라운드 Regular",
  },
  {
    realName: "NanumSquareRoundL",
    displayName: "나눔스퀘어라운드 Light",
  },
  { realName: "RecipeKorea", displayName: "레코체" },
];

const KOREAN_FONT_MAP = {
  "Malgun Gothic": "맑은 고딕",
  Gulim: "굴림",
  Dotum: "돋움",
  Batang: "바탕",
  Gungsuh: "궁서",
  NanumGothic: "나눔고딕",
  NanumMyeongjo: "나눔명조",
  NanumSquare: "나눔스퀘어",
  NanumBarunGothic: "나눔바른고딕",
  Headline: "헤드라인",
  "New Gulim": "새굴림",
  "Apple SD Gothic Neo": "애플 SD 산돌고딕 Neo",
  PCMyungjo: "PC명조",
};

const INITIAL_FONTS = [
  ...BUNDLED_FONTS,
  ...Object.entries(KOREAN_FONT_MAP).map(([real, display]) => ({
    realName: real,
    displayName: `${display}`,
  })),
].sort((a, b) => a.displayName.localeCompare(b.displayName, "ko"));

const cleanText = (text) => {
  if (!text) return "";
  return text.replace(/\{\{[SF]:(.*?)\}\}/g, "$1");
};

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
        } else if (part.startsWith("{{F:")) {
          const content = part.replace(/\{\{F:(.*)\}\}/, "$1");
          return (
            <span key={uniqueKey} className="text-fail">
              {content}
            </span>
          );
        } else {
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
        }
      })}
    </>
  );
};

const DATA_VERSION = "v1.1";
const MOBILE_NOTICE_KEY = "samuel_mobile_notice_dismissed";

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < breakpoint,
  );

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handler = (e) => setIsMobile(e.matches);
    setIsMobile(mql.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [breakpoint]);

  return isMobile;
}

function useKeyboardLayout(isMobile, inputRef) {
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

function App() {
  const savedData = (() => {
    try {
      const data = localStorage.getItem("samuel_storage");
      if (!data) return {};

      const parsed = JSON.parse(data);

      if (parsed.version !== DATA_VERSION) {
        console.log("데이터 버전이 변경되어 로컬 스토리지를 초기화합니다.");
        return {};
      }

      return parsed;
    } catch (err) {
      console.log(err);
      return {};
    }
  })();

  const [originalScriptures, setOriginalScriptures] = useState([]);
  const [selectedScriptures, setSelectedScriptures] = useState(
    savedData.selectedScriptures || [[], [], [], [], [], []],
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

  // 폰트 상태
  const [fontSize, setFontSize] = useState(savedData.fontSize || 30);
  const [isBold, setIsBold] = useState(
    savedData.isBold !== undefined ? savedData.isBold : false,
  );
  const [fontFamilies, setFontFamilies] = useState(INITIAL_FONTS);
  const [fontFamily, setFontFamily] = useState(() =>
    resolveInitialFont(savedData.fontFamily, window.innerWidth < 768),
  );
  const activeFontFamily = cssFontFamily(fontFamily);

  const [activeModal, setActiveModal] = useState(null);
  const inputRef = useRef(null);
  const navRef = useRef(null);
  const problemContainerRef = useRef(null);
  const isMobile = useIsMobile();
  const {
    typingMode,
    keyboardOpen,
    viewportHeight,
    viewportOffsetTop,
    handleInputFocus,
    handleInputBlur,
    dismissKeyboard,
  } = useKeyboardLayout(isMobile, inputRef);
  const displayFontSize = isMobile
    ? Math.min(fontSize, typingMode ? 18 : 22)
    : fontSize;
  const inputFontSize = Math.max(16, displayFontSize * 0.7);

  const toggleMenu = (menuName) => {
    setActiveMenu((prev) => (prev === menuName ? null : menuName));
  };

  // 테마 상태
  const [theme, setTheme] = useState(savedData.theme || "light");

  // 오답 상태
  const [isError, setIsError] = useState(false);
  const [hasFailedCurrent, setHasFailedCurrent] = useState(
    savedData.hasFailedCurrent || false,
  );

  // [추가] 커스텀 Alert/Confirm을 위한 상태
  const [alertMessage, setAlertMessage] = useState("");
  const [onConfirm, setOnConfirm] = useState(null); // 확인 버튼 클릭 시 실행할 함수
  const [showMobileNotice, setShowMobileNotice] = useState(false);

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
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    if (isMobile) return;
    if (localStorage.getItem(MOBILE_NOTICE_KEY) === "true") return;
    setShowMobileNotice(true);
  }, [isMobile]);

  const dismissMobileNotice = (permanent = false) => {
    if (permanent) {
      localStorage.setItem(MOBILE_NOTICE_KEY, "true");
    }
    setShowMobileNotice(false);
  };

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/scriptures.json`)
      .then((res) => res.json())
      .then((data) => {
        // 1일부터 6일까지 순회
        const formatted = [1, 2, 3, 4, 5, 6].map((d) => {
          // 해당 일차(day) 데이터 찾기
          const dayData = data.find((item) => item.day === d);
          if (!dayData) return [];

          // [핵심 수정]
          // 기존: dayData.topics[0].verses (첫 번째 주제만 가져옴)
          // 변경: dayData.topics.flatMap(...) (모든 주제를 순회하며 합침)
          return dayData.topics.flatMap((topic) =>
            topic.verses.map((v) => ({
              ...v,
              topic: topic.title, // 각 구절 객체에 주제 제목(title)을 심어줌
            })),
          );
        });

        setOriginalScriptures(formatted);
      });
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
    if (!typingMode || !problemContainerRef.current) return;

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
  }, [typingMode, keyboardOpen, currentProblem?.problemText]);

  useEffect(() => {
    const dataToSave = {
      version: DATA_VERSION,
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
    };

    localStorage.setItem("samuel_storage", JSON.stringify(dataToSave));
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
  ]);

  const displayProblem = useCallback(
    (mode, list = scripture, bNum = blankNum, wNum = wholeLevelNum) => {
      if (list.length === 0) return;

      const problemNum = Math.floor(Math.random() * list.length);
      const selected = list[problemNum];

      const actualBlankNum = mode === 5 ? 10 : bNum;

      const problem = generateProblem(selected, mode === 5 ? 1 : mode, {
        blankNum: actualBlankNum,
        wholeLevelNum: wNum,
      });

      let finalProblemText = problem.problemText;
      let finalAnswers = [...problem.answers]; // 복사해서 사용

      // [핵심] 주제 모드(5) 전용 로직
      if (mode === 5) {
        // 1. 본문 텍스트 압축 (모든 단어 빈칸을 _ 한 글자로)
        // 기존 텍스트에서 맨 앞의 참조 부분((롬 10:17) 등)은 제거하고 시작
        let bodyText = finalProblemText.replace(/^\(.+?\)\s*/, "");
        bodyText = bodyText.replace(/_+/g, "_");

        // 2. 참조 가리기 및 정답 추가
        const match = selected.reference.match(/\((.+?) (\d+):(.+?)\)/);
        let maskedRefStr = selected.reference; // 기본값

        if (match) {
          const [, book, chap, verse] = match;

          if (Math.random() > 0.5) {
            // 절(Verse) 가리기
            const maskedVerse = verse.replace(/\d+/g, "_");
            maskedRefStr = `(${book} ${chap}:${maskedVerse})`;
            const verseNumbers = verse.match(/\d+/g);
            if (verseNumbers) {
              finalAnswers.unshift(...verseNumbers);
            }
          } else {
            // 장(Chapter) 가리기
            maskedRefStr = `(${book} _:${verse})`;
            finalAnswers.unshift(chap); // 정답 배열 맨 앞에 '장' 추가
          }
        }

        // 3. 텍스트 합치기: (참조) + (본문)
        finalProblemText = `${maskedRefStr} ${bodyText}`;
      }

      setCurrentProblem({
        ...problem,
        problemText: finalProblemText, // 합쳐진 텍스트
        answers: finalAnswers, // 참조 정답이 포함된 리스트
        raw: selected,
        indexInList: problemNum,
        topic: selected.topic,
        // maskedReference는 이제 problemText에 포함되므로 별도 필드 불필요
      });

      setAttempts(0);
      setIsCompleted(false);
      setUserInput("");
      setHasFailedCurrent(false);

      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 0);
    },
    [scripture, blankNum, wholeLevelNum],
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
    const newSelected = [[], [], [], [], [], []];
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
      selectedScriptures.forEach((list) => (toAdd = [...toAdd, ...list]));
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

  const submitLockRef = useRef(false);

  const submitAnswer = (inputOverride) => {
    if (!currentProblem) return;

    const input = inputOverride ?? userInput;
    const shouldAdvance =
      isCompleted || currentProblem.answers.length === 0;

    if (shouldAdvance) {
      const newList = scripture.filter(
        (_, i) => i !== currentProblem.indexInList,
      );
      setScripture(newList);
      setLeftVerse(newList.length);
      displayProblem(currentMode, newList);
      return;
    }

    if (submitLockRef.current) return;

    submitLockRef.current = true;
    window.setTimeout(() => {
      submitLockRef.current = false;
    }, 300);

    const answer = currentProblem.answers[0];
    if (normToken(input) === normToken(answer)) {
      handleCorrect(answer);
    } else {
      handleWrong(answer);
    }
  };

  const handleCorrect = (answer) => {
    const cleanedText = cleanText(currentProblem.problemText);
    const updatedText = cleanedText.replace(/_+/, `{{S:${answer}}}`);
    const remainingAnswers = currentProblem.answers.slice(1);

    setCurrentProblem({
      ...currentProblem,
      problemText: updatedText,
      answers: remainingAnswers,
    });
    setUserInput("");
    setAttempts(0);
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
  };

  const handleWrong = (answer) => {
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    setUserInput("");

    if (newAttempts >= 3) {
      setIsError(false);

      if (!wrongVerses.some((v) => v.reference === currentProblem.reference)) {
        setWrongVerses((prev) => [...prev, currentProblem.raw]);
      }
      setFailNum((prev) => prev + 1);

      if (!hasFailedCurrent) {
        setHasFailedCurrent(true);
        setCumulativeStats((prev) => ({
          ...prev,
          total: prev.total + 1,
          wrong: prev.wrong + 1,
        }));
      }

      const cleanedText = cleanText(currentProblem.problemText);
      const updatedText = cleanedText.replace(/_+/, `{{F:${answer}}}`);
      const remainingAnswers = currentProblem.answers.slice(1);

      setCurrentProblem({
        ...currentProblem,
        problemText: updatedText,
        answers: remainingAnswers,
      });

      setAttempts(0);
      if (remainingAnswers.length === 0) setIsCompleted(true);
    } else {
      setIsError(true);
      setTimeout(() => setIsError(false), 400);
    }
  };

  const handleKeyDown = (e) => {
    if (e.nativeEvent.isComposing) return;
    const isSubmitKey =
      e.key === "Enter" ||
      e.key === " " ||
      e.key === "Spacebar" ||
      e.code === "Space";
    if (isSubmitKey) {
      e.preventDefault();
      submitAnswer();
    }
  };

  const handleBeforeInput = (e) => {
    if (e.nativeEvent.isComposing) return;

    const isSubmitInput =
      e.inputType === "insertLineBreak" ||
      (e.inputType === "insertText" && e.data === " ");

    if (!isSubmitInput) return;

    e.preventDefault();
    submitAnswer();
  };

  const handleInputChange = (e) => {
    const value = e.target.value;

    // 일부 모바일 브라우저는 beforeinput/keydown 없이 공백만 삽입하는 경우가 있음
    if (isMobile && !e.nativeEvent.isComposing && value.endsWith(" ")) {
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
          displayName: displayName,
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

  return (
    <div
      className={[
        "app-container",
        isMobile ? "is-mobile" : "",
        typingMode ? "typing-mode" : "",
        keyboardOpen ? "keyboard-open" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      data-theme={theme}
      style={
        keyboardOpen
          ? {
              "--vv-height": `${viewportHeight}px`,
              "--vv-offset-top": `${viewportOffsetTop}px`,
            }
          : undefined
      }
    >
      <div className="app-chrome">
      {/* 1. 상단 메뉴바 */}
      <nav className="navbar" ref={navRef}>
        <div className="menu-groups">
          <div
            className="menu-group"
            onMouseEnter={() => !isMobile && setActiveMenu("course")}
            onMouseLeave={() => !isMobile && setActiveMenu(null)}
          >
            <button
              className="menu-trigger"
              onClick={(e) => {
                e.stopPropagation();
                toggleMenu("course");
              }}
            >
              과정 ▾
            </button>
            <div
              className="dropdown-content"
              style={{ display: activeMenu === "course" ? "flex" : "none" }}
            >
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  onClick={() => {
                    selectCourse(n);
                    setActiveMenu(null);
                  }}
                >
                  {n}과정
                </button>
              ))}
            </div>
          </div>

          <div
            className="menu-group"
            onMouseEnter={() => !isMobile && setActiveMenu("day")}
            onMouseLeave={() => !isMobile && setActiveMenu(null)}
          >
            <button
              className="menu-trigger"
              onClick={(e) => {
                e.stopPropagation();
                toggleMenu("day");
              }}
            >
              일차 ▾
            </button>
            <div
              className="dropdown-content"
              style={{ display: activeMenu === "day" ? "flex" : "none" }}
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <button
                  key={n}
                  onClick={() => {
                    selectDay(n);
                    setActiveMenu(null);
                  }}
                >
                  {n}일차
                </button>
              ))}
              <button
                onClick={() => {
                  selectDay(7);
                  setActiveMenu(null);
                }}
              >
                전체
              </button>
              <hr />
              <button
                onClick={() => {
                  dayReset();
                  setActiveMenu(null);
                }}
                style={{ color: "#ff6b6b" }}
              >
                초기화
              </button>
            </div>
          </div>

          {/* 글꼴 버튼 */}
          <div className="menu-group">
            <button
              className="menu-trigger"
              onClick={() => setActiveModal("font")}
            >
              글꼴
            </button>
          </div>
        </div>

        <div className="nav-actions">
          <button
            onClick={toggleFullscreen}
            className="theme-toggle hide-mobile"
          >
            ⛶ 전체화면
          </button>
          <button onClick={toggleTheme} className="theme-toggle">
            {theme === "light" ? "🌙 Dark" : "☀️ Light"}
          </button>
          <button
            className="theme-toggle"
            onClick={() => setActiveModal("stats")}
          >
            통계
          </button>
          <button
            className="theme-toggle"
            onClick={() => setActiveModal("info")}
          >
            정보
          </button>
        </div>
      </nav>

      {/* 2. 모드 선택 바 */}
      <div className="mode-bar">
        {[
          {
            id: 1,
            n: "빈칸 모드",
            subText: `${blankNum * 10}%`,
            subAction: () => setActiveModal("blank"),
          },
          { id: 2, n: "구절 모드", subText: null, subAction: null },
          { id: 3, n: "장절 모드", subText: null, subAction: null },
          {
            id: 4,
            n: "전체 모드",
            subText: `${wholeLevelNum}어절`,
            subAction: () => setActiveModal("whole"),
          },
          {
            id: 5,
            n: "주제 모드",
            subText: null,
            subAction: null,
          },
        ].map((m) => (
          <div key={m.id} className="mode-group">
            <button
              className={`mode-main-btn ${currentMode === m.id ? "active" : ""}`}
              onClick={() => {
                setCurrentMode(m.id);
                displayProblem(m.id);
              }}
            >
              {m.n}
            </button>
            {m.subText && (
              <button
                className="mode-sub-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  m.subAction();
                }}
              >
                {m.subText}
              </button>
            )}
          </div>
        ))}

        {/* 도움말 버튼 */}
        <div className="mode-group">
          <button
            className="mode-main-btn"
            onClick={() => setActiveModal("help")}
          >
            도움말
          </button>
        </div>
      </div>
      </div>

      <div className="mobile-study-shell">
      {/* 3. 문제 표시 영역 */}
      <main className="problem-container" ref={problemContainerRef}>
        <div
          className="problem-box"
          style={{
            fontFamily: activeFontFamily,
            fontSize: `${displayFontSize}px`,
            fontWeight: isBold ? "bold" : "normal",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: typingMode ? "flex-start" : "center",
          }}
        >
          {/* A. 주제 표시 (모드 2, 4가 아닐 때만) */}
          {currentMode !== 2 && currentMode !== 4 && currentProblem?.topic && (
            <div className="topic-display">{currentProblem.topic}</div>
          )}

          {/* [삭제됨] B. 참조 표시 
             이제 참조가 본문(ProblemRenderer) 안에 포함되어 있으므로, 
             별도의 참조 div는 제거합니다.
          */}

          {/* C. 본문 텍스트 (참조 포함) */}
          <div className="problem-text-wrapper">
            {currentProblem ? (
              <ProblemRenderer
                text={currentProblem.problemText}
                isError={isError}
              />
            ) : (
              "상단 메뉴에서 과정과 일차를 선택한 후 모드를 눌러 시작하세요."
            )}
          </div>
        </div>
      </main>

      <div className="input-dock">
        {typingMode && (
          <div className="keyboard-mini-bar">
            <span className="badge">{courseName}</span>
            <span className="keyboard-mini-stat">
              남은 <strong>{leftVerse}</strong>
            </span>
            <div className="keyboard-mini-actions">
              <button type="button" onClick={() => displayProblem(currentMode)}>
                스킵
              </button>
              <button type="button" onClick={dismissKeyboard}>
                키보드 닫기
              </button>
            </div>
          </div>
        )}

        {/* 4. 답안 입력 영역 */}
        <div className="input-area">
          <input
            ref={inputRef}
            className={`answer-input ${isError ? "input-error" : ""}`}
            type="text"
            value={userInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onBeforeInput={handleBeforeInput}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            autoFocus={!isMobile}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            enterKeyHint={isCompleted ? "next" : "done"}
            placeholder={
              isMobile
                ? isCompleted
                  ? "Enter/Space → 다음 구절"
                  : "정답 입력 후 Enter/Space"
                : isCompleted
                  ? "Space/Enter를 눌러 다음 구절로"
                  : "Space/Enter를 눌러 정답 입력"
            }
            style={{
              fontSize: `${inputFontSize}px`,
              fontFamily: activeFontFamily,
            }}
          />
        </div>
      </div>
      </div>

      {/* 5. 하단 상태바 */}
      <footer className="status-bar">
        <div className="status-info">
          <span className="badge">{courseName}</span>
          <span>
            남은 구절 : <strong>{leftVerse}</strong>
          </span>
          <span>
            틀린 개수 : <strong>{failNum}</strong>
          </span>
        </div>
        <div className="status-btns">
          <button onClick={() => displayProblem(currentMode)}>스킵</button>
          <button
            onClick={() => {
              if (wrongVerses.length === 0) setActiveModal("no-wrong");
              else setActiveModal("wrong");
            }}
          >
            틀린 구절
          </button>
          <button onClick={dayReset} className="reset-btn">
            초기화
          </button>
        </div>
      </footer>

      {/* 6. 모달 시스템 */}
      {activeModal && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {/* [추가] 커스텀 Alert 모달 */}
            {activeModal === "alert" && (
              <>
                <h3 style={{ marginBottom: "15px" }}>알림</h3>
                <p
                  style={{
                    textAlign: "center",
                    marginBottom: "20px",
                    lineHeight: "1.5",
                  }}
                >
                  {alertMessage}
                </p>
                <button
                  className="full-width-btn"
                  style={{ marginBottom: 0 }}
                  onClick={() => setActiveModal(null)}
                >
                  확인
                </button>
              </>
            )}

            {/* [추가] 커스텀 Confirm 모달 */}
            {activeModal === "confirm" && (
              <>
                <h3 style={{ marginBottom: "15px" }}>확인</h3>
                <p
                  style={{
                    textAlign: "center",
                    marginBottom: "20px",
                    lineHeight: "1.5",
                  }}
                >
                  {alertMessage}
                </p>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    className="full-width-btn"
                    style={{
                      marginBottom: 0,
                    }}
                    onClick={() => setActiveModal(null)}
                  >
                    취소
                  </button>
                  <button
                    className="full-width-btn"
                    style={{
                      marginBottom: 0,
                      backgroundColor: "var(--color-fail)",
                    }}
                    onClick={() => {
                      if (onConfirm) onConfirm();
                      setActiveModal(null);
                    }}
                  >
                    확인
                  </button>
                </div>
              </>
            )}

            {/* 도움말 모달 */}
            {activeModal === "help" && (
              <>
                <h3>도움말</h3>
                <p
                  style={{
                    textAlign: "center",
                    lineHeight: "1.6",
                    marginBottom: "20px",
                  }}
                >
                  1. 과정과 일차를 선택하세요.
                  <br />
                  2. 원하는 모드를 선택하여 암송을 시작하세요.
                  <br />
                  3. 정답을 입력하고 <strong>Space</strong>나{" "}
                  <strong>Enter</strong>를 누르세요.
                  <br />
                  4. 틀린 구절은 자동으로 저장됩니다.
                </p>
                <button
                  className="full-width-btn"
                  style={{ marginBottom: 0 }}
                  onClick={() => setActiveModal(null)}
                >
                  닫기
                </button>
              </>
            )}

            {/* 정보 모달 */}
            {activeModal === "info" && (
              <>
                <h3>프로그램 정보</h3>
                <p
                  style={{
                    textAlign: "center",
                    lineHeight: "1.6",
                    marginBottom: "20px",
                  }}
                >
                  <strong>사무엘학교 암송 프로그램</strong>
                  <br />
                  제43기 사무엘학교
                  <br />
                  <br />
                  <div
                    style={{
                      fontSize: "17px",
                      fontFamily: "MaruBuriBold",
                    }}
                  >
                    “구원의 투구와 성령의 검 곧 하나님의 말씀을 가지라”
                  </div>
                  <div
                    style={{
                      fontSize: "15px",
                      fontFamily: "MaruBuriSemiBold",
                      marginTop: "3px",
                    }}
                  >
                    에베소서 6장 17절
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      marginTop: "6px",
                      paddingBottom: "10px",
                    }}
                  >
                    <br />
                    서울양천교회 공은호 형제
                    <br />
                    (문의 : 깨사모 쪽지)
                  </div>
                </p>
                <button
                  className="full-width-btn"
                  style={{ marginBottom: 0 }}
                  onClick={() => setActiveModal(null)}
                >
                  닫기
                </button>
              </>
            )}

            {/* 오답 없음 알림 모달 */}
            {activeModal === "no-wrong" && (
              <>
                <h3 style={{ marginBottom: "10px" }}>알림</h3>
                <p
                  style={{
                    textAlign: "center",
                    marginBottom: "20px",
                    fontSize: "16px",
                  }}
                >
                  틀린 구절이 없습니다! 🎉
                </p>
                <button
                  className="full-width-btn"
                  style={{ marginBottom: 0 }}
                  onClick={() => setActiveModal(null)}
                >
                  확인
                </button>
              </>
            )}

            {/* 빈칸 비율 모달 */}
            {activeModal === "blank" && (
              <>
                <h3>빈칸 비율 선택</h3>
                <div className="modal-grid">
                  <button onClick={() => handleBlankLevel(-1)}>
                    0% (암기용)
                  </button>
                  {[...Array(10)].map((_, i) => (
                    <button key={i} onClick={() => handleBlankLevel(i)}>
                      {(i + 1) * 10}%
                    </button>
                  ))}
                </div>
                <button
                  className="full-width-btn"
                  style={{ marginBottom: 0, marginTop: "10px" }}
                  onClick={() => setActiveModal(null)}
                >
                  닫기
                </button>
              </>
            )}

            {/* 전체 모드 어절 수 모달 */}
            {activeModal === "whole" && (
              <>
                <h3>공개할 어절 수 선택</h3>
                <div className="modal-grid">
                  {[1, 2, 3, 4].map((n) => (
                    <button key={n} onClick={() => handleWholeLevel(n)}>
                      {n}어절
                    </button>
                  ))}
                </div>
                <button
                  className="full-width-btn"
                  style={{ marginBottom: 0, marginTop: "10px" }}
                  onClick={() => setActiveModal(null)}
                >
                  닫기
                </button>
              </>
            )}

            {/* 글꼴 설정 모달 */}
            {activeModal === "font" && (
              <>
                <h3>글꼴 설정</h3>
                {isMobile && (
                  <p className="font-modal-note">
                    모바일에서는 앱에 포함된 글꼴만 적용됩니다.
                  </p>
                )}
                {!isMobile && (
                  <button onClick={loadSystemFonts} className="full-width-btn">
                    시스템 폰트 불러오기
                  </button>
                )}

                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="font-selector"
                  size="8"
                >
                  {fontFamilies.map((f) => (
                    <option
                      key={f.realName}
                      value={f.realName}
                      style={{ fontFamily: cssFontFamily(f.realName) }}
                    >
                      {f.displayName}
                    </option>
                  ))}
                </select>

                <div className="font-controls">
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <span style={{ fontSize: "14px", fontWeight: "600" }}>
                      크기: {fontSize}px
                    </span>
                    <input
                      type="range"
                      min="16"
                      max="50"
                      step="1"
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      style={{ width: "120px" }}
                    />
                  </div>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isBold}
                      onChange={(e) => setIsBold(e.target.checked)}
                    />
                    <span style={{ fontSize: "14px" }}>진하게</span>
                  </label>
                </div>

                <div className="modal-footer">
                  <button
                    className="modal-close-btn"
                    onClick={() => {
                      setFontFamily(DEFAULT_FONT);
                      setFontSize(30);
                      setIsBold(false);
                    }}
                  >
                    초기화
                  </button>
                  <button
                    className="modal-close-btn"
                    onClick={() => setActiveModal(null)}
                  >
                    닫기
                  </button>
                </div>
              </>
            )}

            {/* 틀린 구절 복습 모달 */}
            {activeModal === "wrong" && (
              <>
                <h3>틀린 구절 모음</h3>
                <div className="wrong-list">
                  {wrongVerses.map((v, i) => (
                    <p key={i}>
                      {i + 1}. {v.reference} {v.verse}
                    </p>
                  ))}
                </div>

                <button
                  className="full-width-btn"
                  onClick={() => {
                    setScripture([...wrongVerses]);
                    setLeftVerse(wrongVerses.length);
                    setFailNum(0);
                    setWrongVerses([]);
                    setActiveModal(null);
                    displayProblem(currentMode, [...wrongVerses]);
                  }}
                >
                  틀린 구절 복습 시작
                </button>

                <div className="modal-footer">
                  <button
                    className="modal-close-btn"
                    onClick={() => {
                      setWrongVerses([]);
                      setActiveModal(null);
                    }}
                  >
                    목록 초기화
                  </button>
                  <button
                    className="modal-close-btn"
                    onClick={() => setActiveModal(null)}
                  >
                    닫기
                  </button>
                </div>
              </>
            )}

            {/* 통계 모달 */}
            {activeModal === "stats" && (
              <>
                <h3
                  style={{
                    marginBottom: "0px",
                  }}
                >
                  누적 학습 통계
                </h3>
                <h3
                  style={{
                    marginTop: "3px",
                    textAlign: "center",
                    fontSize: "12px",
                    fontWeight: "normal",
                  }}
                >
                  구절 기준 통계
                </h3>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    marginBottom: "24px",
                    textAlign: "center",
                    fontSize: "16px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      borderBottom: "1px solid var(--border-color)",
                      paddingBottom: "8px",
                    }}
                  >
                    <span style={{ color: "var(--text-secondary)" }}>
                      총 시도 횟수
                    </span>
                    <strong>{cumulativeStats.total.toLocaleString()}회</strong>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      color: "var(--color-success)",
                    }}
                  >
                    <span>정답 횟수</span>
                    <strong>
                      {cumulativeStats.correct.toLocaleString()}회
                    </strong>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      color: "var(--color-fail)",
                    }}
                  >
                    <span>오답 횟수</span>
                    <strong>{cumulativeStats.wrong.toLocaleString()}회</strong>
                  </div>
                  <div
                    style={{
                      marginTop: "12px",
                      padding: "12px",
                      backgroundColor: "var(--hover-bg)",
                      borderRadius: "8px",
                      fontWeight: "bold",
                    }}
                  >
                    정답률 :{" "}
                    {cumulativeStats.total === 0
                      ? "0%"
                      : `${((cumulativeStats.correct / cumulativeStats.total) * 100).toFixed(1)}%`}
                  </div>
                </div>

                {/* [수정] 통계 초기화 버튼 (confirm -> modal) */}
                <button
                  className="full-width-btn"
                  onClick={() => {
                    setAlertMessage("통계 기록을 초기화하시겠습니까?");
                    setOnConfirm(() => () => {
                      setCumulativeStats({ total: 0, correct: 0, wrong: 0 });
                    });
                    setActiveModal("confirm");
                  }}
                >
                  기록 초기화
                </button>

                <button
                  className="full-width-btn"
                  style={{ marginBottom: 0 }}
                  onClick={() => setActiveModal(null)}
                >
                  닫기
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* 모바일 지원 공지 (데스크탑) */}
      {showMobileNotice && (
        <div
          className="modal-overlay notice-overlay"
          onClick={() => dismissMobileNotice(false)}
        >
          <div className="modal-content notice-modal" onClick={(e) => e.stopPropagation()}>
            <h3>업데이트 안내</h3>
            <p className="notice-body">
              사무엘학교 암송 프로그램이 모바일 환경에서도 사용할 수 있도록
              개선되었습니다.
            </p>
            <div className="notice-actions">
              <button
                className="full-width-btn"
                style={{ marginBottom: 0 }}
                onClick={() => dismissMobileNotice(false)}
              >
                확인
              </button>
              <button
                className="modal-close-btn"
                style={{ marginBottom: 0 }}
                onClick={() => dismissMobileNotice(true)}
              >
                다시 보지 않기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
