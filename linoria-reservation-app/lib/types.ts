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
  slot_id: string;
  name: string;
  email: string;
  line_display_name: string | null;
  line_user_id: string | null;
  plan: ReservationPlan;
  message: string | null;
  status: ReservationStatus;
  created_at: string;
  updated_at: string;
  available_slots?: AvailableSlot | null;
};

export type ReservationFormInput = {
  name: string;
  email: string;
  lineDisplayName?: string;
  lineUserId?: string;
  plan: ReservationPlan;
  slotId: string;
  message?: string;
};

export type AvailableSlot = {
  id: string;
  start_at: string;
  end_at: string;
  capacity: number;
  reserved_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type SlotInput = {
  startAt: string;
  endAt: string;
  capacity: number;
  isActive: boolean;
};
