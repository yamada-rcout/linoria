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
            &#12363;&#12435;&#12383;&#12435;&#12395;
          </h1>
          <p className="lead">
            Linoria&#12398;&#30456;&#35527;&#20104;&#32004;&#12506;&#12540;&#12472;&#12391;&#12377;&#12290;&#12503;&#12521;&#12531;&#12434;&#36984;&#12403;&#12289;&#12459;&#12524;&#12531;&#12480;&#12540;&#12363;&#12425;&#31354;&#12356;&#12390;&#12356;&#12427;&#26178;&#38291;&#12434;&#36984;&#25246;&#12375;&#12390;&#12367;&#12384;&#12373;&#12356;&#12290;
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
              <p>&#20869;&#23481;&#12434;&#30906;&#35469;&#24460;&#12289;&#12513;&#12540;&#12523;&#12391;&#12372;&#36899;&#32097;&#12375;&#12414;&#12377;&#12290;</p>
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
