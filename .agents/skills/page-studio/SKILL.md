---
name: page-studio
description: Maintain and improve the Page Studio AI web app in this repository, including GitHub Pages UI, Google Apps Script backend, OpenAI connection, Google Drive saving, responsive UX, and deployment troubleshooting. Use whenever the user refers to Page Studio, the GitHub Pages editor, AI connection, Apps Script backend, Drive saving, or UI updates for this app.
---

# Page Studio 운영·개발 스킬

이 스킬은 `jskimlam/landing-page-generator-codex` 저장소의 **Page Studio AI 웹앱**을 유지보수하고 발전시키기 위한 지침이다.

사용자의 최신 지시가 항상 이 문서보다 우선한다. 이미 제공된 정보는 다시 묻지 말고, 가능한 경우 저장소와 배포 상태를 직접 확인한 뒤 수정한다.

## 프로젝트 기준

- 저장소: `jskimlam/landing-page-generator-codex`
- GitHub Pages: `https://jskimlam.github.io/landing-page-generator-codex/`
- 프론트엔드:
  - `index.html` — 화면 구조와 JS hook
  - `studio.css` — 전체 UI/반응형 디자인
  - `studio.js` — 입력, AI 호출, 편집, 미리보기, Drive 저장 로직
- 백엔드:
  - `apps-script/Code.gs` — Google Apps Script 웹앱
- 상세페이지 생성 파이프라인은 별도 `.agents/skills/landing-page-generator/SKILL.md`를 따른다.

## 현재 디자인 방향

Page Studio 자체 UI는 **프리미엄 AI SaaS 작업툴** 톤을 유지한다.

- 상단: 딥 네이비 헤더
- 좌측 작업 패널: 다크 네이비/슬레이트
- 입력 필드: 밝은 카드형으로 강한 대비
- 우측 프리뷰: 블루그레이 캔버스
- 실제 결과물: 밝은 프리뷰 카드로 떠 있는 구조
- 과도한 순백 화면은 피한다.
- 정보 밀도는 높이되 답답하지 않게 한다.
- 데스크톱은 작업툴 느낌, 모바일은 한 열 구조와 충분한 터치 영역을 우선한다.
- 새 시각 개선 요청에서는 기능 변경보다 CSS 중심 개선을 먼저 검토한다.

## 절대 보존할 프론트엔드 연결점

UI를 바꿀 때 아래 ID와 기능 연결을 함부로 변경하거나 제거하지 않는다.

- `backendBadge`
- `newProduct`
- `example`
- `saveDrive`
- `download`
- `backendUrl`
- `appToken`
- `saveConnection`
- `testConnection`
- `connectionMessage`
- `inputTab`
- `editTab`
- `briefForm`
- `aiGenerate`
- `templateGenerate`
- `generateAllImages`
- `sections`
- `preview`
- `empty`
- `desktop`
- `mobile`

HTML 구조를 크게 바꿀 때는 먼저 `studio.js`에서 해당 hook 사용 여부를 확인한다.

## AI·백엔드 구조

연결 흐름은 아래와 같다.

```text
GitHub Pages
  ↓ Apps Script 웹앱 URL + APP_TOKEN
Google Apps Script
  ↓ OPENAI_API_KEY
OpenAI Responses API

Google Apps Script
  ↓
Google Drive / 상세페이지
```

보안 원칙:

- OpenAI API Key를 `index.html`, `studio.js`, GitHub 저장소, 브라우저 localStorage에 넣지 않는다.
- OpenAI API Key는 Apps Script **Script Properties의 `OPENAI_API_KEY`** 에만 둔다.
- Page Studio 화면의 “앱 토큰”에는 **`APP_TOKEN`** 을 넣는다.
- `APP_TOKEN`은 `setupPageStudio()`로 생성한다.
- 사용자에게 API Key나 APP_TOKEN을 채팅에 붙여 달라고 요청하지 않는다.
- GitHub에 비밀값을 commit하지 않는다.

프론트엔드는 연결 정보를 다음 localStorage key에 저장한다.

- `pageStudioBackendUrl`
- `pageStudioAppToken`

## Apps Script 핵심 함수

`apps-script/Code.gs`에서 주요 진입점은 다음과 같다.

- `doGet()` — 백엔드 실행 확인 페이지
- `doPost(e)` — API 요청 처리
- `setupPageStudio()` — APP_TOKEN 생성 및 Drive 루트 폴더 준비
- `health_()` — 연결 상태 확인
- `generateCopy_()` — 13개 섹션 카피 생성
- `generateImage_()` — 섹션별 AI 이미지 생성 및 Drive 저장
- `saveProject_()` — project.json / detail-page.html / 원본 이미지 저장
- `openAI_()` — OpenAI Responses API 호출

기본 13개 section ID는 순서를 유지한다.

```text
01_hero
02_pain
03_problem
04_story
05_solution
06_how_it_works
07_social_proof
08_authority
09_benefits
10_risk_removal
11_comparison
12_target_filter
13_final_cta
```

## 백엔드 연결 문제 진단

