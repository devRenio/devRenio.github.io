# 선교회 API 매뉴얼

발급받은 토큰으로 선교회 서비스 데이터를 연동하세요.

## 인증

모든 요청에 발급받은 `dev_name` 과 `tokenId` 를 포함합니다. API키 발급에서 토큰을 발급받으세요.

| 항목 | 값 |
| --- | --- |
| 베이스 URL | `https://api.jbch.org` |
| `dev_name` | 발급 시 등록한 프로그램명 |
| `tokenId` | 발급받은 50자리 토큰 |

## 회원 API

### 로그인

**POST** `/in/login.php`

태그: #로그인, #인증, #회원, #임원수첩2

깨사모 로그인 입니다. 로그인 후 받게되는 hash 값을 저장해서 사용하시면 됩니다.

헤더: `Content-Type: application/json`

#### 요청 파라미터

| 파라미터 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `dev_name` | string | 필수 | 발급시 사용한 앱이름(영문) |
| `tokenId` | string | 필수 | 발급받은 50자리 토큰 |
| `Userid` | string | 필수 | 로그인 아이디 |
| `password` | string | 필수 | 비밀번호 |
| `device` | string | 필수 | 기기 종류(Mac/iPhone/Android 등) |
| `output` | string | 선택 | 응답 형식(1=JSON, 그 외 텍스트) |

#### 출력 결과

| 파라미터명 | 예상결과 | 설명 |
| --- | --- | --- |
| `status` | `status` | 래퍼 키(항상 문자열 status). output=1일 때만 JSON |
| `result` | `ok` | 로그인 결과 ok 또는 error |
| `hash` | `a1b2c3d4...` | 발급된 로그인 인증 hash(성공 시), 실패 시 빈 문자열 |
| `comment` | — | 오류 메시지(실패 시): 아이디나 비번값이 없습니다. / 디바이스 아이디가 없습니다. / 해당 정보의 사용자 계정을 찾지 못했습니다... |
| `(text-response)` | `status@@ok@@a1b2c3d4` | output!=1이면 JSON 대신 status@@결과@@hash 형식 문자열 반환 |
| `(HTTP 500)` | — | 토큰 인증 실패 {"status":"error","result":"Not_certification!"} 또는 계정 불일치 시 반환 |

---

### 로그아웃

**POST** `/in/logout.php`

태그: #로그아웃, #인증, #회원

입력받은 로그인 hash로 깨사모 로그아웃 합니다.

여기에서 테스트해서 로그아웃되면 정상입니니다.

로그인 API는 승인을 거쳐 권한을 드립니다. 별도로 문의하시기 바랍니다.

헤더: `Content-Type: application/json`

#### 요청 파라미터

| 파라미터 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `dev_name` | string | 필수 | 발급시 사용한 앱이름(영문) |
| `tokenId` | string | 필수 | 발급받은 50자리 토큰 |
| `hash` | string | 필수 | 로그인 시 발급된 hash |

#### 출력 결과

| 파라미터명 | 예상결과 | 설명 |
| --- | --- | --- |
| `status` | `status` | 래퍼 키. 정상 처리 시 status, hash 누락 시 error |
| `result` | `ok` | 로그아웃 결과 ok 또는 error(hash 누락 시 Empty hash!) |

---

## 회원정보 API

### 내 회원정보 (JSON)

**POST** `/in/member_json.php`

태그: #회원정보, #프로필

접속한 사람의 깨사모 정보글 가져옵니다. 로그인 후 받은 hash 값이 필수입니다.

헤더: `Content-Type: application/json`

#### 요청 파라미터

| 파라미터 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `dev_name` | string | 필수 | 발급시 사용한 앱이름(영문) |
| `tokenId` | string | 필수 | 발급받은 50자리 토큰 |
| `hash` | string | 필수 | 로그인 시 발급된 hash |

#### 출력 결과

| 파라미터명 | 예상결과 | 설명 |
| --- | --- | --- |
| `status` | `ok` | 래퍼 키. 정상 ok, 정보없음 not, 오류 error |
| `result` | `{...}` | 회원 정보 객체. not/error 시 null 또는 오류 메시지 |
| `userid` | `leebcsp` | 깨사모아이디 |
| `mid` | `12345` | 회원 고유 ID |
| `username` | `홍길동` | 회원 이름 |
| `sexori` | `형제` | 원본 성별 |
| `sex` | `형제` | 성별 |
| `email` | `user@jbch.org` | 이메일 |
| `birth` | `1985-05-10` | 생년월일 |
| `reborn` | `1990-01-01` | 거듭남 일자 |
| `address` | `경기도 안앵시 동안구 ...` | 주소 |
| `tel` | `031-000-0000` | 전화번호 |
| `hand` | `010-0000-0000` | 휴대전화 |
| `chid` | `98` | 소속 교회 ID |
| `churchname` | `서울중앙` | 소속 교회명 |
| `service` | — | 선교회(섬김) 정보 |
| `avatar` | `https://common.jbch.org/upload/member/profile/l/leebcsp_100.jpg` | 아이디_50, 100, 150, 200px 까지 사용가능 |

---

## 공통 API

### 사용자의 새 알림 개수 조회

**POST** `/in/noti_newcount_json.php`

태그: #알림, #개수, #noti, #count, #푸시

hash로 로그인한 회원의 **새 알림 개수**를 조회합니다.
- 결과는 result.total 에 숫자로 반환됩니다.

헤더: `Content-Type: application/json`

#### 요청 파라미터

| 파라미터 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `dev_name` | string | 필수 | 발급시 사용한 앱이름(영문) |
| `tokenId` | string | 필수 | 발급받은 50자리 토큰 |
| `hash` | string | 필수 | 로그인 시 발급된 hash (사용자 인증) |

#### 출력 결과

| 파라미터명 | 예상결과 | 설명 |
| --- | --- | --- |
| `status` | `ok` | 처리 결과(ok / not / error) |
| `result.total` | `7` | 새 알림 개수 |

---

### 선교회앱목록

**POST** `/ex/apps.php`

태그: #앱목록

GET POST 둘다 작동됩니다.

#### 요청 파라미터

| 파라미터 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `dev_name` | string | 필수 | 발급시 사용한 앱이름(영문) |
| `tokenId` | string | 필수 | 발급받은 50자리 토큰 |
| `chk_de` | string | 선택 | ios, android, web 플랫폼(OS) 구분값으로 해당 OS용 앱만 조회 |

#### 출력 결과

| 파라미터명 | 예상결과 | 설명 |
| --- | --- | --- |
| `id` | `1` | 앱 고유 아이디 |
| `name` | `라이프워드` | 앱 이름 |
| `ename` | `Lifeword` | 앱 영문명 |
| `icon` | `icon.png` | 앱 아이콘 파일명 |
| `os` | `1` | 플랫폼 구분 |
| `appLink` | `https://...` | 앱 실행 링크 |
| `storeLink` | `https://play.google.com/...` | 스토어 링크 |
| `onlymember` | `2` | 회원전용 여부 |
| `enable` | `1` | 노출 여부 |
| `onlyPc` | `2` | PC 전용 여부 |
| `onlyPc_size` | — | PC 전용 크기 |
| `onlyMobile` | `2` | 모바일 전용 여부 |
| `insort` | `99` | 정렬 순서 |

---

### 성경강연회 일정 목록

**POST** `/ex/bible_seminar.php`

