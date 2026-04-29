import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type RouteContext = {
  params: Promise<{
    courseCode?: string;
    id?: string;
  }>;
};

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const resolvedParams = await params;
    const rawParam = resolvedParams.courseCode || resolvedParams.id;

    if (!rawParam) {
      return NextResponse.json(
        { error: "Missing course code" },
        { status: 400 }
      );
    }

    const decodedCode = decodeURIComponent(rawParam).trim();
    const isNumeric = /^\d+$/.test(decodedCode);

    let syllabus: any = null;

    const { data: syllabusByCode, error: syllabusCodeError } = await supabase
      .from("syllabi_v2")
      .select(`
        *,
        online_tutors (
          name,
          tutor_pic_url,
          tutor_bio
        )
      `)
      .ilike("course_code", decodedCode)
      .maybeSingle();

    if (syllabusCodeError) {
      return NextResponse.json(
        { error: syllabusCodeError.message },
        { status: 500 }
      );
    }

    syllabus = syllabusByCode;

    if (!syllabus && isNumeric) {
      const { data: syllabusById, error: syllabusIdError } = await supabase
        .from("syllabi_v2")
        .select(`
          *,
          online_tutors (
            name,
            tutor_pic_url,
            tutor_bio
          )
        `)
        .eq("id", Number(decodedCode))
        .maybeSingle();

      if (syllabusIdError) {
        return NextResponse.json(
          { error: syllabusIdError.message },
          { status: 500 }
        );
      }

      syllabus = syllabusById;
    }

    if (!syllabus) {
      return NextResponse.json(
        { error: `Course not found for code: ${decodedCode}` },
        { status: 404 }
      );
    }

    const { data: storefront, error: storefrontError } = await supabase
      .from("online_courses_v2")
      .select("*")
      .eq("syllabus_id", syllabus.id)
      .eq("is_active", true)
      .maybeSingle();

    if (storefrontError) {
      return NextResponse.json(
        { error: storefrontError.message },
        { status: 500 }
      );
    }

    if (!storefront) {
      return NextResponse.json(
        { error: "Course is not active for enrollment" },
        { status: 404 }
      );
    }

    let activeBatch: any = null;

    if (storefront.active_batch_no) {
      const { data: batch, error: batchError } = await supabase
        .from("course_batches_v2")
        .select("*")
        .eq("syllabus_id", syllabus.id)
        .eq("batch_no", storefront.active_batch_no)
        .maybeSingle();

      if (batchError) {
        return NextResponse.json(
          { error: batchError.message },
          { status: 500 }
        );
      }

      activeBatch = batch;
    }

    const tutor = Array.isArray(syllabus.online_tutors)
      ? syllabus.online_tutors[0]
      : syllabus.online_tutors;

    const payload = {
      id: String(syllabus.id),
      syllabus_id: syllabus.id,
      course_code: syllabus.course_code,

      title: storefront.name || syllabus.name || "Untitled Course",
      name: storefront.name || syllabus.name || "Untitled Course",
      description: syllabus.description || null,

      fee: Number(storefront.fee || 0),
      discount: Number(storefront.discount || 0),
      is_active: Boolean(storefront.is_active),
      active_batch_no: storefront.active_batch_no || null,

      batch_id: activeBatch?.id || null,
      active_batch_id: activeBatch?.id || null,
      batch_no: activeBatch?.batch_no || storefront.active_batch_no || null,

      start_datetime: activeBatch?.start_datetime || null,
      timing: activeBatch?.timing || "TBA",
      duration: syllabus.duration || "TBA",

      demo_video_url: syllabus.demo_video_url || null,
      cover_pic: syllabus.cover_pic || "/placeholder-course.jpg",
      syllabus_url: syllabus.syllabus_pdf || syllabus.syllabus_url || "",

      category: syllabus.category || "General",
      difficulty_level: syllabus.difficulty_level || "Beginner",
      learning_outcomes: syllabus.learning_outcomes || null,
      faqs: syllabus.faqs || null,

      tutor_name: tutor?.name || null,
      tutor_pic_url: tutor?.tutor_pic_url || null,
      tutor_bio: tutor?.tutor_bio || null,
    };

    return NextResponse.json(payload);
  } catch (error: any) {
    console.error("Course detail API error:", error);

    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}