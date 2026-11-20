# Implementation Plan: M0+M1 fork hygiene, 2D dashboard and verified quick wins

Branch: feature/visual-base-quick-wins
Created: 2026-11-14

## Original Request
M0+M1 of VisualFactory: fork hygiene (upstream remote, fork change ledger and sync procedure, .swarm-home in .gitignore, commit the AIF setup) and the visual base plus verified quick wins: import the supermini/AI-2DFarm 2D dashboard (fast-forward to fork commit 78a4d42, keep the 3D office reachable, fix the dashboard bundle regression, read-only grid terminals, LICENSE copyright line), then rebase and land the verified wave 1 imports: merge holds (TubadoG 32b3ed8 2698c4c), trust-prompt fix (konstantinknappe 79caf97 68a8ac6), save desk work before reuse (mysteryreloaded 4d56b71 plus leftovers pruning), terminal touch-scroll (mysteryreloaded 2d5b0ea + LiveTerminal hunk of 37d6148), 60k-char messages (mysteryreloaded 4286dec), manager Request changes after QA (droidsembly 4ac28f4 server part + plain-string client), and one re-QA-on-head-move rule (hand port). Source of truth: .ai-factory/research/upstream-fork-audit/README.md sections 2 and 7, exact recipes in verification.json. Excluded: CEO on any CLI and anything OpenCode (M2).

## Settings
- Testing: yes
- Logging: verbose
- Docs: yes
- Desktop default view: 3D office; narrow/touch screens open the 2D dashboard (owner choice)
- Delivery: one PR per task group into kingpeti/VisualFactory `main` (PR 1: tasks 1-4, PR 2: tasks 5-8, PR 3: tasks 9-12, PR 4: tasks 13-15). Work stays on this branch; merge each PR with a merge commit, or rebase this branch onto `main` after a squash merge, before continuing.
- GitHub tracking: owner asked for a GitHub Project with every feature and task tracked as an issue (task 4)

## Context

- Decisions D-001..D-005 and ADR-007: `.ai-factory/ARCHITECTURE.md` (Decisions).
- Fork audit, verified recipes and risks: `.ai-factory/research/upstream-fork-audit/README.md` (sections 2 and 7),
  `verification.json` (trial cherry-picks on 157efde), `features.json`.
- Baseline: `main` = upstream 157efde; on Node 24.22.2 `npm run typecheck` passes and Vitest runs 221 files /
  2451 tests green. Use Node >= 22 (the default shell here is Node 20; prepend
  `C:/Users/peti/.fnm/node-versions/v24.22.2/installation` to PATH).
- Fork sources (read-only; never run their code): `https://github.com/supermini/AI-2DFarm`,
  `https://github.com/TubadoG/cubefarm`, `https://github.com/konstantinknappe-hash/cubefarm`,
  `https://github.com/mysteryreloaded/software-development-factory`, `https://github.com/rosariomoscato/droidsembly`.
  Add each as a temporary remote only for the task that needs it.
- Safety (CLAUDE.md): never touch the live office (`C:\Projects\office-swarm`, ports 4317/5317, `~/.cubefarm`).
  Demo checks use `SWARM_HOME="$PWD/.swarm-home" SWARM_PORT=4391 node --import tsx server/index.ts --demo` after
  `npm run build`.
- Every task ends with `npm run typecheck` and the affected Vitest files; each PR ends with full `npm test` and
  `npm run build`. UI tasks need screenshots from the demo office in the PR.

## Logging conventions for this plan

- Server: `debugLog(scope, message, data?)` from the new `server/log.ts` (task 3) for verbose flow, printed only when
  `SWARM_DEBUG=1` (or the scope is listed, e.g. `SWARM_DEBUG=holds,merge`); `console.warn` for recoverable failures
  and `console.error` for unexpected ones, as the codebase already does. Format: `[scope] message {data}`.
