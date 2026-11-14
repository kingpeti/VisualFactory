# Upstream fork audit and import plan (2026-11-14)

Scope: all 78 forks of [leonvanzyl/cubefarm](https://github.com/leonvanzyl/cubefarm) compared with upstream `main`
157efde (2026-10-22), which is also VisualFactory's `main`. Goal: find work worth importing on the way to an all-in-one
visual AI/agentic software factory, and map it onto the owner's CubeFarm Next RFC.

Data in this folder:

| File | Content |
|------|---------|
| `fork-compare.tsv` | every fork's default branch: status, ahead, behind vs upstream main |
| `features.json` | 254 features recorded across the 27 forks that differ from upstream, with commits, quality, value, effort, conflict risk and rationale |
| `verification.json` | adversarial re-check of 31 quick-win candidates (trial cherry-picks on 157efde, exact import recipes) plus a completeness critique (overlaps, RFC mapping, shortlist problems) |
| `rfc-digest.json` | structured digest of the RFC (67 requirements, WF-001..030, 16 ADRs) and 36 baseline claims checked against the code |

Method: partial clones, no fork code was ever run (git and reading only). "Already upstream" was checked by content,
because upstream squash-merges. Trial cherry-picks ran in scratch worktrees at 157efde. Baseline of this repo on
Node 24.22.2: `npm ci`, `typecheck` pass, Vitest 221 files / 2451 tests pass. (The default shell here is Node 20 via
fnm; the project needs Node >= 22.)

## 1. Which forks matter

| Fork | vs upstream | What it is | Worth |
|------|-------------|-----------|-------|
| mgscox/cubefarm | +213 / -135 | Governance-heavy factory: Idea -> PRD -> 2 reviews -> approval -> held issue publication, QA/security review, merge queue, run history, skills/playbooks, SSH fleet, manager MCP. Still role-based. | Richest idea source; pure modules as RFC seeds, glue not portable |
| rosariomoscato/droidsembly | +170 / 0 | Active product fork (npm `droidsembly`): multi-provider usage telemetry and quota gates, OpenCode V2, read-only analysis task, manager "request changes" after QA, i18n EN/IT | Telemetry and analysis-task designs; one small cherry-pick |
| mysteryreloaded/software-development-factory | +109 / -8 | Self-hosting office: CEO code-review merge gate, per-CLI session limits, Claude-only brakes, custom OpenAI-compatible providers, desk-work preservation | Several clean small fixes, reviewer-gate design |
| TubadoG/cubefarm | +21 / -8 | Governed office: merge holds, routine-only auto-merge, decision briefs, decision room, floor lead | Merge holds now; decision room as approval-inbox UI |
| localloop-pro/cubefarm | +41 / -134 | Safety epic: request boundary (CSRF/rebinding), fail-closed merge gate, desk preservation, scheduler pause | Security boundary and merge-gate tests |
| supermini/AI-2DFarm | +65 / 0 | 2D role-based dashboard (CEO, Developer, Reviewer, Metrics); server untouched | Whole-unit import at 78a4d42 if a 2D view is wanted |
| iAreEddie/cubefarm | +8 / -8 (+ branches) | Cost telemetry with provenance, floor budgets, QA pairing across CLIs, live playtest view, upstream drift check | Telemetry schema, pairing idea |
| konstantinknappe-hash/cubefarm | +37 on branch / -8 | German i18n, model catalog, Claude->Codex failover, trust-prompt fixes, fork ledger | Trust-prompt fix now; fork-ledger policy |
| francovp/cubefarm | +4 / 0 | CEO on any CLI (upstream open PR #299), Copilot CLI | CEO-any-CLI base (with one fix) |
| Others | | nanobpm (ACP runtime, BPMN view), Saredigital (non-GitHub company model), executiveusa (remote transport), Calel33 (Cloudflare tunnel), danhorntx / ncpayne (upstream open PRs #316 #317 #319 #314), Paul-Osborn (merge-gate findings) | Ideas, schema input |
| Nothing unique | | 51 forks with no commits of their own; brainit-consulting, aiagentsworld, zeeneddie, arkaccess, bashettyaaditya hold only copies of upstream PRs | None |

## 2. Verified quick wins (wave 1)

Each was trial-applied on 157efde by a skeptic whose job was to refute it.

| # | Feature (fork) | Import | Notes |
|---|----------------|--------|-------|
| 1 | Merge holds: floor hold paths + `swarm:hold` label (TubadoG) | `cherry-pick 32b3ed8 2698c4c` (clean, 16 files, tested) | Defaults unchanged; fail-closed if the file list cannot be read |
| 2 | Trust-prompt fix: answer the live menu (konstantinknappe) | `cherry-pick 79caf97 68a8ac6` (clean) | Follow up with upstream closed PR #286 cases once the CEO can switch CLI |
| 3 | Save desk work before reuse (mysteryreloaded) | `cherry-pick 4d56b71` (clean) | Add pruning/size cap for `<SWARM_HOME>/leftovers` |
| 4 | Touch-scroll the live terminal on phones (mysteryreloaded) | `cherry-pick 2d5b0ea` + LiveTerminal hunk of 37d6148 only | 37d6148 also adds a stray demo-state file |
| 5 | Manager messages up to 60k chars, 400 instead of silent truncation (mysteryreloaded) | `cherry-pick -n 4286dec`, keep upstream imports in MessageBox.tsx | Trivial conflict |
| 6 | CEO on Claude Code, Codex or OpenCode, read-only on each (francovp, PR #299) | `cherry-pick 625e1df 7685466` (clean) | Fix before landing: `effectiveModel` rejects `/` model ids for Codex, which breaks upstream #311 local models |
| 7 | Manager "Request changes" on a QA-passed PR (droidsembly) | server part of 4ac28f4 applies clean; client needs plain strings (fork i18n) | Becomes the `changes_requested` route of the approval model later |
| 8 | Re-QA whenever the PR head moves (localloop + mysteryreloaded + Paul-Osborn finding #1) | hand-port one pure `retestPatch` rule for update-branch, hand-merge and auto-merge paths | Today a passed PR can be merged on an untested SHA after update-branch or new commits |

Unverified but recommended by the critic (verify before picking): per-agent model override on kept-alive CLIs
(mgscox, upstream bug #322), `## Blocked by` heading parsing (mysteryreloaded), Claude-only usage brakes plus per-CLI
session limits as one unit (mysteryreloaded).

## 3. Rejected or deferred after verification

| Feature | Why |
|---------|-----|
| Codex/OpenCode CEO variants (telemoveisvelhos, konstantinknappe) | Subsets of #6 that leave a non-Claude CEO with a shell (`--dangerously-bypass-approvals-and-sandbox`, `bash: allow`) |
| Auto-ready QA-passed drafts (konstantinknappe) | Auto-merges PRs agents marked unfinished; contradicts the agent contract |
| Routine-only auto-merge (TubadoG) | Flips defaults ON for every floor and bundles fork-only email/digest code; port later as a default-off condition (WF-018) |
| Fail-closed merge gate (localloop) | Clean pick but a behavior change: never merges repos without CI, removes the manual override. Design it into WF-015 with an explicit `checks: none` policy and audited override |
| Request boundary / WS origin (localloop, mgscox) | Needed, but as written breaks `--host`, Tailscale/pocket access; neither covers the #310 preview gateway (agent pages are same-origin). Build one middleware (security foundation below) |
| Copilot CLI (francovp) | Flags and hook formats unverifiable, invented model ids, no cost parser; wait for a per-CLI capability matrix |
| OpenCode 2 support (mysteryreloaded, droidsembly) | Breaks OpenCode 1.x, which upstream #311 and #6 assume; needs a version decision |
| Floor budgets (iAreEddie) | Counts only Claude-reported cost and crashes time-lapse replay of older journal days; build on telemetry |
| Kanban floor flip, compact chat view | Hard-coded arrow keys (against keymap.ts), flips the terminal default to chat |
| Floor lead, decision clock (TubadoG) | New agent role and a paid standing session per floor; decision clock auto-merges held auth/migration PRs after 48 h |
| Manager MCP gateway (mgscox) | One bearer token with merge and approval power lets an external agent approve its own work (FR-025) |

## 4. Overlaps that need one choice

- Approval inbox: upstream already has `HireRequestView` + `/api/requests/:id/approve|reject` + PocketApprovals.
  Generalize it into one hash-bound `ApprovalRequest`; TubadoG's decision room becomes its UI; merge holds, manager
  refinement, spec approvals post into it.
- Cost telemetry: three incompatible stores (droidsembly, iAreEddie, mgscox). Use iAreEddie's `UsageRecord` with
  provenance (reported / estimated / unknown, NFR-010) inside mgscox's per-attempt run-history envelope, in a rotated
  store, never `state.json`.
- Work-item intake: faustosip's idea wall state machine as `WorkItem` intake; mgscox's pure `ideaReview` /
  `issuePlan` / `publication` modules as plan/spec/review stage logic.
- Non-PR agent task: droidsembly's analysis task shape as the `ai.task` executor (WF-008), Saredigital's stored report
  as the artifact handoff. Do not add it as a new swarm task type first.
- Pause switch: one persisted pause (localloop's test as the spec), not three.
- Desk preservation: save-desk (#3) first, then only localloop's recovery refs with pruning.

## 5. RFC mapping (fork work as seeds)

| RFC item | Seeds |
|----------|-------|
| WF-001 baseline tests | Paul-Osborn merge-gate findings, localloop crash matrix |
| WF-002 schemas | TubadoG decision brief (Decision), mgscox stable-ID findings (Finding), iAreEddie UsageRecord, Saredigital non-GitHub company model (Project) |
| WF-004 store | mgscox run history, localloop issue-filing idempotency log, TubadoG undo log |
| WF-005 engine | mgscox 2-reviewer / max-3-round loop, localloop typed refusals |
| WF-006 executors | francovp per-CLI read-only enforcement, TubadoG scoped tool set |
| WF-007 scheduler | localloop pause and slot reservation, mgscox issue claims, mysteryreloaded per-CLI limits |
| WF-008 / WF-009 | droidsembly analysis task, Saredigital versioned deliverables |
| WF-010 / WF-011 | mgscox PRD + reviews, iAreEddie QA pairing (different CLI, then model) |
| WF-012 approvals | upstream HireRequest flow + TubadoG decision room, alerts, digest + droidsembly request-changes |
| WF-013 routing/cost | iAreEddie telemetry, konstantinknappe model catalog, mgscox model-override fix, mysteryreloaded custom providers |
| WF-014 bridge | mgscox held publication, native blockedBy, `## Blocked by` parsing |
| WF-015 merge gate | localloop gate, re-QA rule (#8), merge holds (#1) as typed refusal reasons, mgscox merge queue |
| WF-016 reviewers | mysteryreloaded CEO code-review gate, mgscox security review + playbooks |
| WF-020 UI | supermini dashboard panels, TubadoG decision room, nanobpm floors-as-runs / whiteboard-as-graph |

## 6. RFC gaps found by checking it against the code

- 8 of 36 baseline claims are only partially right. Notably: upstream already merges with `--match-head-commit`; the
  real hole is the manual merge route, which bypasses `mergeGate` entirely (`server/swarm.ts:1921-1924`).
- A human-approval primitive already exists (HireRequestView, `decide()`, PocketApprovals); the RFC builds a new one.
- Existing audit primitives (`server/journal.ts`, `server/ledger.ts`) are not reused.
- No Origin/CSRF checks on REST or websocket upgrades, while `/ws/term` types into unsandboxed CLIs.
- "Read-only" linked repos are passed to agents as writable `--add-dir` paths.
- Non-code stages need a desk and a full coding CLI; no cheap direct-model or local-model reviewer path.
- No 3D/visual design for runs, stages, artifacts and approvals; no notifier mapping for approvals.
- No fork-maintenance strategy (this fork has no `upstream` remote yet).
- The RFC contradicts `CLAUDE.md` twice: zod on every mutating route vs hand validation, and enforced reviewer
  read-only vs "no hooks, permission rules or sandboxes". These are the owner's calls, not to be averaged.
- The RFC's own sample YAML fails its own validation rules; stage and outcome vocabularies differ between sections.

## 7. Milestones (after the owner's decisions)

Decisions D-001..D-005 and ADR-007 are recorded in `.ai-factory/ARCHITECTURE.md`. They change the order: the 2D
dashboard is wanted (D-002) and supermini fast-forwards from 157efde only while nothing else has landed, so it goes
first; CEO-on-any-CLI waits for the OpenCode 2 migration (D-001) because francovp's version assumes OpenCode 1.

- M0 Fork hygiene: `upstream` remote, fork change ledger and sync procedure (konstantinknappe policy), `.swarm-home`
  in `.gitignore`, the AIF setup committed. Optional drift check (iAreEddie), off by default.
- M1 Visual base and quick wins: supermini 2D dashboard (fast-forward to 78a4d42, then keep the 3D office reachable
  and the desktop default decided, fix the bundle regression, read-only grid terminals, LICENSE copyright line); then
  wave 1 items 1-5, 7 and 8 from section 2, rebased onto the dashboard.
- M2 Platform rules: request-boundary middleware for HTTP and websocket upgrades (`--host`, Tailscale, preview
  gateway aware), zod on REST routes (D-004), per-CLI enforcement with hooks, permission rules and sandboxes (D-005),
  OpenCode 2 only (D-001), then CEO on any CLI (francovp, adapted to OpenCode 2).
- M3 RFC core MVP: WF-001 -> WF-002 -> WF-003 / WF-004 -> WF-005 -> WF-006 -> WF-008 / WF-009 -> WF-010..012, seeded
  by section 5; ADR-006 and ADR-008 decided first; `cubefarm.development` as one atomic stage (ADR-007).
- M4 Bridge, merge and cost: WF-014, WF-015 (one pure gate: re-QA rule, holds, routine-only as a default-off
  condition, checks policy, audited override; specialist verdicts as refusal reasons inside the atomic stage),
  WF-016 reviewers, WF-013 telemetry, per-CLI limits and model routing.
- M5 Visual workflow layer: workflow and artifact panels in 2D and 3D (WF-020), one approval inbox built on the
  existing HireRequest flow, runs shown in the 3D office.
- M6 Breadth: model endpoints registry (custom OpenAI-compatible + local), SSH machine provider for on-prem servers,
  package-manager detection (pnpm/yarn/bun), multi-repo initiatives, non-GitHub projects, GitLab/Jira adapters.
- M7 Team/hosted mode (D-003, only after M0-M6): authentication, RBAC, remote workers.

## 8. M2 research (2026-11-14, `m2-research.json`, each area re-checked by a skeptic)

- OpenCode 2 (D-001): latest is 2.3.0 (`@opencode/cli`, anomalyco/opencode); the V1 line still ships as
  `opencode-ai` and also installs `opencode`. Upstream breaks on V2 in three places: single-file plugin (V2 needs a
  folder), `--model` on the TUI (gone), shared background service (needs `--standalone` per session). Hand-port a
  V2-only integration with droidsembly 8adf85b/fa4e3fa/b10b23b as the design reference (native V2 config,
  `--standalone`, office-assigned `ses_` ids, plugin options, `session.execution.*` events). Order: version floor
  (at least 2.0.19, set to the version tested by hand) -> V2 launch and plugin -> #311 local models as V2 providers
  -> CEO on any CLI part 1 (francovp, Claude and Codex, plus the `effectiveModel` fix) -> CEO on OpenCode 2 -> D-005
  rules for OpenCode. Nothing was run against a real OpenCode 2; one manual run on Windows before merging.
- Enforcement (D-005): layered. One pure office-rules policy, one adapter per CLI (Claude Code PreToolUse deny and
  `permissions.deny` in `--settings`; Codex hook decisions and read-only sandbox; OpenCode 2 ordered `permissions`
  plus a plugin evaluate hook), a per-worktree pre-push git guard and credential withholding for every CLI.
  Prerequisite: bump the Agent SDK, whose bundled Claude Code (2.1.283) lacks fail-closed hooks (2.1.295+) and
  write blocking outside the working dir (2.1.314+). Not a security boundary: agents run as the manager's OS user;
  the Claude Code sandbox does not exist on native Windows.
- zod (D-004): `server/index.ts:199-203` already has a zod `parse` helper; move it to `server/restInput.ts`, schemas
  stay server-side (zod in `shared/` would ship to phones), keep user-facing limits in Swarm. Batches: merge method,
  agent and team routes, settings and setup, repo/folder/issue routes, the rest when touched.
- ADR-006 proposal: append-only JSONL per run under `<SWARM_HOME>/workflows/runs/`, content-hashed artifact files,
  fsync before external side effects, no SQLite (`node:sqlite` would need Node >= 24.15 to run without a warning).
- ADR-008 proposal: local manager identity via device pairing (a credential per paired browser/phone), the request
  boundary for HTTP and websockets, the preview gateway on its own origin, approvals bound to the artifact hash /
  PR head SHA with compare-and-set, manual merge bound to the SHA the manager saw.
