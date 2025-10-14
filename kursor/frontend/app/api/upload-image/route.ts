import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function GET(request: Request) {
  console.log("🎨 AI-powered image search API hit!");

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  try {
    console.log("🔍 Original query:", query);
    let keywords = query;

    // ✨ Enhance keywords using Gemini if available
    if (process.env.GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

        const prompt = `Given this academic program name: "${query}", 
        suggest 3-5 relevant keywords for finding a professional stock photo.
        Return only comma-separated keywords.`;

        const result = await model.generateContent(prompt);
        keywords = result.response.text().trim();
        console.log("✨ AI-enhanced keywords:", keywords);
      } catch (aiError) {
        console.warn("⚠️ Gemini failed, using plain query:", aiError);
      }
    }

    // 🖼️ Fetch image from Unsplash API
    const unsplashRes = await fetch(
      `https://api.unsplash.com/photos/random?query=${encodeURIComponent(
        keywords
      )}&orientation=landscape&client_id=${process.env.UNSPLASH_ACCESS_KEY}`
    );

    if (!unsplashRes.ok) {
      const errorText = await unsplashRes.text();
      console.error("❌ Unsplash API error:", errorText);
      return NextResponse.json({ error: "Unsplash API failed" }, { status: 500 });
    }

    const unsplashData = await unsplashRes.json();
    const photoUrl = unsplashData.urls?.regular;

    if (!photoUrl) {
      console.warn("⚠️ No image found, returning placeholder");
      return NextResponse.json({
        photoUrl: "https://placehold.co/800x400/e2e8f0/64748b?text=No+Image+Found",
      });
    }

    console.log("✅ Got Unsplash image:", photoUrl);
    return NextResponse.json({ photoUrl });
  } catch (error) {
    console.error("❌ Error in generate-image:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch image" },
      { status: 500 }
    );
  }
}
