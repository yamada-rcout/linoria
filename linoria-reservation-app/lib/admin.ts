import { createAdminSupabaseClient } from "./supabase/admin";
import { createServerSupabaseClient } from "./supabase/server";

export const getCurrentAdmin = async () => {
  const supabase = createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return null;

  const adminSupabase = createAdminSupabaseClient();
  const { data, error } = await adminSupabase
    .from("admin_users")
    .select("user_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) return null;

  return {
    user,
    role: data.role as string
  };
};
