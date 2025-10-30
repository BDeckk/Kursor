import { NextResponse } from "next/server";
import { supabase } from "@/supabaseClient";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { randomUUID } from "crypto";

const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
  console.error("❌ GEMINI_API_KEY is missing");
}

const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

interface School {
  id: string;
  name: string;
  location?: string | null;
  description?: string | null;
  school_logo?: string | null;
  school_picture?: string | null;
}

// ✅ Build prompt for Gemini
function buildPrompt(schools: School[]): string {
  return `
You are a university ranking assistant for the region of Cebu, Philippines.
Below is a list of schools and universities in the area.

List of institutions:
${schools
  .map(
    (s, i) =>
      `${i + 1}. ${s.name} — Location: ${s.location ?? "N/A"}. ${
        s.description ?? ""
      }`
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

// Normalize for matching - with null safety
function normalize(str: string | null | undefined): string {
  if (!str) return "";
  return str.toLowerCase().trim().replace(/\s+/g, " ");
}

export async function GET() {
  try {
    // Check if Gemini API is configured
    if (!genAI) {
      console.error("❌ Gemini API not initialized - missing API key");
      return NextResponse.json(
        { error: "Gemini API key is not configured" },
        { status: 500 }
      );
    }

    console.log("📡 Fetching schools from Supabase...");

    //  Fetch all schools from Supabase
    const { data, error } = await supabase
      .from("schools")
      .select("*");

    if (error) {
      console.error("❌ Supabase error:", error);
      throw error;
    }

    console.log(`✅ Fetched ${data?.length || 0} schools`);

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "No schools found in database" },
        { status: 404 }
      );
    }

    // Filter out schools without names
    const validSchools = data.filter((s) => s.name && s.name.trim() !== "");
    console.log(`✅ ${validSchools.length} schools have valid names`);

    if (validSchools.length === 0) {
      return NextResponse.json(
        { error: "No schools with valid names found" },
        { status: 404 }
      );
    }

    //  Build prompt for Gemini
    console.log("🔨 Building prompt for Gemini...");
    const prompt = buildPrompt(validSchools);

    console.log("🤖 Calling Gemini API...");
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    console.log("🧠 Gemini raw response:", text);

    //  Parse Gemini response JSON
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) {
      console.error("❌ Gemini did not return valid JSON. Response:", text);
      throw new Error("Gemini did not return JSON format");
    }

    let parsed: { rank: number; name: string; reason?: string }[];
    try {
      parsed = JSON.parse(match[0]);
    } catch (parseError) {
      console.error("❌ JSON parse error:", parseError);
      console.error("Attempted to parse:", match[0]);
      throw new Error("Failed to parse Gemini response as JSON");
    }

    console.log(`✅ Parsed ${parsed.length} universities from Gemini`);

    // Match Gemini results to Supabase data
    const matched = parsed
      .map((g) => {
        const normalizedGeminiName = normalize(g.name);

        const found = validSchools.find((s) => {
          const normalizedSchoolName = normalize(s.name);

          // Skip if either name is empty after normalization
          if (!normalizedGeminiName || !normalizedSchoolName) return false;

          // Check both directions: does school name include gemini name OR vice versa
          return (
            normalizedSchoolName.includes(normalizedGeminiName) ||
            normalizedGeminiName.includes(normalizedSchoolName)
          );
        });

        if (!found) {
          console.log(`⚠️ No match found for: ${g.name} - skipping`);
          return null; // Return null for unmatched schools
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

    console.log(`✅ Successfully matched ${matched.length} universities`);

    // 5️Return top 10
    return NextResponse.json({
      topUniversities: matched.slice(0, 10),
      raw: text,
    });
  } catch (err: unknown) {
    console.error("❌ Error in top-universities API:", err);

    // More detailed error logging
    if (err instanceof Error) {
      console.error("Error name:", err.name);
      console.error("Error message:", err.message);
      console.error("Error stack:", err.stack);
    }

    const errorMessage =
      err instanceof Error ? err.message : "Unknown error occurred";

    return NextResponse.json(
      { error: errorMessage, details: String(err) },
      { status: 500 }
    );
  }
}