태그: #일정, #성경강연회일정

전국 성경강연회 일정을 가져옵니다.

GET, POST 둘 다 작동합니다.

#### 요청 파라미터

| 파라미터 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `dev_name` | string | 필수 | 발급시 사용한 앱이름(영문) |
| `tokenId` | string | 필수 | 발급받은 50자리 토큰 |
| `uid` | int | 선택 | 세미나 일정 고유 ID 필터 |
| `keyword` | string | 선택 | 검색 키워드 |
| `chId` | int | 선택 | 교회 ID 필터 |
| `nacode` | string | 선택 | 국가 코드 필터 |
| `start` | date | 선택 | 조회 시작일 |
| `end` | date | 선택 | 조회 종료일 |
| `size` | int | 선택 | 1:대집회 2:중집회 3:소집회 4:교회학교 |
| `maxX` | string | 선택 | 지도 영역 최대 경도 |
| `maxY` | string | 선택 | 지도 영역 최대 위도 |
| `minX` | string | 선택 | 지도 영역 최소 경도 |
| `minY` | string | 선택 | 지도 영역 최소 위도 |

#### 출력 결과

| 파라미터명 | 예상결과 | 설명 |
| --- | --- | --- |
| `id` | `100` | 일정 고유 아이디 |
| `title` | `성경세미나` | 일정 제목 |
| `size` | `1` | 규모 구분 |
| `nacode` | `082` | 국가코드 |
| `local_name` | `서울` | 지역명 또는 국가명 |
| `chId` | `123` | 교회 아이디 |
| `churchname` | `서울교회` | 교회명 |
| `speaker` | `홍길동` | 강사명 |
| `dateStart` | `2026-03-01` | 시작일 |
| `dateEnd` | `2026-03-03` | 종료일 |
| `timeStart` | `19:00` | 시작 시간 |
| `mapLat` | `37.5` | 위도 |
| `mapLng` | `127.0` | 경도 |
| `address` | `서울시 ...` | 주소 |
| `location` | `본당` | 장소 |
| `phone` | `02-000-0000` | 연락처 |

---

### 집회,선교,선교회 일정 목록

**POST** `/ex/sche_seminar.php`

태그: #일정, #선교일정, #선교회일정, #성경강연회일정

전국의 모든 집회, 선교일정, 선교회일정을 가져옵니다.

#### 요청 파라미터

| 파라미터 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `dev_name` | string | 필수 | 발급시 사용한 앱이름(영문) |
| `tokenId` | string | 필수 | 발급받은 50자리 토큰 |
| `id` | string | 선택 | 하나의 정보가 필요할때 (, 콤마 복수) |
| `start` | date | 선택 | yyyy-mm-dd 없으면 오늘 기준 365일까지 |
| `end` | date | 선택 | yyyy-mm-dd start와 함께 넣어준다. |
| `chId` | string | 선택 | 교회아이디 (, 콤마 복수) |
| `size` | int | 선택 | 1:대집회 2:중집회 3:소집회 4:교회학교 |
| `sId` | string | 선택 | 43:국내집회 230:해외집회 65:해외선교 74:선교회일정 |
| `natId` | string | 선택 | 082:대한민국 (, 콤마 복수) |

#### 출력 결과

| 파라미터명 | 예상결과 | 설명 |
| --- | --- | --- |
| `id` | `500` | 일정 ID |
| `sId` | `43` | 일정 시리즈 ID |
| `lang` | `ko` | 언어 |
| `size` | `1` | 집회 종류 |
| `title` | `성경강연회` | 제목 |
| `speaker` | `홍길동` | 강사명 |
| `speakerId` | `30` | 강사 ID |
| `tags` | `전도,집회` | 태그 |
| `urlLink` | `https://jbch.org` | URL 링크 |
| `mediaLink` | `https://youtu.be/abc` | 미디어 링크 |
| `imgPath` | `https://file1.jbch.org/img.jpg` | 이미지 경로 |
| `charge` | `무료` | 참가비 |
| `natId` | `082` | 국가 코드 |
| `albumhead` | — | 앨범 헤드 |
| `boardhead` | — | 게시판 헤드 |
| `content` | `집회 안내 내용` | 내용 |
| `userid` | `christlee` | 작성자 아이디 |
| `phone` | `010-1234-5678` | 연락처 |
| `email` | `info@jbch.org` | 이메일 |
| `mapLat` | `37.5665` | 위도 |
| `mapLng` | `126.9780` | 경도 |
| `chId` | `45` | 교회 ID |
| `dateStart` | `2026-07-01` | 시작일 |
| `dateEnd` | `2026-07-03` | 종료일 |
| `timeStart` | `19:00` | 시작 시간 |
| `timeEnd` | `21:00` | 종료 시간 |
| `allDay` | `0` | 종일 여부 |
| `address` | `서울시 강남구` | 주소 |
| `created` | `2026-06-01 10:00:00` | 생성일시 |
| `modified` | `2026-06-02 10:00:00` | 수정일시 |
| `openlevel` | `1` | 공개 레벨 |
| `enable` | `1` | 활성 여부 |
| `modifier` | `christlee` | 수정자 |
| `location` | `서울교회` | 장소 |
| `churchname` | `Seoul Church` | 교회명(b.name) |
| `name_kor` | `서울교회` | 교회 한글명 |
| `nation_name` | `대한민국` | 교회 소재 국가명 |
| `nation_ini_2` | `KR` | 국가 2자리 이니셜 |
| `nation_ini_3` | `KOR` | 국가 3자리 이니셜 |
| `nation_name_eng` | `Korea` | 교회 소재 국가 영문명 |
| `continent` | `ASIA` | 교회 소재 대륙 |
| `sche_nation_name` | `대한민국` | 일정 국가명 |
| `sche_nation_name_eng` | `Korea` | 일정 국가 영문명 |
| `sche_continent` | `ASIA` | 일정 대륙 |

---

### 국가명의 언어번역

**POST** `/ex/world.php`

태그: #교회목록

모든 교회명의 언어별 이름 목록입니다.

#### 요청 파라미터

| 파라미터 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `dev_name` | string | 필수 | 발급시 사용한 앱이름(영문) |
| `tokenId` | string | 필수 | 발급받은 50자리 토큰 |
| `uid` | int | 선택 | 특정 국가코드 레코드 고유번호(uid) 필터 |
| `nation_code` | string | 선택 | 국가 코드 필터 |
| `continent` | string | 선택 | 대륙 필터(ASIA, EUROPE 등) |
| `nation_ini` | string | 선택 | 국가 이니셜(2자리/3자리) 필터 |
| `name_eng` | string | 선택 | 국가 영문명 필터 |
| `sort` | string | 선택 | 정렬 방식(name 지정 시 국가명 오름차순) |

#### 출력 결과

