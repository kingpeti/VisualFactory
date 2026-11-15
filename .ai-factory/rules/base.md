# Project Base Rules

> Auto-detected conventions from codebase analysis. Edit as needed. `CLAUDE.md` stays the authoritative source; these
> rules summarize it for AI Factory skills.

## Naming Conventions

- Files: camelCase for modules (`server/agentRunner.ts`, `shared/issues.ts`), PascalCase for React components
  (`client/src/ui/AgentCard.tsx`), tests next to code as `<name>.test.ts`, e2e specs as `e2e/<feature>.spec.ts`
- Variables: camelCase; no single-character names except `i`/`j` loop counters and `x`/`y`/`z` coordinates
- Functions: camelCase verbs (`run`, `failureDetail`, `scalePlan`)
- Classes/types: PascalCase (`HttpError`, `CommandError`, `AgentTerminal`, `WorldSnapshot`, `ServerEvent`)

## Module Structure

- `server/`: Node orchestrator; imports use `.ts` extensions (`import { run } from './exec.ts'`)
- `client/src/`: Vite root; imports without extensions; `world/` (3D), `ui/` (HTML overlays), `pocket/` (2D phone),
  `photo/` (lazy photo mode)
- `shared/`: contract and pure rules imported by both sides (`types.ts` is the REST/websocket contract)
- `scripts/`: plain-JS launcher and tooling with pure, tested step modules (`*Steps.mjs`)
- `bin/cubefarm.js`: plain-JS npm entry
- Every new `Backend` method, CEO tool or capability gets a fake in `server/demo.ts`
- New state: add to `shared/types.ts`, the snapshot and an event, handle it in `client/src/store.ts` `apply`

## Error Handling

- REST: throw `HttpError(status, message)`; the handler in `server/index.ts` returns `{ error }` JSON, anything else is a
  logged 500
- CLI calls go through `server/exec.ts` (`run`/`git`/`gh`): `execFile` without a shell, prompts disabled,
  `CommandError` carrying stderr and exit code
- CEO tools: zod input schemas, errors worded so the CEO can act on them
- Never swallow errors silently; surface skipped work and failures

## Control Flow

- Prefer flat, readable control flow over deeply nested conditionals. Use guard clauses, early `return`/`continue`, small named helper methods, or explicit classification logic when they make the code easier to follow. Handle edge cases and irrelevant branches early so the main path stays visible.
- Extract decisions into pure helpers and test them directly instead of mocking

## Logging

- Plain `console.log` / `console.warn` / `console.error` on the server (no logging library); warnings are the
  common case
- Agent and CEO output goes to their terminals (`server/terminal.ts`), not the server log
- Never log secrets; `ANTHROPIC_*` / `CLAUDE_*` are stripped from agent and preview env

## Comments

- Sparse, say why: a short header comment per file, `/** */` on exported functions and interface fields when the
  name is not enough, `// ---------- section ----------` dividers in long files, no commented-out code
