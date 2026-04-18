import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase"; 

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Define as Promise
) {
  try {
    // 1. Await the params to get the identifier (which is now likely a Course Name)
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Invalid ID or Course Name" }, { status: 400 });
    }

    // 2. Safely decode the URL to turn %20 back into spaces
    const decodedIdentifier = decodeURIComponent(id);

    // 3. Smart check: Is this a UUID or a Course Title?
    // This regex checks if the string matches the standard UUID format
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decodedIdentifier);
    
    // If it's a UUID, search the 'id' column. Otherwise, search the 'title' column.
    const searchColumn = isUUID ? "id" : "title";

    // 4. Query Supabase dynamically based on the identifier type
    const { data: course, error } = await supabase
      .from("online_courses") 
      .select("*")
      .eq(searchColumn, decodedIdentifier) 
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