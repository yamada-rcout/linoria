import type { ReservationPlan, ReservationStatus } from "./types";

export const planLabels: Record<ReservationPlan, string> = {
  initial_consultation: "初回無料相談",
  career_consultation: "キャリア整理相談",
  support_plan: "伴走プラン"
};

export const statusLabels: Record<ReservationStatus, string> = {
  pending: "未対応",
  confirmed: "確定",
  cancelled: "キャンセル"
};

export const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Tokyo"
  }).format(new Date(value));
