export const DEFAULT_FONT = "NanumSquareRoundB";

export const BUNDLED_FONT_FILES = {
  GmarketSansBold: "GMARKETSANSTTFBOLD.TTF",
  GmarketSansLight: "GMARKETSANSTTFLIGHT.TTF",
  GmarketSansMedium: "GMARKETSANSTTFMEDIUM.TTF",
  HakgyoansimAllimjangB: "HAKGYOANSIM ALLIMJANG TTF B.TTF",
  HakgyoansimAllimjangR: "HAKGYOANSIM ALLIMJANG TTF R.TTF",
  MaruBuriBold: "MARUBURI-BOLD.TTF",
  MaruBuriExtraLight: "MARUBURI-EXTRALIGHT.TTF",
  MaruBuriLight: "MARUBURI-LIGHT.TTF",
  MaruBuriRegular: "MARUBURI-REGULAR.TTF",
  MaruBuriSemiBold: "MARUBURI-SEMIBOLD.TTF",
  NanumSquareRoundB: "NANUMSQUAREROUNDB.TTF",
  NanumSquareRoundEB: "NANUMSQUAREROUNDEB.TTF",
  NanumSquareRoundL: "NANUMSQUAREROUNDL.TTF",
  NanumSquareRoundR: "NANUMSQUAREROUNDR.TTF",
  RecipeKorea: "RECIPEKOREA 레코체 FONT.TTF",
};

export function isBundledFont(fontName) {
  return Object.prototype.hasOwnProperty.call(BUNDLED_FONT_FILES, fontName);
}

export function cssFontFamily(fontName) {
  return `"${fontName}"`;
}

export function resolveInitialFont(savedFont, isMobile) {
  const candidate = savedFont || DEFAULT_FONT;
  if (isBundledFont(candidate)) return candidate;
  return isMobile ? DEFAULT_FONT : candidate;
}

export async function preloadBundledFonts() {
  if (!("FontFace" in window)) return;

  const base = import.meta.env.BASE_URL;
  const loads = Object.entries(BUNDLED_FONT_FILES).map(
    async ([family, file]) => {
      const url = `${base}fonts/${encodeURI(file)}`;
      try {
        const face = new FontFace(family, `url("${url}") format("truetype")`, {
          display: "swap",
        });
        const loaded = await face.load();
        document.fonts.add(loaded);
      } catch {
        // 개별 폰트 실패는 무시하고 나머지 계속 로드
      }
    },
  );

  await Promise.allSettled(loads);
}