| 파라미터명 | 예상결과 | 설명 |
| --- | --- | --- |
| `uid` | `1` | 국가 코드 레코드 UID |
| `continent` | `ASIA` | 대륙 |
| `nation_code` | `082` | 국가 코드 |
| `nation_name` | `대한민국` | 국가명 |
| `local_name` | `한국` | 현지명 |
| `nation_ini_2` | `KR` | 국가 2자리 이니셜 |
| `nation_ini_3` | `KOR` | 국가 3자리 이니셜 |
| `name_kor` | `대한민국` | 한글명 |
| `name_eng` | `Korea` | 영문명 |
| `name_npl` | — | 네팔어명 |
| `name_prt` | — | 포르투갈어명 |
| `name_ger` | — | 독일어명 |
| `name_phl` | — | 필리핀어명 |
| `name_cna` | — | 중국어명 |
| `name_jpn` | — | 일본어명 |
| `name_esp` | — | 스페인어명 |
| `name_mgl` | — | 몽골어명 |
| `name_rus` | — | 러시아어명 |
| `name_fra` | — | 프랑스어명 |
| `openstatus` | `1` | 공개 상태 |
| `boardUid` | `100` | 게시판 UID |
| `albumUid` | `200` | 앨범 UID |
| `addChCount` | `0` | 추가 교회 수 |
| `countNews` | `5` | 뉴스 수 |
| `countChurch` | `30` | 교회 수(컬럼) |
| `count_church` | `30` | 국가별 교회 수 집계(서브쿼리) |
| `count_location` | `12` | 국가별 처소 수 집계(서브쿼리) |

---

## 게시판 API

### 게시판의 댓글 좋아요 관련 처리

**POST** `/in/boardb_pro_json.php`

태그: #게시판

"**mode**" 명령에 따른 필수항목 안내

댓글 추가 : add_comment
board_uid : 게시물 아이디
comment : 댓글내용
url : 깨사모 알림에 저장될 현재 위치

댓글삭제 : del_comment
board_uid
comment_uid

좋아요 : processLike
board_uid,
sw : sw=1 좋아요, sw=2 취소

나의 좋아요 체크 여부 : chkLike
board_uid

게시글 히트 : updateHit
board_uid

총 댓글수 : countComment
board_uid

헤더: `Content-Type: application/json`

#### 요청 파라미터

| 파라미터 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `dev_name` | string | 필수 | 발급시 사용한 앱이름(영문) |
| `tokenId` | string | 필수 | 발급받은 50자리 토큰 |
| `hash` | string | 필수 | 로그인 시 발급된 hash |
| `mode` | string | 필수 | 처리명령 |
| `board_uid` | string | 선택 | 게시물 아이디 |
| `chId` | string | 선택 | 교회 아이디 |
| `sw` | string | 선택 | 1: 좋아요클릭 2:좋아요취소 |
| `comment_uid` | string | 선택 | 댓글 아이디 |
| `url` | string | 선택 | 댓글 추가시 링크 |
| `comment` | string | 선택 |  |

#### 출력 결과

| 파라미터명 | 예상결과 | 설명 |
| --- | --- | --- |
| `status` | `error` | 인증 실패 시 JSON 상태값 (error) |
| `result` | `{status:error, result:"알 수 없는 mode 입니다."}` | 인증 실패 시 오류 메시지 (Empty hash, Hash not found, Only Member 등) |
| `add_comment 댓글달기 성공 결과` | `{status:ok` | error, uid, profilePic, comment, writer, churchname} |
| `add_comment 댓글달기 실패 결과` | `{status:error, result:"댓글이 너무 짧습니다."}` | 댓글이 2자 미만일 때 반환되는 오류 텍스트 |
| `del_comment 댓글 삭제 결과` | `{status:ok` | error, total_comment} |
| `processLike 좋아요 체크 결과` | `{"status":"ok","process":"plus","total_like":1}` | 추가 |
| `processLike 좋아요 취소 결과` | `{"status":"ok","process":"minus","total_like":0}` | 취소 |
| `chkLike 나의 좋아요 체크여부와 총 갯수` | `{status:ok, liked:true/false, total_like:1}` | 좋아요 상태 확인 응답 텍스트 |
| `countComment 댓글수` | `{status:ok, total_comment}` | 댓글 수 집계 응답 텍스트 |
| `updateHit 조회수 증가` | `{status:ok}` |  |

---

### 게시판 댓글

**POST** `/in/load_boardb_comment.php`

태그: #게시판, #댓글

게시물에 대한 댓글목록입니다.

#### 요청 파라미터

| 파라미터 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `dev_name` | string | 필수 | 발급시 사용한 앱이름(영문) |
| `tokenId` | string | 필수 | 발급받은 50자리 토큰 |
| `uid` | int | 선택 | 댓글 고유번호 |
| `board_uid` | int | 선택 | 댓글이 속한 게시글 번호 |
| `orderby` | string | 선택 | 댓글 정렬 순서(기본값 DESC) |

#### 출력 결과

| 파라미터명 | 예상결과 | 설명 |
| --- | --- | --- |
| `uid` | `5001` | 댓글 uid |
| `board_uid` | `10001` | 게시글 uid |
| `category_uid` | `5` | 게시판(카테고리) uid |
| `userid` | `hong123` | 작성자 아이디 |
| `comment` | `좋은 글이네요` | 댓글 내용 (태그 제거 처리) |
| `created` | `2026-06-20 10:00:00` | 작성 일시 |
| `username` | `홍길동` | 작성자 이름 |
| `sex` | `형제` | 성별 |
| `sexori` | `M` | 원본 성별 코드 |
| `churchname` | `본교회` | 소속 교회명 |
| `chid` | `1` | 교회 ID |
| `profilePic` | `https://common.jbch.org/...` | 프로필 사진 URL |

---

### 지정 게시판들의 최신글들 뽑아내기

**POST** `/in/load_boardb_latest.php`

태그: #최신글, #게시판

게시판들의 최신글들을 정해진 갯수만큼씩 가져옵니다.

#### 요청 파라미터

| 파라미터 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `dev_name` | string | 필수 | 발급시 사용한 앱이름(영문) |
| `tokenId` | string | 필수 | 발급받은 50자리 토큰 |
| `boardIds` | string | 필수 | 최신글을 조회할 게시판 ID 목록 |
| `hash` | string | 선택 | 로그인시 받은 hash값 |
| `cnt` | int | 선택 | 정해진 갯수만큼 뽑아내기 기본 1개 최대 100개 |

#### 출력 결과

| 파라미터명 | 예상결과 | 설명 |
| --- | --- | --- |
| `(게시판ID)` | `{ }` | 게시판 ID(position)를 키로 하는 그룹 객체 |
| `(게시판ID).position` | `2492` | 게시판(카테고리) uid |
| `(게시판ID).position_name` | `서울중앙교회 교제실` | 게시판명 |
| `(게시판ID).img_primary` | `https://...jpg` | 게시판 대표 이미지 |
| `(게시판ID).posts` | `[ ]` | 해당 게시판 글 목록(최신순, cnt개) |
| `posts[].uid` | `10001` | 게시글 uid |
| `posts[].subject` | `공지 제목` | 게시글 제목 |
| `posts[].opened` | `2026-06-01 00:00:00` | 공개 시작 일시(없으면 null) |
| `posts[].created` | `2026-06-20 10:00:00` | 작성 일시 |
| `posts[].userid` | `hong123` | 작성자 아이디 |
| `posts[].username` | `홍길동` | 작성자 이름 |

---

### 게시글목록 및 상세내용

**POST** `/in/load_boardb_post.php`

태그: #게시판, #게시글목록

교회의 게시판/앨범/교회소식의 게시물 목록을 가져옵니다.

헤더: `Content-Type: application/json`

#### 요청 파라미터

