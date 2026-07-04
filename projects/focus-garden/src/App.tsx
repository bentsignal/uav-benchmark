import { useEffect, useMemo, useRef, useState } from "react";

type TaskStatus = "today" | "upcoming" | "done";
type TaskPriority = "low" | "normal" | "high" | "urgent";

type GardenTask = {
  id: string;
  title: string;
  notes: string;
  status: TaskStatus;
  priority: TaskPriority;
  plannedFor: "today" | "later";
};

type SessionStats = {
  completedSessions: number;
  totalFocusMinutes: number;
};

type SavedState = {
  version: 1;
  tasks: GardenTask[];
  stats: SessionStats;
};

type TimerMode = "idle" | "running" | "paused" | "complete";

const STORAGE_KEY = "focus-garden:v1";
const SESSION_MINUTES = 25;
const SESSION_SECONDS = SESSION_MINUTES * 60;

const statusLabels: Record<TaskStatus, string> = {
  today: "Today",
  upcoming: "Upcoming",
  done: "Done",
};

const priorityLabels: Record<TaskPriority, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
};

const priorityOrder: TaskPriority[] = ["urgent", "high", "normal", "low"];
const taskStatuses: TaskStatus[] = ["today", "upcoming", "done"];

const seedTasks: GardenTask[] = [
  {
    id: "seed-plan-beds",
    title: "Plan today's focus beds",
    notes: "Pick the three outcomes that will make the day feel complete.",
    status: "today",
    priority: "urgent",
    plannedFor: "today",
  },
  {
    id: "seed-water",
    title: "Water one deep work block",
    notes: "Run a full focus session before checking incoming messages.",
    status: "today",
    priority: "high",
    plannedFor: "today",
  },
  {
    id: "seed-prune",
    title: "Prune the backlog",
    notes: "Move stale work out of today so the board stays honest.",
    status: "upcoming",
    priority: "normal",
    plannedFor: "later",
  },
  {
    id: "seed-harvest",
    title: "Harvest yesterday's notes",
    notes: "Capture decisions that should survive the browser tab.",
    status: "done",
    priority: "low",
    plannedFor: "today",
  },
];

const defaultStats: SessionStats = {
  completedSessions: 0,
  totalFocusMinutes: 0,
};

function isTaskStatus(value: unknown): value is TaskStatus {
  return typeof value === "string" && taskStatuses.includes(value as TaskStatus);
}

function isTaskPriority(value: unknown): value is TaskPriority {
  return (
    typeof value === "string" &&
    priorityOrder.includes(value as TaskPriority)
  );
}

function normalizeTasks(value: unknown): GardenTask[] {
  if (!Array.isArray(value)) {
    return seedTasks;
  }

  return value.flatMap((item, index) => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const record = item as Record<string, unknown>;
    const title = typeof record.title === "string" ? record.title.trim() : "";

    if (!title || !isTaskStatus(record.status)) {
      return [];
    }

    const priority = isTaskPriority(record.priority) ? record.priority : "normal";
    const plannedFor = record.plannedFor === "later" ? "later" : "today";

    return {
      id:
        typeof record.id === "string" && record.id
          ? record.id
          : `restored-${index}`,
      title,
      notes: typeof record.notes === "string" ? record.notes : "",
      status: record.status,
      priority,
      plannedFor,
    };
  });
}

function normalizeStats(value: unknown): SessionStats {
  if (!value || typeof value !== "object") {
    return defaultStats;
  }

  const record = value as Record<string, unknown>;
  const completedSessions =
    typeof record.completedSessions === "number" &&
    Number.isFinite(record.completedSessions)
      ? Math.max(0, Math.floor(record.completedSessions))
      : 0;
  const totalFocusMinutes =
    typeof record.totalFocusMinutes === "number" &&
    Number.isFinite(record.totalFocusMinutes)
      ? Math.max(0, Math.floor(record.totalFocusMinutes))
      : 0;

  return { completedSessions, totalFocusMinutes };
}

function loadSavedState(): SavedState {
  if (typeof window === "undefined") {
    return { version: 1, tasks: seedTasks, stats: defaultStats };
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return { version: 1, tasks: seedTasks, stats: defaultStats };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<SavedState>;

    if (parsed.version !== 1) {
      return { version: 1, tasks: seedTasks, stats: defaultStats };
    }

    return {
      version: 1,
      tasks: normalizeTasks(parsed.tasks),
      stats: normalizeStats(parsed.stats),
    };
  } catch {
    return { version: 1, tasks: seedTasks, stats: defaultStats };
  }
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");

  return `${minutes}:${seconds}`;
}

