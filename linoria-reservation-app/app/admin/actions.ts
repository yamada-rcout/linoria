"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/admin";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { validateSlotInput } from "@/lib/validation";

const toIso = (value: FormDataEntryValue | null) =>
  value ? new Date(String(value)).toISOString() : "";

const requireAdmin = async () => {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
};

export async function loginAdmin(formData: FormData) {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect("/admin/login?error=1");
  }

  const adminSupabase = createAdminSupabaseClient();
  const { data: adminUser } = await adminSupabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (!adminUser) {
    await supabase.auth.signOut();
    redirect("/admin/login?error=not_admin");
  }

  redirect("/admin");
}

export async function logoutAdmin() {
  const supabase = createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function createSlot(formData: FormData) {
  await requireAdmin();
  const input = validateSlotInput({
    startAt: toIso(formData.get("startAt")),
    endAt: toIso(formData.get("endAt")),
    capacity: formData.get("capacity"),
    isActive: formData.get("isActive") === "on"
  });
  const supabase = createAdminSupabaseClient();

  const { error } = await supabase.from("available_slots").insert({
    start_at: input.startAt,
    end_at: input.endAt,
    capacity: input.capacity,
    is_active: input.isActive
  });

  if (error) throw new Error("予約枠を追加できませんでした。");

  revalidatePath("/admin");
}

export async function updateSlot(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const input = validateSlotInput({
    startAt: toIso(formData.get("startAt")),
    endAt: toIso(formData.get("endAt")),
    capacity: formData.get("capacity"),
    isActive: formData.get("isActive") === "on"
  });
  const supabase = createAdminSupabaseClient();

  const { error } = await supabase
    .from("available_slots")
    .update({
      start_at: input.startAt,
      end_at: input.endAt,
      capacity: input.capacity,
      is_active: input.isActive
    })
    .eq("id", id);

  if (error) throw new Error("予約枠を更新できませんでした。");

  revalidatePath("/admin");
}

export async function toggleSlot(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const isActive = String(formData.get("isActive")) === "true";
  const supabase = createAdminSupabaseClient();

  const { error } = await supabase.from("available_slots").update({ is_active: !isActive }).eq("id", id);

  if (error) throw new Error("予約枠の公開状態を変更できませんでした。");

  revalidatePath("/admin");
}

export async function deleteSlot(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const supabase = createAdminSupabaseClient();

  const { error } = await supabase.from("available_slots").delete().eq("id", id).eq("reserved_count", 0);

  if (error) throw new Error("予約済みのある枠は削除できません。非公開にしてください。");

  revalidatePath("/admin");
}
