"use client";

import { useEffect, useRef, useState } from "react";
import type { Todo } from "./TodoApp";

type Props = {
  todo: Todo;
  onToggle: (id: string) => void;
  onUpdate: (id: string, text: string) => void;
  onRemove: (id: string) => void;
};

export default function TodoItem({ todo, onToggle, onUpdate, onRemove }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(todo.text);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  function commit() {
    setEditing(false);
    if (draft.trim() !== todo.text) onUpdate(todo.id, draft);
  }

  function cancel() {
    setDraft(todo.text);
    setEditing(false);
  }

  return (
    <li className="group flex items-center gap-3 px-3 py-2.5 transition hover:bg-[color-mix(in_oklab,var(--foreground)_3%,transparent)]">
      <button
        role="checkbox"
        aria-checked={todo.completed}
        onClick={() => onToggle(todo.id)}
        className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border transition ${
          todo.completed
            ? "border-[var(--accent)] bg-[var(--accent)] text-white"
            : "border-[var(--card-border)] hover:border-[var(--accent)]"
        }`}
        aria-label={todo.completed ? "Mark as not done" : "Mark as done"}
      >
        {todo.completed && (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5"
            aria-hidden
          >
            <path d="M5 12l4 4L19 7" />
          </svg>
        )}
      </button>

      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") cancel();
          }}
          className="flex-1 rounded-md bg-transparent px-1 py-1 text-base outline-none ring-1 ring-[var(--accent)]"
        />
      ) : (
        <span
          onDoubleClick={() => setEditing(true)}
          className={`flex-1 cursor-text select-text break-words py-1 text-base ${
            todo.completed
              ? "text-[var(--muted)] line-through"
              : "text-[var(--foreground)]"
          }`}
        >
          {todo.text}
        </span>
      )}

      <button
        onClick={() => setEditing(true)}
        aria-label="Edit task"
        className="rounded-md p-1.5 text-[var(--muted)] opacity-0 transition hover:bg-[color-mix(in_oklab,var(--foreground)_8%,transparent)] hover:text-[var(--foreground)] group-hover:opacity-100 focus-visible:opacity-100"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden
        >
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
        </svg>
      </button>

      <button
        onClick={() => onRemove(todo.id)}
        aria-label="Delete task"
        className="rounded-md p-1.5 text-[var(--muted)] opacity-0 transition hover:bg-[color-mix(in_oklab,var(--danger)_15%,transparent)] hover:text-[var(--danger)] group-hover:opacity-100 focus-visible:opacity-100"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden
        >
          <path d="M3 6h18" />
          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        </svg>
      </button>
    </li>
  );
}
