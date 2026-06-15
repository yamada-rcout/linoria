import { reservationPlans, reservationStatuses } from "./types";
import type { ReservationFormInput, ReservationStatus, SlotInput } from "./types";

const isString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const validateReservationInput = (input: unknown): ReservationFormInput => {
  if (!input || typeof input !== "object") {
    throw new Error("入力内容を確認してください。");
  }

  const data = input as Record<string, unknown>;

  if (!isString(data.name)) throw new Error("お名前を入力してください。");
  if (!isString(data.email) || !isEmail(data.email)) {
    throw new Error("メールアドレスを正しく入力してください。");
  }
  if (!isString(data.plan) || !reservationPlans.includes(data.plan as never)) {
    throw new Error("希望プランを選択してください。");
  }
  if (!isString(data.slotId)) {
    throw new Error("予約枠を選択してください。");
  }

  return {
    name: data.name.trim(),
    email: data.email.trim(),
    lineDisplayName: isString(data.lineDisplayName) ? data.lineDisplayName.trim() : "",
    lineUserId: isString(data.lineUserId) ? data.lineUserId.trim() : "",
    plan: data.plan as ReservationFormInput["plan"],
    slotId: data.slotId.trim(),
    message: isString(data.message) ? data.message.trim() : ""
  };
};

export const validateStatus = (status: unknown): ReservationStatus => {
  if (!isString(status) || !reservationStatuses.includes(status as never)) {
    throw new Error("ステータスを確認してください。");
  }

  return status as ReservationStatus;
};

export const validateSlotInput = (input: unknown): SlotInput => {
  if (!input || typeof input !== "object") {
    throw new Error("予約枠の入力内容を確認してください。");
  }

  const data = input as Record<string, unknown>;
  const capacity = Number(data.capacity);

  if (!isString(data.startAt) || Number.isNaN(Date.parse(data.startAt))) {
    throw new Error("開始日時を入力してください。");
  }
  if (!isString(data.endAt) || Number.isNaN(Date.parse(data.endAt))) {
    throw new Error("終了日時を入力してください。");
  }
  if (new Date(data.endAt).getTime() <= new Date(data.startAt).getTime()) {
    throw new Error("終了日時は開始日時より後にしてください。");
  }
  if (!Number.isInteger(capacity) || capacity < 1) {
    throw new Error("定員は1以上の整数で入力してください。");
  }

  return {
    startAt: data.startAt,
    endAt: data.endAt,
    capacity,
    isActive: Boolean(data.isActive)
  };
};
