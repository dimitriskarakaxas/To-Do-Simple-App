import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local",
  );
}

export type TodoRow = {
  id: string;
  text: string;
  completed: boolean;
  created_at: string;
};

export const supabase = createClient<{
  public: {
    Tables: {
      todos: {
        Row: TodoRow;
        Insert: { id?: string; text: string; completed?: boolean; created_at?: string };
        Update: Partial<Pick<TodoRow, "text" | "completed">>;
      };
    };
  };
}>(url, key, {
  auth: { persistSession: false },
});
