export const BUNDLED_FONTS = [
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

export const KOREAN_FONT_MAP = {
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

export const INITIAL_FONTS = [
  ...BUNDLED_FONTS,
  ...Object.entries(KOREAN_FONT_MAP).map(([real, display]) => ({
    realName: real,
    displayName: `${display}`,
  })),
].sort((a, b) => a.displayName.localeCompare(b.displayName, "ko"));
