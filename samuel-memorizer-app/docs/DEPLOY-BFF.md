# 깨사모 BFF 가이드

> **처음 설정하시나요?** Cloudflare부터 푸시까지 **할 일만** 정리한 문서 → **[SETUP-가이드.md](./SETUP-가이드.md)**  
> (이 문서는 구조·API·트러블슈팅 참고용입니다.)

Samuel Memorizer는 깨사모(jbch) API를 **브라우저에서 직접 호출하지 않습니다.**  
민감한 `tokenId`·`dev_name`과 로그인 `hash`는 **BFF(Backend For Frontend)** 가 대신 처리합니다.

| 구분 | 저장·처리 위치 |
|------|----------------|
| `JBCH_DEV_NAME`, `JBCH_TOKEN_ID` | BFF 서버 env만 (Worker secret / 로컬 `.env`) |
| 로그인 `hash` | HttpOnly 쿠키 `samuel_jbch_hash` (JS에서 읽을 수 없음) |
| 문의 수신자 `userid` | BFF env `JBCH_SUPPORT_USERID` (클라이언트에 노출 안 함) |
| 관리자 UI 표시 | 클라이언트 `VITE_ADMIN_USERIDS` (UI용, 서버 권한 아님) |

관련 jbch API 스펙: [`docs/jbch-api-manual.md`](./jbch-api-manual.md)

---

## 1. 아키텍처

```
┌─────────────────────┐         credentials: include          ┌──────────────────────┐
│  React (GitHub Pages│  ────── POST /api/jbch/login ───────► │  BFF                 │
│  devrenio.github.io │  ◄──── Set-Cookie: samuel_jbch_hash ─ │  (Vite dev 또는       │
│  /samuel/)          │         GET  /api/jbch/member         │   Cloudflare Worker)  │
└─────────────────────┘                                       └──────────┬───────────┘
                                                                           │ dev_name + tokenId
                                                                           ▼
                                                                ┌──────────────────────┐
                                                                │  https://api.jbch.org │
                                                                └──────────────────────┘
```

### 코드 위치

| 파일 | 역할 |
|------|------|
| `server/jbchBffCore.js` | jbch 호출·세션 쿠키·CORS·라우팅 (공통 로직) |
| `vite-plugin-jbch-bff.js` | **로컬 dev** — Vite dev server에 `/api/jbch/*` 미들웨어 장착 |
| `worker/index.js` + `worker/wrangler.toml` | **프로덕션** — Cloudflare Worker 진입점 |
| `src/lib/jbchConfig.js` | 클라이언트 BFF base URL 결정 |
| `src/lib/jbchApi.js` | BFF fetch (`credentials: "include"`) |

### dev vs prod BFF

| 환경 | BFF 구현 | 클라이언트가 호출하는 URL |
|------|----------|---------------------------|
| 로컬 (`npm run dev`) | Vite 플러그인 | `/api/jbch` (same-origin, env 불필요) |
| GitHub Pages | Cloudflare Worker | `VITE_JBCH_BFF_URL` (빌드 시 주입) |

`VITE_JBCH_BFF_URL`이 **없고** 프로덕션 빌드면 → 깨사모 기능 비활성, **게스트 모드만** 동작합니다.

---

## 2. BFF HTTP API

Base path: `/api/jbch`  
모든 요청: `Content-Type: application/json`, `credentials: include` (쿠키 전송)

### `POST /login`

깨사모 로그인. 성공 시 `hash`를 HttpOnly 쿠키로 설정합니다.

**요청 body**

```json
{
  "Userid": "myuserid",
  "password": "********",
  "device": "Web (Windows)"
}
```

**성공 (200)**

```json
{ "ok": true }
```

+ `Set-Cookie: samuel_jbch_hash=<hash>; Path=/; HttpOnly; ...`

**실패 (401)**

```json
{ "error": "아이디 또는 비밀번호가 올바르지 않습니다." }
```

내부 jbch: `POST https://api.jbch.org/in/login.php`

---

### `POST /logout`

쿠키의 `hash`로 jbch 로그아웃 후 쿠키 삭제.

