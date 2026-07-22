export const TUTORIAL_STORAGE_KEY = "samuel_tutorial_completed";

export const MODE_GUIDE = [
  {
    name: "빈칸 모드",
    badge: "기본",
    desc: "본문 중 일부 단어만 빈칸으로 가려집니다. 아래 비율 버튼으로 0~100%까지 난이도를 조절할 수 있습니다.",
  },
  {
    name: "구절 모드",
    badge: "암송",
    desc: "본문의 모든 단어가 빈칸이 됩니다. 성경 장·절은 그대로 보이므로 본문 전체를 외우는 데 적합합니다.",
  },
  {
    name: "장절 모드",
    badge: "참조",
    desc: "성경 책 이름, 장, 절 번호만 빈칸입니다. 본문은 공개되어 있어 장절 암기에 집중할 수 있습니다.",
  },
  {
    name: "전체 모드",
    badge: "심화",
    desc: "장·절과 본문 대부분이 빈칸입니다. 어절 수 버튼으로 연속 공개되는 단어 수(1~4)를 선택할 수 있습니다.",
  },
  {
    name: "주제 모드",
    badge: "종합",
    desc: "주제가 함께 표시되며, 본문과 장·절까지 모두 빈칸으로 암송합니다.",
  },
];

export const TUTORIAL_STEPS = [
  {
    id: "welcome",
    type: "center",
    title: "환영합니다!",
    description:
      "프로그램 사용법을 안내합니다.\n화면 아무 곳이나 클릭하면 다음으로 넘어갑니다.",
  },
  {
    id: "course-day",
    target: "course-day",
    title: "과정 · 일차 선택",
    description:
      "먼저 본인의 **과정**과 암송할 **일차**를 선택하세요.\n선택한 구절이 암송 목록에 추가됩니다.\n여러 일차를 동시에 담을 수도 있습니다.\n일차 메뉴의 **초기화**로 목록을 비울 수 있습니다.",
    placement: "bottom",
  },
  {
    id: "mode-bar",
    target: "mode-bar",
    title: "모드 선택",
    description:
      "원하는 **암송 모드**를 눌러 문제를 시작하세요.\n모드마다 빈칸 범위와 난이도가 다릅니다.\n**빈칸 모드**·**전체 모드**는 아래 작은 버튼으로 비율·공개 어절 수를 조절할 수 있습니다.",
    placement: "bottom",
  },
  {
    id: "merge-blanks",
    target: "merge-blanks",
    title: "빈칸 병합",
    description:
      "**빈칸 병합**을 켜면 인접 빈칸이 … 하나로 묶여 한 번에 입력할 수 있습니다.\n띄어쓰기 입력을 위해 **Enter**로만 제출됩니다.\n일부만 맞춰도 진행되지만, 전부 맞히지 않으면 오답으로 카운트됩니다.\n옆 **도움말** 버튼에서도 요약을 볼 수 있습니다.",
    placement: "bottom",
  },
  {
    id: "problem-area",
    target: "problem-box",
    title: "문제 확인",
    description:
      "선택한 모드에 따라 구절이 표시됩니다.\n_ 또는 … 표시된 **빈칸**에 해당하는 단어를 맞추면 됩니다.\n맞춘 단어는 **초록**, 3회 오답 시 **빨강**으로 공개됩니다.\n장절을 맞히면 (책 장:절) 형식으로 표시됩니다.",
    placement: "top",
  },
  {
    id: "input-area",
    target: "input-area",
    title: "정답 입력",
    description:
      "아래 입력창에 답을 입력하세요.\n기본: **Space** 또는 **Enter**로 제출\n빈칸 병합 ON: **Enter**로만 제출 (Space는 공백 입력)",
    placement: "top",
  },
  {
    id: "font",
    target: "font-btn",
    title: "글꼴 설정",
    description:
      "**글꼴** 버튼에서 글꼴 종류, 크기, 굵기를 바꿀 수 있습니다.\n읽기 편한 설정으로 맞춰 보세요.",
    placement: "bottom",
  },
  {
    id: "modes-guide",
    target: "mode-bar",
    type: "modes",
    title: "암송 모드 안내",
    description: "",
    placement: "bottom",
  },
  {
    id: "status-info",
    target: "status-info",
    title: "진행 정보",
    description:
      "하단에서 **현재 과정**, **남은 구절 수**, **틀린 개수**를 확인할 수 있습니다.\n남은 개수만 표시되며, 구절 본문 목록은 열람할 수 없습니다.",
    placement: "top",
  },
  {
    id: "fullscreen",
    target: "fullscreen-btn",
    title: "전체화면",
    description: "전체화면으로 암송할 수 있습니다.",
    placement: "bottom",
    desktopOnly: true,
  },
  {
    id: "theme",
    target: "theme-btn",
    title: "라이트 / 다크 모드",
    description:
      "**Dark** / **Light** 버튼으로 밝은·어두운 테마를 전환합니다.\n눈이 편한 모드를 선택하세요.",
    placement: "bottom",
  },
  {
    id: "stats",
    target: "stats-btn",
    title: "누적 통계",
    description:
      "**통계**에서 **요약** 탭(정답률·시도 횟수)과 **구절별 오답** 탭을 확인할 수 있습니다.\n기록 초기화도 가능합니다.",
    placement: "bottom",
  },
  {
    id: "account",
    target: "account-btn",
    title: "계정",
    description:
      "**계정**에서 로그인·회원가입 후 **이메일 인증**을 완료하면 클라우드 **저장하기** / **불러오기**를 할 수 있습니다.\n여러 기기를 오갈 때 이용하세요.",
    placement: "bottom",
  },
  {
    id: "info",
    target: "info-btn",
    title: "프로그램 정보",
    description:
      "**정보**에서 프로그램 안내를 볼 수 있습니다.\n튜토리얼도 이곳에서 다시 볼 수 있어요.",
    placement: "bottom",
  },
  {
    id: "skip",
    target: "skip-btn",
    title: "스킵",
    description: "**스킵**으로 현재 구절을 건너뛰고 다음 문제로 넘어갑니다.",
    placement: "top",
  },
  {
    id: "wrong",
    target: "wrong-btn",
    title: "틀린 구절",
    description:
      "오답 시 구절이 자동 저장됩니다.\n**틀린 구절**에서 모아보고 **복습**할 수 있습니다.",
    placement: "top",
  },
  {
    id: "reset",
    target: "reset-btn",
    title: "초기화",
    description:
      "**초기화**로 현재 암송 목록과 진행 상황을 처음부터 다시 시작합니다.\n틀린 구절 목록도 함께 삭제됩니다.",
    placement: "top",
  },
  {
    id: "finish",
    type: "center",
    title: "준비 완료!",
    description:
      "이제 암송을 시작해 보세요.\n**빈칸 병합**은 필요할 때 켜고 끄며 사용하면 됩니다.\n언제든 **정보 → 튜토리얼 다시 보기**로 이 안내를 다시 볼 수 있습니다.",
  },
];

export function getStepsForDevice(isMobile) {
  return TUTORIAL_STEPS.filter((step) => !step.desktopOnly || !isMobile);
}
