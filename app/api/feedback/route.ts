import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type FeedbackPayload = {
  message: string;
  email?: string;
};

type FeedbackInsert = {
  message: string;
  email: string | null;
};

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<FeedbackPayload>;

    const message =
      typeof body.message === "string"
        ? body.message.trim()
        : "";

    const email =
      typeof body.email === "string"
        ? body.email.trim()
        : "";

    if (message.length < 5) {
      return NextResponse.json(
        { error: "Feedback must contain at least 5 characters." },
        { status: 400 },
      );
    }

    if (message.length > 5000) {
      return NextResponse.json(
        { error: "Feedback is too long." },
        { status: 400 },
      );
    }

    if (email && !isValidEmail(email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 },
      );
    }

    const feedback: FeedbackInsert = {
      message,
      email: email || null,
    };

    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from("feedback")
      .insert(feedback);

    if (error) {
      console.error("Feedback insertion failed:", error);

      return NextResponse.json(
        { error: "Unable to submit feedback." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { success: true },
      { status: 201 },
    );
  } catch (error) {
    console.error("Feedback API error:", error);

    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 },
    );
  }
}