**요청 body:** `{}` (빈 JSON)

**성공 (200):** `{ "ok": true }` + 쿠키 만료

내부 jbch: `POST /in/logout.php`

---

### `GET /member`

쿠키 `hash`로 회원 정보 조회.

**성공 (200)**

```json
{
  "ok": true,
  "result": { "userid": "...", "name": "...", "church": "...", ... }
}
```

**실패 (401):** `{ "error": "로그인이 필요합니다." }`

내부 jbch: `POST /in/member_json.php`

---

### `POST /message`

로그인 사용자 → 고정 수신자(`JBCH_SUPPORT_USERID`)에게 쪽지 발송.

**요청 body**

```json
{
  "subject": "문의 제목",
  "content": "문의 내용"
}
```

- 제목에 `[Samuel Memorizer] ` prefix가 없으면 BFF가 자동 추가
- 제목 최대 120자 (prefix 포함)

**성공 (200):** `{ "ok": true, "result": ... }`

내부 jbch: `POST /in/send_message_json2.php`  
수신자 `toIds`는 env `JBCH_SUPPORT_USERID` 고정 (클라이언트에서 변경 불가)

---

### `GET /session`

쿠키에 유효한 `hash`가 있는지 확인.

**응답 (200):** `{ "loggedIn": true }` 또는 `{ "loggedIn": false }`

---

### `OPTIONS *`

CORS preflight. `204` + `Access-Control-Allow-*` 헤더.

---

## 3. 환경 변수

### 3-1. BFF 서버 전용 (절대 `VITE_` 붙이지 않음)

| 변수 | 필수 | 설명 | 예시 |
|------|------|------|------|
| `JBCH_DEV_NAME` | ✅ | jbch API 발급 프로그램명 | `SamuelMemorizer` |
| `JBCH_TOKEN_ID` | ✅ | jbch 50자리 토큰 | `(secret)` |
| `JBCH_SUPPORT_USERID` | ✅ | 쪽지 수신 깨사모 userid | `eunho715` |
| `JBCH_CORS_ORIGINS` | prod ✅ | 허용 Origin (쉼표 구분) | `https://devrenio.github.io` |

**어디에 넣나**

| 환경 | 설정 방법 |
|------|-----------|
| 로컬 dev | `samuel-memorizer-app/.env` |
| Cloudflare Worker | `wrangler secret put` (민감) + `wrangler.toml` `[vars]` (CORS) |

### 3-2. 클라이언트 (빌드 시 번들에 포함 — 비밀 넣지 말 것)

| 변수 | 필수 | 설명 | 예시 |
|------|------|------|------|
| `VITE_JBCH_BFF_URL` | prod ✅ | Worker BFF base URL | `https://samuel-jbch.xxx.workers.dev/api/jbch` |
| `VITE_ADMIN_USERIDS` | 선택 | 관리자 UI userid (쉼표 구분) | `eunho715` |
| `VITE_JBCH_SUPPORT_LABEL` | 선택 | 문의 화면 수신자 표시명 | `서울양천 공은호 형제` |

로컬 dev에서는 `VITE_JBCH_BFF_URL` **생략** → 자동으로 `/api/jbch` 사용.

`.env` 템플릿: [`../.env.example`](../.env.example)

---

## 4. 로컬 개발 설정

### 4-1. `.env` 작성

`samuel-memorizer-app/.env`:

```env
# BFF 서버 (Vite dev 미들웨어가 읽음)
JBCH_DEV_NAME=발급받은_프로그램명
JBCH_TOKEN_ID=발급받은_50자리_토큰
JBCH_SUPPORT_USERID=쪽지_수신_userid

# 클라이언트 (선택)
VITE_ADMIN_USERIDS=eunho715
VITE_JBCH_SUPPORT_LABEL=서울양천 공은호 형제

# VITE_JBCH_BFF_URL 은 로컬에서 넣지 않음
```

### 4-2. 실행

```bash
cd samuel-memorizer-app
npm install
npm run dev
```

브라우저: `http://localhost:5173/samuel/`

