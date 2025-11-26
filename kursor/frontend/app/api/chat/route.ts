import { NextResponse } from "next/server";
import { supabase } from "@/supabaseClient";
import { GoogleGenerativeAI } from "@google/generative-ai";

const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) console.error("❌ Missing GEMINI_API_KEY");

const genAI = new GoogleGenerativeAI(geminiApiKey || "");

export async function POST(req: Request) {
  try {
    const { question } = await req.json();
    if (!question) {
      return NextResponse.json({ answer: "Missing 'question'." }, { status: 400 });
    }

    // Fetch Cebu City schools from Supabase (raw data)
    const { data: schools } = await supabase
      .from("schools")
      .select("*");

    const schoolContext = schools && schools.length > 0
      ? schools.map((s: any) => `${s.name}: ${s.available_courses}: ${s.location} : ${s.description}`).join("\n")
      : "No additional database info available.";

    // a prompt with rules and request that allow AI to use its own knowledge
    const prompt = `
You are a knowledgeable career advisor AI focused on Cebu City universities, colleges, and programs. 
You can answer questions about:
- Schools/universities in Cebu
- Available courses and programs
- Degree descriptions
- Career paths related to courses

Use your general knowledge first. 
If the database below has extra info, incorporate it. Do not rely solely on it.

Database info:
${schoolContext}

Rules:
1. Answer questions about Cebu City schools and courses using your knowledge.
2. If the question is outside this domain, politely refuse.
3. Provide useful, accurate, and concise answers.
4. Include helpful details like course description, career tips, or school location when relevant.

User Question:
${question}
`;

    let answer = "Sorry, I cannot answer this question.";
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: { temperature: 0.2 },
      });

      const result = await model.generateContent(prompt);
      answer = result.response.text().trim();
    } catch (err) {
      console.error("⚠️ Gemini API failed:", err);
    }

    return NextResponse.json({ answer });
  } catch (err: any) {
    console.error("🔥 SERVER ERROR:", err);
    return NextResponse.json({ answer: err?.message || "Unexpected server error" }, { status: 500 });
  }
}
