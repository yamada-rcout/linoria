"use client";

import { FormEvent, useMemo, useState } from "react";
import { formatSlotRange, planLabels } from "@/lib/labels";
import type { AvailableSlot, ReservationPlan } from "@/lib/types";

type SubmitState = {
  type: "idle" | "error";
  message: string;
};

type CompletedReservation = {
  name: string;
  planLabel: string;
  slotLabel: string;
};

type ReservationResponse = {
  message?: string;
  reservation?: {
    name: string;
    planLabel: string;
    slot: AvailableSlot | null;
  };
};

type ReservationFormProps = {
  slots: AvailableSlot[];
};

const planOptions: ReservationPlan[] = [
  "initial_consultation",
  "career_consultation",
  "support_plan"
];

const dateKey = (value: string) => value.slice(0, 10);

const timeKey = (value: string) =>
  new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo"
  }).format(new Date(value));

const dateLabel = (value: string) =>
  new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
    timeZone: "Asia/Tokyo"
  }).format(new Date(value));

export default function ReservationForm({ slots }: ReservationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>({
    type: "idle",
    message: ""
  });
  const [completedReservation, setCompletedReservation] = useState<CompletedReservation | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [datePage, setDatePage] = useState(0);

  const sortedSlots = useMemo(
    () => [...slots].sort((a, b) => a.start_at.localeCompare(b.start_at)),
    [slots]
  );

  const dateKeys = useMemo(
    () => Array.from(new Set(sortedSlots.map((slot) => dateKey(slot.start_at)))),
    [sortedSlots]
  );

  const visibleDateKeys = dateKeys.slice(datePage * 7, datePage * 7 + 7);

  const timeKeys = useMemo(
    () =>
      Array.from(
        new Set(
          sortedSlots
            .filter((slot) => visibleDateKeys.includes(dateKey(slot.start_at)))
            .map((slot) => timeKey(slot.start_at))
        )
      ),
    [sortedSlots, visibleDateKeys]
  );

  const slotMap = useMemo(() => {
    const map = new Map<string, AvailableSlot>();
    sortedSlots.forEach((slot) => {
      map.set(`${dateKey(slot.start_at)}-${timeKey(slot.start_at)}`, slot);
    });
    return map;
  }, [sortedSlots]);

  const selectedSlot = slots.find((slot) => slot.id === selectedSlotId) || null;
  const canMovePrev = datePage > 0;
  const canMoveNext = (datePage + 1) * 7 < dateKeys.length;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitState({ type: "idle", message: "" });

    const form = event.currentTarget;
    const formData = new FormData(form);
    const plan = String(formData.get("plan") || "") as ReservationPlan;

    const payload = {
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      lineDisplayName: String(formData.get("lineDisplayName") || ""),
      lineUserId: String(formData.get("lineUserId") || ""),
      plan,
      slotId: selectedSlotId,
      message: String(formData.get("message") || "")
    };

    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const result = (await response.json()) as ReservationResponse;

      if (!response.ok) {
        throw new Error(result.message || "予約を送信できませんでした。");
      }

      const slot = result.reservation?.slot || selectedSlot;
      setCompletedReservation({
        name: result.reservation?.name || payload.name,
        planLabel: result.reservation?.planLabel || planLabels[plan],
        slotLabel: slot ? formatSlotRange(slot.start_at, slot.end_at) : "選択した予約枠"
      });
      setSelectedSlotId("");
      form.reset();
    } catch (error) {
      setSubmitState({
        type: "error",
        message: error instanceof Error ? error.message : "予約を送信できませんでした。"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (completedReservation) {
    return (
      <div className="reservation-complete">
        <p className="section-kicker">Complete</p>
        <h2>予約希望を受け付けました</h2>
        <div className="complete-summary">
          <div>
            <span>お名前</span>
            <strong>{completedReservation.name}</strong>
          </div>
          <div>
            <span>プラン</span>
            <strong>{completedReservation.planLabel}</strong>
          </div>
          <div>
            <span>日時</span>
            <strong>{completedReservation.slotLabel}</strong>
          </div>
        </div>
        <p className="lead compact">
          &#20869;&#23481;&#12434;&#30906;&#35469;&#24460;&#12289;&#12513;&#12540;&#12523;&#12391;&#12372;&#36899;&#32097;&#12375;&#12414;&#12377;&#12290;Linoria&#12363;&#12425;&#12398;&#36899;&#32097;&#12434;&#12362;&#24453;&#12385;&#12367;&#12384;&#12373;&#12356;&#12290;
        </p>
        <button className="secondary-button" type="button" onClick={() => setCompletedReservation(null)}>
          続けて別の予約を送る
        </button>
      </div>
    );
  }

  return (
    <form className="reservation-form" onSubmit={handleSubmit}>
      <div>
        <p className="section-kicker">Form</p>
        <h2>予約内容を入力</h2>
      </div>

      <div className="form-grid">
        <label>
          お名前
          <input name="name" autoComplete="name" required />
        </label>
        <label>
          メールアドレス
          <input name="email" type="email" autoComplete="email" required />
        </label>
      </div>

<label>
        希望プラン
        <select name="plan" defaultValue="initial_consultation" required>
          {planOptions.map((option) => (
            <option key={option} value={option}>
              {planLabels[option]}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="slot-picker">
        <legend>現在予約可能な空き枠</legend>
        {slots.length === 0 ? (
          <p className="slot-empty">&#29694;&#22312;&#20104;&#32004;&#21487;&#33021;&#12394;&#26528;&#12399;&#12354;&#12426;&#12414;&#12379;&#12435;&#12290;&#12362;&#21839;&#12356;&#21512;&#12431;&#12379;&#12501;&#12457;&#12540;&#12512;&#12424;&#12426;&#12372;&#36899;&#32097;&#12367;&#12384;&#12373;&#12356;&#12290;</p>
        ) : (
          <div className="calendar-picker">
            <div className="calendar-toolbar">
              <button
                className="secondary-button"
                type="button"
                disabled={!canMovePrev}
                onClick={() => setDatePage((page) => Math.max(page - 1, 0))}
              >
                前の期間
              </button>
              <p>
                {visibleDateKeys[0] ? dateLabel(`${visibleDateKeys[0]}T00:00:00+09:00`) : ""}
                {visibleDateKeys.length > 1
                  ? ` - ${dateLabel(`${visibleDateKeys[visibleDateKeys.length - 1]}T00:00:00+09:00`)}`
                  : ""}
              </p>
              <button
                className="secondary-button"
                type="button"
                disabled={!canMoveNext}
                onClick={() => setDatePage((page) => page + 1)}
              >
                次の期間
              </button>
            </div>

            <div className="calendar-table-wrap">
              <table className="calendar-table">
                <thead>
                  <tr>
                    <th scope="col">時間</th>
                    {visibleDateKeys.map((day) => (
                      <th scope="col" key={day}>
                        {dateLabel(`${day}T00:00:00+09:00`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeKeys.map((time) => (
                    <tr key={time}>
                      <th scope="row">{time}</th>
                      {visibleDateKeys.map((day) => {
                        const slot = slotMap.get(`${day}-${time}`);
                        const isSelected = slot?.id === selectedSlotId;
                        return (
                          <td key={`${day}-${time}`}>
                            {slot ? (
                              <button
                                className={`calendar-slot ${isSelected ? "is-selected" : ""}`}
                                type="button"
                                aria-pressed={isSelected}
                                onClick={() => setSelectedSlotId(slot.id)}
                              >
                                ○
                              </button>
                            ) : (
                              <span className="calendar-slot is-disabled">×</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <input name="slotId" type="hidden" value={selectedSlotId} />
            {selectedSlot ? (
              <p className="selected-slot">選択中: {formatSlotRange(selectedSlot.start_at, selectedSlot.end_at)}</p>
            ) : (
              <p className="selected-slot">○の枠から希望日時を選択してください。</p>
            )}
          </div>
        )}
      </fieldset>

      <label>
        相談内容
        <textarea name="message" rows={6} placeholder="今の状況や相談したいことを入力してください。" />
      </label>

      <button className="primary-button" type="submit" disabled={isSubmitting || slots.length === 0 || !selectedSlotId}>
        {isSubmitting ? "送信中..." : "予約希望を送信する"}
      </button>

      <p className={`status-message ${submitState.type === "error" ? "is-error" : ""}`} aria-live="polite">
        {submitState.message}
      </p>
    </form>
  );
}