### 4-3. 동작 확인

1. DevTools → Network → `POST /api/jbch/login` → 200 + `Set-Cookie`
2. 이후 `GET /api/jbch/member` → 200 + 회원 JSON
3. Application → Cookies → `samuel_jbch_hash` (HttpOnly ✓)

로컬 쿠키: `SameSite=Lax` (Secure 없음). same-origin이라 `/api/jbch`와 `/samuel/` 모두 `localhost:5173`에서 동작.

---

## 5. Cloudflare Worker 배포 (프로덕션)

GitHub Pages는 정적 호스팅이라 BFF를 직접 올릴 수 없습니다. Worker가 필요합니다.

### 5-1. 사전 준비

```bash
npm install -g wrangler   # 최초 1회
wrangler login
```

Cloudflare 계정 + Workers 사용 가능 상태.

### 5-2. CORS origin 설정

`samuel-memorizer-app/worker/wrangler.toml`:

```toml
[vars]
JBCH_CORS_ORIGINS = "https://devrenio.github.io"
```

커스텀 도메인을 쓰면 쉼표로 추가:

```toml
JBCH_CORS_ORIGINS = "https://devrenio.github.io,https://example.com"
```

### 5-3. Secret 등록

```bash
cd samuel-memorizer-app/worker

wrangler secret put JBCH_DEV_NAME
# 프롬프트에 jbch 발급 프로그램명 입력

wrangler secret put JBCH_TOKEN_ID
# 프롬프트에 50자리 토큰 입력

wrangler secret put JBCH_SUPPORT_USERID
# 프롬프트에 쪽지 수신 userid 입력 (예: eunho715)
```

### 5-4. 배포

```bash
wrangler deploy
```

출력 예:

```
Published samuel-jbch-bff (X.XX sec)
  https://samuel-jbch-bff.<subdomain>.workers.dev
```

### 5-5. Worker 동작 확인 (curl)

```bash
# CORS preflight
curl -i -X OPTIONS \
  -H "Origin: https://devrenio.github.io" \
  -H "Access-Control-Request-Method: POST" \
  "https://samuel-jbch-bff.<subdomain>.workers.dev/api/jbch/login"

# 세션 없음
curl -i \
  -H "Origin: https://devrenio.github.io" \
  "https://samuel-jbch-bff.<subdomain>.workers.dev/api/jbch/session"
# → {"loggedIn":false}
```

로그인 테스트는 브라우저에서 앱 UI로 하는 편이 낫습니다 (쿠키·CORS 동시 확인).

### 5-6. (선택) 커스텀 도메인

Cloudflare Dashboard → Workers → 해당 Worker → Settings → Domains & Routes  
예: `jbch-api.devrenio.github.io` → `VITE_JBCH_BFF_URL`에 반영

---

## 6. GitHub Pages 빌드·배포

### 6-1. 프로덕션 `.env`

Worker 배포 **후** `samuel-memorizer-app/.env`:

```env
VITE_JBCH_BFF_URL=https://samuel-jbch-bff.<subdomain>.workers.dev/api/jbch
VITE_ADMIN_USERIDS=eunho715
VITE_JBCH_SUPPORT_LABEL=서울양천 공은호 형제
```

> `JBCH_TOKEN_ID` 등 서버 secret은 **여기 넣지 마세요.**  
> 빌드 결과 JS에 `VITE_*` 값이 그대로 들어갑니다.

### 6-2. 빌드 + `samuel/` 복사

```bash
cd samuel-memorizer-app
npm run build:pages
```

- `npm run build` → `dist/` 생성
- `scripts/copy-to-samuel.mjs` → repo 루트 `samuel/`에 복사 (GitHub Pages 서브경로)

### 6-3. 푸시

```bash
cd ..   # repo 루트
git add samuel/ samuel-memorizer-app/
git commit -m "..."
git push
```

사이트: `https://devrenio.github.io/samuel/`

### 6-4. 프로덕션 쿠키

Worker(`secure: true`):

```
samuel_jbch_hash=<hash>; Path=/; HttpOnly; SameSite=None; Secure; Max-Age=1209600
```

