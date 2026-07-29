// app/api/finance/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
// Make sure these are set in your .env or .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET() {
  try {
    // Query the real data from the public.finance table
    const { data, error } = await supabase
      .from("finance")
      .select("*")
      .order("transaction_date", { ascending: false });

    if (error) {
      console.error("Database Error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Return the data to the client
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error("Server Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}