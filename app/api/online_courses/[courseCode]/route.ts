import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase"; 

export async function GET(
  request: Request,
  { params }: { params: Promise<any> } 
) {
  try {
    const resolvedParams = await params;
    const rawParam = resolvedParams.courseCode || resolvedParams.id;
    
    if (!rawParam) {
      return NextResponse.json({ error: "Missing URL parameter" }, { status: 400 });
    }

    const decodedCode = decodeURIComponent(rawParam).trim();
    const isNumeric = /^\d+$/.test(decodedCode);

    // 1. Fetch Tier 1: Look up syllabus
    const { data: syllabusByCode, error: err1 } = await supabase
      .from("syllabi_v2")
      .select(`*, online_tutors (name, tutor_pic_url, tutor_bio)`)
      .ilike("course_code", decodedCode)
      .maybeSingle();

    if (err1) {
      return NextResponse.json({ error: `Supabase Error (Tier 1): ${err1.message}` }, { status: 500 });
    }

    let syllabus = syllabusByCode;

    // Fallback ID Lookup
    if (!syllabus && isNumeric) {
      const { data: syllabusById, error: err2 } = await supabase
        .from("syllabi_v2")
        .select(`*, online_tutors (name, tutor_pic_url, tutor_bio)`)
        .eq("id", Number(decodedCode))
        .maybeSingle();
      
      if (err2) {
        return NextResponse.json({ error: `Supabase Error (Tier 1 ID): ${err2.message}` }, { status: 500 });
      }
      syllabus = syllabusById;
    }

    if (!syllabus) {
      return NextResponse.json({ error: `Course template strictly not found for code: '${decodedCode}'` }, { status: 404 });
    }

    const syllabusId = syllabus.id;

    // 2. Fetch Tier 2: Storefront Listing
    const { data: storefront, error: storefrontError } = await supabase
      .from("online_courses_v2")
      .select("*")
      .eq("syllabus_id", syllabusId)
      .eq("is_active", true)
      .maybeSingle();

    if (storefrontError) {
      return NextResponse.json({ error: `Supabase Error (Tier 2): ${storefrontError.message}` }, { status: 500 });
    }
    if (!storefront) {
      return NextResponse.json({ error: "Course not active for enrollment" }, { status: 404 });
    }

    // 3. Fetch Tier 3: Active Live Batch
    let activeBatch = null;
    if (storefront.active_batch_no) {
      const { data: batch, error: batchErr } = await supabase
        .from("course_batches_v2")
        .select("*")
        .eq("syllabus_id", syllabusId)
        .eq("batch_no", storefront.active_batch_no)
        .maybeSingle();
        
      if (batchErr) {
        return NextResponse.json({ error: `Supabase Error (Tier 3): ${batchErr.message}` }, { status: 500 });
      }
      activeBatch = batch;
    }

    // 🟢 ARRAY FIX: Safely extract tutor data whether Supabase returns an object OR an array
    const tutorData = Array.isArray(syllabus.online_tutors) 
      ? syllabus.online_tutors[0] 
      : syllabus.online_tutors;

    // 4. Construct Payload
    const payload = {
      id: syllabusId.toString(),
      course_code: syllabus.course_code, 
      title: syllabus.name,
      description: syllabus.description || null, // 🟢 FIX: Added description mapping
      fee: storefront.fee,
      discount: storefront.discount,
      start_datetime: activeBatch?.start_datetime || null,
      duration: syllabus.duration || "TBA",
      timing: activeBatch?.timing || "TBA",
      demo_video_url: syllabus.demo_video_url,
      cover_pic: syllabus.cover_pic,
      syllabus_url: syllabus.syllabus_pdf,
      learning_outcomes: syllabus.learning_outcomes,
      faqs: syllabus.faqs,
      
      tutor_name: tutorData?.name || null,
      tutor_pic_url: tutorData?.tutor_pic_url || null,
      tutor_bio: tutorData?.tutor_bio || null,
      
      batch_id: activeBatch?.id || null // 🟢 FIX: Renamed to batch_id to match frontend
    };

    return NextResponse.json(payload);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}