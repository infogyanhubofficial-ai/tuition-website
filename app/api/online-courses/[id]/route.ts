import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase"; 

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Define as Promise
) {
  try {
    // 1. Await the params to get the ID
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    // 2. Query Supabase
    const { data: course, error } = await supabase
      .from("online-courses") 
      .select("*")
      .eq("id", id) // Ensure your column in Supabase is named 'id'
      .single();

    if (error || !course) {
      console.error("Supabase Error:", error);
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json(course);
  } catch (error) {
    console.error("Server Error:", error);
    return NextResponse.json({ error: "Bad Request" }, { status: 400 });
  }
}