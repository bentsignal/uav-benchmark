# UAV Benchmark Results

| Run | Agent | Model | Fixture | Task completion | UAV orchestration | Validation | Result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `codex-gpt-5.5-focus-garden-2026-07-04` | Codex CLI | GPT-5.5 | `projects/focus-garden` | 8/8 | 7/10 | Pass | Pass with one evaluator fix |

## Score Notes

- Task completion counts benchmark feature tasks that were implemented and
  confirmed against the UI and UAV task table.
- UAV orchestration scores discovery and use of `uav workflow`, `uav status`,
  `uav task list`, task status updates, and durable notes. This run lost points
  because it did not create sub-agents despite being prompted to use them if the
  harness supported delegation.
- Validation reflects the fixture checks: `pnpm run typecheck` and
  `pnpm run build`.

Detailed notes live in `run-details/`.
