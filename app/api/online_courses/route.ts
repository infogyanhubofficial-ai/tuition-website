import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data: storefront, error: storefrontError } = await supabase
      .from("online_courses_v2")
      .select("*")
      .eq("is_active", true);

    if (storefrontError) throw storefrontError;
    if (!storefront?.length) return NextResponse.json([]);

    const syllabusIds = storefront
      .map((course) => course.syllabus_id)
      .filter(Boolean);

    if (!syllabusIds.length) return NextResponse.json([]);

    const { data: syllabi, error: syllabiError } = await supabase
      .from("syllabi_v2")
      .select(
        "id, course_code, name, category, difficulty_level, duration, learning_outcomes, cover_pic, syllabus_pdf"
      )
      .in("id", syllabusIds);

    if (syllabiError) throw syllabiError;

    const { data: batches, error: batchesError } = await supabase
      .from("course_batches_v2")
      .select("id, syllabus_id, batch_no, start_datetime, timing")
      .in("syllabus_id", syllabusIds);

    if (batchesError) throw batchesError;

    const mappedCourses = storefront.map((course) => {
      const syllabus = syllabi?.find(
        (item) => item.id === course.syllabus_id
      );

      const activeBatch = batches?.find(
        (batch) =>
          batch.syllabus_id === course.syllabus_id &&
          batch.batch_no === course.active_batch_no
      );

      return {
        id: String(course.syllabus_id),
        syllabus_id: course.syllabus_id,
        course_code: syllabus?.course_code || String(course.syllabus_id),

        title: course.name || syllabus?.name || "Untitled Course",
        name: course.name || syllabus?.name || "Untitled Course",

        fee: Number(course.fee || 0),
        discount: Number(course.discount || 0),
        is_active: Boolean(course.is_active),

        active_batch_no: course.active_batch_no || null,
        batch_id: activeBatch?.id || null,
        active_batch_id: activeBatch?.id || null,
        batch_no: activeBatch?.batch_no || course.active_batch_no || null,

        duration: syllabus?.duration || "Self-Paced",
        timing: activeBatch?.timing || "TBA",

        category: syllabus?.category || "General",
        difficulty_level: syllabus?.difficulty_level || "Beginner",

        learning_outcomes: syllabus?.learning_outcomes || null,
        start_datetime: activeBatch?.start_datetime || null,

        syllabus_url: syllabus?.syllabus_pdf || "",
        cover_pic: syllabus?.cover_pic || "/placeholder-course.jpg",
      };
    });

    mappedCourses.sort((a, b) => {
      const timeA = a.start_datetime
        ? new Date(a.start_datetime).getTime()
        : Infinity;

      const timeB = b.start_datetime
        ? new Date(b.start_datetime).getTime()
        : Infinity;

      return timeA - timeB;
    });

    return NextResponse.json(mappedCourses);
  } catch (error: any) {
    console.error("Online courses API error:", error);

    return NextResponse.json(
      { error: error?.message || "Failed to fetch online courses" },
      { status: 500 }
    );
  }
}