| 파라미터 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `dev_name` | string | 필수 | 발급시 사용한 앱이름(영문) |
| `tokenId` | string | 필수 | 발급받은 50자리 토큰 |
| `hash` | string | 선택 |  |
| `boardId` | int | 선택 | 게시판 아이디 |
| `chId` | string | 필수 | 교회아이디 |
| `gId` | string | 선택 | 부서 id |
| `use_kind` | string | 필수 | 1:게시판 2:교회뉴스 3:앨범 |
| `flag` | int | 필수 | 1: 교회 |
| `swCount` | int | 선택 | 2: 마지막등록일, 최초등록일이 필요할때 1:그냥 토날이 필요할때 |
| `uid` | int | 선택 | 게시물 아이디 |

#### 출력 결과

| 파라미터명 | 예상결과 | 설명 |
| --- | --- | --- |
| `status` | `ok` | 성공 여부 (ok/not) |
| `result` | — | 게시글 목록 배열 (없으면 null) |
| `first_created` | — | 최초글 등록일 |
| `last_created` | — | 최신글 등록일 |
| `total` | — | 갯수 |
| `created` | `2026-06-20 10:00:00` | 작성일 (cdate 매핑) |
| `uid` | `10001` | 게시글 uid |
| `postUid` | `10001` | 게시글 uid 별칭 |
| `flag` | `1` | 게시판 구분 flag (useFlag 매핑) |
| `chId` | `1` | 교회 ID |
| `depth` | `0` | 답글 깊이 |
| `num` | `9999` | 정렬 번호 |
| `group_position` | `5` | 그룹 게시판 위치 |
| `position` | `5` | 게시판(카테고리) uid |
| `position_name` | `자유게시판` | 게시판명 |
| `gId` | `100` | 그룹 ID |
| `head_uid` | `0` | 원글 uid |
| `head_name` | — | 원글 작성자명 |
| `subject` | `제목입니다` | 게시글 제목 |
| `content` | `내용입니다` | 본문 (nl2br/URL치환 처리) |
| `userid` | `hong123` | 작성자 아이디 (postUserid 매핑) |
| `username` | `홍길동` | 작성자 이름 |
| `hit` | `55` | 조회수 |
| `view` | `1` | 공개 여부 |
| `tags` | `수련회,청년` | 태그 |
| `total_comment` | `3` | 댓글 수 |
| `total_good` | `10` | 좋아요 수 |
| `sitelink` | — | 사이트 링크 |
| `medialink` | — | 미디어 링크 |
| `notice` | `0` | 공지 여부 |
| `status_post` | `0` | 게시글 상태(레코드 내 status 키) |
| `front_on` | `1` | 메인 노출 여부 |
| `limit_date` | — | 노출 제한일 |
| `opened` | `2026-06-01 00:00:00` | 공개 시작 일시 |
| `modifed` | `2026-06-02 00:00:00` | 수정 일시 |
| `pw` | — | 비밀글 비밀번호 |
| `use_kind` | `2` | 게시판 용도 종류 (useKind 매핑) |
| `gkind` | — | 그룹 종류 |
| `filepath` | — | 첨부 파일 경로 |
| `originalname` | — | 첨부 원본 파일명 |
| `re_year` | `2026` | 수련회 연도 |
| `re_code` | `2026-01` | 수련회 코드 |
| `auth_write` | `0` | 쓰기 권한 |
| `auth_view` | `0` | 보기 권한 |
| `auth_reply` | `0` | 댓글 권한 |
| `f_no` | `1` | 번호 표시 여부 |
| `f_writer` | `1` | 작성자 표시 여부 |
| `f_addfile` | `1` | 첨부 표시 여부 |
| `f_date` | `1` | 날짜 표시 여부 |
| `f_hit` | `1` | 조회수 표시 여부 |
| `imgs` | — | 본문 추출 이미지 배열 (use_kind<=2) |
| `files` | — | 첨부파일 목록 (use_kind<=2, postUid>1) |
| `img` | `https://file2.jbch.org/...jpg` | 대표 이미지 (withImg 지정 시) |

---

### 게시판정보 목록

**POST** `/in/load_category_board.php`

태그: #게시판, #게시판정보

교회에서 운영하는 게시판/앨범 목록

#### 요청 파라미터

| 파라미터 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `dev_name` | string | 필수 | 발급시 사용한 앱이름(영문) |
| `tokenId` | string | 필수 | 발급받은 50자리 토큰 |
| `flag` | string | 선택 | 게시판 카테고리 조회 구분 플래그 |
| `boardId` | int | 선택 | 게시판 ID 필터 |
| `chId` | int | 필수 | 교회 ID 필터 |
| `use_kind` | int | 필수 | 1:게시판 2:뉴스 3:앨범 |

#### 출력 결과

| 파라미터명 | 예상결과 | 설명 |
| --- | --- | --- |
| `uid` | `12` | 게시판 카테고리 고유번호(PK) |
| `enable` | `1` | 활성 여부(1=활성) |
| `flag` | `1` | 게시판 구분 플래그 |
| `chId` | `98` | 교회 ID |
| `group_uid` | — | 그룹 고유번호 |
| `gId` | — | 그룹 ID |
| `gId_part` | — | 그룹 파트 ID |
| `view` | `1` | 노출 여부 |
| `title` | `주일설교` | 게시판 제목 |
| `re_year` | `2024` | 수련회 연도 |
| `re_code` | `A` | 수련회 코드 |
| `admin_id` | `christlee` | 관리자 아이디 |
| `admin_view_sw` | `1` | 관리자 보기 스위치 |
| `viewtype` | `1` | 보기 유형 |
| `sort_num` | `0` | 정렬 순서 |
| `img_primary` | `/upload/x.jpg` | 대표 이미지 경로 |
| `img_title` | `title.jpg` | 타이틀 이미지 |
| `img_title_on` | `0` | 타이틀 이미지 사용 여부 |
| `img_banner` | `banner.jpg` | 배너 이미지 |
| `img_banner_on` | `0` | 배너 이미지 사용 여부 |
| `img_banner_link` | `https://` | 배너 링크 URL |
| `img_banner_target` | `0` | 배너 링크 타겟 |
| `user_text` | — | 사용자 안내 텍스트 |
| `user_text_on` | `0` | 안내 텍스트 사용 여부 |
| `auth_write` | `0` | 쓰기 권한 |
| `auth_reply` | `0` | 댓글 권한 |
| `auth_view` | `0` | 보기 권한 |
| `best_on` | `1` | 베스트글 사용 여부 |
| `comment_on` | `1` | 댓글 사용 여부 |
| `timeline_on` | `1` | 타임라인 사용 여부 |
| `opened_on` | `0` | 공개 예약 사용 여부 |
| `like_on` | `1` | 좋아요 사용 여부 |
| `sw_dawn` | `0` | 새벽 스위치 |
| `f_no` | `1` | 번호 컬럼 표시 여부 |
| `f_writer` | `1` | 작성자 컬럼 표시 여부 |
| `f_addfile` | `1` | 첨부파일 컬럼 표시 여부 |
| `f_date` | `1` | 날짜 컬럼 표시 여부 |
| `f_hit` | `1` | 조회수 컬럼 표시 여부 |
| `count_list` | `15` | 목록 표시 개수 |
| `reply_style` | `1` | 댓글 스타일 |
| `page_style` | `1` | 페이지 스타일 |
| `totalsize` | `102400` | 전체 용량 제한 |
| `onesize` | `102400` | 단일 파일 용량 제한 |
| `use_kind` | `1` | 사용 종류 |
| `skin_bbs` | `1` | 게시판 스킨 |
| `updated` | `2024-01-01 00:00:00` | 수정 일시 |

