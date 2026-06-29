import { formatSlotRange, planLabels } from "./labels";
import type { AvailableSlot, ReservationPlan } from "./types";

type AdminNotificationInput = {
  name: string;
  email: string;
  lineDisplayName?: string;
  plan: ReservationPlan;
  message?: string;
  slot: AvailableSlot;
};

export const sendAdminReservationNotification = async (input: AdminNotificationInput) => {
  const apiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!apiKey || !adminEmail) {
    console.log("[reservation notification skipped]", {
      reason: "RESEND_API_KEY or ADMIN_EMAIL is not configured",
      reservation: {
        name: input.name,
        email: input.email,
        plan: input.plan,
        slot: input.slot.id
      }
    });
    return;
  }

  const slotLabel = formatSlotRange(input.slot.start_at, input.slot.end_at);
  const text = [
    "Linoriaに新しい予約希望が届きました。",
    "",
    `お名前: ${input.name}`,
    `メール: ${input.email}`,
    `プラン: ${planLabels[input.plan]}`,
    `希望日時: ${slotLabel}`,
    "",
    "相談内容:",
    input.message || "未入力"
  ].join("\n");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: "Linoria Reservations <onboarding@resend.dev>",
      to: adminEmail,
      subject: `Linoria予約希望: ${input.name}さん`,
      text
    })
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("[reservation notification failed]", body);
  }
};
