"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import { useRouter } from "next/navigation";

type Recommendation = {
  id: string;
  rank: number;
  title: string;
  school: string;
  reason: string;
  program_id?: string;
};

type RiasecResult = {
  id: string;
  user_id: string;
  created_at: string;
  r: number;
  i: number;
  a: number;
  s: number;
  e: number;
  c: number;
  recommendations: Recommendation[];
};

export default function AssessmentHistory({ userId }: { userId: string }) {
  const [history, setHistory] = useState<RiasecResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!userId) return;

    const fetchHistory = async () => {
      setLoading(true);

      const { data: results, error } = await supabase
        .from("riasec_results")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching history:", error);
        setLoading(false);
        return;
      }

      const populated: RiasecResult[] = [];

      for (const r of results || []) {
        const { data: recs } = await supabase
          .from("riasec_recommendations")
          .select("*, program_id")
          .eq("result_id", r.id)
          .order("rank", { ascending: true })
          .limit(10);

        populated.push({ ...r, recommendations: recs || [] });
      }

      setHistory(populated);
      setLoading(false);
    };

    fetchHistory();
  }, [userId]);

  const handleProgramClick = (programId?: string) => {
    if (programId) router.push(`/program-details?id=${programId}`);
  };

  if (loading) return <p className="text-gray-600 text-center py-8 font-fredoka">Loading assessment history...</p>;

  if (!history.length)
    return (
      <div className="py-12 text-center">
        <div className="flex flex-col items-center">
          <svg className="w-20 h-20 text-yellow-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <p className="font-bold text-xl text-gray-900 font-outfit mb-2">No assessment history yet</p>
          <p className="text-gray-600 font-fredoka mb-6">Take an assessment to see your results here.</p>
          <button
            onClick={() => router.push("/assessment")}
            className="px-8 py-3 bg-[#FFDE59] text-gray-900 font-semibold font-outfit rounded-xl shadow-md hover:bg-yellow-400 transition-all duration-200 transform hover:scale-105"
          >
            Take Assessment
          </button>
        </div>
      </div>
    );

  const assessment = history[selectedIndex];

  return (
    <div className="space-y-6">
      {/* Dropdown Selector */}
      <div className="w-full">
        <label className="block text-gray-800 font-semibold mb-3 font-outfit text-lg">
          Select Assessment
        </label>
        <select
          value={selectedIndex}
          onChange={(e) => setSelectedIndex(Number(e.target.value))}
          className="w-full p-3 border-2 border-gray-200 rounded-xl bg-white shadow-sm font-outfit text-gray-900 focus:outline-none focus:border-yellow-400 transition-colors"
        >
          {history.map((res, index) => (
            <option key={res.id} value={index}>
              Assessment #{history.length - index} — {new Date(res.created_at).toLocaleDateString()}
            </option>
          ))}
        </select>
      </div>

      {/* RIASEC Scores Section */}
      <div className="bg-gradient-to-br from-yellow-50 to-white border-2 border-yellow-200 rounded-2xl p-6 shadow-md">
        <div className="flex items-center gap-2 mb-5">
          <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="text-xl font-bold font-outfit text-gray-900">Your RIASEC Scores</h3>
        </div>
        
        <div className="space-y-4">
          {["r", "i", "a", "s", "e", "c"].map((k) => {
            const score = assessment[k as keyof typeof assessment] as number;
            const percentage = (score / 40) * 100;
            const labels: Record<string, string> = {
              r: "Realistic",
              i: "Investigative",
              a: "Artistic",
              s: "Social",
              e: "Enterprising",
              c: "Conventional",
            };
            
            return (
              <div key={k} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-outfit font-bold text-gray-900 text-lg">
                    {labels[k]}
                  </span>
                  <span className="font-outfit font-semibold text-yellow-600 text-lg">
                    {score}/40
                  </span>
                </div>
                <div className="bg-gray-100 rounded-full h-8 overflow-hidden border border-gray-200 shadow-inner">
                  <div
                    className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-full rounded-full transition-all duration-500 flex items-center justify-end pr-3"
                    style={{ width: `${percentage}%` }}
                  >
                    {percentage > 15 && (
                      <span className="text-white font-bold text-sm font-outfit drop-shadow">
                        {Math.round(percentage)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top 10 Programs Section */}
      <div className="bg-gradient-to-br from-white to-yellow-50 border-2 border-yellow-200 rounded-2xl p-6 shadow-md">
        <div className="flex items-center gap-2 mb-5">
          <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <h3 className="text-xl font-bold font-outfit text-gray-900">Top 10 Recommended Programs</h3>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
          {assessment.recommendations.map((rec: Recommendation, idx: number) => (
            <div
              key={rec.id}
              className="group p-4 bg-white rounded-xl border-2 border-yellow-200 cursor-pointer hover:border-yellow-400 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
              onClick={() => handleProgramClick(rec.program_id)}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center font-bold text-gray-900 font-outfit shadow-sm">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-outfit font-bold text-gray-900 group-hover:text-yellow-700 transition-colors text-lg mb-1">
                    {rec.title}
                  </p>
                  <p className="text-gray-600 text-sm font-fredoka mb-2 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    {rec.school}
                  </p>
                  <p className="text-gray-700 text-sm font-fredoka leading-relaxed">
                    {rec.reason}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #fef3c7;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #fbbf24;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #f59e0b;
        }
      `}</style>
    </div>
  );
}