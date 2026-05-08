"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase, type TodoRow } from "@/lib/supabase";
import TodoItem from "./TodoItem";

export type Todo = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
};

export type Filter = "all" | "active" | "completed";

function fromRow(r: TodoRow): Todo {
  return {
    id: r.id,
    text: r.text,
    completed: r.completed,
    createdAt: r.created_at,
  };
}

export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("todos")
        .select("id,text,completed,created_at")
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (error) {
        setError(error.message);
      } else {
        setTodos((data ?? []).map(fromRow));
        setError(null);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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

  async function addTodo(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setDraft("");
    const { data, error } = await supabase
      .from("todos")
      .insert({ text: trimmed })
      .select("id,text,completed,created_at")
      .single();
    if (error || !data) {
      setError(error?.message ?? "Failed to add task");
      setDraft(trimmed);
      return;
    }
    setError(null);
    setTodos((prev) => [fromRow(data), ...prev]);
  }

  async function toggleTodo(id: string) {
    const target = todos.find((t) => t.id === id);
    if (!target) return;
    const next = !target.completed;
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: next } : t)),
    );
    const { error } = await supabase
      .from("todos")
      .update({ completed: next })
      .eq("id", id);
    if (error) {
      setError(error.message);
      setTodos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: !next } : t)),
      );
    } else {
      setError(null);
    }
  }

  async function updateTodo(id: string, text: string) {
    const trimmed = text.trim();
    if (!trimmed) {
      removeTodo(id);
      return;
    }
    const prevText = todos.find((t) => t.id === id)?.text;
    if (prevText === trimmed) return;
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, text: trimmed } : t)),
    );
    const { error } = await supabase
      .from("todos")
      .update({ text: trimmed })
      .eq("id", id);
    if (error) {
      setError(error.message);
      if (prevText !== undefined) {
        setTodos((prev) =>
          prev.map((t) => (t.id === id ? { ...t, text: prevText } : t)),
        );
      }
    } else {
      setError(null);
    }
  }

  async function removeTodo(id: string) {
    const snapshot = todos;
    setTodos((p) => p.filter((t) => t.id !== id));
    const { error } = await supabase.from("todos").delete().eq("id", id);
    if (error) {
      setError(error.message);
      setTodos(snapshot);
    } else {
      setError(null);
    }
  }

  async function clearCompleted() {
    const snapshot = todos;
    setTodos((p) => p.filter((t) => !t.completed));
    const { error } = await supabase
      .from("todos")
      .delete()
      .eq("completed", true);
    if (error) {
      setError(error.message);
      setTodos(snapshot);
    } else {
      setError(null);
    }
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

        {loading && (
          <div className="px-6 py-12 text-center text-sm text-[var(--muted)]">
            Loading…
          </div>
        )}

        {!loading && todos.length === 0 && !error && (
          <div className="px-6 py-12 text-center text-sm text-[var(--muted)]">
            Nothing here yet. Add your first task above.
          </div>
        )}

        {!loading && todos.length > 0 && visible.length === 0 && (
          <div className="px-6 py-12 text-center text-sm text-[var(--muted)]">
            No {filter} tasks.
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="border-t border-[var(--card-border)] px-4 py-3 text-center text-sm text-[var(--danger)]"
          >
            {error}
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
        Double-click a task to edit. Synced to Supabase.
      </p>
    </div>
  );
}
