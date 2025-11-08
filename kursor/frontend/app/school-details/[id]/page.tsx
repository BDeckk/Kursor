"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/homepage-navbar";
import { supabase } from "@/supabaseClient";
import { useNearbySchools } from "@/hooks/userNearbySchools";
import { NearbySchoolCarousel } from "@/components/ui/nearby-school";
import ReviewSection from "@/components/reviews/SchoolReviews";
import { useGlobalLoading } from "@/Context/GlobalLoadingContext";

interface School {
  id: string;
  name: string;
  details: string;
  school_logo: string;
  school_picture: string;
  location: string;
  institutional_email: string;
  contact_number: string;
  critique_review?: number;
}

export default function SchoolDetailsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const { setIsLoading } = useGlobalLoading();

  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageReady, setPageReady] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Track image loading states
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [pictureLoaded, setPictureLoaded] = useState(false);

  const {
    nearbySchools,
    loading: nearbyLoading,
    error: locationError,
  } = useNearbySchools();

  // Fetch school data
  useEffect(() => {
    if (!id) return;

    const fetchSchoolDetails = async () => {
      setLoading(true);
      try {
        const { data, error: fetchError } = await supabase
          .from("schools")
          .select("*")
          .eq("id", id)
          .single();

        if (fetchError) throw new Error(fetchError.message);
        setSchool(data);
      } catch (err) {
        console.error("Error fetching school:", err);
        setError((err as Error).message || "Failed to load school details");
      } finally {
        setLoading(false);
      }
    };

    fetchSchoolDetails();
  }, [id]);

  // Preload images
  useEffect(() => {
    if (!school) return;

    const logoImg = new Image();
    const pictureImg = new Image();

    logoImg.onload = () => setLogoLoaded(true);
    logoImg.onerror = () => setLogoLoaded(true); // Still mark as loaded even on error

    pictureImg.onload = () => setPictureLoaded(true);
    pictureImg.onerror = () => setPictureLoaded(true);

    logoImg.src = school.school_logo || "/placeholder-logo.png";
    pictureImg.src = school.school_picture || "/placeholder-picture.png";
  }, [school]);

  // Wait for all data to be ready before showing page
  useEffect(() => {
    const imagesReady = school ? (logoLoaded && pictureLoaded) : false;
    const dataReady = !loading && school !== null;

    if (loading || nearbyLoading || !dataReady || !imagesReady) {
      setIsLoading(true);
    } else {
      const t = setTimeout(() => {
        setPageReady(true);
        setIsLoading(false);
        setTimeout(() => setIsVisible(true), 50);
      }, 500);
      return () => clearTimeout(t);
    }
  }, [loading, nearbyLoading, school, logoLoaded, pictureLoaded, setIsLoading]);

  // Don't show content until everything is ready
  if (!pageReady) {
    return null;
  }

  // Error States
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Error Loading School</h2>
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

  if (!school) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">School Not Found</h2>
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

        {/* Top Banner */}
        <div className="relative w-full h-[350px] md:h-[450px] overflow-hidden">
          <img
            src={school.school_picture || "/placeholder-picture.png"}
            alt={`${school.name} background`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#FFDE59] via-[#FFDE59]/80 to-transparent pointer-events-none"></div>

          <div className="absolute inset-0 flex items-center">
            <div className="max-w-7xl mx-auto w-full px-7">
              <h1 className="text-4xl md:text-5xl font-outfit font-bold text-gray-900 leading-tight max-w-md">
                {school.name}
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
        className={`grid grid-cols-1 lg:grid-cols-2 items-center gap-5 px-8 md:px-30 pt-20 transition-all duration-700 ease-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
        style={{ transitionDelay: "400ms" }}
      >
        {/* Left: Logo */}
        <div className="flex justify-center">
          <div className="flex flex-col items-center">
            <img
              src={school.school_logo || "/placeholder-logo.png"}
              alt={`${school.name} logo`}
              className="w-100 h-100 object-contain mb-4"
            />
          </div>
        </div>

        {/* Right: Info */}
        <div className="flex flex-col justify-start w-[80%] space-y-6">
          <div>
            <h2 className="text-3xl font-outfit font-bold mb-2 text-gray-900 leading-tight">
              {school.name}
            </h2>
            <p className="text-lg font-fredoka text-gray-600">
              {school.location}
            </p>
          </div>

          <div className="text-gray-700 text-base leading-relaxed space-y-2">
            <p>
              <strong>Email:</strong> {school.institutional_email}
            </p>
            <p>
              <strong>Contact:</strong> {school.contact_number}
            </p>
            <p className="flex items-center gap-2">
              <strong>Critique Review:</strong>
              <span className="text-gray-800 font-fredoka">
                {school.critique_review ?? "⭐ 4.78"}
              </span>
            </p>
          </div>

          <div className="pt-6 border-t border-gray-200">
            <h3 className="text-xl font-outfit font-semibold mb-3 text-gray-900">
              School Details
            </h3>
            <p className="text-gray-700 font-fredoka whitespace-pre-wrap leading-relaxed">
              {school.details || "No additional details available."}
            </p>
          </div>
        </div>
      </div>

      {/* ===== Student Reviews Section ===== */}
      <div
        className={`transition-all duration-700 ease-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
        style={{ transitionDelay: "500ms" }}
      >
        <ReviewSection schoolId={school.id} />
      </div>

      {/* ===== Nearby Schools Section ===== */}
      <div
        className={`w-full bg-[#FFDE59] py-10 px-15 transition-all duration-700 ease-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
        style={{ transitionDelay: "600ms" }}
      >
        <div className="mb-8">
          <h2 className="text-3xl font-bold font-outfit text-gray-800 mb-10 pl-10">
            Explore <span className="text-white">Nearby Universities</span>
          </h2>
        </div>

        {nearbyLoading ? (
          <p className="text-center text-gray-800 font-fredoka">
            Finding nearby schools...
          </p>
        ) : locationError ? (
          <p className="text-center text-red-600 font-fredoka">
            {locationError}
          </p>
        ) : nearbySchools.length > 0 ? (
          <div className="max-w-[1300px] mx-auto">
            <NearbySchoolCarousel school_card={nearbySchools} />
          </div>
        ) : (
          <p className="text-center text-gray-800 font-fredoka">
            No nearby schools found.
          </p>
        )}
      </div>
    </div>
  );
}