---
name: landing-page-generator
description: Create Korean product or service detail pages with a 13-section copy and design workflow, using Codex image generation and local PNG/PDF assembly. Use for image-based sales pages and product detail pages.
---

# Codex 상세페이지 생성기

사용자 요청이 이 가이드보다 우선한다. 현재 Codex 모델로 아래 단계를 순서대로 수행한다.
agents/*.md는 역할별 참고 문서이며 별도의 모델이나 자동 실행되는 서브에이전트 설정이 아니다.

## 작업 흐름

1. agents/01-intake.md를 참고해 제품명, 설명, 타겟, 문제, 핵심 혜택을 정리한다. 이미 받은 정보는 다시 묻지 않는다. 가격·후기·환불·기간은 제공된 경우에만 사용한다. output/structured_brief.json에 저장한다.
2. agents/02-research.md와 사용 가능한 검색 도구로 리서치하고 출처 URL·확인일·확인된 주장과 추정을 output/research_output.json에 구분한다. 검색이 불가능하면 미검증 상태를 명시한다.
3. agents/03-copy.md와 references/13-section-guide.md, references/copy-patterns.md를 참고해 output/copy_output.json을 작성한다. 후기, 실적, 인증, 할인, 재고, 환불 보장을 창작하지 않는다. 증거가 없으면 해당 섹션에 확인 가능한 제품 정보나 선택 기준을 넣는다.
4. agents/04-design-direction.md와 references/design-specs.md로 output/design_direction.json을 작성한다. 도표가 필요한 경우 references/diagram-style-preset.md를 참고한다. 원본은 실사 스타일을 기본으로 하지만 사용자의 디자인 요청을 따른다.
5. agents/05-prompt-generator.md와 references/image-prompt-patterns.md로 정확한 카피와 디자인을 담은 output/image_prompts.json을 작성한다. 키는 아래 section ID(01_hero 등)이고 각 값에 prompt, width:1200, height, filename을 넣는다. 예시 형식은 scripts/generate_page.py의 plan 결과를 참고한다. 해당 스크립트는 기획·카피·AI 이미지 생성을 대신하지 않는다.
6. 현재 Codex 환경에서 제공되는 이미지 생성 도구와 관련 스킬을 사용하여 각 섹션을 생성한다. 존재하지 않는 도구를 호출하거나 Python에서 Codex 내부 도구를 API처럼 호출하지 않는다. 참조 제품 이미지는 먼저 확인하고 실제 형태를 유지한다. 생성 결과를 output/sections/<filename>에 저장한다. 도구가 없으면 프롬프트를 전달하고 생성 단계가 미완료임을 알린다. 별도 유료 API로 임의 전환하지 않는다.
7. 아래 스크립트의 assemble 명령으로 13개 이미지의 존재와 파일 형식을 검사하고 PNG, PDF, 축소 미리보기, 이미지 기반 HTML을 만든다. 도구가 정확한 크기를 보장하지 않으므로 비율을 유지하여 너비 1200px로 조정하며 높이는 달라질 수 있다. 글자를 잘라내거나 강제로 찌그러뜨리지 않는다.
8. 최종 PNG와 미리보기를 열어 한국어 오탈자, 제품 형태, 내용 누락, 섹션 연결을 확인한다. 문제 섹션을 수정한 뒤 재조립한다. 생성 완료와 검증 완료를 구분하여 결과 경로를 전달한다.

## 로컬 조립

스킬 폴더의 절대 경로로 scripts/generate_page.py를 실행한다. 출력 경로는 작업 중인 프로젝트 기준이다.

```sh
python <skill-folder>/scripts/generate_page.py plan --brief output/structured_brief.json --output output
python <skill-folder>/scripts/generate_page.py assemble --output output
```

plan은 초안 프롬프트를 만들며 기존 image_prompts.json을 덮어쓰지 않는다. 카피·디자인 단계에서 내용을 완성한 뒤 이미지를 생성한다.
assemble은 완전한 13개 섹션만 최종 결과로 출력한다. 생성 이미지는 정적인 이미지이며 HTML의 CTA도 실제 결제나 폼 기능은 없다.

## 기본 섹션

| # | 섹션명 | 높이 | 핵심 요소 |
|---|--------|------|-----------|
| 01 | Hero | 800px | 헤드라인, CTA, 긴급성 배지 |
| 02 | Pain | 600px | 페인포인트 3-4개 |
| 03 | Problem | 500px | 진짜 원인, 구조적 문제 |
| 04 | Story | 700px | Before→After 변화 |
| 05 | Solution | 400px | 제품 한 줄 정의 |
| 06 | How It Works | 600px | 단계별 프로세스 |
| 07 | Social Proof | 800px | 후기, 수치 |
| 08 | Authority | 500px | 제작자 소개 |
| 09 | Benefits | 700px | 혜택, 보너스 |
| 10 | Risk Removal | 500px | 환불 정책, FAQ |
| 11 | Comparison | 400px | Before/After 대비 |
| 12 | Target Filter | 400px | 추천/비추천 대상 |
| 13 | Final CTA | 600px | 최종 CTA |


기본 높이 합계는 7,500px이며 실제 이미지 비율에 따라 달라진다.


