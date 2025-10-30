import { NextResponse } from "next/server";
import { supabase } from "@/supabaseClient";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get("lat") || "0");
    const lng = parseFloat(searchParams.get("lng") || "0");

    if (!lat || !lng) {
      return NextResponse.json({ error: "Missing lat/lng parameters" }, { status: 400 });
    }

    console.log("📍 Calling get_nearby_schools with:", lat, lng);

    //  Ensures parameter names match your SQL function exactly
    const { data, error } = await supabase.rpc("get_nearby_schools", {
      user_lat: lat,
      user_lng: lng,
    });

    if (error) {
      console.error("❌ Supabase RPC error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("Supabase RPC returned:", data);

    // Return the result
    return NextResponse.json(data || []);
  } catch (err) {
    console.error("💥 Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
