"use client";
import Navbar from "@/components/homepage-navbar";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserAuth } from "@/Context/AuthContext";

type RIASEC = "R" | "I" | "A" | "S" | "E" | "C";

interface Recommendation {
  id?: string;
  title: string;
  school?: string;
  reason: string;
}

export default function ResultPage() {
  const [scores, setScores] = useState<Record<RIASEC, number> | null>(null);
  const [riasecCode, setRiasecCode] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const router = useRouter();

  const { session } = UserAuth();
  const user = session?.user;

  
  const meanings: Record<RIASEC, string> = {
    R: "Realistic",
    I: "Investigative",
    A: "Artistic",
    S: "Social",
    E: "Enterprising", 
    C: "Conventional",
  };

  // Load scores from localStorage
  useEffect(() => {
    try {
      const storedScores = localStorage.getItem("scores");
      const storedCode = localStorage.getItem("riasecCode");
      
      if (storedScores) {
        setScores(JSON.parse(storedScores));
      }
      if (storedCode) {
        setRiasecCode(storedCode);
      } else {
        console.warn("⚠️ No RIASEC code found");
      }
    } catch (error) {
      console.error("Failed to parse stored data:", error);
      setError("Failed to load assessment results");
    }
  }, []);

  // Fetch recommendations
  useEffect(() => {
    if (!riasecCode) return;

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

        if (!res.ok) {
          throw new Error(`API error: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        console.log("📥 API Response:", data);

        // Handle the response
        if (data.recommendations && Array.isArray(data.recommendations)) {
          setRecommendations(data.recommendations);
          console.log(`✅ Loaded ${data.recommendations.length} recommendations`);
        } else if (data.error) {
          throw new Error(data.error);
        } else {
          console.warn("⚠️ Unexpected response format:", data);
          setRecommendations([]);
        }
      } catch (error: any) {
        console.error("❌ Failed to fetch recommendations:", error);
        setError(error.message || "Failed to load recommendations");
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [riasecCode]);

  const handleSeeResults = () => {
    setShowResults(true);
    // Smooth scroll to results section
    setTimeout(() => {
      const resultsSection = document.getElementById("start-section");
      if (resultsSection) {
        resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-white-100 ">
      <Navbar />
      
      <div className=" mx-auto pl-[17%] pr-[17%] pt-[9%]">

        {/* User Profile */}
        <div className="bg-[#F5D555] to-yellow-400 p-7 rounded-3xl">
        <div className="bg-[#FFDE59] rounded-3xl p-8 pt-10 pb-15 border-4 border-white relative overflow-visible">
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-xl">
              <h1 className="text-5xl font-bold text-gray-900 pl-8 mb-4">
                {user?.email || user?.id || "Guest User"}
              </h1>
              <p className="text-xl text-gray-800 leading-relaxed mb-6 pl-10 pr-15 pt-3 mb-10">
                Nice job on accomplishing the assessment test! Now check your possible career/degree path based on the result of the test.
              </p>
              <button 
                onClick={handleSeeResults}
                className="bg-yellow-200 hover:bg-yellow-100 text-gray-900 font-bold py-4 px-8 ml-15 rounded-full text-2xl transition-all shadow-lg hover:shadow-xl"
              >
                See Results →
              </button>
            </div>
            
            <div className="relative">
              {/* Large Profile Picture */}
              <div className="w-80 h-80 rounded-full bg-gray-200 border-8 border-white shadow-xl overflow-hidden">
                <img 
                  src="" 
                  alt="User Profile"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
          
          {/* Small Illustration */}
          <div className="absolute -bottom-25 -right-6 w-60 h-60">
            <img 
              src="/result-decor.png" 
              alt="Illustration"
              className="w-full h-auto object-contain"
            />
          </div>
        </div>
        </div>
        

        {/* Results Section - Only shown after button click */}
        {showResults && (
          <div id="results-section">
            <div id="start-section" className="h-20" />
            {/* Assessment Result Scores */}
            <div className="border-4 border-yellow-400 rounded-3xl p-8 mb-8 bg-gray-50">
                <h2 className="text-4xl font-bold text-gray-900 mb-8">Assessment Result</h2>
              
              {scores ? (
                <div className="bg-[#FCF8EB] rounded-2xl p-8 border-4 border-white">
                  <div className="space-y-4">
                    {Object.entries(scores)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .map(([letter, value]) => (
                        <div key={letter} className="flex items-center gap-2">
                          <span className="text-xl font-bold text-gray-900 w-40 flex items-center">
                            {letter} - {meanings[letter] || ""}
                          </span>
                          <div className="flex-1 bg-gray-200 rounded-lg h-12 relative overflow-hidden">
                            <div
                              className="bg-yellow-400 h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-4"
                              style={{ 
                                width: `${Math.min((value as number / 30) * 100, 100)}%` 
                              }}
                            >
                              </div>
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
                <img 
                  src="/result-career.png" 
                  alt="Career Path"
                  className="w-45 h-45 object-contain"
                />
                <h2 className="text-4xl font-bold text-gray-800 w-90">
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
                        // Store the program data in localStorage
                        localStorage.setItem('selectedProgram', JSON.stringify(program));
                        router.push(`/program-details?id=${program.id || index}`);
                      }}
                      className="border-l-4 border-yellow-400 bg-yellow-50 p-5 rounded-r-lg hover:shadow-md transition cursor-pointer hover:bg-yellow-100"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-gray-800 font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-800 mb-1">
                            {program.title}
                          </h3>
                          {program.school && (
                            <p className="text-sm text-gray-600 mb-2">
                              {program.school}
                            </p>
                          )}
                          <p className="text-gray-700 text-sm leading-relaxed">
                            {program.reason}
                          </p>
                        </div>
                        <div className="flex-shrink-0 text-gray-400">
                          →
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">
                    No recommendations available at this time.
                  </p>
                  {riasecCode && (
                    <p className="text-sm text-gray-500 mt-2">
                      RIASEC Code: {riasecCode}
                    </p>
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