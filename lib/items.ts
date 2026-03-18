import { supabase } from "./supabaseClient";

export async function deleteItem(itemId: string) {
  const { error } = await supabase
    .from("items")
    .delete()
    .eq("id", itemId);

  if (error) {
    throw new Error(error.message || "Delete failed");
  }
}