“백엔드 요청 실패”가 나오면 AI 모델부터 의심하지 않는다. 다음 순서로 진단한다.

1. Page Studio에 입력한 주소가 `https://script.google.com/macros/s/.../exec` 형식인지 확인.
2. 입력한 토큰이 OpenAI API Key가 아니라 `APP_TOKEN`인지 확인.
3. Apps Script Script Properties에 `OPENAI_API_KEY`와 `APP_TOKEN`이 존재하는지 확인.
4. 웹앱이 올바른 계정에서 배포되었는지 확인.
5. 배포 권한/실행 사용자 설정을 확인.
6. `health`가 실패하면 아직 OpenAI 생성 요청 단계가 아님을 구분한다.
7. 연결은 되지만 생성만 실패하면 OpenAI 응답/모델/계정/API 오류를 확인한다.
8. 필요하면 프론트엔드 에러 메시지를 개선해 HTTP 상태와 백엔드 응답을 구분해서 표시한다.

## Apps Script 배포 규칙

- 새 프로젝트에서는 `apps-script/Code.gs` 전체를 사용한다.
- 먼저 `setupPageStudio()`를 한 번 실행해 권한 승인과 APP_TOKEN 생성을 완료한다.
- Script Properties에 `OPENAI_API_KEY`를 저장한다.
- 웹 앱으로 배포한다.
- Page Studio에는 최종 `/exec` URL과 APP_TOKEN만 입력한다.
- 백엔드 코드가 변경되면 Apps Script에 같은 변경을 반영하고 배포 버전을 갱신해야 실제 웹앱에 적용된다.
- 기존 배포를 편집해 새 버전으로 갱신하는 경우 기존 URL 유지 여부를 확인한다.

## Drive 저장 규칙

기본 루트 폴더는 `상세페이지`이다.

프로젝트별 폴더 예시:

```text
상세페이지/
└─ 상품명_YYYYMMDD_HHMMSS/
   ├─ original-product.jpg
   ├─ 01_hero_....png
   ├─ ...
   ├─ project.json
   └─ detail-page.html
```

사용자가 기존 프로젝트 저장 방식을 유지하라고 하면 이 구조를 임의 변경하지 않는다.

## UI 수정 작업 방식

1. 현재 `index.html`, `studio.css`, 필요 시 `studio.js`를 먼저 읽는다.
2. 단순 시각 개선이면 CSS 우선으로 수정한다.
3. 기존 ID/이벤트 hook과 기능을 보존한다.
4. 데스크톱, 900px 이하, 720px 이하, 430px 이하 레이아웃을 함께 확인한다.
5. 다크 패널에서 입력 필드 가독성, disabled 상태, focus 상태를 확인한다.
6. 프리뷰 iframe이 데스크톱/모바일 토글에서 깨지지 않는지 확인한다.
7. 수정 후 커밋 SHA를 알려주고 강력 새로고침이 필요할 수 있음을 안내한다.
8. 캐시 문제와 실제 코드 미반영을 구분한다.

## 변경 시 품질 원칙

- 기능을 바꾸지 않는 UI 요청에서는 JS를 불필요하게 변경하지 않는다.
- AI/Drive 연결이 이미 정상인 경우 연결 코드를 함부로 재작성하지 않는다.
- 사용자 입력과 생성 결과를 초기화하거나 삭제하는 동작을 추가할 때는 명시적 확인 UX를 유지한다.
- 허위 후기, 인증, 성능 수치, 할인, 재고, 보장 내용을 AI가 생성하지 않도록 기존 제약을 유지한다.
- 업로드 이미지의 제품 형태와 정체성을 AI 이미지에서 가능한 한 유지한다.
- 모바일에서 긴 텍스트와 버튼이 잘리지 않도록 한다.
- 비밀정보는 로그, UI, GitHub commit에 노출하지 않는다.

## 테스트와 검증

프론트엔드 로직 변경 후 기존 Node 테스트를 우선 실행한다.

```sh
node --test tests/studio.test.cjs
```

저장소의 Python 파이프라인을 변경했다면 추가로:

```sh
python -m unittest discover -s tests -v
```

CSS-only 변경은 테스트 외에도 다음을 눈으로 확인한다.

- 헤더와 좌측 패널 대비
- 폼 입력 가독성
- 연결 카드
- AI 생성 메인 버튼
- 빈 프리뷰 화면
- 실제 iframe 프리뷰
- 720px 이하 모바일 레이아웃

## 요청 해석 예시

다음 요청은 이 스킬을 사용한다.

- “Page Studio UI 수정해줘”
- “페이지 스튜디오 더 세련되게”
- “AI 연결이 안돼”
- “Apps Script 새로 연결하자”
- “Drive 저장 오류 봐줘”
- “상세페이지 생성기 GitHub 수정해줘”
- “Page Studio 모바일 UI 고쳐줘”
- “이 앱 백엔드 오류 원인 찾아줘”

사용자가 “상세페이지를 만들어줘”라고 요청하면 앱 유지보수보다 `landing-page-generator` 스킬이 우선이다.
