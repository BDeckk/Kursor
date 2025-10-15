"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/homepage-navbar";
import { supabase } from "@/supabaseClient";
import { NearbySchoolCarousel } from "@/components/ui/nearby-school";
import ProgramImage from "@/components/programs_image/left_image";
import MainImage from "@/components/programs_image/main_image";

interface Program {
  id?: string;
  title: string;
  school?: string;
  reason: string;
  description?: string;
}

const schoolList = [
  { rank: 1, schoolname: "Cebu Insitute of Technology - University", image: "/temporary-school-logo/CIT.png"},
  { rank: 2, schoolname: "University of San Carlos", image: "/temporary-school-logo/USC.png"},
  { rank: 3, schoolname: "Cebu Normal University", image: "/temporary-school-logo/USC.png"},
  { rank: 4, schoolname: "Southwestern University PHINMA", image: "/temporary-school-logo/USC.png"},
  { rank: 5, schoolname: "Cebu Institute of Medicine", image: "/temporary-school-logo/USC.png"},
];

export default function ProgramDetailsPage() {
  const [program, setProgram] = useState<Program | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const searchParams = useSearchParams();
  const programId = searchParams.get("id");

  // Animate section visibility
  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  // Fetch program data from Supabase
  useEffect(() => {
    if (programId) {
      fetchProgramFromDatabase(programId);
    } else {
      setError("No program ID provided");
    }
  }, [programId]);

  async function fetchProgramFromDatabase(id: string) {
    try {
      const { data, error } = await supabase
        .from("programs")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setProgram(data);
    } catch (err) {
      console.error("Error fetching program:", err);
      setError("Failed to load program");
    }
  }

  // Error state
  if (error && !program) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto pt-[9%] px-4 pb-12">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <h2 className="text-2xl font-semibold text-red-900 mb-2">Error</h2>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (!program) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  // Prepare program description
  const descriptionText = program.reason || "";
  const truncatedDescription =
    descriptionText.length > 300
      ? descriptionText.substring(0, 300) + "..."
      : descriptionText;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Top Banner - Image with Yellow Overlay and Title */}
      <div 
        className={`w-full pt-[5%] mb-10 transition-all duration-700 ease-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8"
        }`}
      >
        <div className="relative w-full h-[350px] md:h-[450px] overflow-hidden">
          {/* Background Image Container */}
          <div className="relative w-full overflow-hidden">
            <MainImage programData={program} />
          </div>
          
          {/* Yellow Overlay Gradient (left side) - positioned absolutely over image */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#FFDE59] via-[#FFDE59]/80 to-transparent pointer-events-none"></div>
          
          {/* Program Title on Left - positioned absolutely over overlay */}
          <div className="absolute inset-0 flex items-center">
            <div className="max-w-7xl mx-auto w-full px-7">
              <h1 className="text-4xl md:text-5xl font-outfit font-bold text-gray-900 leading-tight max-w-md">
                {program.title}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Yellow Stripe Below Banner */}
      <div 
        className={`w-full h-8 bg-[#FFDE59] transition-all duration-700 ease-out ${
          isVisible ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"
        }`}
        style={{ transitionDelay: "200ms" }}
      ></div>

      {/* Main Content Grid */}
      <div 
        className={`grid grid-cols-1 lg:grid-cols-2 items-center transition-all duration-700 ease-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
        style={{ transitionDelay: "400ms" }}
      >
        {/* Left Side - Image */}
        <div className="flex justify-center">
          <ProgramImage title={program.title} />
        </div>

        {/* Right Side - Content */}
        <div className="flex flex-col justify-start w-[70%] space-y-6">
          <div>
            <h2 className="text-3xl font-outfit font-bold mb-2 text-gray-900 leading-tight">
              {program.title}
            </h2>
            {program.school && (
              <p className="text-lg font-fredoka text-gray-600">{program.school}</p>
            )}
          </div>

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

      {/* Nearby Schools Section */}
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
        <NearbySchoolCarousel school_card={schoolList} />
      </div>
    </div>
  );
}