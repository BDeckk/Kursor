import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function GET(request: Request) {
  console.log("🎨 Gemini image generation API hit!");

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  if (!process.env.GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY not found");
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 500 }
    );
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // ✅ Use Imagen 3.0 model for image generation
    const model = genAI.getGenerativeModel({ model: "imagen-3.0" });

    const prompt = `Create a professional, modern, high-quality image representing "${query}".
    The image should be suitable for an educational program page, vibrant, engaging, and inspirational.`;

    console.log("💭 Generating image with prompt:", prompt);

    const result = await model.generateImage(prompt);

    // Extract base64 image data
    const imageBase64 = result.image?.base64 || result.images?.[0]?.base64;

    if (!imageBase64) {
      console.warn("⚠️ No image returned by Gemini, using placeholder");
      return NextResponse.json({
        photoUrl: "https://placehold.co/800x400/e2e8f0/64748b?text=AI+Image+Unavailable",
      });
    }

    // Convert base64 → data URL
    const photoUrl = `data:image/png;base64,${imageBase64}`;
    console.log("✅ AI image generated successfully");
    return NextResponse.json({ photoUrl });

  } catch (error) {
    console.error("❌ Gemini error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate image" },
      { status: 500 }
    );
  }
}
