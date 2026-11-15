# Architecture: Structured Modules (adapted to the existing codebase)

## Overview

VisualFactory is a brownfield TypeScript monolith (cubefarm fork): one Node process (Express 5 + ws) orchestrates
coding-agent CLI sessions and serves a React Three Fiber client. The server is a set of flat, focused modules around
one large orchestrator (`server/swarm.ts`, class `Swarm`), with a single explicit port, the `Backend` interface
(`server/backend.ts`), implemented by `realBackend` and faked by `createDemoBackend()` (`server/demo.ts`).

Structured Modules fits because the project needs boundaries for the coming workflow layer (owner's CubeFarm Next RFC)
without the ceremony of full hexagonal folders, and because the existing style already is "pure helpers + one port +
demo fake". New feature areas become modules with a pure core, small port interfaces and demo fakes; existing modules
are documented as they are and are not reshuffled.

## Decision Rationale

- **Project type:** local-first desktop/server app (npm `cubefarm`), single process, single owner, many parallel PRs
  from AI agents
- **Tech stack:** TypeScript strict ESM, Node >= 22, Express 5 + ws, React 19 + R3F + zustand, Vitest
- **Key factor:** the RFC's workflow engine needs a deterministic, testable core and replaceable storage/executors,
  while the existing code must keep working unchanged and merge conflicts between parallel agent PRs must stay rare

## Folder Structure

```
server/                         # existing: flat modules, imports with .ts extensions
  index.ts                      # composition root: picks real/demo Backend, REST routes, websockets
  swarm.ts                      # Swarm orchestrator (legacy issue -> build -> QA -> fix -> merge loop)
  backend.ts                    # Backend port + realBackend adapter (gh, git, disk, sessions)
  demo.ts                       # demo Backend + fake sessions (must cover every Backend method)
  outbox.ts                     # websocket fan-out (patches, terminal lines per watch)
  mergeGate.ts, reconcile.ts, qaOrphans.ts, ...   # focused helpers, mostly pure + tested
  workflows/                    # NEW module (RFC): workflow domain layer
    engine.ts                   # pure: definition + persisted state -> next stage commands
    definition.ts               # pure: parse/validate/canonicalize/hash workflow definitions
    executors/                  # stage executors (ai.task, artifact.review, human.approval, cubefarm.development, ...)
      registry.ts
    store.ts                    # WorkflowStore port (interface)
    jsonStore.ts | sqliteStore.ts   # WorkflowStore adapters (choice is an open ADR)
    artifacts.ts                # immutable, content-hashed artifact store
    bridge.ts                   # WorkflowBridge: the only way workflows touch Swarm
    demo.ts                     # fakes for executors/bridge used by --demo
    *.test.ts                   # tests next to code
shared/                         # contract + pure rules for both sides
  types.ts                      # existing REST/websocket contract
  workflows/                    # NEW: zod schemas + TS types (Project, WorkItem, WorkflowDefinition, StageRun, Artifact, Finding, Decision, ...)
client/src/                     # existing: world/ (3D), ui/ (overlays), pocket/ (2D), photo/
  ui/workflows/                 # NEW: workflow panels (run status, spec diff, findings, approvals)
```

## Dependency Rules

- ✅ `server/index.ts` (composition root) wires `Swarm`, `Backend` and, when present, the workflow module
- ✅ `server/workflows/*` -> `shared/workflows/*`, `server/exec.ts`, `server/httpError.ts`
- ✅ `server/workflows/bridge.ts` -> `Swarm` public methods only
- ✅ `client/src/*` -> `shared/*` (types and pure rules), never `server/*`
- ✅ pure modules (`engine.ts`, `definition.ts`, `shared/*`) import nothing with side effects
- ❌ `server/swarm.ts` -> `server/workflows/*` internals (only through a narrow hook the bridge registers)
- ❌ workflow engine -> GitHub/git/CLI directly (side effects go through executors and the `Backend` port)
- ❌ `shared/*` -> `server/*` or `client/*`
- ❌ executors reading or mutating `Swarm`'s private maps
- ❌ circular imports between `server/workflows/` and `server/swarm.ts`

## Layer/Module Communication

- Server -> client: snapshot on connect, then typed `ServerEvent`s through `Swarm.broadcast` / `server/outbox.ts`;
  workflow events are additive event kinds in `shared/types.ts`, handled in `client/src/store.ts` `apply`.
- Client -> server: REST commands under `/api` (no polling for state); errors as `HttpError` -> `{ error }`.
- Workflow layer -> legacy loop: `WorkflowBridge` (`startDevelopment`, `observePullRequest`, `requestQa`,
  `requestFix`, `getMergeFacts`, `authorizeMerge`), one authoritative merge gate per opted-in repo.
- External side effects: recorded as an intent with an idempotency key before execution, reconciled after restart.
- Agents: each AI stage is a fresh CLI/SDK session via the existing runners (`cliRunner.ts`, `agentRunner.ts`).

## Key Principles

1. **Pure core, thin shells.** Decisions (graph transitions, policy, budgets, merge authorization) are pure functions
   with direct unit tests; I/O lives in executors and adapters. Never ask an LLM to decide whether a gate passed.
2. **One port per external world, one demo fake per port.** `Backend` for GitHub/git/disk/sessions, `WorkflowStore`
   for persistence, executor interfaces for stage kinds. Every port method gets a fake in demo mode.
3. **Additive, opt-in change.** A repository with no workflow configuration behaves exactly as upstream cubefarm:
   no extra LLM sessions, no new gates, no forced database.
4. **Immutable, hash-bound artifacts.** Specs, reviews and approvals are versions with content hashes; approvals
   bind to an exact artifact hash / PR head SHA and go stale when it changes.
5. **Windows first and conflict-friendly.** `path.join`, `execFile` with arg arrays, temp-file + rename writes;
   new behavior in new files so parallel agent PRs rarely touch `swarm.ts`.

## Decisions

Owner decisions of 2026-11-14. They override upstream cubefarm conventions where they differ.

| ID | Decision | Consequence |
|----|----------|-------------|
| D-001 | OpenCode: support only the latest OpenCode (2.x) | OpenCode 1.x code paths (plugin format, `--model`, the #311 local-model config, CEO on OpenCode) are migrated, not kept side by side; upstream sync in `clis.ts` / `cliRunner.ts` costs more |
| D-002 | UI: a 2D dashboard in addition to the 3D office | supermini/AI-2DFarm's dashboard is the base; both views stay, the 3D office is not removed |
| D-003 | Hosting: local single-user first; team/hosted mode (auth, RBAC, remote workers) only after the current feature list is built | Approvals in local mode are attested by the local manager; hosted concerns stay out of the MVP |
| D-004 | REST validation: zod schemas at the route | New and touched routes use zod; the remaining hand-validated routes migrate over time |
| D-005 | Enforcement: hooks, per-CLI permission rules and sandboxes are wanted | Office rules (read-only reviewers, no pushes to the default branch, no merging by agents) get enforced per CLI where supported, not only prompted |
| ADR-007 | The legacy issue -> build -> QA -> fix -> merge loop is one atomic `cubefarm.development` stage in the workflow MVP | Specialist reviews and approvals gate the merge through the legacy merge gate as typed refusal reasons (like merge holds), not as separate stages after it |

Still open: ADR-006 (workflow storage) and ADR-008 (approval identity in local mode).

## Code Organization Note

- **New Features:** New feature areas follow the module layout above (pure core + port + adapters + demo fake +
  tests next to code) where practical.
- **Existing Code:** The flat `server/` modules and `swarm.ts` are documented as-is. When modifying them, prefer
  extracting pure helpers, but do not restructure unrelated code (upstream sync and parallel PRs depend on it).
- **Interoperability:** New code reaches `Swarm` through `WorkflowBridge` and public methods; it does not refactor
  `Swarm` for structural alignment.

## Code Examples

### Pure decision + port + adapter

```typescript
// shared/workflows/stage.ts (pure contract)
export type StageOutcome =
  | { kind: 'passed'; artifactIds: string[] }
  | { kind: 'changes_requested'; findingIds: string[] }
  | { kind: 'waiting_approval'; artifactHash: string }
  | { kind: 'blocked'; reason: string; retriable: boolean };

// server/workflows/engine.ts (pure: no I/O, no clock, no randomness passed in implicitly)
import type { WorkflowDefinition, StageRunState, StageCommand } from '../../shared/workflows/types.ts';

/** The stages that may start now, given the pinned definition and what has already happened. */
export function nextCommands(definition: WorkflowDefinition, runs: readonly StageRunState[]): StageCommand[] {
  const finished = new Set(runs.filter((run) => run.status === 'passed').map((run) => run.stageId));
  return definition.stages
    .filter((stage) => !runs.some((run) => run.stageId === stage.id))
    .filter((stage) => stage.needs.every((needed) => finished.has(needed)))
    .map((stage) => ({ kind: 'start', stageId: stage.id }));
}

// server/workflows/store.ts (port)
export interface WorkflowStore {
  appendEvent(runId: string, event: WorkflowEvent, idempotencyKey: string): Promise<void>;
  loadRun(runId: string): Promise<PersistedRun | null>;
}
```

### Reaching the legacy loop only through the bridge

```typescript
// server/workflows/bridge.ts
import type { Swarm } from '../swarm.ts';

export interface WorkflowBridge {
  startDevelopment(repo: string, issueNumber: number): Promise<void>;
  getMergeFacts(repo: string, prNumber: number): Promise<{ headSha: string; checksGreen: boolean }>;
}

/** The only place workflow code touches Swarm: public methods, never its private maps. */
export function swarmBridge(swarm: Swarm): WorkflowBridge {
  return {
    startDevelopment: (repo, issueNumber) => swarm.queueIssue(repo, issueNumber),
    getMergeFacts: (repo, prNumber) => swarm.mergeFacts(repo, prNumber),
  };
}
```

(`queueIssue` / `mergeFacts` are illustrative: add the narrowest public method `Swarm` needs, with a test.)

## Anti-Patterns

- ❌ Growing `swarm.ts` with workflow special cases instead of using the bridge and a new module
- ❌ An LLM's structured output used as the authority for approval, merge, deploy or purchase
- ❌ Reusing an approval after the spec hash or PR head SHA changed
- ❌ A `Backend` or executor method without a demo fake (breaks `--demo` and every test office)
- ❌ Storing workflow runs as ad-hoc fields inside `state.json`
- ❌ Unbounded review/revise loops, or retries that repeat an external write without an idempotency check
- ❌ Polling state over REST from the client instead of server events
