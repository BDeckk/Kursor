import { NextResponse } from "next/server";
import { supabase } from "@/supabaseClient";

export async function POST(request: Request) {
  console.log("📤 Upload image API route hit!");

  try {
    const body = await request.json();
    const { imageUrl, fileName, programId } = body;

    if (!imageUrl || !fileName) {
      return NextResponse.json(
        { error: "Missing imageUrl or fileName" },
        { status: 400 }
      );
    }
    // info handling
    console.log("📥 Image URL:", imageUrl);
    console.log("📝 File name:", fileName);
    console.log("🆔 Program ID:", programId);

    console.log("⬇️ Downloading image from Pexels...");
    const imgResponse = await fetch(imageUrl);

    if (!imgResponse.ok) {
      throw new Error(`Failed to download: ${imgResponse.status}`);
    }

    const imageBuffer = await imgResponse.arrayBuffer();
    console.log("✅ Downloaded:", (imageBuffer.byteLength / 1024).toFixed(2), "KB");

    console.log("⬆️ Uploading to Supabase Storage...");

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("course-images")
      .upload(fileName, imageBuffer, {
        contentType: "image/jpeg",
        upsert: true, 
      });

    if (uploadError) {
      console.error("❌ Upload error:", uploadError);
      return NextResponse.json(
        { error: "Upload failed", details: uploadError.message },
        { status: 500 }
      );
    }

    console.log("✅ Upload successful:", uploadData?.path);

    // Gets public URL
    const { data } = supabase.storage
      .from("course-images")
      .getPublicUrl(fileName);

    const publicUrl = data.publicUrl;
    console.log("🔗 Public URL:", publicUrl);

    // Update database with image URL
    if (programId) {
      console.log("💾 Updating programs table...");
      const { data: updateData, error: updateError } = await supabase
        .from("programs")
        .update({ image_url: publicUrl })
        .eq("id", programId)
        .select();

      if (updateError) {
        console.error("❌ Database update failed:", updateError);
        return NextResponse.json(
          { error: "Image uploaded but database update failed", details: updateError.message },
          { status: 500 }
        );
      }

      console.log("✅ Database updated successfully:", updateData);
    }

    return NextResponse.json({ publicUrl });
  } catch (err) {
    console.error("❌ Upload failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }
}