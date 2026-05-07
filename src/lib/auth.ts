import { supabase } from "@/integrations/supabase/client";

export async function getUserRole(userId: string): Promise<"candidate" | "admin" | null> {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle();
  return (data?.role as "candidate" | "admin") ?? null;
}
