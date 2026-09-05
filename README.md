# Codex 상세페이지 생성기

## 홈페이지에서 바로 만들기

**[Page Studio 열기](https://jskimlam.github.io/landing-page-generator-codex/)**

상품 정보와 사진을 입력한 뒤 `13개 섹션 초안 만들기`를 누르세요. 문구 수정, 섹션 숨기기, 3가지 색상, 모바일 미리보기, 사진이 포함된 HTML 다운로드를 지원합니다. 구매 링크를 입력하면 결과물의 버튼으로 이동할 수 있습니다.

홈페이지는 입력 내용을 템플릿에 배치하는 브라우저 편집기입니다. AI 카피·이미지 생성은 아직 연결되지 않았습니다. 입력 정보와 사진을 서버로 보내지 않으며 새로고침하면 작업이 사라지므로 먼저 HTML을 다운로드하세요. 웹 편집기는 HTML 다운로드를 지원하며 PNG/PDF는 아래 Codex 제작 흐름에서 제공합니다.

GitHub Pages는 `main` 브랜치의 `/ (root)`로 배포합니다. `index.html`, `studio.css`, `studio.js`는 빌드나 API 키 없이 작동합니다. 웹 기능 검증: `node --test tests/studio.test.cjs`.

제품 정보를 받아 **기획 → 리서치 → 카피 → 디자인 → 이미지 생성 → PNG/PDF 조립**을 Codex에서 진행합니다. 원본의 13개 섹션 및 카피·디자인 가이드를 보존하고 Codex용으로 전환했습니다.

## 시작하기

1. 이 저장소를 다운로드하거나 복제한 뒤 **저장소 폴더 자체를 Codex 프로젝트로 열어주세요**.
2. Python 3.10 이상 환경에서 `python -m pip install -r requirements.txt`를 실행합니다. Codex에 설치를 요청해도 됩니다.
3. Codex에 아래처럼 요청합니다.

```text
이 저장소의 AGENTS.md와 .agents/skills/landing-page-generator/SKILL.md를 읽고 상세페이지를 만들어줘.
제품명: [내 제품]
설명: [제품 설명]
타겟: [주요 고객]
문제: [해결하는 문제]
혜택: [확인된 핵심 혜택]
제공한 제품 사진과 실제 가격을 사용하고, 최종 PNG/PDF까지 만들어줘.
```

스킬이 목록에 표시되면 `$landing-page-generator`로도 요청할 수 있습니다. 표시되지 않으면 위처럼 경로를 명시하세요. 역할 가이드는 현재 Codex가 순서대로 읽는 문서이며 별도 모델 설치는 필요하지 않습니다.

**이미지 생성 도구가 제공되는 Codex 환경이 필요합니다.** 도구가 없는 환경에서는 카피·디자인·프롬프트까지 작성할 수 있고, 실제 이미지를 준비한 뒤 조립합니다. Python은 Codex 내부 이미지 도구를 직접 호출하지 않습니다. 별도 API 키 없이 현재 Codex의 제공 기능을 사용하며 계정의 이용 한도는 적용됩니다.

## 결과물

- `output/structured_brief.json`, `research_output.json`, `copy_output.json`, `design_direction.json`: 제작 자료
- `output/image_prompts.json`: 13개 섹션 이미지 프롬프트
- `output/sections/`: 섹션 PNG 13장
- `output/final_page.png`, `final_page.pdf`, `preview.png`: 조립 결과
- `output/index.html`: 섹션 이미지를 보여주는 정적 페이지

이미지 기본 너비는 1200px입니다. 원본 권장 높이 합계는 7,500px이며 생성 이미지 비율에 따라 실제 높이는 달라집니다. HTML의 버튼은 이미지의 일부이므로 결제·문의 기능이 연결되어 있지 않습니다.

## 조립 명령

아래 명령은 저장소 루트에서 실행합니다. 기획·카피·이미지 생성은 Codex가 수행합니다.

```sh
python .agents/skills/landing-page-generator/scripts/generate_page.py plan --brief output/structured_brief.json --output output
# Codex에서 프롬프트를 완성하고 13개 PNG 이미지를 output/sections/에 준비
python .agents/skills/landing-page-generator/scripts/generate_page.py assemble --output output
python -m unittest discover -s tests -v
```

`plan`은 초안 생성 도구이며 기존 프롬프트를 덮어쓰지 않습니다. `assemble`은 누락·손상 이미지가 있으면 실패합니다. JSON 키는 `01_hero`부터 `13_final_cta`까지 스크립트에 정의된 13개 ID입니다.

## GitHub에서의 작동 범위

GitHub Pages에는 정적 웹 편집기가 배포되며 Actions에서 기능 테스트를 실행합니다. Codex 대화와 AI 이미지 생성은 홈페이지에서 자동 실행되지 않습니다. AI 제작은 이 저장소를 연 Codex에서 요청하세요. 생성 결과와 상품의 비공개 자료는 기본적으로 Git에 포함되지 않습니다.

## 원본 및 라이선스

원본: [uxjoseph/landing-page-generator](https://github.com/uxjoseph/landing-page-generator). 원본 README의 **MIT License** 표기를 보존합니다. 상세 출처 및 변경 내역은 [UPSTREAM.md](UPSTREAM.md)에 있습니다.

Codex 스킬 형식 참고: [OpenAI 공식 스킬 문서](https://developers.openai.com/codex/skills).
