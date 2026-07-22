# 처음 설정 — 내가 할 일만 순서대로

GitHub Pages(`https://devrenio.github.io/samuel/`)는 **HTML/JS 파일만** 올릴 수 있습니다.  
깨사모 API 토큰(`tokenId`)은 여기에 넣으면 안 되고, **Cloudflare Worker**라는 작은 서버에 숨겨 둡니다.

> **Cloudflare Worker란?**  
> Cloudflare가 무료로 돌려주는 초소형 API 서버입니다.  
> 우리 repo의 `samuel-memorizer-app/worker/` 코드가 여기에 올라가고,  
> 사이트는 이 Worker를 거쳐서만 깨사모에 로그인·쪽지를 보냅니다.

**기술 문서(아키텍처·API 스펙):** [`DEPLOY-BFF.md`](./DEPLOY-BFF.md)

---

## 준비물 (미리 챙길 것)

| 항목 | 어디서 | 예시 |
|------|--------|------|
| jbch `dev_name` | jbch API 발급 시 받은 프로그램명 | `SamuelMemorizer` |
| jbch `tokenId` | jbch 50자리 토큰 | `(긴 문자열)` |
| 쪽지 받을 userid | 깨사모 아이디 | `eunho715` |
| Node.js | [nodejs.org](https://nodejs.org) | v18 이상 |
| GitHub 계정 | 이미 있음 | `devRenio` |

---

## A. 로컬에서만 테스트할 때 (Cloudflare 불필요)

PC에서 `npm run dev`로 돌릴 때는 Vite가 Worker 대신 BFF를 대신해 줍니다.

### A-1. `.env` 파일 만들기

```powershell
cd c:\GitHub\devRenio.github.io\samuel-memorizer-app
copy .env.example .env
```

메모장 등으로 `.env`를 열고 **아래 3줄만** 채웁니다.

```env
JBCH_DEV_NAME=여기에_발급받은_프로그램명
JBCH_TOKEN_ID=여기에_50자리_토큰
JBCH_SUPPORT_USERID=eunho715

VITE_ADMIN_USERIDS=eunho715
```

`VITE_JBCH_BFF_URL`은 **비워 둡니다.**

### A-2. 실행

```powershell
npm install
npm run dev
```

브라우저: `http://localhost:5173/samuel/`  
→ 깨사모 로그인·쪽지가 되면 jbch 연동은 정상입니다.

---

## B. GitHub Pages에 올릴 때 (Cloudflare Worker 필수)

아래 **B-1 → B-6**을 순서대로 한 번만 하면 됩니다.  
이후 코드만 바꿀 때는 **B-5 → B-6**만 반복하면 됩니다.

---

### B-1. Cloudflare 가입 (5분)

1. 브라우저에서 [https://dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up) 접속
2. 이메일·비밀번호로 가입
3. 이메일 인증
4. **도메인 추가는 건너뛰어도 됩니다.** Worker만 쓸 거면 도메인 연결 불필요

---

### B-2. Wrangler 설치 + 로그인 (5분)

PowerShell을 **관리자 권한 없이** 열고:

```powershell
npm install -g wrangler
wrangler login
```

- 브라우저가 열리면 Cloudflare 계정으로 **Allow** 클릭
- 터미널에 `Successfully logged in` 비슷한 메시지가 나오면 OK

> `wrangler` 명령을 찾을 수 없다면: PowerShell을 닫았다가 다시 열거나,  
> `npm config get prefix` 경로의 `node_modules\.bin`이 PATH에 있는지 확인

---

### B-3. Worker에 비밀값 등록 (5분)

```powershell
cd c:\GitHub\devRenio.github.io\samuel-memorizer-app\worker
```

아래 명령을 **하나씩** 실행합니다.  
매번 값 입력 프롬프트가 뜹니다. **입력한 글자는 화면에 안 보입니다.** (정상)

```powershell
wrangler secret put JBCH_DEV_NAME
```
→ jbch 발급 프로그램명 붙여넣기 → Enter

```powershell
wrangler secret put JBCH_TOKEN_ID
```
→ 50자리 토큰 붙여넣기 → Enter

```powershell
wrangler secret put JBCH_SUPPORT_USERID
```
→ `eunho715` (또는 쪽지 받을 userid) 입력 → Enter

등록 확인:

```powershell
wrangler secret list
```

`JBCH_DEV_NAME`, `JBCH_TOKEN_ID`, `JBCH_SUPPORT_USERID` 세 개가 보이면 OK.

---

### B-4. Worker 배포 (2분)

같은 폴더(`worker`)에서:

```powershell
wrangler deploy
```

끝나면 터미널에 **URL**이 출력됩니다. 예:

```
Published samuel-jbch-bff
  https://samuel-jbch-bff.abc123def456.workers.dev
```

**이 URL을 메모장에 복사해 두세요.**  
아래에서 `<WORKER_URL>`이라고 부릅니다.

예: `https://samuel-jbch-bff.abc123def456.workers.dev`

> CORS(어느 사이트에서 호출 허용할지)는 이미 `worker/wrangler.toml`에  
> `https://devrenio.github.io` 로 설정되어 있습니다. **추가 작업 없음.**

---

### B-5. 프론트 빌드용 `.env` 수정 (3분)

```powershell
cd c:\GitHub\devRenio.github.io\samuel-memorizer-app
```

`.env` 파일에 **아래 한 줄을 추가**합니다. (`<WORKER_URL>`을 B-4에서 복사한 주소로 바꿈)

```env
VITE_JBCH_BFF_URL=https://samuel-jbch-bff.abc123def456.workers.dev/api/jbch
VITE_ADMIN_USERIDS=eunho715
VITE_JBCH_SUPPORT_LABEL=서울양천 공은호 형제
```

**주의**

- 끝에 **`/api/jbch`까지** 포함해야 합니다.
- `JBCH_TOKEN_ID`는 `.env`에 있어도 dev용이고, **빌드 JS에는 `VITE_`로 시작하는 것만** 들어갑니다.  
  `VITE_JBCH_BFF_URL`만 prod에 필요합니다.

빌드 + GitHub Pages 폴더(`samuel/`) 복사:

```powershell
npm run build:pages
```

에러 없이 끝나면 OK.

---

### B-6. GitHub에 푸시 (1분)

```powershell
cd c:\GitHub\devRenio.github.io
git add samuel/ samuel-memorizer-app/
git commit -m "Deploy Samuel with jbch BFF"
git push
```

1~2분 후 브라우저에서 테스트:

**https://devrenio.github.io/samuel/**

1. 깨사모 로그인
2. 계정 정보 보이는지
3. 문의(쪽지) 보내기

---

## C. Worker URL / secret을 바꿔야 할 때

| 상황 | 할 일 |
|------|--------|
| jbch 토큰 갱신 | `wrangler secret put JBCH_TOKEN_ID` → `wrangler deploy` |
| Worker 재배포만 | `cd worker` → `wrangler deploy` |
| Worker URL 바뀜 | `.env`의 `VITE_JBCH_BFF_URL` 수정 → `npm run build:pages` → push |
| 프론트 코드만 수정 | `npm run build:pages` → push (Worker 건드릴 필요 없음) |

---

## D. 안 될 때 빠른 확인

### 1) 사이트에서 로그인 UI조차 없고 게스트만 됨

→ prod 빌드에 `VITE_JBCH_BFF_URL`이 없었을 가능성  
→ B-5 다시 하고 `npm run build:pages` 후 push

### 2) 로그인 누르면 "네트워크 오류 / BFF URL·CORS"

→ Worker URL 오타 확인 (`/api/jbch` 포함?)  
→ `wrangler deploy`가 성공했는지  
→ 브라우저 F12 → Network → `login` 요청 URL이 Worker 주소인지

### 3) "API 토큰 인증에 실패"

→ `wrangler secret put JBCH_DEV_NAME` / `JBCH_TOKEN_ID` 값이 jbch 발급값과 일치하는지  
→ jbch 측에서 **로그인 API 사용 승인**을 받았는지 (매뉴얼 참고)

### 4) 로컬은 되는데 GitHub Pages만 안 됨

→ B-5 `VITE_JBCH_BFF_URL` 넣고 **다시 빌드**했는지 (env는 빌드할 때만 반영됨)  
→ Worker secret이 등록됐는지 `wrangler secret list`

---

## E. 한 줄 요약

```
Cloudflare 가입 → wrangler login
→ worker 폴더에서 secret 3개 등록 → wrangler deploy → URL 복사
→ .env에 VITE_JBCH_BFF_URL=<URL>/api/jbch
→ npm run build:pages → git push
→ https://devrenio.github.io/samuel/ 에서 로그인 테스트
```

---

## F. 비용

Cloudflare Workers **무료 플랜**으로 Samuel Memorizer 트래픽(로그인·쪽지)은 보통 충분합니다.  
대시보드: [https://dash.cloudflare.com](https://dash.cloudflare.com) → Workers & Pages
