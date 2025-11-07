"use client";
import Navbar from "@/components/homepage-navbar";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserAuth } from "@/Context/AuthContext";
import { supabase } from "@/supabaseClient";

type RIASEC = "R" | "I" | "A" | "S" | "E" | "C";

interface Recommendation {
  id?: string;
  title: string;
  school?: string;
  reason: string;
}

interface Profile {
  id: string;
  full_name?: string;
  profile_image_url: string;
  email?: string;
}

export default function ResultPage() {
  const [scores, setScores] = useState<Record<RIASEC, number> | null>(null);
  const [riasecCode, setRiasecCode] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [profileData, setProfileData] = useState<Profile | null>(null);
  const [hasGeneratedRecommendations, setHasGeneratedRecommendations] = useState(false);
  const router = useRouter();

  const { session, getProfile } = UserAuth();
  const user = session?.user;

  const meanings: Record<RIASEC, string> = {
    R: "Realistic",
    I: "Investigative",
    A: "Artistic",
    S: "Social",
    E: "Enterprising",
    C: "Conventional",
  };

  // 🧭 Load user profile
  useEffect(() => {
    if (!user?.id) return;

    const loadUserProfile = async () => {
      const data = await getProfile(user.id);
      if (data) {
        setProfileData(data);
        console.log("📄 User profile:", data);
      }
    };

    loadUserProfile();
  }, [user, getProfile]);

  // 📦 Load scores and cached results
  useEffect(() => {
    try {
      const storedScores = localStorage.getItem("scores");
      const storedCode = localStorage.getItem("riasecCode");
      const storedRecommendations = localStorage.getItem("recommendations");
      const storedGeneratedCode = localStorage.getItem("generatedForCode");

      if (storedScores) setScores(JSON.parse(storedScores));
      if (storedCode) setRiasecCode(storedCode);

      if (
        storedRecommendations &&
        storedGeneratedCode &&
        storedGeneratedCode === storedCode
      ) {
        setRecommendations(JSON.parse(storedRecommendations));
        setHasGeneratedRecommendations(true);
        console.log("✅ Loaded cached recommendations for this code");
      }
    } catch (error) {
      console.error("Failed to parse stored data:", error);
      setError("Failed to load assessment results");
    }
  }, []);

  // 🔍 Fetch recommendations + Save to Supabase
  useEffect(() => {
    if (!riasecCode) return;

    const alreadyGeneratedForCode =
      localStorage.getItem("generatedForCode") === riasecCode;

    if (hasGeneratedRecommendations || alreadyGeneratedForCode) {
      console.log("⚙️ Recommendations already generated for this code");
      return;
    }

    const fetchRecommendations = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log("🔄 Fetching recommendations for:", riasecCode);

        const res = await fetch("/api/recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ riasecCode }),
        });

        if (!res.ok) throw new Error(`API error: ${res.status}`);

        const data = await res.json();
        console.log("📥 API Response:", data);

        if (data.recommendations && Array.isArray(data.recommendations)) {
          setRecommendations(data.recommendations);
          setHasGeneratedRecommendations(true);

          // Store locally
          localStorage.setItem("recommendations", JSON.stringify(data.recommendations));
          localStorage.setItem("generatedForCode", riasecCode);
          localStorage.setItem("hasGeneratedRecommendations", "true");

          console.log(`✅ Stored ${data.recommendations.length} recommendations`);

          // 🗄️ Save to Supabase
          if (!user?.id) {
            console.warn("⚠️ No user ID found, skipping Supabase save.");
            return;
          }

          if (scores && riasecCode) {
            try {
              console.log("🗄️ Saving results to Supabase...");

              // 1️⃣ Insert the RIASEC result
              const { data: insertedResult, error: resultError } = await supabase
                .from("riasec_results")
                .insert([
                  {
                    user_id: user.id,
                    riasec_code: riasecCode,
                    r: scores.R,
                    i: scores.I,
                    a: scores.A,
                    s: scores.S,
                    e: scores.E,
                    c: scores.C,
                  },
                ])
                .select()
                .single();

              if (resultError) throw resultError;
              console.log("🧩 Inserted RIASEC result:", insertedResult);

              // 2️⃣ Insert top 10 recommendations
              const topTen = data.recommendations.slice(0, 10).map((rec: any, index: number) => ({
                result_id: insertedResult.id,
                rank: index + 1,
                title: rec.title,
                school: rec.school || null,
                reason: rec.reason,
              }));

              const { error: recError } = await supabase
                .from("riasec_recommendations")
                .insert(topTen);

              if (recError) throw recError;

              console.log("🏫 Saved recommendations to Supabase:", topTen.length);
            } catch (err: any) {
              console.error("❌ Error saving to Supabase:", JSON.stringify(err, null, 2));
            }
          }
        } else {
          throw new Error("Unexpected response format");
        }
      } catch (error: any) {
        console.error("❌ Failed to fetch recommendations:", error);
        setError(error.message || "Failed to load recommendations");
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [riasecCode, hasGeneratedRecommendations, scores, user]);

  const handleSeeResults = () => {
    setShowResults(true);
    setTimeout(() => {
      const resultsSection = document.getElementById("start-section");
      if (resultsSection) {
        resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  const getInitial = () => {
    if (profileData?.full_name) return profileData.full_name.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return "U";
  };

  return (
    <div className="min-h-screen bg-white-100">
      <Navbar />

      <div className="mx-auto pl-[17%] pr-[17%] pt-[9%]">
        {/* Profile Section */}
        <div className="bg-[#F5D555] p-7 rounded-3xl max-w justify-center">
          <div className="bg-[#FFDE59] rounded-3xl p-8 border-4 border-white relative overflow-visible">
            <div className="flex items-center justify-between">
              <div className="flex-1 max-w-xl">
                <h1 className="text-5xl font-bold font-outfit text-gray-900 pl-8 mb-6">
                  {profileData?.full_name}
                </h1>
                <p className="text-xl text-gray-800 font-fredoka mb-7 pl-10 pr-5">
                  Nice job on accomplishing the assessment test! Now check your possible
                  career/degree path based on your result.
                </p>
                <button
                  onClick={handleSeeResults}
                  className="bg-yellow-200 mt-2 hover:bg-yellow-100 text-gray-900 font-fredoka py-4 px-4 ml-10 w-[280px] rounded-full text-2xl transition-all shadow-lg hover:shadow-xl"
                >
                  See Results →
                </button>
              </div>

              <div className="relative pr-5">
                <div className="w-85 h-85 rounded-full bg-gray-200 border-8 border-white shadow-xl overflow-hidden flex items-center justify-center">
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  ) : profileData?.profile_image_url ? (
                    <img
                      src={profileData.profile_image_url}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-6xl font-bold text-gray-600">{getInitial()}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="absolute -bottom-25 -right-6 w-60 h-60">
              <img src="/result-decor.png" alt="Decor" className="w-full h-auto object-contain" />
            </div>
          </div>
        </div>

        {/* Results Section */}
        {showResults && (
          <div id="results-section">
            <div id="start-section" className="h-20" />

            <div className="border-4 border-yellow-400 rounded-3xl p-8 mb-8 bg-gray-50">
              <h2 className="text-4xl font-bold text-gray-900 mb-8">Assessment Result</h2>

              {scores ? (
                <div className="bg-[#FCF8EB] rounded-2xl p-8 border-4 border-white">
                  <div className="space-y-4">
                    {Object.entries(scores)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .map(([letter, value]) => (
                        <div key={letter} className="flex items-center gap-2">
                          <span className="text-xl font-bold text-gray-900 w-40">
                            {letter} - {meanings[letter as RIASEC]}
                          </span>
                          <div className="flex-1 bg-gray-200 rounded-lg h-12 overflow-hidden">
                            <div
                              className="bg-yellow-400 h-full rounded-lg transition-all duration-500"
                              style={{ width: `${Math.min((value as number / 30) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <p className="text-center text-gray-600">
                  No results found. Please take the test first.
                </p>
              )}
            </div>

            {/* Recommendations */}
            <div className="bg-white p-8">
              <div className="flex items-center gap-4 mb-6">
                <img src="/result-career.png" alt="Career Path" className="w-45 h-45" />
                <h2 className="text-4xl font-bold text-gray-800">
                  Possible Career Path Based on Result
                </h2>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                  <p className="mt-4 text-gray-600 font-medium">
                    Finding the best programs for you...
                  </p>
                </div>
              ) : error ? (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                  <p className="text-red-700">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-2 text-red-600 underline hover:text-red-800"
                  >
                    Try again
                  </button>
                </div>
              ) : recommendations.length > 0 ? (
                <div className="space-y-4 pl-10 pr-10">
                  {recommendations.map((program, index) => (
                    <div
                      key={program.id || index}
                      onClick={() => {
                        localStorage.setItem("selectedProgram", JSON.stringify(program));
                        router.push(`/program-details?id=${program.id || index}`);
                      }}
                      className="border-l-4 border-yellow-400 bg-yellow-50 p-5 rounded-r-lg hover:shadow-md transition cursor-pointer hover:bg-yellow-100"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-gray-800 font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-800 mb-1">{program.title}</h3>
                          {program.school && (
                            <p className="text-sm text-gray-600 mb-2">{program.school}</p>
                          )}
                          <p className="text-gray-700 text-sm leading-relaxed">{program.reason}</p>
                        </div>
                        <div className="text-gray-400">→</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">No recommendations available at this time.</p>
                  {riasecCode && (
                    <p className="text-sm text-gray-500 mt-2">RIASEC Code: {riasecCode}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
