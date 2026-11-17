# The VisualFactory fork

VisualFactory (`kingpeti/VisualFactory`) is a fork of [cubefarm](https://github.com/leonvanzyl/cubefarm). It keeps
cubefarm's office and adds a 2D dashboard, fixes and features from other cubefarm forks, and later a workflow layer
(specs, reviews, approvals) on top of the issue -> build -> QA -> fix -> merge loop.

The research behind it is in `.ai-factory/research/upstream-fork-audit/README.md`; the milestones (M0-M7) are in its
section 7.

## Decisions

The owner's decisions (OpenCode 2.x only, 2D dashboard next to the 3D office, local first, zod on REST routes,
enforced agent rules, the development loop as one workflow stage) are in `.ai-factory/ARCHITECTURE.md`, Decisions.
They override upstream conventions where the two differ.

## Tracking

Every task and feature is a GitHub issue on the [VisualFactory board](https://github.com/users/kingpeti/projects/4),
with milestones M0-M7 and `Depends on #N` lines that a cubefarm office follows. Every issue starts with
`swarm:skip`, so an office connected to this repo picks nothing up by itself: remove the label from the issues an
office should work on. The M0+M1 tasks are issues #1-#13, the M2 platform rules #14-#22, ADR-006 and ADR-008 #23 and
#24, and the RFC backlog (`WF-001`..`WF-030`) plus the M5-M7 features #25-#61.

## Import ledger

One row per feature taken from another fork. Cherry-picks keep the source commit in their message (`-x`).

| Feature | Source | Commits | Here | Adaptations | Tests |
|---------|--------|---------|------|-------------|-------|
| 2D dashboard | [supermini/AI-2DFarm](https://github.com/supermini/AI-2DFarm) | merge of 78a4d42 (51 commits), cherry-pick 951c3af | #63 | the 3D office stays the desktop default (`pocket/mode.ts`); read-only grid terminals (`ui/termSend.ts`); copyright line in LICENSE | the fork's own, `mode.test.ts`, `termSend.test.ts`, `noWorldImports.test.ts` |
| Answer the live trust menu | [konstantinknappe-hash/cubefarm](https://github.com/konstantinknappe-hash/cubefarm) | cherry-picks 79caf97, 68a8ac6 | #64 | `debugLog('trust')` when a key is pressed | the fork's `clis.test.ts` cases |
| Save a desk's work before reuse | [mysteryreloaded/software-development-factory](https://github.com/mysteryreloaded/software-development-factory) | cherry-pick 4d56b71 | #64 | preview desks (`swarm-preview*`) are not saved; uncommitted files over 25 MB left out and named; `leftovers` pruned to 30 days and 500 MB; the squash-merge tests skip on git < 2.38 | the fork's `workspace.test.ts`, plus preview, big file, pruning (`leftoversToPrune`) |
| Touch-scroll a live terminal | [mysteryreloaded/software-development-factory](https://github.com/mysteryreloaded/software-development-factory) | cherry-pick 2d5b0ea, the `LiveTerminal.tsx` hunk of 37d6148 | #64 | read-only tiles pan sideways (`touch-action: pan-x`); the e2e spec runs on the dashboard and reads scrolling from the typed tokens on screen | `termTouch.test.ts`, `e2e/terminalTouch.spec.ts` (plus a read-only tile test) |
| 60,000-character messages | [mysteryreloaded/software-development-factory](https://github.com/mysteryreloaded/software-development-factory) | cherry-pick -n 4286dec | #64 | the console's CEO input is in `consoleSections.tsx`; no `useTouch`; zod on both message routes | `shared/message.test.ts`, `server/managerMessages.test.ts`, `e2e/longMessage.spec.ts` |

## Syncing with upstream

The `upstream` remote is local git config, so add it once per clone:

```bash
git remote add upstream https://github.com/leonvanzyl/cubefarm.git
```

To take upstream's new work:

1. `git fetch upstream`
2. Branch from `main`: `git switch -c chore/sync-upstream-<yyyy-mm-dd> main`
3. `git merge upstream/main`, then resolve conflicts. Expect them in `server/swarm.ts`, `server/cliRunner.ts`,
   `server/clis.ts`, `client/src/ui/ManagerConsole.tsx` and `client/src/ui/KanbanView.tsx`.
4. `npm run typecheck`, `npm test` and `npm run build` must pass.
5. Open a PR to `main` that lists the upstream commits taken and every conflict resolved by hand.

Fork-only behavior goes into new files with narrow hooks into the files above, so upstream merges stay small.
