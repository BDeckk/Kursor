import { NextResponse } from "next/server";
import { supabase } from "@/supabaseClient";
import { GoogleGenerativeAI } from "@google/generative-ai";

const geminiApiKey = process.env.GEMINI_API_KEY;
const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

interface TopUniversity {
  university_id: string; // matched to Supabase or temporary
  schoolname: string;
  image?: string | null;
  rank: number;
  reason?: string;
}

function buildPrompt() {
  return `
You are an assistant that retrieves the **Top 10 universities in Cebu, Philippines** according to the latest information on the EduRank website (edurank.org).

Return ONLY a valid JSON array in this format:
[
  { "rank": 1, "name": "University Name", "reason": "Short reason why it is ranked highly" },
  ...
]

Rules:
- Include only universities in Cebu.
- Rank them from 1 (highest) to 10 (lowest).
- Return ONLY JSON, no extra text.
`;
}

function normalize(str?: string | null) {
  return str ? str.toLowerCase().trim().replace(/\s+/g, " ") : "";
}

export async function GET() {
  try {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

    // 1 - Check Supabase for this month's top universities
    const { data: existing, error } = await supabase
      .from("top_universities")
      .select("*")
      .gte("created_at", firstDay)
      .lt("created_at", nextMonth)
      .order("rank", { ascending: true });

    if (error) throw new Error(error.message);
    if (existing && existing.length > 0) {
      return NextResponse.json({ topUniversities: existing });
    }

    // 2 -  Call Gemini if no existing data
    let geminiData: { rank: number; name: string; reason?: string }[] = [];
    if (genAI) {
      try {
        const prompt = buildPrompt();
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const match = text.match(/\[[\s\S]*\]/);
        if (match) geminiData = JSON.parse(match[0]);
      } catch (err) {
        console.warn("Gemini API failed, using fallback:", err);
      }
    }

    // 3️ -  Fallback
    if (!geminiData || geminiData.length === 0) {
      geminiData = [
        { rank: 1, name: "University of San Carlos (USC – Talamban Campus)" },
        { rank: 2, name: "University of San Jose – Recoletos (USJ-R)" },
        { rank: 3, name: "Cebu Normal University (CNU)" },
        { rank: 4, name: "Southwestern University PHINMA" },
        { rank: 5, name: "Cebu Institute of Medicine (CIM)" },
        { rank: 6, name: "University of the Visayas (UV – Main Campus)" },
        { rank: 7, name: "Cebu Institute of Technology – University (CIT-U)" },
        { rank: 8, name: "University of Cebu (UC – Main Campus)" },
        { rank: 9, name: "Cebu Technological University" },
        { rank: 10, name: "University of Southern Philippines Foundation (USPF)" },
      ];
    }

    // 4 - Map Gemini/fallback to Supabase schools
    const { data: schools } = await supabase.from("schools").select("*");
    const topUniversities: TopUniversity[] = geminiData.map((g, i) => {
      const matched = schools?.find(s => normalize(s.name) === normalize(g.name));
      return {
        university_id: matched?.id ?? `no_id_${i + 1}`,
        schoolname: matched?.name ?? g.name,
        image: matched?.school_logo ?? null,
        rank: g.rank,
        reason: g.reason ?? "Highly reputable university in Cebu",
      };
    });

    // 5️ -  Save into Supabase
    await supabase.from("top_universities").insert(
      topUniversities.map(u => ({
        university_id: u.university_id,
        schoolname: u.schoolname,
        image: u.image,
        rank: u.rank,
        reason: u.reason,
        created_at: new Date().toISOString(),
      }))
    );

    return NextResponse.json({ topUniversities });
  } catch (err: any) {
    console.error("Error in /api/top-universities:", err);
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}
