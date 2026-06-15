import { NextResponse } from "next/server";
import { sendAdminReservationNotification } from "@/lib/email";
import { planLabels } from "@/lib/labels";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { AvailableSlot } from "@/lib/types";
import { validateReservationInput } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const input = validateReservationInput(await request.json());
    const supabase = createAdminSupabaseClient();

    const { data: reservationId, error } = await supabase.rpc("create_reservation_with_slot", {
      p_slot_id: input.slotId,
      p_name: input.name,
      p_email: input.email,
      p_line_display_name: input.lineDisplayName || "",
      p_line_user_id: input.lineUserId || "",
      p_plan: input.plan,
      p_message: input.message || ""
    });

    if (error) {
      console.error(error);
      return NextResponse.json({ message: "予約を保存できませんでした。" }, { status: 500 });
    }

    const { data: slotData } = await supabase
      .from("available_slots")
      .select("*")
      .eq("id", input.slotId)
      .single();

    const slot = slotData as AvailableSlot | null;

    if (slot) {
      await sendAdminReservationNotification({
        name: input.name,
        email: input.email,
        lineDisplayName: input.lineDisplayName,
        plan: input.plan,
        message: input.message,
        slot
      });
    }

    return NextResponse.json(
      {
        message: "予約希望を受け付けました。",
        reservation: {
          id: reservationId,
          name: input.name,
          plan: input.plan,
          planLabel: planLabels[input.plan],
          slot
        }
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "入力内容を確認してください。" },
      { status: 400 }
    );
  }
}
