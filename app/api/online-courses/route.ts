import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase"; 

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("online-courses") // Match your table name
      .select("*")
      .order("start_datetime", { ascending: true });

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}