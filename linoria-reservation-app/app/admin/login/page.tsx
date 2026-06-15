import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/admin";
import { loginAdmin } from "../actions";

type LoginPageProps = {
  searchParams?: {
    error?: string;
  };
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const admin = await getCurrentAdmin();
  if (admin) redirect("/admin");

  const errorMessage =
    searchParams?.error === "not_admin"
      ? "このアカウントは管理者として登録されていません。"
      : searchParams?.error
        ? "メールアドレスまたはパスワードを確認してください。"
        : "";

  return (
    <main className="site-shell">
      <header className="site-header">
        <a className="brand" href="/">
          Linoria
          <span>Reservation Admin</span>
        </a>
      </header>
      <section className="page-section hero-grid">
        <div>
          <p className="section-kicker">Admin Login</p>
          <h1 className="page-title">管理者ログイン</h1>
          <p className="lead">Supabase Authで管理者アカウントにログインしてください。</p>
        </div>
        <form className="panel admin-login" action={loginAdmin}>
          <label>
            メールアドレス
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            パスワード
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
          <button className="primary-button" type="submit">
            ログイン
          </button>
          {errorMessage ? <p className="status-message is-error">{errorMessage}</p> : null}
        </form>
      </section>
    </main>
  );
}