function App() {
  const savedState = useMemo(loadSavedState, []);
  const [tasks, setTasks] = useState<GardenTask[]>(savedState.tasks);
  const [stats, setStats] = useState<SessionStats>(savedState.stats);
  const [selectedTaskId, setSelectedTaskId] = useState(
    savedState.tasks[0]?.id ?? "",
  );
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">(
    "all",
  );
  const [remainingSeconds, setRemainingSeconds] = useState(SESSION_SECONDS);
  const [timerMode, setTimerMode] = useState<TimerMode>("idle");
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    const stateToSave: SavedState = { version: 1, tasks, stats };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  }, [stats, tasks]);

  useEffect(() => {
    if (timerMode !== "running") {
      return undefined;
    }

    intervalRef.current = window.setInterval(() => {
      setRemainingSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(intervalRef.current ?? undefined);
          intervalRef.current = null;
          setTimerMode("complete");
          setStats((currentStats) => ({
            completedSessions: currentStats.completedSessions + 1,
            totalFocusMinutes: currentStats.totalFocusMinutes + SESSION_MINUTES,
          }));
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(intervalRef.current ?? undefined);
      intervalRef.current = null;
    };
  }, [timerMode]);

  useEffect(() => {
    if (!selectedTaskId && tasks[0]) {
      setSelectedTaskId(tasks[0].id);
      return;
    }

    if (selectedTaskId && !tasks.some((task) => task.id === selectedTaskId)) {
      setSelectedTaskId(tasks[0]?.id ?? "");
    }
  }, [selectedTaskId, tasks]);

  const filteredTasks = useMemo(
    () =>
      tasks.filter((task) => {
        const matchesStatus =
          statusFilter === "all" || task.status === statusFilter;
        const matchesPriority =
          priorityFilter === "all" || task.priority === priorityFilter;

        return matchesStatus && matchesPriority;
      }),
    [priorityFilter, statusFilter, tasks],
  );

  const columns = useMemo(
    () =>
      taskStatuses.map((status) => ({
        status,
        tasks: filteredTasks
          .filter((task) => task.status === status)
          .sort(
            (a, b) =>
              priorityOrder.indexOf(a.priority) -
              priorityOrder.indexOf(b.priority),
          ),
      })),
    [filteredTasks],
  );

  const selectedTask = tasks.find((task) => task.id === selectedTaskId);
  const completedTasks = tasks.filter((task) => task.status === "done").length;
  const completionRate =
    tasks.length === 0 ? 0 : Math.round((completedTasks / tasks.length) * 100);
  const timerProgress =
    ((SESSION_SECONDS - remainingSeconds) / SESSION_SECONDS) * 100;

  function updateSelectedTask(updates: Partial<GardenTask>) {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === selectedTaskId ? { ...task, ...updates } : task,
      ),
    );
  }

  function startTimer() {
    if (remainingSeconds === 0) {
      setRemainingSeconds(SESSION_SECONDS);
    }
    setTimerMode("running");
  }

  function pauseTimer() {
    setTimerMode("paused");
  }

  function resetTimer() {
    setTimerMode("idle");
    setRemainingSeconds(SESSION_SECONDS);
  }

  return (
    <main className="shell">
      <section className="hero" aria-labelledby="page-title">
        <div className="heroCopy">
          <p className="eyebrow">Focus Garden</p>
          <h1 id="page-title">Tend today with fewer tabs.</h1>
          <p className="lede">
            A local-first focus board with durable tasks, session rhythm, and a
            compact read on what is actually moving.
          </p>
        </div>

        <section className={`timerCard ${timerMode}`} aria-label="Focus timer">
          <div className="timerTopline">
            <span>{timerMode === "complete" ? "Session complete" : "Focus timer"}</span>
            <strong>{formatTime(remainingSeconds)}</strong>
          </div>
          <div className="timerTrack" aria-hidden="true">
            <span style={{ width: `${timerProgress}%` }} />
          </div>
          <div className="timerControls">
            <button
              aria-label="Start focus timer"
              disabled={timerMode === "running"}
              onClick={startTimer}
              type="button"
            >
              Start
            </button>
            <button
              aria-label="Pause focus timer"
              disabled={timerMode !== "running"}
              onClick={pauseTimer}
              type="button"
            >
              Pause
            </button>
            <button
              aria-label="Reset focus timer"
              onClick={resetTimer}
              type="button"
            >
              Reset
            </button>
          </div>
          <p className="timerState" aria-live="polite">
            {timerMode === "running" && "Running"}
            {timerMode === "paused" && "Paused"}
            {timerMode === "idle" && "Ready"}
            {timerMode === "complete" && "Complete"}
          </p>
        </section>
      </section>

      <section className="summaryStrip" aria-label="Progress summary">
        <div>
          <span>Completion</span>
          <strong>{completionRate}%</strong>
          <small>
            {completedTasks} of {tasks.length} tasks
          </small>
        </div>
        <div>
          <span>Focus minutes</span>
          <strong>{stats.totalFocusMinutes}</strong>
          <small>{stats.completedSessions} completed sessions</small>
        </div>
        <div>
          <span>Visible tasks</span>
          <strong>{filteredTasks.length}</strong>
          <small>from current filters</small>
        </div>
      </section>

      <section className="filters" aria-label="Task filters">
        <div>
          <span>Status</span>
          <button
            className={statusFilter === "all" ? "active" : ""}
            onClick={() => setStatusFilter("all")}
            type="button"
          >
            All
          </button>
          {taskStatuses.map((status) => (
            <button
              className={statusFilter === status ? "active" : ""}
              key={status}
              onClick={() => setStatusFilter(status)}
              type="button"
            >
              {statusLabels[status]}
            </button>
          ))}
        </div>
        <div>
          <span>Priority</span>
          <button
            className={priorityFilter === "all" ? "active" : ""}
            onClick={() => setPriorityFilter("all")}
            type="button"
          >
            All
          </button>
          {priorityOrder.map((priority) => (
            <button
              className={priorityFilter === priority ? "active" : ""}
              key={priority}
              onClick={() => setPriorityFilter(priority)}
              type="button"
            >
              {priorityLabels[priority]}
            </button>
          ))}
        </div>
      </section>

      <section className="workspace" aria-label="Task workspace">
        <section className="board" aria-label="Task board">
          {columns.map((column) => (
            <article className="taskColumn" key={column.status}>
              <header>
                <span>{statusLabels[column.status]}</span>
                <strong>{column.tasks.length}</strong>
              </header>
              <div className="taskList">
                {column.tasks.length === 0 ? (
                  <p className="emptyState">No tasks match this view.</p>
                ) : (
                  column.tasks.map((task) => (
                    <button
                      className={task.id === selectedTaskId ? "task active" : "task"}
                      key={task.id}
                      onClick={() => setSelectedTaskId(task.id)}
                      type="button"
                    >
                      <span className={`priorityDot ${task.priority}`} />
                      <strong>{task.title}</strong>
                      <small>
                        {priorityLabels[task.priority]} ·{" "}
                        {task.plannedFor === "today" ? "Today" : "Later"}
                      </small>
                    </button>
                  ))
                )}
              </div>
            </article>
          ))}
        </section>

        <aside className="detailPanel" aria-label="Task detail panel">
          <div>
            <p className="sectionLabel">Task detail</p>
            <h2>{selectedTask ? "Edit selected task" : "No task selected"}</h2>
          </div>

          {selectedTask ? (
            <form>
              <label>
                Title
                <input
                  aria-invalid={!selectedTask.title.trim()}
                  onChange={(event) =>
                    updateSelectedTask({ title: event.target.value })
                  }
                  required
                  value={selectedTask.title}
                />
              </label>
              <label>
                Notes
                <textarea
                  onChange={(event) =>
                    updateSelectedTask({ notes: event.target.value })
                  }
                  rows={5}
                  value={selectedTask.notes}
                />
              </label>
              <div className="fieldRow">
                <label>
                  Status
                  <select
                    onChange={(event) =>
                      updateSelectedTask({
                        status: event.target.value as TaskStatus,
                      })
                    }
                    value={selectedTask.status}
                  >
                    {taskStatuses.map((status) => (
                      <option key={status} value={status}>
                        {statusLabels[status]}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Priority
                  <select
                    onChange={(event) =>
                      updateSelectedTask({
                        priority: event.target.value as TaskPriority,
                      })
                    }
                    value={selectedTask.priority}
                  >
                    {priorityOrder.map((priority) => (
                      <option key={priority} value={priority}>
                        {priorityLabels[priority]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {!selectedTask.title.trim() && (
                <p className="validation">A title is required.</p>
              )}
            </form>
          ) : (
            <p className="emptyState">Choose a task to edit its details.</p>
          )}
        </aside>
      </section>
    </main>
  );
}

export default App;
