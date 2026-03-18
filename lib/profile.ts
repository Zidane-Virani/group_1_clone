import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";

export interface UserProfile {
  name: string;
  role: string;
  kogbucks_balance: number;
}

export async function getUserProfile(
  userId: string,
  client: SupabaseClient = supabase
): Promise<UserProfile> {
  const { data, error } = await client
    .from("profiles")
    .select("name, role, kogbucks_balance")
    .eq("id", userId)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Profile not found");
  }

  return {
    name: String(data.name ?? ""),
    role: String(data.role ?? "REP").toUpperCase(),
    kogbucks_balance: Number(data.kogbucks_balance ?? 0),
  };
}
