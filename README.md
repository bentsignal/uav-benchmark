# UAV Benchmark

UAV Benchmark is a collection of downstream project fixtures for evaluating how
well coding agents discover and use UAV for durable task orchestration.

The benchmark intentionally keeps fixtures outside the UAV repository so test
subjects must rely on the installed `uav` command, `uav help`, `uav workflow`,
and project-local skill files.

## Projects

- `projects/focus-garden`: a small Vite/React app for planning calm work
  sessions. This is the canonical first fixture.

## Trial Shape

1. Ask an external agent to set up UAV inside a fixture.
2. Ask it to create the benchmark backlog as UAV tasks.
3. Verify UAV state independently.
4. Start a fresh external agent and ask it to work every open UAV task to
   completion.
5. Evaluate both the agent behavior and the UAV workflow affordances.
