import { NextRequest, NextResponse } from "next/server";
import { createClient, getAuthenticatedUser } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);

    const payload = (await request.json()) as {
      name?: string;
      email?: string;
      topic?: string;
      message?: string;
    };

    const name = payload.name?.trim();
    const email = payload.email?.trim();
    const topic = payload.topic?.trim() || "General";
    const message = payload.message?.trim();

    if (!name || name.length < 2) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    if (!message || message.length < 5) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("support_tickets")
      .insert({
        user_id: user?.id ?? null,
        name,
        email,
        topic,
        message,
        status: "new",
      })
      .select("id")
      .single();

    if (error) {
      console.error("[Support Route] Insert failed:", error.message);
      return NextResponse.json(
        { error: "Failed to submit support request" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { success: true, ticketId: data.id },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "[Support Route] Error:",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      { error: "Failed to submit support request" },
      { status: 500 },
    );
  }
}