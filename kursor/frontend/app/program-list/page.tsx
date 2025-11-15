"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "@/components/homepage-navbar";
import { supabase } from "@/supabaseClient";
import { useGlobalLoading } from "@/Context/GlobalLoadingContext";

interface Field {
  title: string;
  image: string;
  description: string;
  color: string;
  imageWidth: string;
  imageHeight: string;
  imageTop: string;
  imageLeft?: string;
}

interface Program {
  id: string;
  title: string;
  field: string;
  description?: string;
}

const fields: Field[] = [
  { 
    title: "Engineering & Technology", 
    image: "/homepage_carousel/engineer.svg", 
    description: "Build the future with innovation", 
    color: "bg-blue-50", 
    imageWidth: "250px", 
    imageHeight: "250px", 
    imageTop: "4px" 
  },
  { 
    title: "Arts, Humanities & Design", 
    image: "/homepage_carousel/artist.svg", 
    description: "Express creativity and culture", 
    color: "bg-purple-50", 
    imageWidth: "230px", 
    imageHeight: "230px", 
    imageTop: "7px", 
    imageLeft: "0px" 
  },
  { 
    title: "Business & Management", 
    image: "/homepage_carousel/finance.svg", 
    description: "Lead and drive growth", 
    color: "bg-green-50", 
    imageWidth: "250px", 
    imageHeight: "250px", 
    imageTop: "6px", 
    imageLeft: "3px" 
  },
  { 
    title: "Law & Legal Studies", 
    image: "/homepage_carousel/judge.svg", 
    description: "Advocate for justice", 
    color: "bg-red-50", 
    imageWidth: "250px", 
    imageHeight: "250px", 
    imageTop: "8px" 
  },
  { 
    title: "Health & Medical Sciences", 
    image: "/homepage_carousel/doctor.svg", 
    description: "Care for others' wellbeing", 
    color: "bg-teal-50", 
    imageWidth: "230px", 
    imageHeight: "230px", 
    imageTop: "22px" 
  },
  { 
    title: "Education & Social Work", 
    image: "/homepage_carousel/Teacher.png", 
    description: "Shape minds and communities", 
    color: "bg-orange-50", 
    imageWidth: "240px", 
    imageHeight: "240px", 
    imageTop: "16px" 
  },
];

export default function ProgramListPage() {
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [pageReady, setPageReady] = useState(false);
  
  const { setIsLoading } = useGlobalLoading();
  const searchParams = useSearchParams();
  const router = useRouter();
  const fieldTitle = searchParams.get("field");

  // Find the selected field based on URL parameter
  useEffect(() => {
    if (fieldTitle) {
      const field = fields.find(f => f.title === fieldTitle);
      setSelectedField(field || fields[0]);
    } else {
      setSelectedField(fields[0]);
    }
  }, [fieldTitle]);

  // Fetch programs for the selected field
  useEffect(() => {
    if (!selectedField) return;

    const fetchPrograms = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const { data, error: fetchError } = await supabase
          .from("programs")
          .select("*")
          .eq("field", selectedField.title)
          .order("title", { ascending: true });

        if (fetchError) throw new Error(fetchError.message);
        setPrograms(data || []);
      } catch (err) {
        console.error("Error fetching programs:", err);
        setError((err as Error).message || "Failed to load programs");
      } finally {
        setLoading(false);
      }
    };

    fetchPrograms();
  }, [selectedField]);

  // Wait for all data to be ready before showing page
  useEffect(() => {
    const dataReady = !loading && selectedField !== null;

    if (loading || !dataReady) {
      setIsLoading(true);
    } else {
      const timer = setTimeout(() => {
        setPageReady(true);
        setIsLoading(false);
        setTimeout(() => setIsVisible(true), 50);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, selectedField, setIsLoading]);

  // Don't show content until everything is ready
  if (!pageReady) {
    return null;
  }

  if (!selectedField) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Field Not Found</h2>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-4 px-6 py-2 bg-yellow-400 text-gray-900 rounded-lg hover:bg-yellow-500 transition"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleProgramClick = (programId: string) => {
    router.push(`/program-details?id=${programId}`);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar with fade-in */}
      <div
        className={`transition-opacity duration-500 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      >
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </button>
        </div>
        
        {/* Top Banner with Field Info */}
        <div className="relative w-full h-[350px] md:h-[450px] overflow-hidden">
          <div className={`absolute inset-0 ${selectedField.color}`}></div>
          
          {/* Field Image */}
          <div 
            className="absolute left-1/2 transform -translate-x-1/2"
            style={{
              width: selectedField.imageWidth,
              height: selectedField.imageHeight,
              top: selectedField.imageTop,
              marginLeft: selectedField.imageLeft || '0px'
            }}
          >
            <img 
              src={selectedField.image} 
              alt={selectedField.title}
              className="w-full h-full object-contain drop-shadow-2xl"
            />
          </div>
          
          <div className="absolute inset-0 bg-gradient-to-r from-[#FFDE59] via-[#FFDE59]/80 to-transparent pointer-events-none"></div>
          
          <div className="absolute inset-0 flex items-center">
            <div className="max-w-7xl mx-auto w-full px-7">
              <h1 className="text-4xl md:text-5xl font-outfit font-bold text-gray-900 leading-tight max-w-md">
                {selectedField.title}
              </h1>
              <p className="text-xl font-outfit text-gray-700 mt-3 max-w-md">
                {selectedField.description}
              </p>
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

      {/* ===== Programs List Section ===== */}
      <div 
        className={`px-8 md:px-20 py-12 transition-all duration-700 ease-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
        style={{ transitionDelay: "400ms" }}
      >
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-outfit font-bold text-gray-900 mb-8">
            Available Programs
          </h2>

          {error ? (
            <div className="text-center text-red-600 py-12">
              <p className="text-lg">{error}</p>
            </div>
          ) : programs.length === 0 ? (
            <div className="text-center text-gray-600 py-12">
              <p className="text-lg">No programs available in this field yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {programs.map((program) => (
                <div
                  key={program.id}
                  onClick={() => handleProgramClick(program.id)}
                  className="bg-white rounded-2xl p-6 shadow-lg border-2 border-transparent hover:border-[#FFDE59] cursor-pointer transition-all duration-300 group"
                >
                  <h3 className="text-xl font-outfit font-bold text-gray-900 mb-3 group-hover:text-[#FFDE59] transition-colors">
                    {program.title}
                  </h3>
                  {program.description && (
                    <p className="text-gray-600 font-outfit text-sm line-clamp-3">
                      {program.description}
                    </p>
                  )}
                  <div className="mt-4 flex items-center text-[#FFDE59] font-outfit font-semibold">
                    <span>Learn more</span>
                    <svg 
                      className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ===== Related Fields Section ===== */}
      <div
        className={`w-full bg-[#FFDE59] py-12 px-8 md:px-20 transition-all duration-700 ease-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
        style={{ transitionDelay: "600ms" }}
      >
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold font-outfit text-gray-800 mb-8">
            Explore Other <span className="text-white">Fields</span>
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {fields.filter(f => f.title !== selectedField.title).map((field, index) => (
              <button
                key={index}
                onClick={() => router.push(`/program-list?field=${encodeURIComponent(field.title)}`)}
                className="bg-white rounded-xl p-4 hover:shadow-xl transition-all duration-300 group"
              >
                <div className="relative w-20 h-20 mx-auto mb-3">
                  <img 
                    src={field.image} 
                    alt={field.title}
                    className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                  />
                </div>
                <p className="text-sm font-outfit font-semibold text-gray-800 text-center">
                  {field.title}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}