---

### 게시판 글쓰기

**POST** `/in/boardb_write_json.php`

태그: #게시판, #글쓰기, #write

hash 로 로그인한 회원이 지정 게시판(boardId)에 새 글을 등록합니다.
- 쓰기권한 게시판(auth_write=1)은 권한이 있는 회원만 작성됩니다.
- 첨부파일·푸시·SNS공유는 미포함(텍스트 글 등록).

헤더: `Content-Type: application/json`

#### 요청 파라미터

| 파라미터 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `dev_name` | string | 필수 | 발급시 사용한 앱이름(영문) |
| `tokenId` | string | 필수 | 발급받은 50자리 토큰 |
| `hash` | string | 필수 | 로그인 시 발급된 hash (작성자 인증) |
| `boardId` | int | 필수 | 글을 쓸 게시판(카테고리) uid |
| `subject` | string | 필수 | 제목 |
| `content` | string | 선택 | 본문 내용 |
| `tags` | string | 선택 | 태그(쉼표로 구분) |
| `notice` | int | 선택 | 공지 여부(0/1) |
| `front_on` | int | 선택 | 전면 노출(0/1) |
| `view` | int | 선택 | 노출 범위(0/1/2, 기본 1) |
| `pw` | string | 선택 | 비밀번호(선택) |
| `fileId` | string | 선택 | 첨부파일 업로드 API가 반환한 fileId(배열) |
| `fileName` | string | 선택 | 첨부 원본 파일명(배열, fileId와 순서 일치) |

#### 출력 결과

| 파라미터명 | 예상결과 | 설명 |
| --- | --- | --- |
| `status` | `ok` | 처리 결과(ok / error) |
| `result.uid` | `5023460` | 등록된 게시글 uid |
| `result.position` | `2492` | 게시판(카테고리) uid |
| `result.num` | `90946` | 게시판 내 글 번호 |
| `result.flag` | `1` | 게시판 flag |
| `result.chId` | `98` | 교회 ID |

---

### 게시판 글 삭제

**POST** `/in/boardb_delete_json.php`

태그: #게시판, #삭제, #delete

hash 로 로그인한 회원이 본인이 작성한 글만 삭제합니다.
- 답글이 있는 글은 내용만 비우는 소프트삭제, 없으면 본문·첨부·댓글·좋아요·태그까지 완전 삭제됩니다.

헤더: `Content-Type: application/json`

#### 요청 파라미터

| 파라미터 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `dev_name` | string | 필수 | 발급시 사용한 앱이름(영문) |
| `tokenId` | string | 필수 | 발급받은 50자리 토큰 |
| `hash` | string | 필수 | 로그인 시 발급된 hash (작성자 인증) |
| `uid` | int | 필수 | 삭제할 게시글 uid |

#### 출력 결과

| 파라미터명 | 예상결과 | 설명 |
| --- | --- | --- |
| `status` | `ok` | 처리 결과(ok / error) |
| `result.uid` | `5023491` | 삭제한 게시글 uid |
| `result.deleted` | `true` | 삭제 완료 여부 |

---

### 게시판 첨부파일 업로드

**POST** `/in/boardb_upload_json.php`

태그: #게시판, #첨부, #업로드, #upload

첨부파일을 업로드합니다. multipart/form-data 로 전송하며(JSON 아님), 이미지는 자동으로 회전보정·썸네일(view_/sum_)이 생성됩니다.
- 반환된 fileId/fileName 을 글쓰기 API의 fileId[]/fileName[] 로 넘기면 글에 첨부됩니다.
- 파일당 1회 호출(여러 개면 반복 호출).

헤더: `Content-Type: multipart/form-data`

#### 요청 파라미터

| 파라미터 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `dev_name` | string | 필수 | 발급시 사용한 앱이름(영문) |
| `tokenId` | string | 필수 | 발급받은 50자리 토큰 |
| `hash` | string | 필수 | 로그인 시 발급된 hash |
| `file` | file | 필수 | 업로드할 파일(multipart/form-data) |
| `chId` | int | 선택 | 파일명 구성용 교회 ID(선택) |

#### 출력 결과

| 파라미터명 | 예상결과 | 설명 |
| --- | --- | --- |
| `status` | `ok` | 처리 결과(ok / error) |
| `result.fileId` | `98_20260629_..jpg` | 글쓰기 fileId[] 로 넘길 값 |
| `result.fileName` | `원본.jpg` | 원본 파일명 → fileName[] |
| `result.isImage` | `true` | 이미지 여부 |
| `result.sumUrl` | `//common.jbch.org/.../sum_..jpg` | 썸네일 미리보기 URL(이미지) |

---

## 임원수첩 API

### 임원수

**POST** `/in/count_duty_json.php`

태그: #임원수, #count, #임원

로그인 hash(tokenId, dev_name 포함)로 사용자를 인증한 뒤 Member 클래스의 count_duty()로 전체 임원(직분자) 수를 조회한다. 결과를 total 값으로 담아 {status, result} JSON 형식으로 반환한다.

헤더: `Content-Type: application/json`

#### 요청 파라미터

| 파라미터 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `dev_name` | string | 필수 | 발급시 사용한 앱이름(영문) |
| `tokenId` | string | 필수 | 발급받은 50자리 토큰 |
| `hash` | string | 필수 | 로그인 시 발급된 hash |
| `chId` | string | 선택 | 교회아이디 |

#### 출력 결과

| 파라미터명 | 예상결과 | 설명 |
| --- | --- | --- |
| `status` | `ok` | 조회 결과 상태 (ok 성공, not 없음, error 오류) |
| `result` | — | 집계 결과 객체 (없으면 null) |
| `total` | `42` | 임원(직분자) 총 수 |

---

## 토브성경 API

### 성경검색

**POST** `/in/load_bible.php`

태그: #성경, #검색

성경 책 코드(bCode)·장절 코드(eCode)·언어(langCode 기본 kor)·대조 언어(comlangCode) 또는 검색어(keyword)를 입력받아 성경구정을 돌려받습니다.

#### 요청 파라미터

| 파라미터 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `dev_name` | string | 필수 | 발급시 사용한 앱이름(영문) |
| `tokenId` | string | 필수 | 발급받은 50자리 토큰 |
| `bCode` | string | 선택 | 성경 책 코드(eCode와 함께 본문 조회 시 필수) |
| `eCode` | string | 선택 | 성경 장절 코드(bCode와 함께 본문 조회 시 필수) |
| `langCode` | string | 필수 | 성경 언어 코드(기본값 kor) |
| `comlangCode` | string | 선택 | 대조 표시용 언어 코드 |
| `keyword` | string | 선택 | 성경 본문 검색어(bCode·eCode 없이 검색 시 사용) |

#### 출력 결과

| 파라미터명 | 예상결과 | 설명 |
| --- | --- | --- |
| `code` | `01001001` | 성경 절 코드 |
| `book` | `1` | 책 번호 |
| `chapter` | `1` | 장 |
| `paragraph` | `1` | 절 |
| `sentence` | `태초에 하나님이 천지를 창조하시니라` | 본문 문장 |
| `bookname` | `창세기` | 책 전체명(long_label) |
| `bookname_short` | `창` | 책 약칭(short_label) |
| `com_sentence` | `In the beginning God created the heavens and the earth` | 대조 언어 본문 (comlangCode 지정 시) |
| `bookname_com` | `Genesis` | 대조 언어 책 전체명 (comlangCode 지정 시) |
| `bookname_short_com` | `Gen` | 대조 언어 책 약칭 (comlangCode 지정 시) |

