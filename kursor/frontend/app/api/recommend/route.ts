import { NextResponse } from "next/server";
import { supabase } from "@/supabaseClient";
import { GoogleGenerativeAI } from "@google/generative-ai";

const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
  console.error("❌ GEMINI_API_KEY is not set.");
}

const genAI = new GoogleGenerativeAI(geminiApiKey || "");

// Program interface
interface Program {
  id: string;
  title: string;
  school: string;
  description: string;
  riasec_tags: string[];
}

/** Utility: normalize text for matching */
function normalizeString(str: string): string {
  return str.toLowerCase().trim().replace(/\s+/g, " ").replace(/[^\w\s]/g, "");
}

/** Structured prompt for Gemini (low temperature = consistent results) */
function buildPrompt(riasecCode: string, programs: Program[]): string {
  return `
You are a strict recommendation system. 
Your task: choose exactly 10 program titles that best match the given RIASEC code.

RIASEC Code: ${riasecCode}

List of available programs (with RIASEC tags):
${programs
  .map(
    (p, idx) =>
      `${idx + 1}. "${p.title}" — Tags: ${p.riasec_tags.join(", ")}`
  )
  .join("\n")}

Return a JSON array containing exactly 10 titles from the list above.
Return ONLY a valid JSON array like this:
["Program A", "Program B", "Program C", ...]
No extra text, no explanations.
`;
}

/** Tries to match Gemini output titles to Supabase programs */
function findMatchingPrograms(geminiTitles: string[], allPrograms: Program[]): Program[] {
  const matched: Program[] = [];

  for (const title of geminiTitles) {
    const normalized = normalizeString(title);
    let found =
      allPrograms.find((p) => normalizeString(p.title) === normalized) ||
      allPrograms.find((p) => normalizeString(p.title).includes(normalized)) ||
      allPrograms.find((p) => normalized.includes(normalizeString(p.title)));

    if (found && !matched.some((p) => p.id === found.id)) {
      matched.push(found);
    }
  }

  return matched;
}

/** Deterministic fallback: picks programs whose tags match RIASEC code */
function fallbackRecommendations(riasecCode: string, programs: Program[]): Program[] {
  const matched = programs.filter((p) =>
    p.riasec_tags?.some((tag) => riasecCode.includes(tag.toUpperCase()))
  );

  // Sort by number of matching tags (most relevant first)
  const scored = matched
    .map((p) => ({
      ...p,
      matchCount: p.riasec_tags.filter((t) => riasecCode.includes(t.toUpperCase())).length,
    }))
    .sort((a, b) => b.matchCount - a.matchCount);

  return scored.slice(0, 10);
}

/** POST handler */
export async function POST(req: Request) {
  try {
    const { riasecCode }: { riasecCode: string } = await req.json();

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

    if (error) throw new Error(`Supabase error: ${error.message}`);
    if (!programs?.length) {
      return NextResponse.json(
        { message: "No programs found in Supabase." },
        { status: 200 }
      );
    }

    // Build and send prompt
    const prompt = buildPrompt(riasecCode, programs);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: { temperature: 0.0 }, // ✅ deterministic
    });

    const result = await model.generateContent(prompt);
    const geminiText = result.response.text().trim();

    // Try parsing JSON response
    let parsedTitles: string[] = [];
    try {
      const match = geminiText.match(/\[[\s\S]*\]/);
      if (!match) throw new Error("No JSON array found");
      parsedTitles = JSON.parse(match[0]);
      if (!Array.isArray(parsedTitles)) throw new Error("Invalid array format");
    } catch {
      console.warn("⚠️ Gemini response not valid JSON, skipping AI output");
      parsedTitles = [];
    }

    // Try matching
    let matchedPrograms = parsedTitles.length
      ? findMatchingPrograms(parsedTitles, programs)
      : [];

    // Fallback deterministic if Gemini fails or low matches
    if (matchedPrograms.length < 5) {
      console.warn("⚠️ Using fallback deterministic recommendation logic");
      matchedPrograms = fallbackRecommendations(riasecCode, programs);
    }

    // Final recommendations (max 10)
    const recommendations = matchedPrograms.slice(0, 10).map((p) => ({
      id: p.id,
      title: p.title,
      school: p.school,
      reason: p.description || "No description available",
    }));

    // Debug output (only in dev)
    if (process.env.NODE_ENV === "development") {
      console.log("✅ Final Recommendations:", recommendations.map((r) => r.title));
    }

    return NextResponse.json({
      recommendations,
      debug: {
        riasecCode,
        geminiUsed: parsedTitles.length > 0,
        matchedCount: matchedPrograms.length,
      },
    });
  } catch (err: any) {
    console.error("❌ Recommendation API error:", err);
    return NextResponse.json(
      { error: err.message || "Unexpected server error." },
      { status: 500 }
    );
  }
}
