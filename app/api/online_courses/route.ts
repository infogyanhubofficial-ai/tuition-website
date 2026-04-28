import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase"; 

export async function GET() {
  try {
    // 1. Fetch Tier 2: Storefront Listings (Only active courses)
    const { data: storefront, error: storefrontError } = await supabase
      .from("online_courses_v2")
      .select("*")
      .eq("is_active", true);

    if (storefrontError) throw storefrontError;

    if (!storefront || storefront.length === 0) {
      return NextResponse.json([]);
    }

    const syllabusIds = storefront.map((c) => c.syllabus_id);

    // 2. Fetch Tier 1: Master Templates (Heavy Content)
    // 🟢 course_code and description are safely fetched here
    const { data: syllabi, error: syllabiError } = await supabase
      .from("syllabi_v2")
      .select("id, course_code, category, difficulty_level, duration, description, cover_pic, syllabus_pdf")
      .in("id", syllabusIds);

    if (syllabiError) throw syllabiError;

    // 3. Fetch Tier 3: Live Logistics (Active Batches Only)
    // 🟢 FIX: Added 'id' to the select statement so we can map batch_id
    const { data: batches, error: batchesError } = await supabase
      .from("course_batches_v2")
      .select("id, syllabus_id, batch_no, start_datetime, timing")
      .in("syllabus_id", syllabusIds);

    if (batchesError) throw batchesError;

    // 4. Merge into the flat interface
    const mappedCourses = storefront.map((course) => {
      const syllabus = syllabi.find((s) => s.id === course.syllabus_id) || {};
      
      const activeBatch = batches.find(
        (b) => b.syllabus_id === course.syllabus_id && b.batch_no === course.active_batch_no
      ) || {};

      return {
        id: course.syllabus_id.toString(), 
        course_code: syllabus.course_code || course.syllabus_id.toString(),
        title: course.name,
        // 🟢 FIX: Map the batch_id so the frontend can use it for enrollments_v2
        batch_id: activeBatch.id || null, 
        duration: syllabus.duration || "Self-Paced",
        timing: activeBatch.timing || "TBA",
        fee: course.fee,
        discount: course.discount,
        category: syllabus.category || "General",
        difficulty_level: syllabus.difficulty_level || "Beginner",
        description: syllabus.description || "",
        start_datetime: activeBatch.start_datetime || null,
        syllabus_url: syllabus.syllabus_pdf || "",
        cover_pic: syllabus.cover_pic || "/placeholder-course.jpg",
        is_active: course.is_active,
      };
    });

    // Default sort by Earliest First
    mappedCourses.sort((a, b) => {
      const timeA = a.start_datetime ? new Date(a.start_datetime).getTime() : Infinity;
      const timeB = b.start_datetime ? new Date(b.start_datetime).getTime() : Infinity;
      return timeA - timeB;
    });

    return NextResponse.json(mappedCourses);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}