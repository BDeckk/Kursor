"use client";

import Navbar from "@/components/homepage-navbar";
import { NearbySchoolCarousel } from "@/components/ui/nearby-school";
import { useNearbySchools } from "@/hooks/userNearbySchools";
<<<<<<< Updated upstream
=======
import { supabase } from "@/supabaseClient";
>>>>>>> Stashed changes
import { useState, useEffect } from "react";

export default function SchoolPage() {
  const { nearbySchools, loading, error: locationError } = useNearbySchools();
<<<<<<< Updated upstream
=======
  const { session } = UserAuth();
  const user = session?.user;
>>>>>>> Stashed changes
  const [isVisible, setIsVisible] = useState(false);
  const [universities, setUniversities] = useState<any[]>([]);
  const [topLoading, setTopLoading] = useState(false);
  const [topError, setTopError] = useState<string | null>(null);

  useEffect(() => setIsVisible(true), []);

  const handleLocalCache = (newUnis?: any[]) => {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${now.getMonth() + 1}`;
    localStorage.setItem("top_universities_month", monthKey);

    if (newUnis && newUnis.length > 0) {
      localStorage.setItem("top_universities_data", JSON.stringify(newUnis));
    } else {
      localStorage.removeItem("top_universities_data");
    }
  };

  useEffect(() => {
    const fetchTopUniversities = async () => {
      setTopLoading(true);
      try {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

        // Always check Supabase first (truth source)
        const { data: supaData, error: supaError } = await supabase
          .from("top_universities")
          .select("*")
          .gte("created_at", firstDay)
          .lt("created_at", nextMonth)
          .order("rank", { ascending: true });

        if (supaError) throw supaError;

        if (supaData && supaData.length > 0) {
          console.log("✅ Using Supabase data (this month)");
          setUniversities(supaData);
          handleLocalCache(supaData); // keep in sync with localStorage
          return;
        }

        console.log("⚠️ No Supabase data — clearing cache and checking API");

        // Clear stale local cache if DB is empty
        localStorage.removeItem("top_universities_data");
        localStorage.removeItem("top_universities_month");

        // Call API if nothing in DB
        const res = await fetch("/api/top-universities");
        const json = await res.json();

        if (!res.ok) throw new Error(json.error || "Failed to fetch universities");
        const newUnis = json.topUniversities || [];

        // Clean old DB rows
        await supabase.from("top_universities").delete().lt("created_at", firstDay);

        // Store new data if any
        if (newUnis.length > 0) {
          const { error: insertError } = await supabase.from("top_universities").insert(
            newUnis.map((u: any) => ({
              university_id: u.id,
              rank: u.rank,
              schoolname: u.schoolname,
              image: u.image,
              reason: u.reason,
              created_at: new Date().toISOString(),
            }))
          );
          if (insertError)
            console.error("⚠️ Failed to store new data:", insertError.message);
          else console.log("✅ Stored new top universities in Supabase (this month)");
        }

        handleLocalCache(newUnis);
        setUniversities(newUnis);
      } catch (err: any) {
        console.error("❌ Error fetching top universities:", err);
        setTopError(err.message || "Unknown error");

        //  If Supabase fails, fallback to localStorage cache
        const cachedData = localStorage.getItem("top_universities_data");
        if (cachedData) {
          console.log("⚡ Using fallback localStorage cache");
          setUniversities(JSON.parse(cachedData));
        }
      } finally {
        setTopLoading(false);
      }
    };

    fetchTopUniversities();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Universities Near Your Location */}
      <div className="max-w-7xl mx-auto py-12 px-6 pt-[7%]">
        <h2 className="text-3xl font-bold text-gray-800 mb-8">
          Universities and Schools{" "}
          <span className="text-yellow-400">Near Your Location</span>
        </h2>

        {loading ? (
          <div className="text-center text-gray-800 font-fredoka">
            Finding nearby schools...
          </div>
        ) : locationError ? (
          <div className="text-center text-red-600 font-fredoka">
            {locationError}
          </div>
        ) : nearbySchools.length > 0 ? (
          <NearbySchoolCarousel school_card={nearbySchools} />
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

          {loading ? (
            <div className="text-center text-gray-800 font-fredoka">
              Finding nearby schools...
            </div>
          ) : locationError ? (
            <div className="text-center text-red-600 font-fredoka">
              {locationError}
            </div>
          ) : nearbySchools.length > 0 ? (
            <NearbySchoolCarousel school_card={nearbySchools} />
          ) : (
            <div className="text-center text-gray-800 font-fredoka">
<<<<<<< Updated upstream
              No nearby schools found.
=======
              No top universities found for this month.
>>>>>>> Stashed changes
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
            Finding nearby schools...
          </div>
        ) : locationError ? (
          <div className="text-center text-red-600 font-fredoka">
            {locationError}
          </div>
        ) : nearbySchools.length > 0 ? (
          <NearbySchoolCarousel school_card={nearbySchools} />
        ) : (
          <div className="text-center text-gray-800 font-fredoka">
            No nearby schools found.
          </div>
        )}
      </div>
    </div>
  );
}
