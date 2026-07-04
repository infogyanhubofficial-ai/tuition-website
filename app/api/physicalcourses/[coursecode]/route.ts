import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client using the service role key.
// This key must NEVER be exposed to the client — only use it inside
// server-only files like this API route (app/api/**/route.ts).
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export const dynamic = "force-dynamic"; // always fetch fresh data, no caching

export async function GET(
  request: Request,
  { params }: { params: Promise<{ coursecode: string }> }
) {
  try {
    const { coursecode } = await params;

    if (!coursecode) {
      return NextResponse.json(
        { error: "Course code is required." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("physical_classes")
      .select(
        `
        id,
        title,
        category,
        course_code,
        description,
        location,
        start_date,
        timing,
        duration_weeks,
        price,
        discount_price,
        max_seats,
        enrolled_count,
        syllabus_id,
        status,
        is_active,
        created_at,
        updated_at
      `
      )
      .eq("course_code", coursecode)
      .eq("is_active", true)
      .single();

    if (error) {
      // PGRST116 = no rows found for .single()
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Batch not found." },
          { status: 404 }
        );
      }
      console.error("[physical_classes/:coursecode] Supabase error:", error.message);
      return NextResponse.json(
        { error: "Failed to fetch batch details." },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Batch not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("[physical_classes/:coursecode] Unexpected error:", err);
    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 }
    );
  }
}