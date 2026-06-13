import type { BuildProfile } from "@/lib/types/build";
import { getSupabaseClient } from "./client";
import type { SavedBuildRow, SavedBuildSummary } from "./database.types";

function toSummary(row: SavedBuildRow): SavedBuildSummary {
  return {
    id: row.id,
    name: row.name,
    position: row.profile.position,
    updatedAt: row.updated_at,
  };
}

export async function listUserBuilds(): Promise<SavedBuildSummary[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("builds")
    .select("id, name, profile, updated_at")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) =>
    toSummary(row as SavedBuildRow),
  );
}

export async function getUserBuild(id: string): Promise<SavedBuildRow | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("builds")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createUserBuild(
  profile: BuildProfile,
): Promise<SavedBuildRow> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase is not configured");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in to save builds");

  const { data, error } = await supabase
    .from("builds")
    .insert({
      user_id: user.id,
      name: profile.name || "My Build",
      profile,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function updateUserBuild(
  id: string,
  profile: BuildProfile,
): Promise<SavedBuildRow> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase is not configured");

  const { data, error } = await supabase
    .from("builds")
    .update({
      name: profile.name || "My Build",
      profile,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function deleteUserBuild(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase is not configured");

  const { error } = await supabase.from("builds").delete().eq("id", id);
  if (error) throw error;
}
