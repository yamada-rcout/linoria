import ReservationForm from "@/components/ReservationForm";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { AvailableSlot } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getAvailableSlots() {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("available_slots")
    .select("*")
    .eq("is_active", true)
    .gt("start_at", new Date().toISOString())
    .order("start_at", { ascending: true });

  if (error) {
    console.error(error);
    return [];
  }

  return ((data || []) as AvailableSlot[]).filter((slot) => slot.reserved_count < slot.capacity);
}

export default async function HomePage() {
  const slots = await getAvailableSlots();

  return (
    <main className="site-shell">
      <header className="site-header">
        <a className="brand" href="/">
          Linoria
          <span>Career Support for Teachers</span>
        </a>
      </header>

      <section className="page-section hero-grid">
        <div>
          <p className="section-kicker">Reservation</p>
          <h1 className="page-title">
            相談予約を、
            <br />
            LINEからスムーズに
          </h1>
          <p className="lead">
            LINE公式アカウントから案内された方向けの予約ページです。プランを選び、カレンダーから空いている時間を選択してください。
          </p>
          <ul className="info-list">
            <li>
              <span>01</span>
              <p>初回無料相談、キャリア整理相談、伴走プランから選べます。</p>
            </li>
            <li>
              <span>02</span>
              <p>予約はまず未対応として保存され、Linoria側で確認します。</p>
            </li>
            <li>
              <span>03</span>
              <p>内容を確認後、LINEまたはメールでご連絡します。</p>
            </li>
          </ul>
        </div>

        <div className="panel">
          <ReservationForm slots={slots} />
        </div>
      </section>
    </main>
  );
}
