# Linoria Reservation App

Linoria用の予約管理システムです。既存LPとは別プロジェクトとして、Next.js + Supabase + Vercel公開を前提にしています。

## 現在の構成

- Next.js App Router
- Supabase Auth
- Supabase Database
- Resendによる管理者通知メール
- Vercel公開前提
- LINE公式アカウントからWeb予約ページへ誘導
- LIFF / LINE Messaging API は未実装。ただし拡張用カラムと構成を用意済み

## ファイル構成

```txt
linoria-reservation-app/
  app/
    page.tsx                              # Web予約ページ
    admin/page.tsx                        # 管理画面
    admin/login/page.tsx                  # Supabase Authログイン画面
    admin/actions.ts                      # ログイン、ログアウト、予約枠CRUD
    api/reservations/route.ts             # 予約作成API
    api/admin/reservations/[id]/route.ts  # 予約ステータス更新API
    globals.css
    layout.tsx
  components/
    ReservationForm.tsx
    StatusUpdateForm.tsx
  lib/
    admin.ts                              # 管理者判定
    labels.ts
    types.ts
    validation.ts
    supabase/
      admin.ts                            # service role用
      browser.ts                          # 将来のクライアント利用向け
      server.ts                           # Auth Cookie対応サーバークライアント
  supabase/
    schema.sql
  .env.example
```

## Supabase テーブル

`supabase/schema.sql` をSupabase SQL Editorで実行してください。

### available_slots

予約可能枠を管理します。

| カラム | 用途 |
| --- | --- |
| `id` | UUID |
| `start_at` | 開始日時 |
| `end_at` | 終了日時 |
| `capacity` | 定員 |
| `reserved_count` | 予約済み数 |
| `is_active` | 予約ページに公開するか |
| `created_at` | 作成日時 |
| `updated_at` | 更新日時 |

### reservations

予約情報を管理します。Google Calendar API連携を見据え、`slot_id` を中心にしています。

| カラム | 用途 |
| --- | --- |
| `id` | UUID |
| `slot_id` | `available_slots.id` |
| `name` | 名前 |
| `email` | メールアドレス |
| `line_display_name` | LINE表示名 |
| `line_user_id` | 将来のLIFF / Messaging API用 |
| `plan` | `initial_consultation` / `career_consultation` / `support_plan` |
| `message` | 相談内容 |
| `status` | `pending` / `confirmed` / `cancelled` |
| `created_at` | 作成日時 |
| `updated_at` | 更新日時 |

### admin_users

Supabase Authユーザーのうち、管理画面へ入れるユーザーを管理します。

| カラム | 用途 |
| --- | --- |
| `user_id` | `auth.users.id` |
| `role` | `admin` など |
| `created_at` | 作成日時 |

## 重複予約防止

予約作成は `create_reservation_with_slot` RPC を使います。

このRPCは `available_slots` の対象行を `for update` でロックし、以下を確認してから予約を作成します。

- 枠が存在する
- 公開中
- 未来の枠
- `reserved_count < capacity`

予約作成時点でステータスは `pending` ですが、この時点で `reserved_count` を加算して仮押さえします。予約作成と `reserved_count` の加算を同一トランザクションで行うため、複数人が同時予約しても定員超過しにくい設計です。

キャンセル時は `update_reservation_status` RPC が `reserved_count` を減算します。キャンセル済み予約を再度 `pending` / `confirmed` に戻す場合は、空きがある時だけ `reserved_count` を加算します。

## 環境変数

`.env.example` をコピーして `.env.local` を作成します。

```txt
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_EMAIL=admin@example.com
RESEND_API_KEY=re_your-resend-api-key
```

`SUPABASE_SERVICE_ROLE_KEY` はサーバー側だけで使用します。VercelのEnvironment Variablesにも同じ値を設定してください。

`RESEND_API_KEY` または `ADMIN_EMAIL` が未設定の場合、管理者通知メールは送信せずログ出力のみ行います。予約処理自体は失敗しません。

## 管理者アカウント作成

1. Supabase Dashboard の Authentication で管理者ユーザーを作成
2. 作成したユーザーのUUIDを確認
3. SQL Editorで以下を実行

```sql
insert into public.admin_users (user_id, role)
values ('AUTH_USER_UUID_HERE', 'admin')
on conflict (user_id) do update set role = excluded.role;
```

管理画面は `/admin/login` からログインします。未ログインで `/admin` にアクセスするとログイン画面へリダイレクトされます。

## 実装手順

1. Supabaseで新規プロジェクトを作成
2. `supabase/schema.sql` をSQL Editorで実行
3. Supabase Authで管理者ユーザーを作成
4. `admin_users` に管理者ユーザーIDを登録
5. `.env.local` を作成
6. Resendで送信元ドメインを設定し、`RESEND_API_KEY` と `ADMIN_EMAIL` を設定
7. 依存関係をインストール

```bash
npm install
```

8. ローカル起動

```bash
npm run dev
```

9. 予約ページ

```txt
http://localhost:3000/
```

10. 管理画面

```txt
http://localhost:3000/admin
```

## UI

予約フォームは自由入力の希望日時ではなく、現在予約可能な空き枠一覧から選択する仕様です。

空き枠は以下の場合に非表示になります。

- 定員に達している
- 非公開
- 過去の枠

予約送信後は受付完了画面を表示し、選択した日時、プラン、名前と「内容を確認後、LINEまたはメールでご連絡します」という案内を表示します。

## 管理者通知メール

予約作成後、`ADMIN_EMAIL` 宛にResend経由で通知メールを送信します。

通知に含める内容:

- 名前
- メールアドレス
- LINE表示名
- プラン
- 希望日時
- 相談内容

`RESEND_API_KEY` または `ADMIN_EMAIL` が未設定の場合は送信をスキップし、ログだけ出します。

## 今後の拡張

### Google Calendar API

`available_slots` をGoogle Calendarの予定と同期し、`reservations.slot_id` を基準に予約と予定を紐づける構成にできます。

### LIFF

`line_display_name` と `line_user_id` は保持済みです。LIFF SDKでプロフィールを取得し、`ReservationForm.tsx` のhidden inputに `lineUserId`、表示名欄に `displayName` を入れる形で拡張できます。

### LINE Messaging API

追加しやすい通知ポイント:

- `app/api/reservations/route.ts` の予約作成成功後: 予約受付通知
- `app/api/admin/reservations/[id]/route.ts` の confirmed 更新後: 予約確定通知
- Vercel Cron等: リマインド通知
