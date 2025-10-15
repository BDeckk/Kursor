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
      <div className="max-w-7xl mx-auto pt-[9%] px-4 pb-12">
        {/* Main Image */}
        <MainImage programData={program} />
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Image */}
          <ProgramImage title={program.title} />

          {/* Right Side - Content */}
          <div className="space-y-6">
            <div>
              <h1 className="text-5xl font-bold mb-2 text-gray-900 leading-tight">
                {program.title}
              </h1>
              {program.school && (
                <p className="text-xl text-gray-600">{program.school}</p>
              )}
            </div>

            <div className="text-gray-700 text-lg leading-relaxed">
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

            {/* Additional Description */}
            {program.description && (
              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-xl font-semibold mb-3 text-gray-900">
                  Program Description
                </h3>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {program.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Nearby Schools Section */}
      <div
        className={`w-full pt-[3%] bg-[#FFDE59] py-12 mt-20 pb-[2%] mb-10 transition-all duration-700 ease-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
        style={{ transitionDelay: "700ms" }}
      >
        <div className="px-[6%] mb-8">
          <h2 className="text-3xl font-bold font-outfit text-gray-800 mb-10 pl-10">
            Nearby <span className="text-white">University/School</span> for this Field:
          </h2>
        </div>
        <NearbySchoolCarousel school_card={schoolList} />
      </div>
    </div>
  );
}
