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

  if (data) {
    return {
      name: String(data.name ?? ""),
      role: String(data.role ?? "REP").toUpperCase(),
      kogbucks_balance: Number(data.kogbucks_balance ?? 0),
    };
  }

  // Profile doesn't exist yet — create a default one
  if (error && error.code === "PGRST116") {
    const { data: newProfile, error: insertError } = await client
      .from("profiles")
      .upsert({ id: userId, name: "", role: "REP", kogbucks_balance: 0 })
      .select("name, role, kogbucks_balance")
      .single();

    if (insertError || !newProfile) {
      throw new Error(insertError?.message ?? "Failed to create profile");
    }

    return {
      name: String(newProfile.name ?? ""),
      role: String(newProfile.role ?? "REP").toUpperCase(),
      kogbucks_balance: Number(newProfile.kogbucks_balance ?? 0),
    };
  }

  throw new Error(error?.message ?? "Profile not found");
}
