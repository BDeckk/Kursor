import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  console.log("🎨 Image generation API hit!");

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  try {
    console.log("🔍 Finding image for:", query);

    // Gets the appropriate image URL based on program title
    const imageUrl = getImageUrlForProgram(query);

    console.log("✅ Image URL selected:", imageUrl);
    return NextResponse.json({ photoUrl: imageUrl });

  } catch (error) {
    console.error("❌ Error:", error);
    
    // Fallback to default career image
    return NextResponse.json({
      photoUrl: "/career-images/programs-career.svg"
    });
  }
}

function getImageUrlForProgram(title: string): string {
  // Extract key words for visual elements - map to image URLs
  const words = title.toLowerCase();
  
  if (words.includes("computer") || words.includes("software") || words.includes("it")) {
    return "/career-images/programs-computer.svg";
  } else if (words.includes("business") || words.includes("management")) {
    return "/career-images/programs-business.svg";
  } else if (words.includes("engineering")) {
    return "/career-images/programs-engineer.svg";
  } else if (words.includes("science") || words.includes("biology") || words.includes("chemistry")) {
    return "/career-images/programs-science.svg";
  } else if (words.includes("art") || words.includes("design")) {
    return "/career-images/programs-artist.svg";
  } else if (words.includes("medicine") || words.includes("health") || words.includes("nursing")) {
    return "/career-images/programs-medicine.svg";
  } else if (words.includes("law")) {
    return "/career-images/programs-law.svg";
  } else if (words.includes("education") || words.includes("teaching")) {
    return "/career-images/programs-education.svg";
  } else if (words.includes("psychology")) {
    return "/career-images/programs-psychology.svg";
  } else if (words.includes("accounting") || words.includes("finance")) {
    return "/career-images/programs-accountant.svg";
  }
  
  // Default: university/education
  return "/career-images/programs-career.svg";
}