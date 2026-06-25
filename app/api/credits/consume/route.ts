import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { consumeUserCredits, getUserCredits } from "@/lib/credits/repository";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = (await request.json()) as {
      amount?: number;
      idempotencyKey?: string;
      scope?: string;
    };
    const amount = payload.amount ?? 3;
    const idempotencyKey =
      typeof payload.idempotencyKey === "string"
        ? payload.idempotencyKey.trim()
        : undefined;
    const scope =
      typeof payload.scope === "string" && payload.scope.trim()
        ? payload.scope.trim()
        : "credits.consume";

    const success = await consumeUserCredits(
      supabase,
      userData.user.id,
      amount,
      idempotencyKey,
      scope,
    );

    if (!success) {
      return NextResponse.json(
        { error: "Insufficient credits" },
        { status: 402 },
      );
    }

    const balance = await getUserCredits(supabase, userData.user.id);

    return NextResponse.json({ success: true, consumed: amount, balance });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to consume credits";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