- GitHub Pages(HTTPS) ↔ Worker(HTTPS) **cross-site** → `SameSite=None; Secure` 필수
- `credentials: include` + CORS `Access-Control-Allow-Credentials: true` 필수

---

## 7. 전체 배포 체크리스트

```
[ ] jbch API 토큰 발급 (dev_name, tokenId)
[ ] worker/wrangler.toml — JBCH_CORS_ORIGINS = https://devrenio.github.io
[ ] wrangler secret put JBCH_DEV_NAME / JBCH_TOKEN_ID / JBCH_SUPPORT_USERID
[ ] wrangler deploy → Worker URL 확인
[ ] .env — VITE_JBCH_BFF_URL=<Worker URL>/api/jbch
[ ] npm run build:pages
[ ] https://devrenio.github.io/samuel/ 에서 로그인·쪽지 테스트
[ ] DevTools — 번들 JS에 tokenId 문자열 없는지 확인
```

---

## 8. 트러블슈팅

### 로그인은 되는데 member가 401

- 쿠키가 설정되지 않음 → Network 탭에서 `login` 응답 `Set-Cookie` 확인
- prod: `SameSite=None; Secure` 미적용, 또는 HTTP 페이지에서 접속
- CORS: `Access-Control-Allow-Origin`이 `*`이면 credentials 쿠키 불가 → Worker `JBCH_CORS_ORIGINS`에 정확한 origin

### `네트워크 오류입니다. BFF URL·CORS 설정을 확인하세요.`

- `VITE_JBCH_BFF_URL` 오타 / Worker 미배포
- Worker CORS에 `https://devrenio.github.io` 누락
- 브라우저 확장(광고 차단 등)이 cross-origin fetch 차단

### `JBCH_DEV_NAME / JBCH_TOKEN_ID가 설정되지 않았습니다.`

- **로컬:** `.env`에 `JBCH_*` 있는지, dev server 재시작
- **Worker:** `wrangler secret list`로 secret 등록 확인

### `문의 수신자 설정이 없습니다.` (500)

- Worker/local env에 `JBCH_SUPPORT_USERID` 미설정

### `API 토큰 인증에 실패했습니다.`

- `JBCH_DEV_NAME` 또는 `JBCH_TOKEN_ID` 불일치
- jbch 측 API 승인(로그인 API) 미완료 — 매뉴얼 참고

### 로컬에서는 되는데 GitHub Pages에서만 안 됨

1. `VITE_JBCH_BFF_URL`을 넣고 **다시 빌드**했는지 (env는 빌드 타임 주입)
2. Worker `JBCH_CORS_ORIGINS`에 `https://devrenio.github.io` 포함
3. CSP `connect-src` — `index.html`에 `https:` 허용됨 (Worker URL 포함)

### 게스트 모드만 보임

- prod 빌드에 `VITE_JBCH_BFF_URL` 없음 → `isJbchConfigured()` false
- `.env` 수정 후 `npm run build:pages` 재실행 필요

---

## 9. 보안 요약

| 항목 | 상태 |
|------|------|
| `tokenId` 클라이언트 노출 | ❌ BFF env only |
| `hash` JS 접근 | ❌ HttpOnly 쿠키 |
| 쪽지 수신자 임의 지정 | ❌ `JBCH_SUPPORT_USERID` 서버 고정 |
| 관리자 콘솔 | ⚠️ 클라이언트 `VITE_ADMIN_USERIDS` (UI 숨김용, API 권한 아님) |
| `.env` git 추적 | ❌ `.gitignore` 처리 |

---

## 10. 명령어 요약

```bash
# 로컬 개발
cd samuel-memorizer-app && npm run dev

# Worker 배포
cd samuel-memorizer-app/worker && wrangler deploy

# GitHub Pages용 빌드
cd samuel-memorizer-app && npm run build:pages

# Worker secret 관리
wrangler secret list
wrangler secret put JBCH_TOKEN_ID
wrangler secret delete JBCH_TOKEN_ID   # 교체 시
```