---

## 쪽지 API

### 쪽지발송

**POST** `/in/send_message_json2.php`

태그: #쪽지, #쪽지발송, #임원수첩2

깨사모 쪽지 발송을 해줍니다.

반드시 로그인한 본인이 다른 사람에게 발송을 할수 있습니다.

대상자의 깨사모 아이디가 필요합니다.

첨부파일(여러 개 가능): 두 가지 방식을 지원합니다.
① multipart/form-data 업로드 — 파일 필드명 무관, attach[] 같은 배열형·단일형 모두 가능
② JSON 본문 files 배열 — [{"name":"파일명.jpg","data":"<base64>"}]
개당 50MB 제한, 위험 확장자(php·html·exe·js 등)는 제외되며 제외 사유는 응답의 file_errors로 반환됩니다.

헤더: `Content-Type: application/json`

#### 요청 파라미터

| 파라미터 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `dev_name` | string | 필수 | 발급시 사용한 앱이름(영문) |
| `tokenId` | string | 필수 | 발급받은 50자리 토큰 |
| `hash` | string | 필수 | 로그인 시 발급된 hash |
| `toIds` | string | 선택 | 대상자 깨사모아이디 |
| `subject` | string | 선택 | 제목 (URL인코딩, *** 는 & 로 치환) |
| `content` | string | 선택 | 내용 (URL인코딩, *** 는 & 로 치환) |
| `attach[]` | file | 선택 | 첨부파일(multipart/form-data 방식) — 여러 개 가능, 필드명 무관, 개당 50MB |
| `files` | array | 선택 | 첨부파일 배열(JSON 방식) — [{name:"파일명.jpg", data:"<base64>"}] 여러 개 가능 |

#### 출력 결과

| 파라미터명 | 예상결과 | 설명 |
| --- | --- | --- |
| `status` | `ok` | 성공 여부(ok 또는 not). 실패 검증 시 error |
| `result` | — | 성공 시 postId 포함 객체, 실패 시 null, 검증오류 시 에러 메시지 |
| `postId` | `789` | 신규 등록된 메모 id(result 객체 내부) |
| `files` | `2` | 첨부된 파일 수(result 객체 내부) |
| `file_errors` | `["a.exe: 허용되지 않는 확장자(exe)"]` | 제외된 첨부파일 사유 배열(있을 때만) |

---

## 교회정보 API

### 교회목록 (회원용)

**POST** `/ex/address_church_json.php`

태그: #교회목록

교회목록을 가져옵니다. 반드시 로그인이 되어 있어야 합니다. (hash)

헤더: `Content-Type: application/json`

#### 요청 파라미터

| 파라미터 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `dev_name` | string | 필수 | 발급시 사용한 앱이름(영문) |
| `tokenId` | string | 필수 | 발급받은 50자리 토큰 |
| `hash` | string | 필수 | 로그인 시 발급된 hash |
| `id` | string | 선택 |  |
| `chid` | string | 선택 |  |
| `enable` | string | 선택 | 앞 1: 교회, 뒤 1: 홈피사용 |
| `zone_code` | string | 선택 |  |
| `nationid` | string | 선택 |  |
| `nacode` | string | 선택 | 082: 대한민국 |
| `chname` | string | 선택 |  |
| `continent` | string | 선택 | EUROPE, ASIA, AFRICA, NAMERICA, SAMERICA, OCEANIA |
| `oversea` | string | 선택 |  |
| `com_date` | string | 선택 |  |
| `security` | string | 선택 |  |
| `homepage` | string | 선택 |  |
| `maxX` | string | 선택 |  |
| `maxY` | string | 선택 |  |
| `minX` | string | 선택 |  |
| `minY` | string | 선택 |  |
| `onlySize` | string | 선택 | ok: 용량만 체크 |

#### 출력 결과

| 파라미터명 | 예상결과 | 설명 |
| --- | --- | --- |
| `status` | `ok` | 성공 여부 (ok/not/error) |
| `result` | — | 교회 목록 배열 또는 onlySize시 size 객체, 실패시 메시지/null |
| `size` | `1.23 MB` | onlySize=OK일 때 직렬화 데이터 크기 (result.size) |
| `chId` | `123` | 교회 고유 아이디 |
| `center_ch` | `1` | 중심교회 여부 |
| `nationId` | `45` | 국가 아이디 |
| `nacode` | `082` | 국가코드 |
| `name` | `서울교회` | 교회명 |
| `churchname` | `서울교회` | 교회명 (name 별칭) |
| `name_kor` | `서울교회` | 한글 교회명 |
| `name_eng` | `Seoul Church` | 영문 교회명 |
| `name_local` | — | 현지어 교회명 |
| `chname_pri` | `서울교회` | 국내면 name, 아니면 name_kor |
| `continent` | `ASIA` | 대륙 |
| `userid` | `christlee` | 관리 사용자 아이디 |
| `enable` | `10` | 노출 상태값 |
| `security` | `0` | 보안 등급 |
| `updated` | `2026-01-01 12:00:00` | 수정일시 |
| `zone_code` | `01` | 지역코드 |
| `zone_name` | `서울` | 지역명 |
| `nation_ini_2` | `KR` | 국가 2자리 이니셜 |
| `nation_ini_3` | `KOR` | 국가 3자리 이니셜 |
| `lat` | `37.5` | 위도 |
| `lng` | `127.0` | 경도 |
| `address` | `서울시 ...` | 주소 |
| `zipcode` | `06000` | 우편번호 |
| `webmaster_mail` | `a@b.com` | 웹마스터 이메일 |
| `webmaster_ksmid` | `christlee` | 웹마스터 KSM 아이디 |
| `about` | — | 교회 안내 (church_guide) |
| `swAbook` | `1` | 주소록 사용 여부 |
| `swZone` | `1` | 지역 사용 여부 |
| `use_home` | `0` | 홈페이지 사용 방식 |
| `name_primary` | `서울교회` | 대표 표기명 (name_kor 우선) |
| `local_code` | `01` | 국내 지역코드 또는 국가코드 |
| `local_name` | `서울` | 국내 지역명 또는 국가명 |
| `nation_name` | `대한민국` | 국가명 |
| `homepage` | `https://home.jbch.org/seoul` | 홈페이지 주소 |
| `phone` | `02-000-0000` | 대표 전화번호 |
| `fax` | `02-000-0001` | 팩스번호 |
| `missionary` | `2` | 선교사(설교자) 수 |
| `seqBox` | — | 해외교회 정렬 박스 (relation_oversea_church) |

---

### 교회목록 (단순)

**POST** `/ex/church.php`

태그: #교회목록

교회 이름 목록을 반환합니다. 각 항목에는 교회 식별자(chId)와 교회소개 첨부 이미지 1장(img, 1000px URL)이 함께 포함됩니다. 이미지가 없으면 빈 문자열입니다.

미리 생성된 정적 JSON(chlist.json)을 출력하므로 응답이 빠르며, 목록은 교회정보 수정 시 자동 갱신됩니다.

#### 요청 파라미터

