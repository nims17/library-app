import { createBrowserClient } from "@supabase/ssr";

// Used in Client Components ("use client" files) — runs in the friend's browser.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
