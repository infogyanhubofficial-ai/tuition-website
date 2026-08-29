import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

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

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .select(`
        id,
        name,
        overall_rating,
        testimonial,
        syllabi_v2(name)
      `)
      .not("testimonial", "is", null)
      .not("name", "is", null)
      .eq("status", "approved")
      .order("overall_rating", { ascending: false });

    if (error) {
      console.error("[reviews] Supabase Error:", error);

      return NextResponse.json(
        { error: "Failed to fetch reviews." },
        { status: 500 }
      );
    }

    return NextResponse.json(data ?? [], { status: 200 });
  } catch (err) {
    console.error("[reviews] Unexpected Error:", err);

    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 }
    );
  }
}