| 파라미터 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `dev_name` | string | 필수 | 발급시 사용한 앱이름(영문) |
| `tokenId` | string | 필수 | 발급받은 50자리 토큰 |
| `oversea` | string | 선택 | 국내/해외 구분 (do 국내, ov 해외) |

#### 출력 결과

| 파라미터명 | 예상결과 | 설명 |
| --- | --- | --- |
| `churchname` | `서울중앙` | 교회명 |
| `chId` | `98` | 교회 식별자 |
| `img` | `https://file1.jbch.org/guide/98/1000_98_2017031717343602956_christlee.jpg` | 교회소개 첨부 이미지 1장(1000px URL, 없으면 빈값) |

---

### 상세 교회목록

**POST** `/ex/church_info.php`

태그: #교회목록

상세교회정보 및 목록을 가져옵니다. 목록에는 자세한 교회정보들이 있습니다.

json으로 받게되는 정보를 참고해 보세요.

각 교회 항목에는 교회소개 첨부 이미지 1장이 img 필드(1000px URL)로 포함됩니다. 이미지가 없으면 빈 문자열이며, min_fields 지정 시에는 포함되지 않습니다.

#### 요청 파라미터

| 파라미터 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `dev_name` | string | 필수 | 발급시 사용한 앱이름(영문) |
| `tokenId` | string | 필수 | 발급받은 50자리 토큰 |
| `chId` | int | 선택 | 교회 ID 필터 |
| `min_fields` | string | 선택 | 최소 필드만 반환 여부 |
| `enable` | string | 선택 | 노출 상태 코드 (미지정 시 기본 10,11) |
| `zone_code` | string | 선택 | 권역 코드 필터 |
| `nationId` | int | 선택 | 국가 ID 필터 |
| `nacode` | string | 선택 | 국가 코드 필터 |
| `chName` | string | 선택 | 교회명 검색 |
| `like_search` | string | 선택 | 부분 일치 검색 사용 여부 |
| `continent` | string | 선택 | 대륙 필터 |
| `oversea` | string | 선택 | 국내/해외 구분 필터 do: 국내 / ov: 해외 |
| `com_date` | date | 선택 | 비교 기준일 필터 |
| `security` | string | 선택 | 보안 등급 필터 |
| `homepage` | string | 선택 | 홈페이지 보유 여부 필터 |
| `maxX` | string | 선택 | 지도 영역 최대 경도 |
| `maxY` | string | 선택 | 지도 영역 최대 위도 |
| `minX` | string | 선택 | 지도 영역 최소 경도 |
| `minY` | string | 선택 | 지도 영역 최소 위도 |

#### 출력 결과

| 파라미터명 | 예상결과 | 설명 |
| --- | --- | --- |
| `chId` | `16315` | 교회 식별자 |
| `center_ch` | `1` | 1:국가내 중심교회 |
| `nationId` | `1` | 국가 식별자 |
| `nacode` | `082` | 국가 코드 |
| `name` | `서울중앙` | 교회명 |
| `churchname` | `서울중앙` | 표시용 교회명 |
| `name_kor` | — | 해외의 경우 한글 교회명 |
| `name_eng` | `seoul` | 영문 교회명 |
| `name_local` | `서울중앙` | 현지어 교회명 |
| `chname_pri` | `서울중앙` | 대표 교회명 |
| `continent` | `ASIA` | 대륙 |
| `userid` | `leebcsp` | 교회 담당자 아이디 |
| `enable` | `11` | 앞 1:교회 / 뒤 1:홈피사용 |
| `security` | `0` | 1: 보안지역 |
| `updated` | `2026-03-01 12:00:00` | 수정일시 |
| `zone_code` | `1` | 지역(존) 코드 |
| `zone_name` | `서울` | 지역(존) 이름 |
| `nation_ini_2` | — | 국가 2자리 약자 |
| `nation_ini_3` | — | 국가 3자리 약자 |
| `lat` | `37.5665` | 위도 |
| `lng` | `126.9780` | 경도 |
| `address` | `경기도 안양시 동안구 관양로305번길 37` | 주소 |
| `zipcode` | `13943` | 우편번호 |
| `webmaster_mail` | `web@jbch.org` | 웹마스터 이메일 |
| `webmaster_ksmid` | `samchoi` | 웹마스터 선교회 아이디 |
| `about` | `교회 소개` | 교회 소개 |
| `swAbook` | `1` | 주소록 사용 여부 |
| `swZone` | `1` | 존 사용 여부 |
| `use_home` | `1` | 홈페이지 사용 여부 |
| `name_primary` | `서울중앙교회` | 기본 표시 교회명 |
| `local_code` | `00002` | 지역 코드 |
| `local_name` | `서울` | 지역 이름 |
| `nation_name` | `대한민국` | 국가명 |
| `homepage` | `https://seoul.jbch.org` | 홈페이지 주소 |
| `phone` | `02-1234-5678` | 전화번호 |
| `fax` | `02-1234-5679` | 팩스번호 |
| `missionary` | `37` | 교회 전도인 수 |
| `img` | `https://file1.jbch.org/guide/교회id/{해상도}_파일명` | 교회대표이미지 300px, 500px, 1000px, |

---

### 상세 교회목록

**POST** `/ex/load_church.php`

태그: #교회목록, #임원수첩2

교회목록과 상세정보가 포함된 교회정보가 뜹니다.

각 교회 항목에는 교회소개 첨부 이미지 1장이 img 필드(1000px URL)로 포함됩니다. 이미지가 없으면 빈 문자열입니다.

헤더: `Content-Type: application/json`

#### 요청 파라미터

| 파라미터 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `dev_name` | string | 필수 | 발급시 사용한 앱이름(영문) |
| `tokenId` | string | 필수 | 발급받은 50자리 토큰 |
| `chid` | string | 선택 |  |
| `enable` | string | 선택 |  |
| `oversea` | string | 선택 |  |
| `nacode` | string | 선택 |  |
| `chName` | string | 선택 |  |
| `like_search` | string | 선택 |  |
| `continent` | string | 선택 |  |
| `com_date` | string | 선택 |  |
| `security` | string | 선택 |  |
| `homepage` | string | 선택 |  |
| `Userid` | string | 선택 | {{userid}} |

#### 출력 결과

