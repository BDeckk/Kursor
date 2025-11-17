"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "@/components/homepage-navbar";
import { supabase } from "@/supabaseClient";
import ProgramImage from "@/components/programs_image/left_image";
import MainImage from "@/components/programs_image/main_image";
import { useNearbySchools } from "@/hooks/userNearbySchools";
import { useGlobalLoading } from "@/Context/GlobalLoadingContext";
import { NearbySchoolFilteredByProgram } from "@/components/NearbySchoolWithProgramCarousel";
import { UserAuth } from "@/Context/AuthContext";

interface Program {
  id?: string;
  title: string;
  school?: string;
  reason: string;
  required_strand: string; 
  description?: string;
}

export default function ProgramDetailsClient() {
  const [program, setProgram] = useState<Program | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [pageReady, setPageReady] = useState(false);
  
  const { nearbySchools, loading: nearbyLoading, error: locationError } = useNearbySchools();
  const { setIsLoading } = useGlobalLoading();

  const searchParams = useSearchParams();
  const router = useRouter();
  const programId = searchParams.get("id");

  const {session} = UserAuth()
  const user = session?.user;

  // Fetch program data from Supabase
  useEffect(() => {
    if (!programId) {
      setError("No program ID provided");
      setLoading(false);
      return;
    }

    const fetchProgramFromDatabase = async () => {
      setLoading(true);
      try {
        const { data, error: fetchError } = await supabase
          .from("programs")
          .select("*")
          .eq("id", programId)
          .single();

        if (fetchError) throw new Error(fetchError.message);
        setProgram(data);
      } catch (err) {
        console.error("Error fetching program:", err);
        setError((err as Error).message || "Failed to load program");
      } finally {
        setLoading(false);
      }
    };

    fetchProgramFromDatabase();
  }, [programId]);

  // Wait for all data to be ready before showing page
  useEffect(() => {
    const dataReady = !loading && program !== null;

    if (loading || nearbyLoading || !dataReady) {
      setIsLoading(true);
    } else {
      const t = setTimeout(() => {
        setPageReady(true);
        setIsLoading(false);
        setTimeout(() => setIsVisible(true), 50);
      }, 500);
      return () => clearTimeout(t);
    }
  }, [loading, nearbyLoading, program, setIsLoading]);

  // Don't show content until everything is ready
  if (!pageReady) {
    return null;
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Error Loading Program</h2>
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

  if (!program) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Program Not Found</h2>
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

  // Prepare program description
  const descriptionText = program.reason || "";
  const truncatedDescription =
    descriptionText.length > 300
      ? descriptionText.substring(0, 300) + "..."
      : descriptionText;

  // 🔥 CLEAN THE REQUIRED STRAND STRING HERE
  const formattedStrands = program.required_strand
    ?.replace(/[\[\]"]+/g, "")     // remove brackets and quotes
    .split(",")                    // split
    .map((s) => s.trim())          // clean spacing
    .join(", ");                   // final string

  return (
    <div className="min-h-screen bg-white">
      
      {/* Navbar */}
      <div className={`transition-opacity duration-500 ${isVisible ? "opacity-100" : "opacity-0"}`}>
        <Navbar />
      </div>

      {/* ===== Hero Banner Section ===== */}
      <div 
        className={`w-full pt-[5.2%] mb-5 transition-all duration-700 ease-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8"
        }`}
        style={{ transitionDelay: "200ms" }}
      >

        {/* Back Button */}
        <div className="fixed top-24 left-3 z-10">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 bg-transparent transition-all duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
        </div>

        {/* Top Banner */}
        <div className="relative w-full h-[350px] md:h-[450px] overflow-hidden">
          <MainImage programData={program} />
          
          <div className="absolute inset-0 bg-gradient-to-r from-[#FFDE59] via-[#FFDE59]/80 to-transparent pointer-events-none"></div>
          
          <div className="absolute inset-0 flex items-center">
            <div className="max-w-7xl mx-auto w-full px-7">
              <h1 className="text-4xl md:text-5xl font-outfit font-bold text-gray-900 leading-tight max-w-md">
                {program.title}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Yellow Stripe ===== */}
      <div 
        className={`w-full h-7 bg-[#FFDE59] transition-all duration-700 ease-out ${
          isVisible ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"
        }`}
        style={{ transitionDelay: "300ms" }}
      ></div>

      {/* ===== Main Content ===== */}
      <div 
        className={`grid grid-cols-1 lg:grid-cols-2 items-center gap-5 px-8 md:px-30 transition-all duration-700 ease-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
        style={{ transitionDelay: "400ms" }}
      >
        {/* Left: Image */}
        <div className="flex justify-center">
          <ProgramImage title={program.title} />
        </div>

        {/* Right: Info */}
        <div className="flex flex-col justify-start w-[80%] space-y-6">
          <div>
            <h2 className="text-3xl font-outfit font-bold mb-2 text-gray-900 leading-tight">
              {program.title}
            </h2>
            {program.school && (
              <p className="text-lg font-fredoka text-gray-600">{program.school}</p>
            )}
          </div>

          {/* Description */}
          <div className="text-gray-700 text-base leading-relaxed">
            <p className="whitespace-pre-wrap">
              {showFullDescription ? descriptionText : truncatedDescription}
            </p>
            {descriptionText.length > 300 && (
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="text-gray-400 hover:text-gray-600 mt-2 transition-colors"
              >
                {showFullDescription ? "see less" : "see more"}
              </button>
            )}
          </div>

          {/* REQUIRED STRAND UI */}
          {formattedStrands && (
            <div className="pt-4">
              <h3 className="text-xl font-outfit font-semibold mb-2 text-gray-900">
                Required Strand
              </h3>
              <p className="text-gray-700 font-fredoka">
                {formattedStrands}
              </p>
            </div>
          )}

          {/* Program description */}
          {program.description && (
            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-xl font-outfit font-semibold mb-3 text-gray-900">
                Program Description
              </h3>
              <p className="text-gray-700 font-fredoka whitespace-pre-wrap leading-relaxed">
                {program.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ===== Nearby Schools ===== */}
      <div
        className={`w-full bg-[#FFDE59] py-10 px-15 transition-all duration-700 ease-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
        style={{ transitionDelay: "600ms" }}
      >
        <div className="mb-8">
          <h2 className="text-3xl font-bold font-outfit text-gray-800 mb-10 pl-10">
            Top Performing <span className="text-white">Universities in this Field</span>
          </h2>
        </div>

        {nearbyLoading ? (
          <p className="text-center text-gray-800 font-fredoka">Finding nearby schools...</p>
        ) : locationError ? (
          <p className="text-center text-red-600 font-fredoka">{locationError}</p>
        ) : nearbySchools.length > 0 ? (
          <div className="max-w-[1300px] mx-auto">
            <NearbySchoolFilteredByProgram
              schools={nearbySchools}
              programTitle={program.title}
              userId={user?.id}
            />
          </div>
        ) : (
          <p className="text-center text-gray-800 font-fredoka">No nearby schools found.</p>
        )}
      </div>
    </div>
  );
}


