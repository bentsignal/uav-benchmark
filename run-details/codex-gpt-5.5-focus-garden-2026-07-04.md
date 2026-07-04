# Codex CLI / GPT-5.5 - Focus Garden

Date: 2026-07-04
Fixture: `projects/focus-garden`
Run ID: `codex-gpt-5.5-focus-garden-2026-07-04`

## Summary

Codex CLI running GPT-5.5 successfully completed the first UAV benchmark trial.
It installed the UAV skill as a downstream agent, created the canonical Focus
Garden backlog, implemented all eight feature tasks, updated UAV task statuses,
recorded project memory, and left no `todo`, `in_progress`, or `blocked` UAV
tasks.

The implementation was good enough to pass after one evaluator fix: the agent
left the HTML document title as `uav-test-app`; the evaluator changed it to
`Focus Garden`.

## Scores

| Category | Score | Notes |
| --- | ---: | --- |
| UAV setup | 9/10 | Installed `.agents/skills/uav/SKILL.md` from `uav skill` and verified `uav status`, `uav notes`, `uav task list`, and `uav remember`. One noisy `remember` note was caused by shell backtick expansion, then corrected with a clean note. |
| Backlog creation | 10/10 | Created all 8 feature tasks with useful bodies, priorities, and tags. Did not implement during the backlog phase. |
| UAV orchestration | 7/10 | Read `uav workflow`, used `uav status`, discovered tasks with `uav task list`, marked tasks `in_progress` and `done`, and recorded validation. It did not spin up sub-agents, despite the prompt allowing that when supported. |
| Feature implementation | 8/10 | Implemented all requested features in a cohesive React app. One minor stale-title issue needed evaluator correction. |
| Validation | 10/10 | `pnpm run typecheck` and `pnpm run build` passed before and after evaluator QA. |

Overall: pass.

## Task Results

| Task | Result | QA Notes |
| --- | --- | --- |
| Create task dashboard columns for Today, Upcoming, and Done | Pass | Browser QA confirmed three columns, correct seeded counts, task movement through status edit, and no desktop overflow. |
| Add focus session timer with start, pause, reset, and completed-session count | Pass | Browser QA confirmed start, pause, reset states and timer countdown. Completed-session increment was implemented for full-session completion but not waited through in QA because the session length is 25 minutes. |
| Add localStorage persistence for tasks and session stats | Pass | Browser QA edited title, notes, status, and priority, then reloaded. The UI preserved the changed task and updated completion rate. |
| Add quick filters for priority and status | Pass | Browser QA confirmed the Urgent filter reduced visible tasks to 1 and reset restored 4 visible tasks. |
| Add editable task detail panel with title, notes, status, and priority | Pass | Browser QA confirmed title, notes, status, and priority edits update the board and survive reload. |
| Add lightweight seed data for a first-run experience | Pass | Initial browser QA confirmed 4 seeded tasks across Today, Upcoming, and Done with mixed priorities. |
| Add progress summary for completion rate and focus minutes | Pass | Browser QA confirmed completion and visible-task summaries update after edits and filters. |
| Improve responsive styling for narrow screens | Pass | Mobile viewport QA at 390x844 confirmed stacked layout and no horizontal overflow. |

## QA Performed

- Ran `pnpm run typecheck`.
- Ran `pnpm run build`.
- Opened the app in the in-app browser at `http://localhost:5173/`.
- Inspected desktop UI structure and overflow.
- Exercised timer controls: start, pause, reset.
- Exercised priority filters and reset behavior.
- Edited a task title, notes, status, and priority.
- Reloaded the page and confirmed edited task state persisted.
- Tested mobile viewport at 390x844 and confirmed no horizontal overflow.
- Verified UAV task table:
  - `todo`: 0
  - `in_progress`: 0
  - `blocked`: 0
  - `done`: 8

## Code Quality Notes

The implementation is intentionally compact and keeps the fixture dependency
free. Most logic lives in `src/App.tsx`, which is acceptable for this first
small fixture but should not become the pattern for larger benchmark apps.

The app uses a versioned localStorage key, safe JSON parsing, typed task/status
models, derived filtering, and responsive CSS. The visual style is coherent and
usable on desktop and mobile.

## Agent Behavior Notes

The agent behaved well as a UAV user:

- It read the project-local UAV skill.
- It ran `uav workflow` and `uav status`.
- It noticed that `uav status` did not show queued todo tasks and ran
  `uav task list`.
- It updated task statuses during and after work.
- It remembered the validation outcome.
- It stopped only after all open UAV tasks were complete.

The main benchmark gap is that it did not use sub-agents. The prompt said to use
sub-agents if the harness supported them, which made delegation optional. Future
multi-agent benchmark runs should require delegation explicitly if that behavior
is being measured.

## UAV Improvement Findings

These were also recorded back in UAV as project requests:

- Nested fixtures currently resolve to the parent git repository identity. That
  is technically correct but makes it hard to compare multiple fixture projects
  inside one benchmark repo.
- `uav status` can show no active or blocked tasks while todo work exists.
  Agents may incorrectly infer there is no work unless they know to run
  `uav task list`.
- Shell-sensitive text can pollute `uav remember` notes. Stdin/file input or
  stronger examples could reduce accidental command substitution.
