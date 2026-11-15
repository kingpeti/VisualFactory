# AGENTS.md

> Structural map of the project for AI agents. Keep it factual; update it when the structure changes significantly.
> `CLAUDE.md` holds the authoritative safety rules, conventions and full code map: read it before editing.

## Project Overview

VisualFactory is a fork of cubefarm: a cartoon first-person 3D office (React Three Fiber) over a Node orchestrator that
runs one coding-agent CLI session (Claude Code, Codex or OpenCode) per agent, plus a CEO, working through GitHub
issues. It is being extended into an all-in-one visual AI/agentic software factory (see `.ai-factory/DESCRIPTION.md`).

## Safety (summary of CLAUDE.md)

- A live office may run from `C:\Projects\office-swarm` on ports 4317/5317 with state in `~/.cubefarm`: never edit,
  run or read anything there, and never use those ports.
- Test only in demo mode with an isolated `SWARM_HOME` and your own `SWARM_PORT`:
  `SWARM_HOME="$PWD/.swarm-home" SWARM_PORT=<port> node --import tsx server/index.ts --demo`
- Never run `npm run dev` / `npm run demo` / `npm start` / `npx cubefarm` (they default to the live ports).
- Never push to `main`, never force-push, never merge your own PR, never publish or tag releases.

## Tech Stack

- **Programming language:** TypeScript (strict ESM), Node >= 22
- **Framework:** Express 5 + ws (server), React 19 + React Three Fiber 9 + zustand (client), Vite 8
- **Database:** none (JSON state files under `SWARM_HOME`)
- **ORM:** none

## Project Structure

```
bin/            # cubefarm npm command (plain JS): checks, starts dist-server, login/doctor
client/         # Vite root
  src/world/    # 3D building: floors, desks, characters, camera, gfx tiers, themes, toys, outside city
  src/ui/       # HTML overlays: HUD, terminal, Kanban, manager console, phone, settings, accessibility
  src/pocket/   # 2D pocket mode for phones
  src/photo/    # photo mode and clips (lazy)
server/         # Node orchestrator: swarm, runners, CLIs, pty host, CEO tools, GitHub, workspaces, previews, cloud
shared/         # REST/websocket contract (types.ts) and pure rules shared by both sides
scripts/        # launcher (office.mjs), build, bench, e2e and package smoke helpers
e2e/            # optional Playwright specs, one file per feature
docs/           # agents, cloud, fork, how-it-works, pocket, voice
.github/        # CI (typecheck, test, build, package smoke) and npm release workflow
.ai-factory/    # AI Factory context: description, architecture, rules, plans
```

## Key Entry Points

| File | Purpose |
|------|---------|
| `server/index.ts` | Server entry: real or demo backend, REST under `/api`, `/ws` and `/ws/term` websockets, serves `dist/` |
| `server/swarm.ts` | Orchestrator: floors, agents, scheduling, build -> QA -> fix -> merge loop, CEO jobs, persistence |
| `server/backend.ts` | `Backend` interface (GitHub, git, disk, sessions) and the real implementation |
| `server/demo.ts` | Demo backend: fakes for every `Backend` method |
| `server/cliRunner.ts` | Terminal runtime: an agent as the real CLI in a node-pty |
| `server/ceo.ts` | CEO office MCP tools, system and job prompts |
| `shared/types.ts` | REST/websocket contract (`WorldSnapshot`, `ServerEvent`, views, settings) |
| `client/src/store.ts` | zustand store; `apply(ServerEvent)` folds server events into UI state |
| `client/src/App.tsx` | Loads the 3D office or pocket mode lazily |
| `scripts/office.mjs` | Launcher with self-update (only in a throwaway clone, demo mode) |
| `package.json` | Scripts: `typecheck`, `test`, `build`, `test:e2e`, `bench` |

## Documentation

| Document | Path | Description |
|----------|------|-------------|
| README | README.md | Quick start and feature overview |
| Contributing | CONTRIBUTING.md | Development workflow and PR rules |
| How it works | docs/how-it-works.md | Orchestration details |
| Agents | docs/agents.md | Agents, machines, CLIs |
| Cloud | docs/cloud.md | Cloud agents on Upstash Boxes |
| Pocket | docs/pocket.md | Phone mode, PWA, notifications |
| Voice | docs/voice.md | Phone messages read aloud |
| Fork | docs/fork.md | VisualFactory decisions, import ledger, upstream sync |

## AI Context Files

| File | Purpose |
|------|---------|
| AGENTS.md | This file: project structure map |
| CLAUDE.md | Authoritative safety rules, scripts, code map, conventions, test and PR rules |
| .ai-factory/DESCRIPTION.md | Project specification, stack and direction |
| .ai-factory/ARCHITECTURE.md | Architecture decisions and guidelines |
| .ai-factory/rules/base.md | Detected coding conventions |
| .ai-factory/config.yaml | AI Factory settings (languages, paths, git) |

## Agent Rules

- Never combine shell commands with `&&`, `||` or `;`: execute each as a separate command.
  - Wrong: `git checkout main && git pull`
  - Right: first `git checkout main`, then `git pull origin main`
- Before opening a PR: `npm run typecheck`, `npm test` and `npm run build` must pass.
- One issue per PR, small on-topic diffs; don't reformat, reorder or rename code you aren't changing.
