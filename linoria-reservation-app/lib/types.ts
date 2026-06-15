export const reservationPlans = [
  "initial_consultation",
  "career_consultation",
  "support_plan"
] as const;

export const reservationStatuses = ["pending", "confirmed", "cancelled"] as const;

export type ReservationPlan = (typeof reservationPlans)[number];
export type ReservationStatus = (typeof reservationStatuses)[number];

export type Reservation = {
  id: string;
  name: string;
  email: string;
  line_display_name: string | null;
  line_user_id: string | null;
  plan: ReservationPlan;
  desired_at: string;
  message: string | null;
  status: ReservationStatus;
  created_at: string;
  updated_at: string;
};

export type ReservationFormInput = {
  name: string;
  email: string;
  lineDisplayName?: string;
  plan: ReservationPlan;
  desiredAt: string;
  message?: string;
};
