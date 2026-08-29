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
      .from("physicalcourses")
      .select(`
        id,
        title,
        course_code,
        course_image_url,
        instructor_image_url,
        category,
        learning_outcomes,
        instructor_name,
        location,
        start_date,
        timing,
        duration_weeks,
        price,
        discount_price,
        max_seats,
        enrolled_count,
        is_active,
        created_at,
        updated_at,
        tutor_bio,
        batch_no
      `)
      .eq("is_active", true)
      .order("start_date", { ascending: true });

    if (error) {
      console.error("[physicalcourses] Supabase Error:", error);

      return NextResponse.json(
        {
          error: "Failed to fetch physical courses.",
        },
        { status: 500 }
      );
    }

    const formattedData = (data ?? []).map((course) => ({
      ...course,
      price: Number(course.price),
      discount_price:
        course.discount_price !== null
          ? Number(course.discount_price)
          : null,
    }));

    return NextResponse.json(formattedData, { status: 200 });
  } catch (err) {
    console.error("[physicalcourses] Unexpected Error:", err);

    return NextResponse.json(
      {
        error: "Unexpected server error.",
      },
      { status: 500 }
    );
  }
}