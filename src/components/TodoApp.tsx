"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import TodoItem from "./TodoItem";

export type Todo = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
};

export type Filter = "all" | "active" | "completed";

const STORAGE_KEY = "todo-app:v1";

function loadTodos(): Todo[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (t): t is Todo =>
        t &&
        typeof t.id === "string" &&
        typeof t.text === "string" &&
        typeof t.completed === "boolean" &&
        typeof t.createdAt === "number",
    );
  } catch {
    return [];
  }
}

export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [draft, setDraft] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Hydrate from localStorage on mount; not available during SSR.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTodos(loadTodos());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }, [todos, hydrated]);

  const remaining = useMemo(
    () => todos.reduce((n, t) => n + (t.completed ? 0 : 1), 0),
    [todos],
  );
  const completedCount = todos.length - remaining;

  const visible = useMemo(() => {
    if (filter === "active") return todos.filter((t) => !t.completed);
    if (filter === "completed") return todos.filter((t) => t.completed);
    return todos;
  }, [todos, filter]);

  function addTodo(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setTodos((prev) => [
      {
        id:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        text: trimmed,
        completed: false,
        createdAt: Date.now(),
      },
      ...prev,
    ]);
    setDraft("");
  }

  function toggleTodo(id: string) {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    );
  }

  function updateTodo(id: string, text: string) {
    const trimmed = text.trim();
    if (!trimmed) {
      removeTodo(id);
      return;
    }
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, text: trimmed } : t)),
    );
  }

  function removeTodo(id: string) {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }

  function clearCompleted() {
    setTodos((prev) => prev.filter((t) => !t.completed));
  }

  return (
    <div className="w-full max-w-xl">
      <header className="mb-6 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">To-Do</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Stay focused. One task at a time.
        </p>
      </header>

      <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] shadow-sm backdrop-blur supports-[backdrop-filter]:bg-[color-mix(in_oklab,var(--card)_85%,transparent)]">
        <form
          className="flex items-center gap-2 border-b border-[var(--card-border)] p-3"
          onSubmit={(e) => {
            e.preventDefault();
            addTodo(draft);
            inputRef.current?.focus();
          }}
        >
          <button
            type="submit"
            aria-label="Add task"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--accent)] text-white transition hover:bg-[var(--accent-hover)] active:scale-95"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5"
              stroke="currentColor"
              strokeWidth={2.25}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="What needs to be done?"
            aria-label="New task"
            autoFocus
            className="w-full bg-transparent px-1 py-2 text-base outline-none placeholder:text-[var(--muted)]"
          />
        </form>

        <ul className="divide-y divide-[var(--card-border)]">
          {visible.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={toggleTodo}
              onUpdate={updateTodo}
              onRemove={removeTodo}
            />
          ))}
        </ul>

        {hydrated && todos.length === 0 && (
          <div className="px-6 py-12 text-center text-sm text-[var(--muted)]">
            Nothing here yet. Add your first task above.
          </div>
        )}

        {hydrated && todos.length > 0 && visible.length === 0 && (
          <div className="px-6 py-12 text-center text-sm text-[var(--muted)]">
            No {filter} tasks.
          </div>
        )}

        {todos.length > 0 && (
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--card-border)] px-3 py-2 text-sm">
            <span className="text-[var(--muted)]">
              {remaining} {remaining === 1 ? "item" : "items"} left
            </span>
            <div
              role="tablist"
              aria-label="Filter tasks"
              className="flex gap-1 rounded-full bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)] p-1"
            >
              {(["all", "active", "completed"] as const).map((f) => (
                <button
                  key={f}
                  role="tab"
                  aria-selected={filter === f}
                  onClick={() => setFilter(f)}
                  className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition ${
                    filter === f
                      ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
                      : "text-[var(--muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <button
              onClick={clearCompleted}
              disabled={completedCount === 0}
              className="rounded-full px-3 py-1 text-xs font-medium text-[var(--muted)] transition hover:text-[var(--danger)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-[var(--muted)]"
            >
              Clear completed
            </button>
          </footer>
        )}
      </section>

      <p className="mt-4 text-center text-xs text-[var(--muted)]">
        Double-click a task to edit. Saved locally in your browser.
      </p>
    </div>
  );
}