| 파라미터명 | 예상결과 | 설명 |
| --- | --- | --- |
| `status` | `ok` | 성공 여부(ok/not) |
| `result` | `[...]` | 교회 목록 배열(없으면 null) |
| `chId` | `16315` | 교회 식별자 |
| `center_ch` | `1` | 1:국가내 중심교회 |
| `nationId` | `1` | 국가 식별자 |
| `nacode` | `082` | 국가 코드 |
| `name` | `서울중앙` | 교회명 |
| `churchname` | `서울중앙` | 표시용 교회명 |
| `name_kor` | — | 해외의 경우 한글 교회명 |
| `name_eng` | `seoul` | 영문 교회명 |
| `name_local` | `서울중앙` | 현지어 교회명 |
| `chname_pri` | `서울중앙` | 대표 교회명 |
| `continent` | `ASIA` | 대륙 |
| `userid` | `leebcsp` | 교회 담당자 아이디 |
| `enable` | `11` | 앞 1:교회 / 뒤 1:홈피사용 |
| `security` | `0` | 1: 보안지역 |
| `updated` | `2026-03-01 12:00:00` | 수정일시 |
| `zone_code` | `1` | 지역(존) 코드 |
| `zone_name` | `서울` | 지역(존) 이름 |
| `nation_ini_2` | — | 국가 2자리 약자 |
| `nation_ini_3` | — | 국가 3자리 약자 |
| `lat` | `37.5665` | 위도 |
| `lng` | `126.9780` | 경도 |
| `address` | `경기도 안양시 동안구 관양로305번길 37` | 주소 |
| `zipcode` | `13943` | 우편번호 |
| `webmaster_mail` | `web@jbch.org` | 웹마스터 이메일 |
| `webmaster_ksmid` | `samchoi` | 웹마스터 선교회 아이디 |
| `about` | `교회 소개` | 교회 소개 |
| `swAbook` | `1` | 주소록 사용 여부 |
| `swZone` | `1` | 존 사용 여부 |
| `use_home` | `1` | 홈페이지 사용 여부 |
| `name_primary` | `서울중앙교회` | 기본 표시 교회명 |
| `local_code` | `00002` | 지역 코드 |
| `local_name` | `서울` | 지역 이름 |
| `nation_name` | `대한믹국` | 국가명 |
| `homepage` | `https://seoul.jbch.org` | 홈페이지 주소 |
| `phone` | `02-1234-5678` | 전화번호 |
| `fax` | `02-1234-5679` | 팩스번호 |
| `missionary` | `37` | 교회 전도인 수 |
| `img` | `https://file1.jbch.org/guide/교회아이디/{해상도}_파일명` | 교회소개 첨부 이미지 1장(300px, 500px, 1000px URL, 없으면 빈값) |
| `count` | — |  |

---

### 교회연락처

**POST** `/ex/phone_church.php`

태그: #교회연락처, #임원수첩, #연락처, #임원수첩2

지역교회 관리페이지에 등록된 교회 연락처 목록을 가져옵니다.

get, post, json 모두 작동합니다.

#### 요청 파라미터

| 파라미터 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `dev_name` | string | 필수 | 발급시 사용한 앱이름(영문) |
| `tokenId` | string | 필수 | 발급받은 50자리 토큰 |
| `id` | int | 선택 | 특정 임원 연락처 ID 필터 |
| `chid` | int | 선택 | 조회할 교회 ID 필터 |
| `com_date` | date | 선택 | 기준 날짜(임원 명단 기준일) 필터 |
| `onlySize` | string | 선택 | OK 지정 시 데이터 직렬화 용량만 반환 |
| `loadtype_embed` | int | 선택 | 1이면 임베드용 출력(JSON 헤더 미설정) |

#### 출력 결과

| 파라미터명 | 예상결과 | 설명 |
| --- | --- | --- |
| `id` | `5` | 연락처 ID |
| `churchid` | `98` | 교회 ID |
| `partname` | `봉사회` | 부서/직책명 |
| `tel1` | `02-1234-5678` | 전화번호1 |
| `tel2` | `010-1234-5678` | 전화번호2 |
| `fax` | `02-1234-5679` | 팩스번호 |
| `sort_num` | `1` | 정렬 순서 |
| `enable` | `1` | 활성 여부 |
| `updated` | `2026-06-01 10:00:00` | 수정일시 |

---

### 교회연락처 (회원용)

**POST** `/ex/phone_church_json.php`

태그: #교회연락처

각 지역교회에서 입력한 연락처를 가져옵니다.

헤더: `Content-Type: application/json`

#### 요청 파라미터

| 파라미터 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `dev_name` | string | 필수 | 발급시 사용한 앱이름(영문) |
| `tokenId` | string | 필수 | 발급받은 50자리 토큰 |
| `hash` | string | 필수 | 로그인 시 발급된 hash |
| `id` | int | 선택 |  |
| `chid` | int | 선택 | 교회아이디 |
| `com_date` | date | 선택 |  |
| `onlySize` | string | 선택 | 0k : 용량만 체크 |

#### 출력 결과

| 파라미터명 | 예상결과 | 설명 |
| --- | --- | --- |
| `status` | `ok` | 응답 상태(ok/not/error) |
| `result` | — | 연락처 목록 또는 에러 메시지 |
| `id` | `5` | 연락처 ID |
| `churchid` | `45` | 교회 ID |
| `partname` | `행정부` | 부서/직책명 |
| `tel1` | `02-1234-5678` | 전화번호1 |
| `tel2` | `010-1234-5678` | 전화번호2 |
| `fax` | `02-1234-5679` | 팩스번호 |
| `sort_num` | `1` | 정렬 순서 |
| `enable` | `1` | 활성 여부 |
| `updated` | `2026-06-01 10:00:00` | 수정일시 |
| `size` | `1.23 Kb` | onlySize=OK일 때 직렬화 용량 |

---

## 수양회 API

### 수양회정보 가져오기

**POST** `/ex/li_retreat.php`

태그: #수양회, #수양회정보

수양회와 전국행사의 목록과 자세한 셋팅 정보를 가져옵니다.

그래서 출력 내용이 불필요한 부분들이 있습니다.

헤더: `Content-Type: application/json`

#### 요청 파라미터

| 파라미터 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `dev_name` | string | 필수 | 발급시 사용한 앱이름(영문) |
| `tokenId` | string | 필수 | 발급받은 50자리 토큰 |
| `rYear` | string | 필수 |  |
| `rCode` | string | 선택 |  |
| `season` | string | 선택 |  |

#### 출력 결과

| 파라미터명 | 예상결과 | 설명 |
| --- | --- | --- |
| `status` | `ok` | 성공 여부 (ok/not/error) |
| `result` | — | 시즌 정보 배열 또는 null |
| `s_uid` | `1` | 시즌 고유 아이디 |
| `s_year` | `2026` | 연도 |
| `s_season` | `1` | 시즌 구분 |
| `s_code` | `A` | 구분코드 |
| `s_title` | `여름수련회` | 시즌 제목 |
| `s_etitle` | `Summer` | 영문 제목 |
| `title_fullname` | `2026 여름수련회` | 전체 제목 |
| `startAccept` | `2026-05-01 00:00:00` | 접수 시작일시 |
| `startRoomApply` | `2026-05-10 00:00:00` | 숙소신청 시작일시 |
| `accept1st` | `2026-05-01 00:00:00` | 1차 접수일시 |
| `accept1st_limit` | `2026-05-15 00:00:00` | 1차 접수 마감일시 |
| `accept2nd` | `2026-05-16 00:00:00` | 2차 접수일시 |
| `accept2nd_limit` | `2026-05-31 00:00:00` | 2차 접수 마감일시 |
| `startDate` | `2026-07-01 00:00:00` | 수련회 시작일시 |
| `endDate` | `2026-07-03 00:00:00` | 수련회 종료일시 |
| `enable` | `1` | 노출 여부 |
| `level` | `1` | 레벨 |
| `seq` | `1` | 순번 |
| `jo` | `1` | 조 정보 |
| `location` | `수양관` | 장소 |
| `cent_church` | `서울교회` | 중심교회 |
| `manager` | `홍길동` | 담당자 |
| `current` | `0` | 현재 시즌 여부 |
| `swOrder` | `0` | 정렬 스위치 |
| `banknumber` | — | 계좌번호 |
| `manager_namecard` | — | 담당자 명함 |
| `manager_lodging` | — | 숙소 담당자 |
| `start_receipt` | `2` | 영수증 발급 시작 |
| `limit_refund` | `0` | 환불 제한 |

---
