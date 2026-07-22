// 쉼표, 하이픈, 슬래시 무시용
const PUNCT_RE = /[,\-/]/g;
const WORD_TOKEN_RE = /[0-9A-Za-z가-힣]/;

/** 채점 및 정답 저장용: 문장부호 제거 */
export const normToken = (s) => s.replace(PUNCT_RE, "").trim();

/** 모드1: 길이 힌트 O, 문장부호는 그대로 */
export const maskLenKeepPunct = (tok) =>
  tok.replace(/[0-9A-Za-z가-힣]+/g, (m) => "_".repeat(m.length));

/** 모드2/4: 길이 힌트 X, 문장부호는 그대로 */
export const maskOneKeepPunct = (tok) => tok.replace(/[0-9A-Za-z가-힣]+/g, "_");

/** 장절 파싱: '(요 5:38-39)' -> { book: '요', chap: '5', verse: '38-39' } */
export const parseRefParts = (ref) => {
  const s = ref.trim().slice(1, -1);
  const [book, chapVerse] = s.split(" ");
  const [chap, verse] = chapVerse.split(":");
  return { book, chap, verse };
};

/** 절 파싱: '38-39' -> { mask: '_-_', parts: ['38', '39'] } */
export const splitVerseParts = (verse) => {
  if (verse.includes("-")) {
    const [a, b] = verse.split("-");
    return { mask: "_-_", parts: [a, b] };
  }
  if (verse.includes(",")) {
    const parts = verse
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    return { mask: parts.map(() => "_").join(","), parts };
  }
  return { mask: "_", parts: [verse] };
};

// 암송 문제 생성 함수
export const generateProblem = (
  scripture,
  mode,
  config = { blankNum: 5, wholeLevelNum: 1 },
) => {
  const { reference, verse } = scripture; // JSON에서 이미 분리된 상태라고 가정
  const words = verse.split(" ");
  let problemText = "";
  let answers = [];

  switch (mode) {
    case 1: {
      // 빈칸 모드
      const numBlanks = Math.max(
        0,
        Math.min(
          words.length,
          Math.floor(words.length * config.blankNum * 0.1),
        ),
      );
      const maskableIdx = words
        .map((w, i) => (WORD_TOKEN_RE.test(w) ? i : -1))
        .filter((i) => i !== -1);

      // 랜덤 인덱스 추출 (Python의 random.sample 대용)
      const blankIndices = [...maskableIdx]
        .sort(() => Math.random() - 0.5)
        .slice(0, numBlanks)
        .sort((a, b) => a - b);

      answers = blankIndices.map((i) => normToken(words[i]));
      const problemWords = words.map((w, i) =>
        blankIndices.includes(i) ? maskLenKeepPunct(w) : w,
      );
      problemText = `${reference} ${problemWords.join(" ")}`;
      break;
    }

    case 2: {
      // 구절 모드 (전체 빈칸)
      answers = words
        .filter((w) => WORD_TOKEN_RE.test(w))
        .map((w) => normToken(w));
      const problemWords = words.map((w) =>
        WORD_TOKEN_RE.test(w) ? maskOneKeepPunct(w) : w,
      );
      problemText = `${reference} ${problemWords.join(" ")}`;
      break;
    }

    case 3: {
      // 장절 모드
      const { book, chap, verse: vPart } = parseRefParts(reference);
      const { mask, parts } = splitVerseParts(vPart);
      problemText = `(_ _:${mask}) ${verse}`;
      answers = [book, chap, ...parts];
      break;
    }

    case 4: {
      // 전체 모드 (연속된 n어절만 공개)
      const n = Math.min(config.wholeLevelNum, words.length);
      const randIndex = Math.floor(Math.random() * (words.length - n + 1));
      const visibleWords = words.slice(randIndex, randIndex + n);

      const { book, chap, verse: vPart } = parseRefParts(reference);
      const { mask, parts: vParts } = splitVerseParts(vPart);

      const problemWords = words.map((w, i) =>
        i >= randIndex && i < randIndex + n ? w : maskOneKeepPunct(w),
      );
      problemText = `(_ _:${mask}) ${problemWords.join(" ")}`;

      // 정답 구성: 장절 정보 + 가려진 단어들
      answers = [book, chap, ...vParts];
      words.forEach((w, i) => {
        if (!(i >= randIndex && i < randIndex + n) && WORD_TOKEN_RE.test(w)) {
          answers.push(normToken(w));
        }
      });
      break;
    }
  }

  return { problemText, answers, reference };
};
