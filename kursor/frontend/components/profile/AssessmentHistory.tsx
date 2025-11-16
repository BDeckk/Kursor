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

      // Fetch RIASEC results for this user
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

      // Fetch top 10 recommendations for each result
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

  const renderAssessmentCard = (assessment: RiasecResult) => (
    <div className="space-y-4">
      {/* SCORES */}
      <div className="space-y-3">
        {["r", "i", "a", "s", "e", "c"].map((k) => (
          <div key={k} className="flex items-center gap-4">
            <span className="w-32 font-outfit font-bold capitalize text-gray-900">
              {{
                r: "Realistic",
                i: "Investigative",
                a: "Artistic",
                s: "Social",
                e: "Enterprising",
                c: "Conventional",
              }[k]}
            </span>
            <div className="flex-1 bg-yellow-50 rounded-lg h-6 overflow-hidden border border-yellow-200">
              <div
                className="bg-yellow-400 h-full"
                style={{
                  width: `${(assessment[k as keyof RiasecResult] as number / 40) * 100}%`,
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* TOP 10 RECOMMENDATIONS */}
      <div>
        <h3 className="text-xl font-bold font-outfit text-gray-900 mb-3">
          Top 10 Recommended Programs
        </h3>
        <ul className="space-y-2 max-h-80 overflow-y-auto">
          {assessment.recommendations.map((rec) => (
            <li
              key={rec.id}
              className="p-4 bg-yellow-50 rounded-xl border border-yellow-200 cursor-pointer hover:bg-yellow-100 transition"
              onClick={() => handleProgramClick(rec.program_id)}
            >
              <p className="font-outfit font-semibold text-gray-900 underline">
                {rec.rank}. {rec.title}
              </p>
              <p className="text-gray-700 text-sm font-fredoka">{rec.school}</p>
              <p className="text-gray-600 text-sm mt-1">{rec.reason}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  if (loading) return <p className="text-gray-600">Loading assessment history...</p>;

  if (!history.length)
    return (
      <div className="py-10 text-center text-gray-700">
        <p className="font-bold text-xl">No assessment history yet</p>
        <p>Take an assessment to see your results here.</p>
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Dropdown Selector */}
      <div className="w-full space-y-2">
        <label className="block text-gray-800 font-semibold mb-2 font-outfit">
          Select Assessment
        </label>
        <select
          value={selectedIndex}
          onChange={(e) => setSelectedIndex(Number(e.target.value))}
          className="w-full p-3 border rounded-xl bg-white shadow-sm font-outfit"
        >
          {history.map((res, index) => (
            <option key={res.id} value={index}>
              Assessment #{history.length - index} —{" "}
              {new Date(res.created_at).toLocaleDateString()}
            </option>
          ))}
        </select>
      </div>

      {/* Selected Assessment */}
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-xl shadow-md">
        {renderAssessmentCard(history[selectedIndex])}
      </div>
    </div>
  );
}
