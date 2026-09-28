# C Companion — project guide

Production Thai C tutor distributed publicly under MIT (book rights are separate).

- Stack: Node.js HTTP server, SQLite, React/TypeScript/Vite, Docker Compose and external Hermes API.
- `app/`: backend, retrieval, tutoring policy and conversation routing. `web/`: UI. `book/`: licensed PDF/index. `ops/`: release/backup/monitor. `test/` and `evaluation/`: checks.
- Preserve original learner messages, conversation ownership, cancellation, grounded citations and existing data volumes.
- Do not publish credentials or production connection details. Production Compose differs from the public example; preserve its networks and mounts during authorized releases.
- Diagnose reported failures with a regression first. Keep changes scoped; avoid new dependencies without a concrete need.
- Checks: `npm test`, `npm run evaluate`, `npx tsc --noEmit`, `npm run build`, `npm run test:e2e`.
- Do not edit generated `dist/`, real databases or secrets as source changes.
- Status: [docs/PROJECT-STATUS-TH.md](docs/PROJECT-STATUS-TH.md). Release procedure: [docs/RELEASE-PROCESS-TH.md](docs/RELEASE-PROCESS-TH.md).
- Communicate in Thai, explain intended behavior and evidence, and honor authorization already granted in the current session.
