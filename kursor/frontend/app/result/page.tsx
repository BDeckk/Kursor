"use client";
import Navbar from "@/components/homepage-navbar";
import { useState, useEffect } from "react";

type RIASEC = "R" | "I" | "A" | "S" | "E" | "C";

interface CareerPath {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
}

export default function ResultPage() {
  const scores = JSON.parse(localStorage.getItem("scores") || "{}");
  const riasecCode = localStorage.getItem("riasecCode");
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!riasecCode) return;

    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ riasecCode }),
        });

        if (!res.ok) throw new Error(`API error: ${res.status}`);

        const data = await res.json();
        console.log("📥 API Response:", data);

        if (data.recommendations) {
          if (Array.isArray(data.recommendations)) {
            setRecommendations(data.recommendations);
          } else if (typeof data.recommendations === "string") {
            setRecommendations([
              { title: "AI Response", reason: data.recommendations },
            ]);
          } else {
            setRecommendations([
              {
                title: "Unknown Format",
                reason: JSON.stringify(data.recommendations, null, 2),
              },
            ]);
          }
        } else {
          setRecommendations(
            data.supabase?.map((p: any) => ({
              title: p.title,
              reason: p.description || "No description available",
            })) || []
          );
        }
      } catch (error) {
        console.error("❌ Failed to fetch recommendations:", error);
        setRecommendations([
          {
            title: "Error",
            reason: "Failed to load recommendations. Please try again.",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [riasecCode]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <Navbar />
     <div className="pr-50 pl-50 pt-25">
      {/* Assessment Result */}
      <div className="bg-white rounded-2xl shadow-lg p-10 mr-20 ml-20">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Assessment Result</h2>
        {scores ? (
          <div className="space-y-3">
            {Object.entries(scores).map(([letter, value]) => (
              <div key={letter} className="flex items-center gap-4 pl-10 pr-10">
                <div className="flex-1 bg-gray-200 rounded-full h-8 relative overflow-hidden">
                  <div
                    className="bg-yellow-400 h-full rounded-full transition-all duration-500 flex items-center justify-end pr-3"
                    style={{ width: `${value}%` }}
                  >
                    <span className="text-xs font-medium text-gray-700">
                      {letter}
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
      <div className="bg-white rounded-2xl shadow-lg p-8 mt-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Recommended Programs for You
        </h2>

        {loading ? (
          // Loading screen
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600 font-medium">
              Finding the best programs for you...
            </p>
          </div>
        ) : recommendations.length > 0 ? (
          <div className="space-y-4">
            {recommendations.map((program, index) => (
              <div
                key={index}
                className="border-l-4 border-yellow-400 bg-yellow-50 p-5 rounded-r-lg hover:shadow-md transition"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-gray-800 font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-800 mb-2">
                      {program.title}
                    </h3>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {program.reason}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">
            No recommendations available at this time.
          </p>
        )}
      </div>
    </div>
    </div>
  );
}
