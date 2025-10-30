"use client";

import Navbar from "@/components/homepage-navbar";
import { TopUniversitiesCarousel } from "@/components/TopUniversitiesCarousel";
import { NearbySchoolCarousel } from "@/components/ui/nearby-school";
import { UserAuth } from "@/Context/AuthContext";
import { useNearbySchools } from "@/hooks/userNearbySchools";
import { useTopUniversitiesGemini } from "@/hooks/useTopUniversitiesGemini"; 
import { useState, useEffect } from "react";

export default function SchoolPage() {
  const { nearbySchools, loading, error: locationError } = useNearbySchools();
  const { universities, loading: topLoading, error: topError } = useTopUniversitiesGemini(); 
  const { session } = UserAuth();
  const user = session?.user;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <Navbar />

      {/* Universities Near Your Location */}
      <div className="max-w-7xl mx-auto py-12 px-6 pt-[7%]">
        <h2 className="text-3xl font-bold text-gray-800 mb-8">
          Universities and Schools{" "}
          <span className="text-yellow-400">Near Your Location</span>
        </h2>

        {loading ? (
          <div className="text-center text-gray-800 font-fredoka">
            Finding nearby schools…
          </div>
        ) : locationError ? (
          <div className="text-center text-red-600 font-fredoka">
            {locationError}
          </div>
        ) : nearbySchools.length > 0 ? (
          <NearbySchoolCarousel
            school_card={nearbySchools}
            userId={user?.id ?? ""}
          />
        ) : (
          <div className="text-center text-gray-800 font-fredoka">
            No nearby schools found.
          </div>
        )}
      </div>

      {/* Top Performing Universities */}
      <div
        className={`w-full bg-[#FFD31F] py-12 px-6 transition-all duration-700 ease-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
        style={{ transitionDelay: "600ms" }}
      >
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-800 mb-8">
            Top Performing <span className="text-white">Universities</span>
          </h2>

          {topLoading ? (
            <div className="text-center text-gray-800 font-fredoka">
              Ranking universities via Gemini…
            </div>
          ) : topError ? (
            <div className="text-center text-red-600 font-fredoka">
              {topError}
            </div>
          ) : universities.length > 0 ? (
            <TopUniversitiesCarousel
              universities={universities}
              userId={user?.id ?? ""}
            />
          ) : (
            <div className="text-center text-gray-800 font-fredoka">
              No top universities found.
            </div>
          )}
        </div>
      </div>

      {/* Recommended Universities */}
      <div className="max-w-7xl mx-auto py-12 px-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-8">
          Recommended Universities Based on{" "}
          <span className="text-yellow-400">Your Assessment</span>
        </h2>

        {loading ? (
          <div className="text-center text-gray-800 font-fredoka">
            Finding nearby schools…
          </div>
        ) : locationError ? (
          <div className="text-center text-red-600 font-fredoka">
            {locationError}
          </div>
        ) : nearbySchools.length > 0 ? (
          <NearbySchoolCarousel
            school_card={nearbySchools}
            userId={user?.id ?? ""}
          />
        ) : (
          <div className="text-center text-gray-800 font-fredoka">
            No nearby schools found.
          </div>
        )}
      </div>
    </div>
  );
}
