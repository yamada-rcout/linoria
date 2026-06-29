import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/admin";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { formatSlotRange, planLabels, statusLabels } from "@/lib/labels";
import type { AvailableSlot, Reservation } from "@/lib/types";
import StatusUpdateForm from "@/components/StatusUpdateForm";
import { createSlot, deleteSlot, logoutAdmin, toggleSlot, updateSlot } from "./actions";

export const dynamic = "force-dynamic";

type ReservationWithSlot = Reservation & {
  available_slots: AvailableSlot | null;
};

const toLocalInputValue = (value: string) => {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

async function getReservations() {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("reservations")
    .select("*, available_slots(*)")
    .order("created_at", { ascending: false });

  if (error) throw new Error("予約一覧を取得できませんでした。");

  return (data || []) as ReservationWithSlot[];
}

async function getSlots() {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("available_slots")
    .select("*")
    .order("start_at", { ascending: true });

  if (error) throw new Error("予約枠を取得できませんでした。");

  return (data || []) as AvailableSlot[];
}

export default async function AdminPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const [reservations, slots] = await Promise.all([getReservations(), getSlots()]);

  return (
    <main className="site-shell">
      <header className="site-header">
        <a className="brand" href="/">
          Linoria
          <span>Reservation Admin</span>
        </a>
        <form action={logoutAdmin}>
          <button className="secondary-button" type="submit">
            ログアウト
          </button>
        </form>
      </header>

      <section className="page-section admin-stack">
        <div className="admin-header">
          <div>
            <p className="section-kicker">Admin</p>
            <h1 className="page-title">予約管理</h1>
            <p>予約一覧と予約可能枠を管理します。枠の定員に達した場合、予約ページには表示されません。</p>
          </div>
        </div>

        <section className="admin-panel panel">
          <div>
            <p className="section-kicker">Slots</p>
            <h2>予約枠追加</h2>
          </div>
          <form className="slot-form" action={createSlot}>
            <label>
              開始日時
              <input name="startAt" type="datetime-local" required />
            </label>
            <label>
              終了日時
              <input name="endAt" type="datetime-local" required />
            </label>
            <label>
              定員
              <input name="capacity" type="number" min="1" defaultValue="1" required />
            </label>
            <label className="inline-check">
              <input name="isActive" type="checkbox" defaultChecked />
              公開する
            </label>
            <button className="primary-button" type="submit">
              予約枠を追加
            </button>
          </form>
        </section>

        <section className="admin-panel panel">
          <div>
            <p className="section-kicker">Available Slots</p>
            <h2>予約枠一覧</h2>
          </div>
          {slots.length === 0 ? (
            <div className="empty-state">予約枠はまだありません。</div>
          ) : (
            <div className="slot-admin-list">
              {slots.map((slot) => (
                <article className="slot-admin-card" key={slot.id}>
                  <form className="slot-form" action={updateSlot}>
                    <input name="id" type="hidden" value={slot.id} />
                    <label>
                      開始日時
                      <input name="startAt" type="datetime-local" defaultValue={toLocalInputValue(slot.start_at)} required />
                    </label>
                    <label>
                      終了日時
                      <input name="endAt" type="datetime-local" defaultValue={toLocalInputValue(slot.end_at)} required />
                    </label>
                    <label>
                      定員
                      <input name="capacity" type="number" min={Math.max(slot.reserved_count, 1)} defaultValue={slot.capacity} required />
                    </label>
                    <label className="inline-check">
                      <input name="isActive" type="checkbox" defaultChecked={slot.is_active} />
                      公開
                    </label>
                    <div className="slot-meta">
                      <span>
                        予約数 {slot.reserved_count}/{slot.capacity}
                      </span>
                      <span className={`status-badge ${slot.is_active ? "confirmed" : "cancelled"}`}>
                        {slot.is_active ? "公開中" : "非公開"}
                      </span>
                    </div>
                    <button className="secondary-button" type="submit">
                      更新
                    </button>
                  </form>
                  <div className="status-actions">
                    <form action={toggleSlot}>
                      <input name="id" type="hidden" value={slot.id} />
                      <input name="isActive" type="hidden" value={String(slot.is_active)} />
                      <button className="secondary-button" type="submit">
                        {slot.is_active ? "非公開にする" : "公開する"}
                      </button>
                    </form>
                    <form action={deleteSlot}>
                      <input name="id" type="hidden" value={slot.id} />
                      <button className="secondary-button danger-button" type="submit" disabled={slot.reserved_count > 0}>
                        削除
                      </button>
                    </form>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="admin-panel panel">
          <div>
            <p className="section-kicker">Reservations</p>
            <h2>予約一覧</h2>
          </div>
          {reservations.length === 0 ? (
            <div className="empty-state">まだ予約はありません。</div>
          ) : (
            <div className="table-wrap">
              <table className="reservation-table">
                <thead>
                  <tr>
                    <th>予約者</th>
                    <th>予約枠</th>
                    <th>プラン</th>
                    <th>相談内容</th>
                    <th>ステータス</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((reservation) => (
                    <tr key={reservation.id}>
                      <td>
                        <strong>{reservation.name}</strong>
                        <span>{reservation.email}</span>
                      </td>
                      <td>
                        {reservation.available_slots
                          ? formatSlotRange(reservation.available_slots.start_at, reservation.available_slots.end_at)
                          : "削除済みの枠"}
                      </td>
                      <td>{planLabels[reservation.plan]}</td>
                      <td>{reservation.message || "未入力"}</td>
                      <td>
                        <span className={`status-badge ${reservation.status}`}>{statusLabels[reservation.status]}</span>
                      </td>
                      <td>
                        <StatusUpdateForm reservationId={reservation.id} currentStatus={reservation.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
