"use client";

import Navbar from "@/components/homepage-navbar";
import { TopUniversitiesCarousel } from "@/components/TopUniversitiesCarousel";
import { NearbySchoolCarousel } from "@/components/ui/nearby-school";
import { UserAuth } from "@/Context/AuthContext";
import { useNearbySchools } from "@/hooks/userNearbySchools";
import { supabase } from "@/supabaseClient";
import { useState, useEffect } from "react";
import { useGlobalLoading } from "@/Context/GlobalLoadingContext";

/* --- Simple Skeleton (used only if you later want it) --- */
const SkeletonCarousel = () => (
  <div className="flex gap-4 overflow-x-auto animate-pulse">
    {Array.from({ length: 4 }).map((_, i) => (
      <div
        key={i}
        className="w-72 h-40 bg-gray-300 rounded-2xl flex-shrink-0"
      ></div>
    ))}
  </div>
);

export default function SchoolPage() {
  const { nearbySchools, loading: nearbyLoading, error: locationError } = useNearbySchools();
  const { session } = UserAuth();
  const user = session?.user;

  const {setIsLoading} = useGlobalLoading();

  const [universities, setUniversities] = useState<any[]>([]);
  const [topLoading, setTopLoading] = useState(true);
  const [topError, setTopError] = useState<string | null>(null);

  // pageReady becomes true only when all required async sources are done
  const [pageReady, setPageReady] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  /* --- Fetch top universities (cache-first + parallel fetch) --- */
  useEffect(() => {
    const fetchTopUniversities = async () => {
      setTopLoading(true);
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

      // local cache check
      const cachedMonth = localStorage.getItem("top_universities_month");
      const cachedData = localStorage.getItem("top_universities_data");
      const monthKey = `${now.getFullYear()}-${now.getMonth() + 1}`;

      if (cachedMonth === monthKey && cachedData) {
        try {
          setUniversities(JSON.parse(cachedData));
        } catch {
          // ignore parse error and continue to fetch
        }
      }

      try {
        const [supaRes, apiRes] = await Promise.allSettled([
          supabase
            .from("top_universities")
            .select("*")
            .gte("created_at", firstDay)
            .lt("created_at", nextMonth)
            .order("rank", { ascending: true }),
          fetch("/api/top-universities").then((res) => res.json()),
        ]);

        let finalData: any[] = [];

        if (
          supaRes.status === "fulfilled" &&
          supaRes.value &&
          Array.isArray(supaRes.value.data) &&
          supaRes.value.data.length > 0
        ) {
          finalData = supaRes.value.data;
          console.log("✅ top universities: loaded from Supabase");
        } else if (
          apiRes.status === "fulfilled" &&
          apiRes.value &&
          Array.isArray(apiRes.value.topUniversities) &&
          apiRes.value.topUniversities.length > 0
        ) {
          finalData = apiRes.value.topUniversities;
          console.log("⚡ top universities: loaded from API fallback");

          // store to supabase in background (non-blocking)
          supabase.from("top_universities").insert(
            finalData.map((u: any) => ({
              university_id: u.id,
              rank: u.rank,
              schoolname: u.schoolname,
              image: u.image,
              reason: u.reason,
              created_at: new Date().toISOString(),
            }))
          ).then(res => {
            if (res.error) console.warn("Supabase background insert failed:", res.error.message);
          });
        }

        if (finalData.length > 0) {
          localStorage.setItem("top_universities_month", monthKey);
          localStorage.setItem("top_universities_data", JSON.stringify(finalData));
          setUniversities(finalData);
        } else {
          // if nothing found and we have cached data, keep it; otherwise throw
          if (!cachedData) throw new Error("No top universities found.");
        }
      } catch (err: any) {
        console.error("❌ Error fetching top universities:", err);
        setTopError(err?.message ?? "Unknown error");

        // fallback: use cached data if present
        if (cachedData) {
          try {
            setUniversities(JSON.parse(cachedData));
          } catch {
            // ignore
          }
        }
      } finally {
        setTopLoading(false);
      }
    };

    fetchTopUniversities();
  }, []);

  /* --- When everything (nearby, top, session) is finished, mark page ready --- */
  useEffect(() => {
    const authResolved = session !== undefined;

    if (nearbyLoading || topLoading || !authResolved) {
      setIsLoading(true);
    } else {
      const t = setTimeout(() => {
        setPageReady(true);
        setIsLoading(false);
        setTimeout(() => setIsVisible(true), 50);
      }, 500);
      return () => clearTimeout(t);
    }
  }, [nearbyLoading, topLoading, session, setIsLoading]);

  if (!pageReady) {
    // No need for LoadingScreen, the global one shows automatically
    return null;
  }

  /* --- Page content with smooth entrance animations --- */
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

      {/* === Nearby Universities Section === */}
      <div
        className={`max-w-7xl mx-auto py-12 px-6 pt-[7%] transition-all duration-700 ease-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
        style={{ transitionDelay: "200ms" }}
      >
        <h2 className="text-3xl font-bold text-gray-800 mb-8">
          Universities and Schools{" "}
          <span className="text-yellow-400">Near Your Location</span>
        </h2>

        {nearbyLoading ? (
          <SkeletonCarousel />
        ) : locationError ? (
          <div className="text-center text-red-600 font-fredoka">{locationError}</div>
        ) : nearbySchools.length > 0 ? (
          <NearbySchoolCarousel school_card={nearbySchools} userId={user?.id ?? ""} />
        ) : (
          <div className="text-center text-gray-800 font-fredoka">
            No nearby schools found.
          </div>
        )}
      </div>

      {/* === Top Performing Universities Section === */}
      <div
        className={`w-full bg-[#FFD31F] py-12 px-0 transition-all duration-700 ease-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
        style={{ transitionDelay: "400ms" }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-8">
            Top Performing <span className="text-white">Universities</span>
          </h2>

          {topLoading ? (
            <SkeletonCarousel />
          ) : topError ? (
            <div className="text-center text-red-600 font-fredoka">{topError}</div>
          ) : universities.length > 0 ? (
            <TopUniversitiesCarousel
              universities={universities}
              userId={user?.id ?? ""}
            />
          ) : (
            <div className="text-center text-gray-800 font-fredoka">
              No top universities found for this month.
            </div>
          )}
        </div>
      </div>

      {/* === Recommended Universities Section === */}
      <div
        className={`max-w-7xl mx-auto py-12 px-6 transition-all duration-700 ease-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
        style={{ transitionDelay: "600ms" }}
      >
        <h2 className="text-3xl font-bold text-gray-800 mb-8">
          Recommended Universities Based on{" "}
          <span className="text-yellow-400">Your Assessment</span>
        </h2>

        {nearbyLoading ? (
          <SkeletonCarousel />
        ) : locationError ? (
          <div className="text-center text-red-600 font-fredoka">{locationError}</div>
        ) : nearbySchools.length > 0 ? (
          <NearbySchoolCarousel school_card={nearbySchools} userId={user?.id ?? ""} />
        ) : (
          <div className="text-center text-gray-800 font-fredoka">
            No nearby schools found.
          </div>
        )}
      </div>
    </div>
  );
}