# Codex Landing Page Generator

This repository contains both the Korean detail-page generation pipeline and the Page Studio AI web application.

- For creating product/detail pages, read `.agents/skills/landing-page-generator/SKILL.md`.
- For Page Studio UI, GitHub Pages, Apps Script backend, OpenAI connection, Google Drive saving, deployment, or troubleshooting, read `.agents/skills/page-studio/SKILL.md`.

Use the current Codex session for research, copy, design and image generation. The Python helpers assemble existing images locally; they do not call an AI service.
User instructions take precedence over repository guidance. Do not fabricate claims, reviews, certifications, deadlines or guarantees. Keep private briefs, generated outputs and credentials out of Git.
Run `node --test tests/studio.test.cjs` after changing Page Studio JavaScript behavior.
Run `python -m unittest discover -s tests -v` after changing Python behavior.
