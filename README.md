# Page Studio AI · Codex 상세페이지 생성기

상품 정보와 대표 사진을 바탕으로 **13개 전환 섹션의 한국어 상세페이지**를 만들고 편집하는 프로젝트입니다.

- GitHub Pages 웹 편집기: 상품 입력 → AI 카피 → 섹션 편집 → AI 이미지 → HTML 다운로드
- Google Apps Script 백엔드: OpenAI API 키 보호 + Google Drive 저장
- Codex 제작 파이프라인: 리서치 → 카피 → 디자인 → 13개 이미지 → PNG/PDF 조립

## 웹앱

**[Page Studio 열기](https://jskimlam.github.io/landing-page-generator-codex/)**

웹앱은 다음을 지원합니다.

- Hero → Pain → Problem → Story → Solution → How → Proof → Authority → Benefits → Risk → Comparison → Target → CTA의 13개 섹션
- OpenAI Responses API 기반 AI 카피 생성
- 대표 상품사진을 참조한 섹션별 AI 이미지 생성
- 섹션 표시/숨김, 제목/본문/이미지 프롬프트 직접 편집
- 데스크톱/모바일 미리보기
- 현재 결과 HTML 다운로드
- 생성 이미지를 Google Drive에 즉시 저장
- `Drive 저장`으로 `project.json`, `detail-page.html`, 원본 상품사진을 프로젝트 폴더에 저장

API 키는 브라우저나 GitHub에 넣지 않습니다. AI/Drive 기능은 `apps-script/` 백엔드를 먼저 배포해야 합니다.

## AI + Google Drive 연결

Google Apps Script에서 새 프로젝트를 만들고 `apps-script/Code.gs`를 붙여넣은 뒤 웹 앱으로 배포합니다. 먼저 편집기에서 `setupPageStudio()`를 한 번 실행하면 Drive 권한 승인과 `상세페이지` 폴더 생성, 임의 `APP_TOKEN` 생성이 이뤄집니다. 그 다음 **프로젝트 설정 → 스크립트 속성**에 최소 다음 값을 확인/추가합니다.

- `OPENAI_API_KEY`: OpenAI API 키
- `APP_TOKEN`: `setupPageStudio()` 실행 로그에 표시된 토큰 또는 직접 만든 긴 임의 문자열

웹 앱은 **실행 사용자: 나**로 배포하고, `/exec` URL을 Page Studio의 `AI · Google Drive 연결`에 입력합니다. 조직 또는 브라우저 정책에 따라 GitHub Pages→Apps Script 교차 출처 요청이 차단될 수 있는 환경에서는 별도 서버리스 프록시 또는 Apps Script HTML Service 호스팅이 필요할 수 있습니다.

기본 텍스트 모델은 `gpt-5.6-luna`이며 `OPENAI_TEXT_MODEL`/`OPENAI_IMAGE_CALLER_MODEL` Script Property로 변경할 수 있습니다. 이미지는 Responses API의 `image_generation` 도구를 사용하며, 도구가 지원되는 GPT-5 이상 계열 모델을 호출 모델로 사용합니다.

Drive에는 첫 저장 시 자동으로 다음 구조가 생성됩니다.

```text
내 드라이브/
└─ 상세페이지/
   └─ 상품명_YYYYMMDD_HHMMSS/
      ├─ original-product.jpg
      ├─ 01_hero_....png
      ├─ ...
      ├─ project.json
      └─ detail-page.html
```

## 웹앱 보안 원칙

- OpenAI API 키를 프론트엔드에 저장하지 않음
- Apps Script의 `APP_TOKEN`으로 공개 엔드포인트 오용 방지
- 구매 링크는 http/https만 허용
- 사용자 카피는 HTML escape 처리
- 업로드 이미지는 JPG/PNG/WebP만 허용
- 후기, 인증, 판매 수치, 할인, 보장 등을 AI가 임의 생성하지 않도록 백엔드 지침과 Structured Outputs 사용

## 테스트

```sh
node --test tests/studio.test.cjs
python -m unittest discover -s tests -v
```

GitHub Actions에서도 동일한 검증을 실행합니다.

---

# Codex 이미지 기반 제작 흐름

웹앱과 별도로, 저장소를 Codex 프로젝트로 열어 **기획 → 리서치 → 카피 → 디자인 → 이미지 생성 → PNG/PDF 조립**을 진행할 수 있습니다.

1. 저장소 폴더를 Codex 프로젝트로 엽니다.
2. Python 3.10+ 환경에서 `python -m pip install -r requirements.txt`를 실행합니다.
3. 아래처럼 요청합니다.

```text
이 저장소의 AGENTS.md와 .agents/skills/landing-page-generator/SKILL.md를 읽고 상세페이지를 만들어줘.
제품명: [내 제품]
설명: [제품 설명]
타겟: [주요 고객]
문제: [해결하는 문제]
혜택: [확인된 핵심 혜택]
제공한 제품 사진과 실제 가격을 사용하고, 최종 PNG/PDF까지 만들어줘.
```

주요 결과물:

- `output/structured_brief.json`
- `output/research_output.json`
- `output/copy_output.json`
- `output/design_direction.json`
- `output/image_prompts.json`
- `output/sections/`
- `output/final_page.png`
- `output/final_page.pdf`
- `output/preview.png`
- `output/index.html`

조립:

```sh
python .agents/skills/landing-page-generator/scripts/generate_page.py plan --brief output/structured_brief.json --output output
python .agents/skills/landing-page-generator/scripts/generate_page.py assemble --output output
```

원본 기반 13개 섹션 카피/디자인 가이드와 라이선스 정보는 `.agents/skills/landing-page-generator/` 및 `UPSTREAM.md`를 참고하세요.
