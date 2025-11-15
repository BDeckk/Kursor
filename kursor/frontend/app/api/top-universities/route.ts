import { NextResponse } from "next/server";
import { supabase } from "@/supabaseClient";
import { GoogleGenerativeAI } from "@google/generative-ai";

const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
  console.error("❌ GEMINI_API_KEY is missing");
}

const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

interface School {
  id: string;
  uni_id: string;
  name: string;
  location?: string | null;
  description?: string | null;
  school_logo?: string | null;
}

// Build Gemini prompt
function buildPrompt(schools: School[]): string {
  return `
You are a university ranking assistant for the region of Cebu, Philippines.
Below is a list of schools and universities in the area.

List of institutions:
${schools
  .map(
    (s, i) =>
      `${i + 1}. ${s.name} — Location: ${s.location ?? "N/A"}. ${s.description ?? ""}`
  )
  .join("\n")}

Your task:
- Based on global university ranking sources like EduRank, QS, and general academic reputation,
- Identify the **Top 10 performing universities in Cebu**.
- Rank them from 1 (highest) to 10 (lowest).
- If any school is clearly not a university (e.g., high school, college branch), exclude it.
- IMPORTANT: Only rank universities that appear in the list above. Do not add universities not in the list.

Return ONLY a JSON array in this format:
[
  { "rank": 1, "name": "University of Example", "reason": "Strong research output and reputation" },
  ...
]

Return only the JSON array, no text before or after.
`;
}

// Normalize strings for matching
function normalize(str: string | null | undefined): string {
  if (!str) return "";
  return str.toLowerCase().trim().replace(/\s+/g, " ");
}

export async function GET() {
  try {
    // Fetch all schools from Supabase
    const { data, error } = await supabase.from("schools").select("*");
    if (error) {
      console.error("❌ Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data || data.length === 0) {
      return NextResponse.json({ error: "No schools found in database" }, { status: 404 });
    }

    const validSchools = data.filter((s) => s.name && s.name.trim() !== "");
    if (validSchools.length === 0) {
      return NextResponse.json(
        { error: "No schools with valid names found" },
        { status: 404 }
      );
    }

    let geminiParsed: { rank: number; name: string; reason?: string }[] = [];

    if (genAI) {
      try {
        console.log("🔨 Building prompt for Gemini...");
        const prompt = buildPrompt(validSchools);

        console.log("🤖 Calling Gemini API...");
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        console.log("🧠 Gemini raw response:", text);

        const match = text.match(/\[[\s\S]*\]/);
        if (match) {
          geminiParsed = JSON.parse(match[0]);
        } else {
          console.warn("⚠️ Gemini did not return valid JSON. Returning empty array.");
        }
      } catch (geminiError) {
        console.error("❌ Error calling Gemini API:", geminiError);
      }
    }

    // Match Gemini results to Supabase schools
    const matched = geminiParsed
      .map((g) => {
        const normalizedGeminiName = normalize(g.name);

        const found = validSchools.find((s) => {
          const normalizedSchoolName = normalize(s.name);
          if (!normalizedGeminiName || !normalizedSchoolName) return false;
          return (
            normalizedSchoolName.includes(normalizedGeminiName) ||
            normalizedGeminiName.includes(normalizedSchoolName)
          );
        });

        if (!found) {
          console.log(`⚠️ No match found for: ${g.name} - skipping`);
          return null;
        }

        return {
          id: found.id,
          schoolname: found.name,
          image: found.school_logo ?? null,
          rank: g.rank,
          reason: g.reason ?? "Highly reputable university in Cebu",
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    // Fallback: if Gemini failed, return top 10 valid schools from Supabase
    const topUniversities =
      matched.length > 0
        ? matched.slice(0, 10)
        : validSchools.slice(0, 10).map((s, i) => ({
            id: s.id,
            schoolname: s.name,
            image: s.school_logo ?? null,
            rank: i + 1,
            reason: "Fallback university ranking",
          }));

    return NextResponse.json({
      topUniversities,
      raw: geminiParsed,
    });
  } catch (err: unknown) {
    console.error("❌ Error in top-universities API:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
