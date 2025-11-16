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
  required_strand?: string;
  program_id?: string | null;
}

interface Profile {
  id: string;
  full_name?: string;
  profile_image_url: string;
  email?: string;
  strand: string;
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

  const normalize = (str: string) => str.trim().toLowerCase();

  const parseStrands = (strandText: string): string[] => {
    if (!strandText) return [];
    try {
      const parsed = JSON.parse(strandText);
      if (Array.isArray(parsed)) return parsed.map(s => s.toString().trim().toLowerCase());
    } catch {
      return strandText.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
    }
    return [];
  };

  const isStrandMismatch = (program: Recommendation, userStrand: string) => {
    if (!program.required_strand || !userStrand) return false;
    const requiredStrands = parseStrands(program.required_strand).map(normalize);
    return requiredStrands.length > 0 && !requiredStrands.includes(normalize(userStrand));
  };

  // Load user profile
  useEffect(() => {
    if (!user?.id) return;
    const loadUserProfile = async () => {
      const data = await getProfile(user.id);
      if (data) setProfileData(data);
    };
    loadUserProfile();
  }, [user, getProfile]);

  // Load cached scores and recommendations
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
      }
    } catch (error) {
      console.error("Failed to parse stored data:", error);
      setError("Failed to load assessment results");
    }
  }, []);

  // Fetch recommendations from API and save to Supabase
  useEffect(() => {
    if (!riasecCode) return;
    const alreadyGeneratedForCode = localStorage.getItem("generatedForCode") === riasecCode;
    if (hasGeneratedRecommendations || alreadyGeneratedForCode) return;

    const fetchRecommendations = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ riasecCode }),
        });

        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const data = await res.json();

        if (data.recommendations && Array.isArray(data.recommendations)) {
          // Enrich recommendations with program_id from programs table
          const enrichedRecs: Recommendation[] = await Promise.all(
            data.recommendations.map(async (rec: any) => {
              let program_id: string | null = null;
              const { data: programData } = await supabase
                .from("programs")
                .select("id")
                .ilike("title", rec.title)
                .maybeSingle();

              if (programData?.id) program_id = programData.id;

              return {
                ...rec,
                required_strand: rec.required_strand || "",
                program_id,
              };
            })
          );

          setRecommendations(enrichedRecs);
          setHasGeneratedRecommendations(true);

          localStorage.setItem("recommendations", JSON.stringify(enrichedRecs));
          localStorage.setItem("generatedForCode", riasecCode);
          localStorage.setItem("hasGeneratedRecommendations", "true");

          if (!user?.id) return;

          if (scores && riasecCode) {
            const { data: insertedResult, error: resultError } = await supabase
              .from("riasec_results")
              .insert([{
                user_id: user.id,
                riasec_code: riasecCode,
                r: scores.R,
                i: scores.I,
                a: scores.A,
                s: scores.S,
                e: scores.E,
                c: scores.C,
              }])
              .select()
              .single();

            if (resultError) throw resultError;

            const topTen = enrichedRecs.slice(0, 10).map((rec: any, index: number) => ({
              result_id: insertedResult.id,
              rank: index + 1,
              title: rec.title,
              school: rec.school || null,
              reason: rec.reason,
              required_strand: rec.required_strand || null,
              program_id: rec.program_id || null,
            }));

            const { error: recError } = await supabase.from("riasec_recommendations").insert(topTen);
            if (recError) throw recError;
          }
        } else {
          throw new Error("Unexpected response format");
        }
      } catch (error: any) {
        console.error("Failed to fetch recommendations:", error);
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
      if (resultsSection)
        resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
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
        {showResults && profileData && (
          <div id="results-section">
            <div id="start-section" className="h-20" />

            {/* Recommendations Section */}
            <div className="bg-white p-8">
              <div className="flex items-center gap-4 mb-6">
                <img src="/result-career.png" alt="Career Path" className="w-auto h-32" />
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
                <div className="space-y-4 pl-10 pr-10 max-h-[600px] overflow-y-auto">
                  {recommendations.map((program, index) => (
                    <div
                      key={program.id || index}
                      onClick={() => {
                        if (program.program_id) {
                          router.push(`/program-details?id=${program.program_id}`);
                        }
                      }}
                      className="border-l-4 border-yellow-400 bg-yellow-50 p-5 rounded-r-lg hover:shadow-md transition cursor-pointer hover:bg-yellow-100 relative"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-gray-800 font-bold">
                            {index + 1}
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1">
                              <h3 className="font-bold text-lg text-gray-800 pr-1 underline">
                                {program.title}
                              </h3>
                              {isStrandMismatch(program, profileData.strand) && (
                                <div className="w-5 h-5 bg-[#E14434]/80 rounded-full flex items-center justify-center text-white text-xs group relative">
                                  !
                                  <div className="absolute left-full top-0 ml-2 w-64 p-2 text-sm text-white bg-[#ED3500] rounded opacity-0 group-hover:opacity-100 transition-opacity z-50">
                                    Your strand is not one of the required strands for this program. Bridging may be required.
                                  </div>
                                </div>
                              )}
                            </div>
                            {program.school && (
                              <p className="text-sm text-gray-600">{program.school}</p>
                            )}
                            <p className="text-gray-700 text-sm leading-relaxed">{program.reason}</p>
                          </div>
                        </div>
                        <div className="text-gray-400 text-xl font-bold flex items-center">
                          →
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">No recommendations available at this time.</p>
                  {riasecCode && <p className="text-sm text-gray-500 mt-2">RIASEC Code: {riasecCode}</p>}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
