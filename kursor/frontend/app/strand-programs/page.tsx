"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/supabaseClient";
import Navbar from "@/components/homepage-navbar";
import { useGlobalLoading } from "@/Context/GlobalLoadingContext";

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
  const { setIsLoading } = useGlobalLoading();

  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageReady, setPageReady] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Fetch programs
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

  // Wait for all data to be ready
  useEffect(() => {
    if (loading) {
      setIsLoading(true);
    } else {
      const timer = setTimeout(() => {
        setPageReady(true);
        setIsLoading(false);
        setTimeout(() => setIsVisible(true), 50);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, setIsLoading]);

  const handleProgramClick = (programId: number) => {
    router.push(`/program-details?id=${programId}`);
  };

  if (!pageReady) return null;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Error Loading Programs</h2>
          <p>{error}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-6 py-2 bg-yellow-400 text-gray-900 rounded-lg hover:bg-yellow-500 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <div className={`transition-opacity duration-500 ${isVisible ? "opacity-100" : "opacity-0"}`}>
        <Navbar />
      </div>

      {/* Hero Banner */}
      <div
        className={`w-full pt-[5.2%] mb-5 transition-all duration-700 ease-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8"
        }`}
        style={{ transitionDelay: "200ms" }}
      >
        <div className="fixed top-24 left-3 z-10">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 bg-transparent transition-all duration-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
        </div>

        <div className="relative w-full h-[350px] md:h-[450px] overflow-hidden">
          <img
            src={`/homepage_carousel/${strand}.svg`}
            alt={`${strand} background`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#FFDE59] via-[#FFDE59]/80 to-transparent pointer-events-none"></div>

          <div className="absolute inset-0 flex items-center">
            <div className="max-w-7xl mx-auto w-full px-7">
              <h1 className="text-4xl md:text-5xl font-outfit font-bold text-gray-900 leading-tight max-w-md">
                {strand} Programs
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Yellow Stripe */}
      <div
        className={`w-full h-7 bg-[#FFDE59] transition-all duration-700 ease-out ${
          isVisible ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"
        }`}
        style={{ transitionDelay: "300ms" }}
      ></div>

      {/* Main Content - Programs Grid */}
      <div
        className={`max-w-7xl mx-auto px-8 md:px-16 pt-16 pb-20 transition-all duration-700 ease-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
        style={{ transitionDelay: "400ms" }}
      >
        <div className="mb-10">
          <h2 className="text-3xl font-outfit font-bold text-gray-800 mb-3">
            Available Programs for <span className="text-[#FFDE59]">{strand}</span>
          </h2>
          <p className="text-gray-600 font-fredoka text-lg">
            {programs.length} {programs.length === 1 ? 'program' : 'programs'} found
          </p>
        </div>

        {programs.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-600 font-fredoka text-lg">No programs found for this strand.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                  className="bg-white rounded-2xl p-6 shadow-lg border-2 border-transparent hover:border-[#FFDE59] cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 group"
                >
                  <div className="mb-4">
                    <h3 className="text-xl font-outfit font-bold text-gray-900 mb-2 group-hover:text-[#FFDE59] transition-colors">
                      {p.title}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {formattedStrands.split(", ").map((s, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-[#FFDE59]/20 text-gray-700 rounded-full text-sm font-fredoka"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-600 font-fredoka leading-relaxed line-clamp-4">
                    {p.description}
                  </p>
                  <div className="mt-4 flex items-center text-[#FFDE59] font-fredoka font-semibold group-hover:gap-2 transition-all">
                    Learn more
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 ml-1 group-hover:translate-x-1 transition-transform"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}