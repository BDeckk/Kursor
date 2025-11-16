"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/supabaseClient";
import Navbar from "@/components/homepage-navbar";

interface Program {
  id: number;
  title: string;
  required_strand: string; 
  description: string;
}

export default function StrandProgramsPage() {
  const searchParams = useSearchParams();
  const strand = searchParams.get("strand") || "";
  const router = useRouter();

  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!strand) return;

    const fetchPrograms = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from("programs")
          .select("*");

        if (error) throw error;

        const filtered = data.filter((p: any) => {
          if (!p.required_strand) return false;
          try {
            const strands: string[] = JSON.parse(p.required_strand);
            return strands.includes(strand);
          } catch {
            return false;
          }
        });

        setPrograms(filtered);
      } catch (err: any) {
        setError(err.message ?? "Failed to fetch programs");
      } finally {
        setLoading(false);
      }
    };

    fetchPrograms();
  }, [strand]);

  const handleProgramClick = (programId: number) => {
    router.push(`/program-details?id=${programId}`);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <Navbar />

      <div className="max-w-7xl mx-auto pt-20 px-6 py-10">
        

        {loading && <p>Loading programs...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && programs.length === 0 && <p>No programs found for this strand.</p>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {programs.map((p) => {
            // Clean the required_strand string
            const formattedStrands = p.required_strand
              ?.replace(/[\[\]"]+/g, "") // remove brackets and quotes
              .split(",")
              .map((s) => s.trim())
              .join(", ");

            return (
              <div
                key={p.id}
                onClick={() => handleProgramClick(p.id)}
                className="border rounded-xl p-6 shadow hover:shadow-lg transition cursor-pointer hover:scale-105"
              >
                <h2 className="text-xl font-bold mb-2">{p.title}</h2>
                <p className="text-gray-600 mb-2">Required strands: {formattedStrands}</p>
                <p className="text-gray-600">{p.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
