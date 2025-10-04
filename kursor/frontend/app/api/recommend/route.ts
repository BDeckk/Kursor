import { NextResponse } from "next/server";
import { supabase } from "@/supabaseClient";
import { GoogleGenerativeAI } from "@google/generative-ai";

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

// Improved prompt with JSON output format
function buildPrompt(riasecCode: string, programs: Program[]): string {
  return `
You are a career recommendation system.
Your task is to suggest the best 10 programs for a student based on their RIASEC code.

RIASEC Code: ${riasecCode}

Available Programs:
${programs
    .map(
      (p, idx) => `${idx + 1}. Title: "${p.title}"
   School: ${p.school}
   Description: ${p.description}
   RIASEC Tags: ${p.riasec_tags.join(", ")}`
    )
    .join("\n\n")}

IMPORTANT: Based on the RIASEC code provided, suggest the top 10 programs from the list above.
You MUST return ONLY the exact program titles as they appear above, nothing else.
Format your response as a JSON array of exact titles from the list.

Example format:
["Program Title A", "Program Title B", "Program Title C"]

Return ONLY the JSON array, no additional text.
`;
}

// Normalize string for better matching
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s]/g, "");
}

// Better matching function
function findMatchingPrograms(
  geminiTitles: string[],
  allPrograms: Program[]
): Program[] {
  const matched: Program[] = [];
  
  for (const geminiTitle of geminiTitles) {
    const normalizedGemini = normalizeString(geminiTitle);
    
    // Try exact match first
    let found = allPrograms.find(
      (p) => normalizeString(p.title) === normalizedGemini
    );
    
    // If no exact match, try fuzzy match
    if (!found) {
      found = allPrograms.find((p) => {
        const normalizedProgram = normalizeString(p.title);
        return (
          normalizedProgram.includes(normalizedGemini) ||
          normalizedGemini.includes(normalizedProgram)
        );
      });
    }
    
    if (found && !matched.some((p) => p.id === found.id)) {
      matched.push(found);
    }
  }
  
  return matched;
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

    // Fetch programs from Supabase
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

    // Build prompt
    const prompt = buildPrompt(riasecCode, programs);

    if (!geminiApiKey) {
      return NextResponse.json(
        { error: "Gemini API key is not configured." },
        { status: 500 }
      );
    }

    // Call Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    const result = await model.generateContent(prompt);
    const geminiResponseText = result.response.text();
    console.log("✅ Gemini raw response:", geminiResponseText);

    // Parse Gemini response
    let parsedTitles: string[] = [];
    
    try {
      // Try to extract JSON array from response
      const jsonMatch = geminiResponseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        parsedTitles = JSON.parse(jsonMatch[0]);
        console.log("✅ Parsed JSON titles:", parsedTitles);
      } else {
        throw new Error("No JSON array found");
      }
    } catch (parseError) {
      // Fallback: parse line by line
      console.warn("⚠️ JSON parsing failed, using line-by-line parsing");
      parsedTitles = geminiResponseText
        .split("\n")
        .map((line) => line.replace(/^\d+\.\s*/, "").trim())
        .map((line) => line.replace(/^["']|["']$/g, "")) // Remove quotes
        .filter((line) => line && line.length > 3);
      console.log("✅ Parsed line titles:", parsedTitles);
    }

    // Match programs
    const matchedPrograms = findMatchingPrograms(parsedTitles, programs);
    console.log(`✅ Matched ${matchedPrograms.length} programs`);

    // If we matched fewer than expected, log for debugging
    if (matchedPrograms.length < parsedTitles.length) {
      console.warn(
        `⚠️ Only matched ${matchedPrograms.length}/${parsedTitles.length} programs`
      );
      console.warn("Unmatched titles:", 
        parsedTitles.filter(
          (title) => !matchedPrograms.some((p) => 
            normalizeString(p.title) === normalizeString(title)
          )
        )
      );
    }

    // Return recommendations
    return NextResponse.json({
      recommendations: matchedPrograms.slice(0, 10).map((p) => ({
        id: p.id,
        title: p.title,
        school: p.school,
        reason: p.description || "No description available",
      })),
      raw: geminiResponseText,
      debug: {
        parsedTitles,
        matchedCount: matchedPrograms.length,
      },
    });
  } catch (err: any) {
    console.error("❌ API error:", err);
    return NextResponse.json(
      { error: err.message || "An unexpected error occurred." },
      { status: 500 }
    );
  }
}