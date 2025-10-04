import { NextResponse } from "next/server";
import { supabase } from "@/supabaseClient";
import { GoogleGenerativeAI } from "@google/generative-ai";

//Error Handling - gemini API key does not exist
const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
  console.error("❌ GEMINI_API_KEY is not set.");
}

const genAI = new GoogleGenerativeAI(geminiApiKey || "");
interface Program {
  id: string;
  title: string;
  school: string;
  description: string;
  riasec_tags: string[];
}

// Prompting part
function buildPrompt(riasecCode: string, programs: Program[]): string {
  return `
You are a career recommendation system.
Your task is to suggest the best 10 programs for a student based on their RIASEC code.

RIASEC Code: ${riasecCode}

Available Programs:
${programs
    .map(
      (p) => `- Program: ${p.title}
  School: ${p.school}
  Description: ${p.description}
  Tags: ${p.riasec_tags.join(", ")}`
    )
    .join("\n\n")}

Based on the RIASEC code provided, suggest the top 10 programs from the list above.
Format your response as a numbered list of program titles only.
Example:
1. Program Title A
2. Program Title B
3. Program Title C
`;
}

export async function POST(req: Request) {
  try {

    const { riasecCode }: { riasecCode: string } = await req.json();
    console.log("➡️ Received RIASEC code:", riasecCode);

    if (!riasecCode) {
      return NextResponse.json(
        { error: "Missing 'riasecCode' in request body." },
        { status: 400 }
      );
    }

    const { data: programs, error } = await supabase
      .from("programs")
      .select("*")
      .returns<Program[]>();

    if (error) {
      console.error("❌ Supabase query error:", error);
      throw new Error(`Failed to fetch programs from Supabase: ${error.message}`);
    }

    if (!programs || programs.length === 0) {
      console.warn("⚠️ No programs found in Supabase.");
      return NextResponse.json(
        { message: "No programs available for recommendation." },
        { status: 200 }
      );
    }

    console.log(`✅ Fetched ${programs.length} programs from Supabase.`);

    const prompt = buildPrompt(riasecCode, programs);

    if (!geminiApiKey) {
      return NextResponse.json(
        { error: "Gemini API key is not configured." },
        { status: 500 }
      );
    }

    // Call Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const geminiResponseText = result.response.text();
    console.log("✅ Gemini response:", geminiResponseText);

    // Parse Gemini output
    const parsedRecommendations = geminiResponseText
      .split("\n")
      .map((line) => line.replace(/^\d+\.\s*/, "").trim())
      .filter(Boolean);

    // Match against Supabase only
    const matchedPrograms = programs.filter((p) =>
      parsedRecommendations.some((title) =>
        p.title.toLowerCase().includes(title.toLowerCase())
      )
    );

    // Return only Supabase-backed recommendations
    return NextResponse.json({
      recommendations: matchedPrograms.map((p) => ({
        title: p.title,
        reason: p.description || "No description available",
      })),
      raw: geminiResponseText,
    });
  } catch (err: any) {
    console.error("❌ API error:", err);
    return NextResponse.json(
      { error: err.message || "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