- Client: `console.debug('[scope] ...')` for verbose flow (hidden by default in browsers), `console.warn` for failures.
- Never log tokens, secrets, prompt bodies or full PR bodies; log ids, SHAs, counts and decisions.

## Validation convention for this plan (D-004)

Routes touched here validate their body with the existing zod `parse` helper (`server/index.ts`, `parse(schema,
value)` throwing `HttpError(400)`), schemas server-side only (zod in `shared/` would ship to phones). Shape, types and
generous caps in zod; user-facing limits stay in Swarm. Moving the helper to `server/restInput.ts` is M2 work.

## Commit Plan
- **Commit 1** (after tasks 1-3): "chore(aif): set up AI Factory context, fork ledger and debug logging"
- **Commit 2** (after task 4): "docs(fork): record GitHub tracking for milestones M0-M7"
- **Commit 3** (after tasks 5-8): merge commit "Merge supermini/AI-2DFarm 78a4d42: 2D dashboard", then "fix(dashboard): keep the 3D office as the desktop default and make grid terminals read-only"
- **Commit 4** (after tasks 9-12): the cherry-picks keep their source messages (`-x`); adaptations as "fix(workspace): prune saved desk leftovers" and "fix(messages): accept typed messages up to 60k characters"
- **Commit 5** (after tasks 13-15): cherry-picks with `-x`, then "feat(merge): re-run QA whenever a passed PR's head moves" and "feat(kanban): let the manager request changes after QA passed"

## Tasks

### Phase 1: Fork hygiene (M0, PR 1)

