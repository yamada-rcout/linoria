import { reservationPlans, reservationStatuses } from "./types";
import type { ReservationFormInput, ReservationStatus } from "./types";

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
  if (!isString(data.desiredAt) || Number.isNaN(Date.parse(data.desiredAt))) {
    throw new Error("希望日時を入力してください。");
  }

  return {
    name: data.name.trim(),
    email: data.email.trim(),
    lineDisplayName: isString(data.lineDisplayName) ? data.lineDisplayName.trim() : "",
    plan: data.plan as ReservationFormInput["plan"],
    desiredAt: data.desiredAt,
    message: isString(data.message) ? data.message.trim() : ""
  };
};

export const validateStatus = (status: unknown): ReservationStatus => {
  if (!isString(status) || !reservationStatuses.includes(status as never)) {
    throw new Error("ステータスを確認してください。");
  }

  return status as ReservationStatus;
};
