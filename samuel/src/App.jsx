import { useState, useEffect, useRef } from "react";
import { generateProblem, normToken } from "./utils/memorizeLogic";

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
  const [scripture, setScripture] = useState([]); // 적재된 리스트 (scripture)
  const [courseName, setCourseName] = useState("과정 미선택"); // course_label
  const [leftVerse, setLeftVerse] = useState(0); // left_verse_label
  const [failNum, setFailNum] = useState(0); // fail_num_label
  const [wrongVerses, setWrongVerses] = useState([]); // wrong_verses

  const [currentProblem, setCurrentProblem] = useState(null);
  const [userInput, setUserInput] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [currentMode, setCurrentMode] = useState(1);
  const [blankNum, setBlankNum] = useState(5); // blank_num
  const [wholeLevelNum, setWholeLevelNum] = useState(1); // whole_level_num

  // App.jsx 내부 상태 추가
  const [fontFamily, setFontFamily] = useState("맑은 고딕"); // font_form
  const [fontSize, setFontSize] = useState(30); // font_size_var
  const [isBold, setIsBold] = useState(false); // bold_var

  // 미리 정의된 폰트 리스트 (웹 안전 폰트 및 한국어 대표 폰트)
  const fontFamilies = [
    "맑은 고딕",
    "돋움",
    "굴림",
    "궁서",
    "Arial",
    "Verdana",
    "Times New Roman",
  ];

  const [activeModal, setActiveModal] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    fetch("/data/scriptures.json")
      .then((res) => res.json())
      .then((data) => {
        const formatted = [1, 2, 3, 4, 5, 6].map(
          (d) => data.find((item) => item.day === d)?.topics[0].verses || [],
        );
        setOriginalScriptures(formatted);
      });
  }, []);

  // 문제 표시 (display_problem)
  const displayProblem = (
    mode,
    list = scripture,
    bNum = blankNum,
    wNum = wholeLevelNum,
  ) => {
    if (list.length === 0) return;

    const problemNum = Math.floor(Math.random() * list.length);
    const selected = list[problemNum];

    // 상태값 대신 인자로 받은 bNum, wNum을 직접 사용하여 즉시 반영
    const problem = generateProblem(selected, mode, {
      blankNum: bNum,
      wholeLevelNum: wNum,
    });
    setCurrentProblem({ ...problem, raw: selected, indexInList: problemNum });
    setAttempts(0);
    setIsCompleted(false);
    setUserInput("");
    if (inputRef.current) inputRef.current.focus();
  };

  // 빈칸 난이도 선택 핸들러 (level_num)
  const handleBlankLevel = (num) => {
    const newLevel = num + 1;
    setBlankNum(newLevel);
    displayProblem(1, scripture, newLevel, wholeLevelNum); // 즉시 반영
    setActiveModal(null);
  };

  // 어절 수 선택 핸들러 (whole_num)
  const handleWholeLevel = (num) => {
    setWholeLevelNum(num);
    displayProblem(4, scripture, blankNum, num); // 즉시 반영
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

  // 시스템 폰트 불러오기 함수 (Local Font Access API)
  const loadSystemFonts = async () => {
    if (!window.queryLocalFonts) {
      alert(
        "이 브라우저는 시스템 폰트 접근을 지원하지 않습니다. (Chrome, Edge 권장)",
      );
      return;
    }

    try {
      // 1. 사용자에게 폰트 접근 권한 요청 및 목록 가져오기
      const availableFonts = await window.queryLocalFonts();

      // 2. 중복 제거 및 패밀리 네임 추출
      // @로 시작하는 세로쓰기용 폰트는 제외하는 파이썬 로직 반영
      const families = Array.from(new Set(availableFonts.map((f) => f.family)))
        .filter((f) => !f.startsWith("@"))
        .sort();

      setFontFamilies(families);
      alert(`${families.length}개의 시스템 폰트를 불러왔습니다.`);
    } catch (err) {
      console.error("폰트 접근 권한이 거부되었습니다:", err);
      alert("폰트 목록을 불러오려면 권한 승인이 필요합니다.");
    }
  };

  const handleFontUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const fontFace = new FontFace(
          "CustomFont",
          `url(${event.target.result})`,
        );
        fontFace.load().then((loadedFace) => {
          document.fonts.add(loadedFace);
          setFontFamily("CustomFont"); // 업로드한 폰트로 즉시 적용
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        padding: "10px",
      }}
    >
      {/* 상단 메뉴바 (파이썬 Menu 재현) */}
      <div
        style={{
          display: "flex",
          gap: "20px",
          borderBottom: "1px solid #ccc",
          paddingBottom: "5px",
        }}
      >
        <div className="menu-group">
          과정
          <div className="dropdown">
            {[1, 2, 3, 4].map((n) => (
              <button key={n} onClick={() => selectCourse(n)}>
                {n}과정
              </button>
            ))}
          </div>
        </div>
        <div className="menu-group">
          일차
          <div className="dropdown">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <button key={n} onClick={() => selectDay(n)}>
                {n}일차
              </button>
            ))}
            <button onClick={() => selectDay(7)}>전체</button>
            <hr />
            <button onClick={dayReset}>초기화</button>
          </div>
        </div>
        <button
          onClick={() =>
            alert("사무엘 암송 프로그램\n버전 : 제42기 사무엘학교")
          }
        >
          정보
        </button>
      </div>
      <div
        style={{
          marginTop: "10px",
          borderTop: "1px solid #eee",
          paddingTop: "10px",
        }}
      >
        <button onClick={() => setActiveModal("font")}>글꼴</button>
      </div>
      {activeModal === "font" && (
        <div className="modal" style={{ width: "300px" }}>
          <h3>글꼴 설정</h3>

          <div style={{ marginBottom: "15px" }}>
            <button
              onClick={loadSystemFonts}
              style={{ width: "100%", padding: "5px", marginBottom: "10px" }}
            >
              시스템 폰트 불러오기
            </button>

            <label>글꼴: </label>
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              style={{ width: "100%", height: "150px" }}
              size="10" // 파이썬 Listbox와 유사한 UX
            >
              {fontFamilies.map((f) => (
                <option key={f} value={f} style={{ fontFamily: f }}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          {/* 크기 및 진하게 설정 (기존과 동일) */}
          <div>
            <label>크기: {fontSize} </label>
            <input
              type="range"
              min="8"
              max="100"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
            />
          </div>

          <div style={{ marginTop: "10px" }}>
            <label>
              <input
                type="checkbox"
                checked={isBold}
                onChange={(e) => setIsBold(e.target.checked)}
              />
              진하게
            </label>
          </div>

          <div style={{ marginTop: "15px", display: "flex", gap: "5px" }}>
            <button
              onClick={() => {
                setFontFamily("맑은 고딕");
                setFontSize(30);
                setIsBold(false);
              }}
            >
              초기화
            </button>
            <button onClick={() => setActiveModal(null)}>닫기</button>
          </div>
        </div>
      )}

      {/* 모드 버튼 영역 */}
      <div style={{ margin: "10px 0", display: "flex", gap: "5px" }}>
        <button onClick={() => setActiveModal("blank")}>빈칸 모드</button>
        <button
          onClick={() => {
            setCurrentMode(2);
            displayProblem(2);
          }}
        >
          구절 모드
        </button>
        <button
          onClick={() => {
            setCurrentMode(3);
            displayProblem(3);
          }}
        >
          장절 모드
        </button>
        <button onClick={() => setActiveModal("whole")}>전체 모드</button>
        <button onClick={() => alert("도움말 내용...")}>도움말</button>
      </div>

      {/* 문제 영역 (problem_text_box) */}
      <div
        style={{
          flex: 1,
          border: "1px solid #aaa",
          padding: "15px",
          overflowY: "auto",
          fontFamily: fontFamily,
          fontSize: `${fontSize}px`,
          fontWeight: isBold ? "bold" : "normal",
          whiteSpace: "pre-wrap",
        }}
      >
        {currentProblem?.problemText}
      </div>

      {/* 입력 영역 (answer_text_box) */}
      <input
        ref={inputRef}
        type="text"
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        onKeyDown={handleKeyDown}
        style={{
          width: "100%",
          fontSize: "24px",
          padding: "10px",
          margin: "10px 0",
        }}
      />

      {/* 하단 상태바 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "15px",
          fontSize: "18px",
        }}
      >
        <span>{courseName}</span>
        <span>남은 구절 : {leftVerse}</span>
        <span>틀린 갯수 : {failNum}</span>
        <button onClick={dayReset}>초기화</button>
        <button onClick={() => displayProblem(currentMode)}>스킵</button>
        <button
          onClick={() => {
            if (wrongVerses.length === 0) alert("틀린 구절이 없습니다.");
            else setActiveModal("wrong");
          }}
        >
          틀린 구절
        </button>
      </div>

      {/* --- 모달 구현부 (난이도 선택 즉시 반영 연결) --- */}
      {activeModal === "blank" && (
        <div className="modal">
          <h3>빈칸 난이도 선택</h3>
          <button onClick={() => handleBlankLevel(-1)}>0%</button>
          {[...Array(10)].map((_, i) => (
            <button key={i} onClick={() => handleBlankLevel(i)}>
              {(i + 1) * 10}%
            </button>
          ))}
          <button onClick={() => setActiveModal(null)}>취소</button>
        </div>
      )}

      {activeModal === "whole" && (
        <div className="modal">
          <h3>어절 수 선택</h3>
          <button onClick={() => handleWholeLevel(1)}>1어절</button>
          {[2, 3, 4].map((n) => (
            <button key={n} onClick={() => handleWholeLevel(n)}>
              {n}어절
            </button>
          ))}
          <button onClick={() => setActiveModal(null)}>취소</button>
        </div>
      )}

      {/* 틀린 구절 모음 (show_wrong_verses) */}
      {activeModal === "wrong" && (
        <div className="modal">
          <h3>틀린 구절 모음</h3>
          <div
            style={{ maxHeight: "300px", overflowY: "auto", textAlign: "left" }}
          >
            {wrongVerses.map((v, i) => (
              <p key={i}>
                {i + 1}. {v.reference} {v.verse}
              </p>
            ))}
          </div>
          <button
            onClick={() => {
              const newList = [...wrongVerses];
              setScripture(newList);
              setLeftVerse(newList.length);
              setFailNum(0);
              setWrongVerses([]);
              setActiveModal(null);
              displayProblem(currentMode, newList);
            }}
          >
            틀린 구절 복습
          </button>
          <button
            onClick={() => {
              setWrongVerses([]);
              setActiveModal(null);
            }}
          >
            틀린 구절 초기화
          </button>
          <button onClick={() => setActiveModal(null)}>닫기</button>
        </div>
      )}
    </div>
  );
}

export default App;
