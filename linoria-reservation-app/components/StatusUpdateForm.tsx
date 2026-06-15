"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { statusLabels } from "@/lib/labels";
import type { ReservationStatus } from "@/lib/types";

type StatusUpdateFormProps = {
  reservationId: string;
  currentStatus: ReservationStatus;
};

const nextStatuses: ReservationStatus[] = ["confirmed", "cancelled"];

export default function StatusUpdateForm({ reservationId, currentStatus }: StatusUpdateFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const updateStatus = (status: ReservationStatus) => {
    setMessage("");

    startTransition(async () => {
      const response = await fetch(`/api/admin/reservations/${reservationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        const result = (await response.json()) as { message?: string };
        setMessage(result.message || "ステータスを更新できませんでした。");
        return;
      }

      router.refresh();
    });
  };

  return (
    <div>
      <div className="status-actions">
        {nextStatuses.map((status) => (
          <button
            className="secondary-button"
            key={status}
            type="button"
            disabled={isPending || currentStatus === status}
            onClick={() => updateStatus(status)}
          >
            {statusLabels[status]}にする
          </button>
        ))}
      </div>
      {message ? <p className="status-message is-error">{message}</p> : null}
    </div>
  );
}
