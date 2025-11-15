import { NextResponse } from "next/server";
import { supabase } from "@/supabaseClient";
import { GoogleGenerativeAI } from "@google/generative-ai";

const geminiApiKey = process.env.GEMINI_API_KEY;

if (!geminiApiKey) {
  console.error("❌ Missing GEMINI_API_KEY");
}

const genAI = new GoogleGenerativeAI(geminiApiKey || "");

// Program interface
interface Program {
  id: string;
  title: string;
  school: string;
  description: string;
  riasec_tags: any; // ← allow any shape, we validate manually
}

/** Normalize text for matching */
function normalizeString(str: string): string {
  return str.toLowerCase().trim().replace(/\s+/g, " ").replace(/[^\w\s]/g, "");
}

/** Build concise prompt */
function buildPrompt(riasecCode: string, programs: Program[]): string {
  return `
You are a strict recommendation system.
Choose exactly 10 programs that best match the RIASEC code.

RIASEC Code: ${riasecCode}

Programs:
${programs
    .map(
      (p, idx) =>
        `${idx + 1}. "${p.title}" — Tags: ${
          Array.isArray(p.riasec_tags)
            ? p.riasec_tags.join(", ")
            : "INVALID_TAGS"
        }`
    )
    .join("\n")}

Return ONLY a JSON array of 10 titles.
`;
}

/** Match Gemini output titles to program objects */
function findMatchingPrograms(geminiTitles: string[], programs: Program[]): Program[] {
  const matched: Program[] = [];

  for (const title of geminiTitles) {
    const normalized = normalizeString(title);

    const found =
      programs.find((p) => normalizeString(p.title) === normalized) ||
      programs.find((p) => normalizeString(p.title).includes(normalized));

    if (found && !matched.some((m) => m.id === found.id)) {
      matched.push(found);
    }
  }

  return matched;
}

/** Fallback deterministic recommendations */
function fallbackRecommendations(riasecCode: string, programs: Program[]): Program[] {
  const safePrograms = programs.filter((p) => Array.isArray(p.riasec_tags));

  const ranked = safePrograms
    .map((p) => ({
      ...p,
      score: p.riasec_tags.filter(
        (t: any) => typeof t === "string" && riasecCode.includes(t.toUpperCase())
      ).length,
    }))
    .sort((a, b) => b.score - a.score);

  return ranked.slice(0, 10);
}

/** MAIN POST HANDLER */
export async function POST(req: Request) {
  try {
    const { riasecCode }: { riasecCode: string } = await req.json();

    if (!riasecCode) {
      return NextResponse.json(
        { error: "Missing 'riasecCode'." },
        { status: 400 }
      );
    }

    // ✅ Get all programs (simple, safe)
    const { data: programs, error } = await supabase
      .from("programs")
      .select("*");

    if (error) throw new Error("Supabase error: " + error.message);
    if (!programs || programs.length === 0) {
      return NextResponse.json({
        recommendations: [],
        message: "No programs found."
      });
    }

    // ✅ SAFE FILTERING
    const filteredPrograms = programs.filter((p) => {
      if (!Array.isArray(p.riasec_tags)) return false;
      return p.riasec_tags.some(
        (tag: any) =>
          typeof tag === "string" &&
          riasecCode.includes(tag.toUpperCase())
      );
    });

    if (filteredPrograms.length === 0) {
      return NextResponse.json({
        recommendations: [],
        message: "No programs match your RIASEC code.",
      });
    }

    // ✅ SAFE SORTING
    const sortedPrograms = filteredPrograms
      .map((p) => ({
        ...p,
        matchCount: (p.riasec_tags || []).filter(
          (t: any) =>
            typeof t === "string" &&
            riasecCode.includes(t.toUpperCase())
        ).length,
      }))
      .sort((a, b) => b.matchCount - a.matchCount);

    // ✅ Reduce load — send ONLY top 30 to Gemini
    const reducedPrograms = sortedPrograms.slice(0, 30);

    let parsedTitles: string[] = [];

    // ✅ GEMINI CALL (SAFE)
    if (geminiApiKey) {
      try {
        const model = genAI.getGenerativeModel({
          model: "gemini-2.0-flash",
          generationConfig: { temperature: 0.0 },
        });

        const result = await model.generateContent(buildPrompt(riasecCode, reducedPrograms));
        const geminiText = result.response.text().trim();

        const match = geminiText.match(/\[[\s\S]*\]/);
        parsedTitles = match ? JSON.parse(match[0]) : [];
      } catch (err) {
        console.error("⚠️ Gemini failed, fallback activated:", err);
        parsedTitles = [];
      }
    }

    // ✅ Match AI-selected titles
    let matchedPrograms =
      parsedTitles.length > 0
        ? findMatchingPrograms(parsedTitles, reducedPrograms)
        : [];

    // ✅ Fallback if Gemini fails or returns weak matches
    if (matchedPrograms.length < 5) {
      matchedPrograms = fallbackRecommendations(riasecCode, reducedPrograms);
    }

    const recommendations = matchedPrograms.slice(0, 10).map((p) => ({
      id: p.id,
      title: p.title,
      school: p.school,
      reason: p.description || "No description available",
    }));

    return NextResponse.json({
      recommendations,
      debug: {
        totalPrograms: programs.length,
        filteredPrograms: filteredPrograms.length,
        sentToGemini: reducedPrograms.length,
        geminiUsed: parsedTitles.length > 0,
        matchedCount: matchedPrograms.length,
      },
    });
  } catch (err: any) {
    console.error("🔥 SERVER CRASH DEBUG:", err);
    return NextResponse.json(
      { error: err?.message || "Unexpected server error" },
      { status: 500 }
    );
  }
}
