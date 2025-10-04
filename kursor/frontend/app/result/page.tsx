"use client";
import Navbar from "@/components/homepage-navbar";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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
  const router = useRouter();

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="px-8 py-12 max-w-7xl mx-auto pt-30">

        {/* RIASEC Code Display */}
        {riasecCode && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 text-center">
            <h3 className="text-lg text-gray-600 mb-2">Your RIASEC Code</h3>
            <p className="text-5xl font-bold text-yellow-500">{riasecCode}</p>
          </div>
        )}

        {/* Assessment Result Scores */}
        <div className="bg-white rounded-2xl shadow-lg p-10 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Score Breakdown</h2>
          {scores ? (
            <div className="space-y-3">
              {Object.entries(scores)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([letter, value]) => (
                  <div key={letter} className="flex items-center gap-4 px-10">
                    <span className="text-xl font-bold text-gray-700 w-8">
                      {letter}
                    </span>
                    <div className="flex-1 bg-gray-200 rounded-full h-8 relative overflow-hidden">
                      <div
                        className="bg-yellow-400 h-full rounded-full transition-all duration-500 flex items-center justify-end pr-3"
                        style={{ 
                          width: `${Math.min((value as number / 25) * 100, 100)}%` 
                        }}
                      >
                        <span className="text-xs font-medium text-gray-700">
                          {value}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-center text-gray-600">
              No results found. Please take the test first.
            </p>
          )}
        </div>

        {/* Recommendations */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Recommended Programs for You
          </h2>

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
            <div className="space-y-4">
              {recommendations.map((program, index) => (
                <div
                  key={program.id || index}
                  className="border-l-4 border-yellow-400 bg-yellow-50 p-5 rounded-r-lg hover:shadow-md transition"
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
    </div>
  );
}