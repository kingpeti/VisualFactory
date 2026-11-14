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
