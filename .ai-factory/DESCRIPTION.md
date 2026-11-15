# VisualFactory

## Overview

VisualFactory is kingpeti's fork of [leonvanzyl/cubefarm](https://github.com/leonvanzyl/cubefarm) (npm `cubefarm` 0.3.20,
forked at upstream `main` 157efde, 2026-10-22). Today it is cubefarm unchanged: a cartoon first-person 3D office
(React Three Fiber) over a Node orchestrator that runs one coding-agent CLI session (Claude Code, Codex or OpenCode)
per agent, plus a CEO agent, working through GitHub issues: issue -> build -> QA -> fix -> merge.

Direction: grow it into an all-in-one, multipurpose visual AI/agentic software factory. The owner's design is the
"CubeFarm Next" RFC (configurable, artifact-driven workflows per project/repository: plan -> spec -> independent
review -> human approval -> build -> QA -> SHA-bound merge gate; multi-repo initiatives, GitOps and non-GitHub/physical
projects; stage-level model routing and cost telemetry). Selected work from other upstream forks is to be imported
along the way. The existing issue -> PR -> QA -> merge loop must keep working for repositories with no workflow config.

## Core Features (existing, upstream baseline)

- Agents are interchangeable (no roles): any free agent builds, tests or fixes; each works on a machine of its own
  (local clone/worktree, or an Upstash Box for cloud agents).
- Terminal runtime: each agent is the real CLI in a node-pty held by a detached keeper (`ptyHost`), surviving office
  restarts; Claude Code reports through HTTP hooks, Codex/OpenCode through notify hooks.
- CEO agent with office MCP tools (scale team, configure agents, create/triage issues), phone messages, voice.
- QA loop with screenshots, fix rounds, merge gate, PR theatre previews, per-floor app previews.
- 3D office: floors, desks, characters, elevator, photo mode, time-lapse journal, themes, accessibility;
  pocket mode (2D) for phones; PWA and Web Push notifications.
- Demo mode (`--demo`): fake GitHub, fake agents, fake machines, for safe testing with no Claude usage.

## Tech Stack

- **Language:** TypeScript (strict, ESM, `noUnusedLocals`/`noUnusedParameters`), TypeScript 7, Node >= 22 (CI on Node 24)
- **Server:** Node + Express 5 + `ws`, run by `tsx` in development, bundled by esbuild into `dist-server/`
- **Agent runtimes:** `@anthropic-ai/claude-agent-sdk`, `@lydell/node-pty`, `@xterm/headless`, `@modelcontextprotocol/sdk`, `@playwright/mcp`
- **Client:** React 19, React Three Fiber 9, drei 10, three r186, Rapier physics, postprocessing/n8ao, zustand 5, xterm.js, Vite 8
- **Validation:** zod 4 (CEO tools), hand validation at REST routes
- **Cloud agents:** `@upstash/box` (opt-in)
- **External tooling:** `gh` CLI for all GitHub access, `git`, `npm`
- **Database:** none; state is JSON files under `SWARM_HOME` (`state.json`, journal, secrets.json, push.json), written via temp file + rename
- **Tests:** Vitest 5 (`*.test.ts` next to code, ~220 files), optional Playwright e2e (`e2e/`), scale benchmark (`scripts/bench.mjs`)

## Architecture Notes

- `server/swarm.ts` (~5.5k lines) is the orchestrator: floors, agents, scheduling, build -> QA -> fix -> merge loop,
  CEO job queue, persistence and websocket fan-out. Most other server modules are focused helpers around it.
- `Backend` interface (`server/backend.ts`) isolates GitHub, git, disk and sessions; `server/demo.ts` fakes every
  method (demo parity is mandatory).
- UI state comes from the server: snapshot on connect, then typed `ServerEvent`s batched by `server/outbox.ts`;
  REST is for commands only. Shared contract in `shared/types.ts`.
- See `CLAUDE.md` for the full code map and `.ai-factory/ARCHITECTURE.md` for the target architecture.

## Architecture

See `.ai-factory/ARCHITECTURE.md` for detailed architecture guidelines.
Pattern: Structured Modules (adapted to the existing codebase)

## Non-Functional Requirements

- Windows first: `path.join`, `execFile` with arg arrays, `fs.rm` with retries, process-tree kills, `windowsHide`.
- Safety: never touch the live office (`C:\Projects\office-swarm`, ports 4317/5317, `~/.cubefarm`); test only in demo
  mode with an isolated `SWARM_HOME` and a reserved `SWARM_PORT`.
- Scale budgets: a big company must fit `server/scale.test.ts`.
- Agent prompts are paid on every session: keep them short.
- Backward compatibility: repositories without new workflow configuration behave exactly as before.
- No unattended real external writes by default (merges, deploys, purchases); LLM output alone never grants permission.
