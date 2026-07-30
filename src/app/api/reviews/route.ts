import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { reviewSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = reviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        success: true,
        message: "Thank you. Your review will appear after admin approval. (Development mode — configure Supabase to persist.)",
        devFallback: true,
      });
    }

    const userClient = await createClient();
    const {
      data: { user },
    } = await userClient.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please sign in to submit a review." },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from("reviews").insert({
      name: parsed.data.name,
      city: parsed.data.city || null,
      service: parsed.data.service || null,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
      consent: parsed.data.consent,
      status: "pending",
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Thank you. Your review will appear after admin approval.",
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