- [x] Task 1: Commit the AI Factory setup and the decision edits. (#1)
  Files: `.ai-factory/config.yaml`, `.ai-factory/DESCRIPTION.md`, `.ai-factory/ARCHITECTURE.md`,
  `.ai-factory/rules/base.md`, `.ai-factory/research/upstream-fork-audit/*`, `.ai-factory/plans/feature-visual-base-quick-wins.md`,
  `AGENTS.md`, `CLAUDE.md` (D-004 zod and D-005 enforcement edits), `.claude/skills/{threejs-react-three-fiber,vitest}`,
  `skills-lock.json`. Remove `.claude/skills/zustand` and its `skills-lock.json` entry if the owner confirms (it
  encodes LobeHub's own store conventions, which contradict `client/src/store.ts`).
  Check `.claude/skills/*` are not shipped in the npm package (`package.json` `files` is `bin`, `dist`,
  `dist-server`: confirm with `npm pack --dry-run`).
  Logging: none (no runtime code).

- [x] Task 2: Upstream remote, fork ledger and sync procedure. (#1)
  Run `git remote add upstream https://github.com/leonvanzyl/cubefarm.git` (local config, not committed).
  Create `docs/fork.md`: what VisualFactory is, the decisions table (link to ARCHITECTURE.md), the import ledger
  (one row per imported feature: source fork, commits, local commit/PR, adaptations, tests), the sync procedure
  (`git fetch upstream`, merge `upstream/main` into a `chore/sync-upstream-<date>` branch, resolve, typecheck/test/build,
  PR to `main`; known hotspots `server/swarm.ts`, `server/cliRunner.ts`, `server/clis.ts`,
  `client/src/ui/ManagerConsole.tsx`, `client/src/ui/KanbanView.tsx`), and the rule that fork-only behavior goes into
  new files with narrow hooks. Add one line for `docs/fork.md` to the CLAUDE.md code map and the AGENTS.md
  documentation table.
  Logging: none.

- [x] Task 3: `.gitignore` and the debug logging helper. (#1)
  Add `.swarm-home` to `.gitignore` (CLAUDE.md's demo instructions create it in the checkout).
  Create `server/log.ts`: `debugEnabled(scope)` and `debugLog(scope, message, data?)`, reading `SWARM_DEBUG` once at
  import (`1`/`*` = all scopes, or a comma list), printing `[scope] message` plus compact JSON of `data` via
  `console.log`. No dependency, no config file. Test `server/log.test.ts`: scopes on/off, list parsing, data
  formatting (spy on `console.log`). Mention `SWARM_DEBUG` in CLAUDE.md (config/scripts section).
  Logging: this task defines it.

- [x] Task 4: GitHub tracking for the whole programme. (#1)
  Preconditions (owner actions, see the checkpoint): Issues enabled on kingpeti/VisualFactory (currently off, as on
  every fork) and the gh token refreshed with the `project` scope (`gh auth refresh -s project`).
  Create GitHub milestones M0..M7 (titles and descriptions from README section 7), labels `area:*` (dashboard, merge,
  workspace, clis, workflows, security, telemetry, ui-3d) and `source:fork-import` / `source:rfc`, and a Projects (v2)
  board "VisualFactory" with Status (Todo, In progress, In review, Done) and Milestone.
  Create one issue per task of this plan (tasks 5-15; tasks 1-4 as one "M0 fork hygiene" issue) and one issue per
  feature of M2-M7 (README section 7, RFC backlog WF-001..WF-030, decisions D-001..D-005), each with source links,
  acceptance criteria, and `Depends on #N` lines in the format `shared/issues.ts` parses, so a cubefarm office can
  schedule them in order. Add every issue to the board. Record the issue numbers in this plan next to each task and
  in `docs/fork.md`.
  If the repo is ever connected to a cubefarm office as a floor, open issues become agent work: label the issues that
  must wait with `swarm:skip` (`shared/issues.ts`).
  Logging: none (gh CLI); keep the created numbers in the PR description.

### Phase 2: 2D dashboard (M1a, PR 2)

- [x] Task 5: Merge the supermini dashboard with its history. (depends on 1) (#3)
  `git remote add supermini https://github.com/supermini/AI-2DFarm.git`, `git fetch supermini`,
  `git merge --no-ff 78a4d42` (157efde..78a4d42 touches 111 files, all under `client/` plus `docs/pocket.md`; no
  server, shared, package or e2e changes), then `git cherry-pick -x 951c3af` (metrics CSS).
  Never take 708f9b8 (VITE_OFFICE_3D flag), 09b20d3 (deletes the 3D office), c7f87a5, dfc12e6, 9388523, 2329a62,
  f876f17 or anything else after 78a4d42.
  Run typecheck, full `npm test`, `npm run build`. Add the ledger row in `docs/fork.md`.
  Logging: none added by the merge; note in the PR which commits came in.

- [x] Task 6: Keep the 3D office as the desktop default. (depends on 5) (#4)
  `client/src/pocket/mode.ts`: restore the narrow/touch inputs to `pickMode` and `startMode` so a wide, non-touch
  screen opens the 3D office and narrow/touch screens open the dashboard; keep `?office=3d`, `?pocket=0` and the
  saved choice (a saved legacy `pocket` value maps to the dashboard). Update `client/src/pocket/mode.test.ts`
  (desktop -> office, phone -> dashboard, overrides, saved choice) and the `docs/pocket.md` paragraph.
  Confirm `e2e/helpers.ts` (`goto('/')`) and `scripts/bench.mjs` (`/?stats`) still open the 3D office.
  Logging: `console.debug('[mode] picked', { mode, reason })` once at startup.

- [x] Task 7: Dashboard safety and bundle fixes. (depends on 5) (#5)
  a) Grid terminals read-only: add a prop to `client/src/ui/LiveTerminal.tsx` (e.g. `interactive={false}`) used by
  the dashboard terminal grid tiles, so a tile never sends `{t:'resize'}` (the agent's single shared PTY in
  `server/terminal.ts` takes the last viewer's size) and never forwards keystrokes (Esc would interrupt the agent);
  the full terminal view stays interactive. Test the pure part (which messages a non-interactive terminal sends).
  b) Time-lapse in the dashboard: confirm the dashboard's action buttons are disabled while replay plays or seeks
  (the 2D replay text claims it); add the guard if missing.
  c) Bundle: confirm the dashboard and pocket chunks import no `three` / `@react-three/*` (check the build output or
  supermini's `noWorldImports.test.ts` if present; otherwise add a small Vitest import-closure guard over
  `client/src/dashboard/**`).
  Logging: `console.debug('[terminal] read-only tile', { agentId })`; `console.warn` when a blocked action is attempted
  during replay.

- [x] Task 8: Attribution and demo verification of the dashboard. (depends on 6, 7) (#6)
  `LICENSE`: add `Copyright (c) 2026 Paulo Lopes` below Leon van Zyl's notice (supermini's MIT notice for the
  imported dashboard). README: one short section on the 2D dashboard and how to switch views.
  Boot the demo office (`npm run build`, then the SAFETY command on port 4391), and screenshot: desktop opens 3D,
  the dashboard via the view switch, the reviewer, CEO, Kanban, terminal grid and metrics panels, and a phone-width
  viewport opening the dashboard. Attach to PR 2.
  Logging: none.

### Phase 3: Reliability and UX quick wins (M1b, PR 3)

- [x] Task 9: Answer the live trust menu. (depends on 1) (#7)
  `git cherry-pick -x 79caf97 68a8ac6` from konstantinknappe-hash/cubefarm (`server/clis.ts` `trustKey` reads the
  last trust marker, `server/clis.test.ts` +2 cases; verified clean on 157efde).
  Logging: `debugLog('trust', 'answered trust prompt', { cli, key })` where `cliRunner.ts` answers it.

- [x] Task 10: Save a desk's unfinished work before reuse, with pruning. (depends on 1) (#8)
  `git cherry-pick -x 4d56b71` from mysteryreloaded (`server/workspace.ts` `saveBeforeReuse`,
  `server/workspace.test.ts`; verified clean). Adapt in `server/workspace.ts`: skip desks whose branch starts with
  `swarm-preview` (preview restarts must not write patches); prune `<SWARM_HOME>/leftovers` at save time, oldest
  first, keeping at most 30 days and 500 MB in total (constants at the top of the file); skip files over 25 MB in the
  saved patch and say so in the note. Tests: preview desk skipped, pruning by age and by size, large-file skip.
  Run the workspace tests on Windows (the stale-lock test expects exactly one note).
  Logging: `debugLog('workspace', 'saved leftovers', { desk, files, bytes })`, `debugLog('workspace', 'pruned', { removed, bytes })`,
  `console.warn` when saving fails (the save must never block the desk).

- [x] Task 11: Touch-scroll an agent's live terminal on phones. (depends on 5, 7) (#9)
  `git cherry-pick -x 2d5b0ea` from mysteryreloaded (`client/src/ui/termTouch.ts` + test, `LiveTerminal.tsx`,
  `styles.css`, `e2e/terminalTouch.spec.ts`), then apply only the `client/src/ui/LiveTerminal.tsx` hunk of 37d6148
  (`git show 37d6148 -- client/src/ui/LiveTerminal.tsx | git apply`); never 37d6148 whole (it adds a stray demo
  state file). Check it works together with task 7's read-only tiles (scrolling allowed, no resize/keys).
  Logging: `console.debug('[termTouch] scroll', { lines })` throttled to once per gesture.

- [x] Task 12: Typed messages up to 60,000 characters. (depends on 1) (#10)
  `git cherry-pick -n 4286dec` from mysteryreloaded; in `client/src/ui/MessageBox.tsx` keep upstream's imports and
  add only `import { MESSAGE_MAX } from '../../../shared/message';` (drop the fork's `useTouch`). Keep
  `maxLength={MESSAGE_MAX}`. In `server/swarm.ts` `message()`, a typed message is refused only when empty; longer
  than `MESSAGE_MAX` returns `HttpError(400)` instead of silent truncation. Validate the message route body with zod
  (D-004) while touching it. Tests for the limit and the 400.
  Logging: `debugLog('messages', 'manager message', { to, chars })`; `console.warn` on a rejected oversize message.

### Phase 4: Merge governance quick wins (M1c, PR 4)

- [ ] Task 13: Merge holds. (depends on 5) (#11)
  `git cherry-pick -x 32b3ed8 2698c4c` from TubadoG/cubefarm (floor hold paths with gitignore-style globs, the
  `swarm:hold` label, `Backend.prFiles` with its demo fake, `shared/holds.ts` + tests; verified clean on 157efde).
  Resolve against the dashboard's Kanban refactor (`useCardActions` in `client/src/ui/KanbanView.tsx`) so the held
  badge shows in both the 3D Kanban and the dashboard reviewer panel. Delete the stale `/** One step toward merging
  ... */` line left above `advanceMerge`. Add one sentence about holds to the CEO system prompt in `server/ceo.ts`
  (around the "office merges a PR by itself" line). Validate the new hold-paths setting with zod at its route (D-004, validation convention above).
  Logging: `debugLog('holds', 'held', { repo, pr, reason })`, `debugLog('holds', 'released', { repo, pr })`,
  `console.warn` when the PR file list cannot be read (auto-merge stays fail-closed).

- [ ] Task 14: Re-run QA whenever a passed PR's head moves. (depends on 13) (#12)
  In `server/mergeGate.ts`: add pure `retestPatch(rec)` (`status: 'queued'`, `round + 1`, `retests + 1`,
  `passedSha: null`, `mergeNote: null`, `pendingSince: null`) and port `movedSincePass()` from mysteryreloaded
  d67a009 (selects passed records whose PR head differs from `passedSha`).
  In `server/swarm.ts`: `advanceMerge` uses `retestPatch` for `requeue`, and the `update-branch` step requeues QA
  instead of setting `passedSha` to the untested merged head (upstream lines ~1620-1626); `syncRepo` requeues
  `movedSincePass` records on floors with auto-merge off too; the manager's `mergePull` passes `rec.passedSha` as the
  head to match when a passed QA record exists, and on a head mismatch requeues QA and throws
  `HttpError(409, 'New commits arrived after QA passed; QA is testing them again')`. PRs without a QA record merge as
  before. Tests in `server/mergeGate.test.ts` for both helpers; a swarm-level test for the update-branch and
  manual-merge paths using the demo backend if feasible.
  Logging: `debugLog('merge', 'head moved since QA pass, requeued', { repo, pr, passedSha, headSha, path })` for each of
  the three paths.

- [ ] Task 15: The manager can request changes on a QA-passed PR. (depends on 13, 14) (#13)
  Apply the portable part of droidsembly 4ac28f4:
  `git show 4ac28f4 -- server shared/types.ts client/src/qaCard.ts client/src/qaCard.test.ts | git apply --3way`
  (server/fixOutcome, prOwnership, qaOutcome, qaPrompt, restartRecovery, sendBack with tests, swarm.ts). Resolve
  `client/src/qaCard.ts` so the `qaCardNote` Pick keeps both `heldFor` and `managerRequested`.
  Hand-port the client: a "Request changes" action with a required note in the shared card actions
  (`useCardActions` / KanbanView), so the 3D Kanban and the dashboard reviewer panel both get it, plain English
  strings (no fork i18n); the `managerRequested` badge in `client/src/ui/AppViewer.tsx`; `managerRequested` in
  `shared/journal.ts` `compactQa`; the "Manager refinements after QA passed" section in `docs/agents.md`.
  Validate the request body (note: 1-4000 chars) with zod at the route (D-004, validation convention above). Drop `shared/i18n.ts` and
  `docs/FORK_CHANGELOG.md`.
  Then boot the demo office and screenshot: a held PR card, Request changes on a passed PR and its retest round.
  Logging: `debugLog('refine', 'manager requested changes', { repo, pr, requestedSha, chars })`; `console.warn` when a
  request targets a PR that is not passed.
