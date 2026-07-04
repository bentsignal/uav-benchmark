import { useMemo, useState } from "react";

type DemoItem = {
  label: string;
  status: "ready" | "next" | "later";
};

const demoItems: DemoItem[] = [
  { label: "Track project notes from an external repo", status: "ready" },
  { label: "Coordinate parallel worktree tasks", status: "next" },
  { label: "Record a feature request back to UAV", status: "later" },
];

const commands = [
  "uav status",
  "uav notes",
  'uav remember "Test app smoke test passed"',
  "uav task list",
];

function App() {
  const [checks, setChecks] = useState(1);
  const [selectedCommand, setSelectedCommand] = useState(commands[0]);

  const progress = useMemo(
    () => Math.round((checks / demoItems.length) * 100),
    [checks],
  );

  return (
    <main className="shell">
      <section className="hero" aria-labelledby="page-title">
        <div className="heroCopy">
          <p className="eyebrow">External UAV proving ground</p>
            <h1 id="page-title">Focus Garden</h1>
          <p className="lede">
            A small React workspace for exercising UAV as if this were any
            other downstream project.
          </p>
        </div>
        <div className="signalPanel" aria-label="Demo readiness">
          <span className="signalLabel">Smoke readiness</span>
          <strong>{progress}%</strong>
          <div className="meter" aria-hidden="true">
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>
      </section>

      <section className="board" aria-label="UAV test dashboard">
        <div className="panel checklist">
          <div>
            <p className="sectionLabel">Demo queue</p>
            <h2>Things worth trying next</h2>
          </div>
          <ul>
            {demoItems.map((item, index) => (
              <li key={item.label}>
                <button
                  aria-pressed={index < checks}
                  className={index < checks ? "checked" : ""}
                  onClick={() => setChecks(index + 1)}
                  type="button"
                >
                  <span />
                  {item.label}
                </button>
                <small>{item.status}</small>
              </li>
            ))}
          </ul>
        </div>

        <div className="panel commandPanel">
          <div>
            <p className="sectionLabel">Useful command</p>
            <h2>{selectedCommand}</h2>
          </div>
          <div className="commandGrid">
            {commands.map((command) => (
              <button
                className={command === selectedCommand ? "active" : ""}
                key={command}
                onClick={() => setSelectedCommand(command)}
                type="button"
              >
                {command}
              </button>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;
