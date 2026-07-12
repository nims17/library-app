import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

// Fetches the logged-in user's profile (display name, role) for use in
// Server Components. Returns null if nobody is logged in.
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile as Profile | null;
}
