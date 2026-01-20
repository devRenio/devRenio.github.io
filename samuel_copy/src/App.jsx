import { useState, useEffect, useRef, useCallback } from "react";
import { generateProblem, normToken } from "./utils/memorizeLogic";

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

function App() {
  // --- 파이썬 앱의 글로벌 변수 및 상태 이식 ---
  const [originalScriptures, setOriginalScriptures] = useState([]);
  const [selectedScriptures, setSelectedScriptures] = useState([
    [],
    [],
    [],
    [],
    [],
    [],
  ]);
  const [scripture, setScripture] = useState([]);
  const [courseName, setCourseName] = useState("과정 미선택");
  const [leftVerse, setLeftVerse] = useState(0);
  const [failNum, setFailNum] = useState(0);
  const [wrongVerses, setWrongVerses] = useState([]);

  const [currentProblem, setCurrentProblem] = useState(null);
  const [userInput, setUserInput] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [currentMode, setCurrentMode] = useState(1);

  // 빈칸 50%(index 5), 전체 2어절(value 2) 디폴트 설정
  const [blankNum, setBlankNum] = useState(5);
  const [wholeLevelNum, setWholeLevelNum] = useState(2);

  // 폰트 상태
  const [fontSize, setFontSize] = useState(30);
  const [isBold, setIsBold] = useState(false);
  const [fontFamilies, setFontFamilies] = useState(INITIAL_FONTS);
  const [fontFamily, setFontFamily] = useState("NanumSquareRoundB");

  const [activeModal, setActiveModal] = useState(null);
  const inputRef = useRef(null);

  // 테마 상태
  const [theme, setTheme] = useState("light");

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  // 전체화면 토글 함수
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
    fetch(`${import.meta.env.BASE_URL}data/scriptures.json`)
      .then((res) => res.json())
      .then((data) => {
        const formatted = [1, 2, 3, 4, 5, 6].map(
          (d) => data.find((item) => item.day === d)?.topics[0].verses || [],
        );
        setOriginalScriptures(formatted);
      });
  }, []);

  // 문제 표시 (display_problem)
  const displayProblem = useCallback(
    (mode, list = scripture, bNum = blankNum, wNum = wholeLevelNum) => {
      if (list.length === 0) return;

      const problemNum = Math.floor(Math.random() * list.length);
      const selected = list[problemNum];

      const problem = generateProblem(selected, mode, {
        blankNum: bNum,
        wholeLevelNum: wNum,
      });

      setCurrentProblem({ ...problem, raw: selected, indexInList: problemNum });
      setAttempts(0);
      setIsCompleted(false);
      setUserInput("");

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
  };

  const submitAnswer = () => {
    if (!currentProblem) return;
    if (isCompleted || currentProblem.answers.length === 0) {
      const newList = scripture.filter(
        (_, i) => i !== currentProblem.indexInList,
      );
      setScripture(newList);
      setLeftVerse(newList.length);
      displayProblem(currentMode, newList);
      return;
    }

    const answer = currentProblem.answers[0];
    if (normToken(userInput) === normToken(answer)) {
      handleCorrect(answer);
    } else {
      handleWrong(answer);
    }
  };

  const handleCorrect = (answer) => {
    const updatedText = currentProblem.problemText.replace(/_+/, answer);
    const remainingAnswers = currentProblem.answers.slice(1);
    setCurrentProblem({
      ...currentProblem,
      problemText: updatedText,
      answers: remainingAnswers,
    });
    setUserInput("");
    setAttempts(0);
    if (remainingAnswers.length === 0) setIsCompleted(true);
  };

  const handleWrong = (answer) => {
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    setUserInput("");

    if (newAttempts >= 3) {
      if (!wrongVerses.some((v) => v.reference === currentProblem.reference)) {
        setWrongVerses((prev) => [...prev, currentProblem.raw]);
      }
      setFailNum((prev) => prev + 1);
      handleCorrect(answer);
    }
  };

  const handleKeyDown = (e) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      submitAnswer();
    }
  };

  const loadSystemFonts = async () => {
    if (!window.queryLocalFonts) {
      alert("이 브라우저는 시스템 폰트 접근을 지원하지 않습니다.");
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
      alert(
        `${combinedList.length - BUNDLED_FONTS.length}개의 시스템 폰트를 불러왔습니다.`,
      );
    } catch (err) {
      console.error(err);
      alert("폰트 접근 권한 승인이 필요합니다.");
    }
  };

  return (
    <div className="app-container" data-theme={theme}>
      {/* 1. 상단 메뉴바 */}
      <nav className="navbar">
        <div className="menu-groups">
          {/* 과정 메뉴 */}
          <div className="menu-group">
            <button className="menu-trigger">과정 ▾</button>
            <div className="dropdown-content">
              {[1, 2, 3, 4].map((n) => (
                <button key={n} onClick={() => selectCourse(n)}>
                  {n}과정
                </button>
              ))}
            </div>
          </div>

          {/* 일차 메뉴 */}
          <div className="menu-group">
            <button className="menu-trigger">일차 ▾</button>
            <div className="dropdown-content">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <button key={n} onClick={() => selectDay(n)}>
                  {n}일차
                </button>
              ))}
              <button onClick={() => selectDay(7)}>전체</button>
              <hr />
              <button onClick={dayReset} style={{ color: "#ff6b6b" }}>
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
          {/* 전체화면 버튼 추가 */}
          <button onClick={toggleFullscreen} className="theme-toggle">
            ⛶ 전체화면
          </button>
          {/* 테마 버튼 */}
          <button onClick={toggleTheme} className="theme-toggle">
            {theme === "light" ? "🌙 Dark" : "☀️ Light"}
          </button>
          {/* 정보 버튼 (alert 대신 모달 호출) */}
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
            subText: `${blankNum * 10}%`, // 50%
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

        {/* 도움말 버튼 (alert 대신 모달 호출) */}
        <div className="mode-group">
          <button
            className="mode-main-btn"
            onClick={() => setActiveModal("help")}
          >
            도움말
          </button>
        </div>
      </div>

      {/* 3. 문제 표시 영역 */}
      <main className="problem-container">
        <div
          className="problem-box"
          style={{
            fontFamily: fontFamily,
            fontSize: `${fontSize}px`,
            fontWeight: isBold ? "bold" : "normal",
          }}
        >
          {currentProblem?.problemText ||
            "상단 메뉴에서 과정과 일차를 선택한 후 모드를 눌러 시작하세요."}
        </div>
      </main>

      {/* 4. 답안 입력 영역 */}
      <div className="input-area">
        <input
          ref={inputRef}
          className="answer-input"
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          placeholder={
            isCompleted ? "Space/Enter를 눌러 다음 구절로" : "정답 입력..."
          }
          style={{
            fontSize: `${Math.max(20, fontSize * 0.7)}px`,
            fontFamily: fontFamily,
          }}
        />
      </div>

      {/* 5. 하단 상태바 */}
      <footer className="status-bar">
        <div className="status-info">
          <span className="badge">{courseName}</span>
          <span>
            남은 구절 : <strong>{leftVerse}</strong>
          </span>
          <span>
            틀린 갯수 : <strong>{failNum}</strong>
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
                  <strong>사무엘 암송 프로그램</strong>
                  <br />
                  버전 : 제43기 사무엘학교
                  <br />
                  <br />
                  하나님의 말씀을 마음에 새기는
                  <br />
                  귀한 시간 되시길 바랍니다.
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
                    0% (암기)
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
                <h3>어절 수 선택</h3>
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
                <button onClick={loadSystemFonts} className="full-width-btn">
                  시스템 폰트 불러오기
                </button>

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
                      style={{ fontFamily: f.realName }}
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
                      max="100"
                      step="2"
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
                      setFontFamily("NanumSquareRoundB");
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
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
