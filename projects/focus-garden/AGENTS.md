# AGENTS.md

## Project Summary

Focus Garden is a small external Vite/React project for testing UAV workflows
from outside the UAV repository. It is one fixture inside the UAV benchmark
suite.

## Agent Workflow

- Use the project-local UAV skill in `.agents/skills/uav`.
- Start work by checking `uav status` and relevant notes.
- Record useful findings, decisions, and validation results with
  `uav remember`.
- Keep this repo independent from UAV internals so it behaves like a real
  downstream project.

## Validation

Run these before finishing changes:

1. `pnpm run typecheck`
2. `pnpm run build`
