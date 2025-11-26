  import { NextResponse } from "next/server";
  import { supabase } from "@/supabaseClient";
  import { GoogleGenerativeAI } from "@google/generative-ai";

  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!geminiApiKey) console.error("❌ Missing GEMINI_API_KEY");

  const genAI = new GoogleGenerativeAI(geminiApiKey || "");

  interface Program {
    id: string;
    title: string;
    school: string;
    description: string;
    riasec_tags: any;
    required_strand: string | string[];
  }

  function normalizeString(str: string) {
    return str.toLowerCase().trim().replace(/\s+/g, " ").replace(/[^\w\s]/g, "");
  }

  function buildPrompt(riasecCode: string, programs: Program[]) {
    return `
You are a strict recommendation system. 
Your task is to select EXACTLY 10 programs from the list I will give you.

Rules:
1. You MUST only choose titles from the provided list. Never invent new programs.
2. Rank programs by how well their RIASEC tags match the RIASEC code.
3. A tag matches if it appears in the RIASEC code (case-insensitive).
4. Prefer programs with more matching tags.
5. If fewer than 10 programs match, fill the remaining slots with the closest matches (but still from the list).

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

Output format:
Return ONLY a valid JSON array with EXACTLY 10 titles.
Do NOT include explanations, reasoning, or extra text.
`;
  }

  function findMatchingPrograms(geminiTitles: string[], programs: Program[]) {
    const matched: Program[] = [];
    for (const title of geminiTitles) {
      const normalized = normalizeString(title);
      const found =
        programs.find((p) => normalizeString(p.title) === normalized) ||
        programs.find((p) => normalizeString(p.title).includes(normalized));
      if (found && !matched.some((m) => m.id === found.id)) matched.push(found);
    }
    return matched;
  }

  function fallbackRecommendations(riasecCode: string, programs: Program[]): Program[] {
    const safePrograms = programs.filter(p => Array.isArray(p.riasec_tags));
    const ranked = safePrograms
      .map(p => ({
        ...p,
        score: Array.isArray(p.riasec_tags)
          ? p.riasec_tags.filter(
              t => typeof t === "string" && riasecCode.includes(t.toUpperCase())
            ).length
          : 0,
      }))
      .sort((a, b) => b.score - a.score);
    return ranked.slice(0, 10);
  }


  export async function POST(req: Request) {
    try {
      const { riasecCode }: { riasecCode: string } = await req.json();
      if (!riasecCode) return NextResponse.json({ error: "Missing 'riasecCode'." }, { status: 400 });

      const { data: programs, error } = await supabase.from("programs").select("*");
      if (error) throw new Error(error.message);
      if (!programs || programs.length === 0) return NextResponse.json({ recommendations: [] });

      // Filter programs safely
      const filteredPrograms = programs.filter(p => Array.isArray(p.riasec_tags) && p.riasec_tags.some((tag: any) => typeof tag === "string" && riasecCode.includes(tag.toUpperCase())));
      const sortedPrograms = filteredPrograms
        .map(p => ({
          ...p,
          matchCount: (p.riasec_tags || []).filter((t: any) => typeof t === "string" && riasecCode.includes(t.toUpperCase())).length,
        }))
        .sort((a, b) => b.matchCount - a.matchCount)
        .slice(0, 30);

      let parsedTitles: string[] = [];

      if (geminiApiKey) {
        try {
          const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: { temperature: 0.0 },
          });
          const result = await model.generateContent(buildPrompt(riasecCode, sortedPrograms));
          const geminiText = result.response.text().trim();
          const match = geminiText.match(/\[[\s\S]*\]/);
          parsedTitles = match ? JSON.parse(match[0]) : [];
        } catch (err) {
          console.error("⚠️ Gemini failed, fallback activated:", err);
        }
      }

      let matchedPrograms = parsedTitles.length > 0 ? findMatchingPrograms(parsedTitles, sortedPrograms) : [];
      if (matchedPrograms.length < 5) matchedPrograms = fallbackRecommendations(riasecCode, sortedPrograms);

      const recommendations = matchedPrograms.slice(0, 10).map(p => ({
        id: p.id,
        title: p.title,
        school: p.school,
        reason: p.description || "No description available",
        required_strand: p.required_strand || "",
      }));

      return NextResponse.json({
        recommendations,
        debug: {
          totalPrograms: programs.length,
          filteredPrograms: filteredPrograms.length,
          sentToGemini: sortedPrograms.length,
          geminiUsed: parsedTitles.length > 0,
          matchedCount: matchedPrograms.length,
        },
      });
    } catch (err: any) {
      console.error("🔥 SERVER CRASH DEBUG:", err);
      return NextResponse.json({ error: err?.message || "Unexpected server error" }, { status: 500 });
    }
  }
