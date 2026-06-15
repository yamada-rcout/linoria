import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/admin";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { validateStatus } from "@/lib/validation";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function PATCH(request: Request, { params }: RouteContext) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ message: "認証が必要です。" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const status = validateStatus(body.status);
    const supabase = createAdminSupabaseClient();

    const { error } = await supabase.rpc("update_reservation_status", {
      p_reservation_id: params.id,
      p_status: status
    });

    if (error) {
      console.error(error);
      return NextResponse.json({ message: "ステータスを更新できませんでした。" }, { status: 500 });
    }

    return NextResponse.json({ message: "ステータスを更新しました。" });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "入力内容を確認してください。" },
      { status: 400 }
    );
  }
}
