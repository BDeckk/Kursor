"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Navbar from "@/components/homepage-navbar";
import { useRouter } from "next/navigation";
import HomeCards from "@/components/ui/home_carousel";
import { MiniCarousel } from "@/components/ui/mini-carousel";
import { SchoolCarousel } from "@/components/ui/school-carousel";
import { supabase } from "@/supabaseClient";
import { useGlobalLoading } from "@/Context/GlobalLoadingContext";
import Chatbot from "@/components/chatbot/page";
import { Search, X } from "lucide-react";

type SchoolResult = {
  type: "school";
  id: string;
  name: string;
  school_logo: string;
  location: string;
};

type ProgramResult = {
  type: "program";
  id: string;
  program_name: string;
  school_id?: string;
  school_name: string;
};

type SearchResult = SchoolResult | ProgramResult;

export default function DashboardPage() {
  const router = useRouter();
  const { setIsLoading } = useGlobalLoading();
  const searchRef = useRef<HTMLDivElement | null>(null);

  // Page visibility
  const [isVisible, setIsVisible] = useState(false);
  const [pageReady, setPageReady] = useState(false);

  // Chatbot
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  // Top carousels data
  const [topStatistics, setTopStatistics] = useState<any[]>([]);
  const [topReviews, setTopReviews] = useState<any[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [reviewsError, setReviewsError] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Refs for debounce & abort
  const debounceRef = useRef<number | null>(null);
  const currentAbortRef = useRef<AbortController | null>(null);

  /* ----------------- Search Handler (robust) ----------------- */
const runSearch = useCallback(
  async (query: string) => {
    // Cancel previous in-flight request
    if (currentAbortRef.current) {
      try {
        currentAbortRef.current.abort();
      } catch (_) {}
    }
    const abort = new AbortController();
    currentAbortRef.current = abort;

    if (query.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    setShowResults(true);

    try {
      const sanitized = query.trim();
      const ilikeTerm = `%${sanitized}%`;

      // Search schools
      const schoolPromise = supabase
        .from("schools")
        .select("id, name, school_logo, location")
        .ilike("name", ilikeTerm)
        .limit(6)
        .abortSignal(abort.signal);

      // Search programs - only using columns that exist
      const programPromise = supabase
        .from("programs")
        .select("id, title")
        .ilike("title", ilikeTerm)
        .limit(6)
        .abortSignal(abort.signal);

      const [schoolRes, programRes] = await Promise.all([schoolPromise, programPromise]);

      const { data: schools, error: schoolError } = schoolRes;
      const { data: programs, error: programError } = programRes;

      if (schoolError) {
        console.error("School search error:", schoolError);
      }
      if (programError) {
        console.error("Program search error:", programError);
        console.error("Program error details:", JSON.stringify(programError, null, 2));
      }

      // Normalize school results
      const schoolResults: SchoolResult[] = (schools ?? []).map((s: any) => ({
        type: "school",
        id: String(s.id),
        name: s.name ?? "Unnamed School",
        school_logo: s.school_logo ?? "/temporary-school-logo/placeholder.png",
        location: s.location ?? "",
      }));

      // Normalize program results - no school relationship
      const programResults: ProgramResult[] = (programs ?? []).map((p: any) => ({
        type: "program",
        id: String(p.id),
        program_name: p.title || "Unnamed Program",
        school_name: "Program", // No school relationship exists
      }));

      setSearchResults([...schoolResults, ...programResults]);
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      console.error("Search error:", err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  },
  []
);

  // Debounced effect for searchQuery
  useEffect(() => {
    // clear previous debounce
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    // schedule new debounce
    debounceRef.current = window.setTimeout(() => {
      runSearch(searchQuery);
    }, 300);

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery, runSearch]);

  // Click outside to close search results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside, { passive: true });
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleResultClick = (result: SearchResult) => {
  // Close dropdown first (prevent UI flicker)
  setShowResults(false);
  setSearchQuery("");

  if (result.type === "school") {
    router.push(`/school-details/${result.id}`);
  } else {
    router.push(`/program-details?id=${result.id}`);
  }
};

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
    // abort any in-flight search
    if (currentAbortRef.current) {
      try {
        currentAbortRef.current.abort();
      } catch (_) {}
      currentAbortRef.current = null;
    }
  };

  /* ----------------- Fetch Top Statistics ----------------- */
  useEffect(() => {
    let mounted = true;
    (async () => {
      setStatsLoading(true);
      setStatsError(null);
      try {
        const { data, error } = await supabase
          .from("top_universities")
          .select("*")
          .order("rank", { ascending: true })
          .limit(10);

        if (error) throw error;

        const formatted = (data ?? []).map((u: any) => ({
          id: u.university_id,
          rank: u.rank,
          schoolname: u.schoolname,
          image: u.image ?? "/temporary-school-logo/placeholder.png",
        }));

        if (mounted) setTopStatistics(formatted);
      } catch (err: any) {
        if (mounted) setStatsError(err.message ?? "Failed to load data");
      } finally {
        if (mounted) setStatsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  /* ----------------- Fetch Top Reviews ----------------- */
  useEffect(() => {
    let mounted = true;
    (async () => {
      setReviewsLoading(true);
      setReviewsError(null);

      try {
        const { data: reviewRows, error: reviewErr } = await supabase
          .from("reviews")
          .select("school_id, rating");

        if (reviewErr) throw reviewErr;

        if (!reviewRows || reviewRows.length === 0) {
          if (mounted) setTopReviews([]);
          return;
        }

        const ratingMap: Record<string, { total: number; count: number }> = {};
        reviewRows.forEach((row: any) => {
          const id = String(row.school_id);
          if (!id) return;
          if (!ratingMap[id]) ratingMap[id] = { total: 0, count: 0 };
          ratingMap[id].total += Number(row.rating ?? 0);
          ratingMap[id].count += 1;
        });

        const averages = Object.entries(ratingMap).map(([schoolId, stats]) => ({
          school_id: schoolId,
          average: stats.total / stats.count,
        }));

        averages.sort((a, b) => b.average - a.average);

        const top10 = averages.slice(0, 10);
        if (top10.length === 0) {
          if (mounted) setTopReviews([]);
          return;
        }

        const schoolIds = top10.map((s) => s.school_id);
        const { data: schoolRows, error: schoolErr } = await supabase
          .from("schools")
          .select("id, name, school_logo")
          .in("id", schoolIds);

        if (schoolErr) throw schoolErr;

        const merged = top10.map((entry, index) => {
          const school = (schoolRows ?? []).find((s: any) => String(s.id) === String(entry.school_id));
          return {
            id: school?.id,
            rank: index + 1,
            schoolname: school?.name ?? "Unknown School",
            image: school?.school_logo ?? "/temporary-school-logo/placeholder.png",
            rating: entry.average,
          };
        });

        if (mounted) setTopReviews(merged);
      } catch (err: any) {
        if (mounted) setReviewsError(err.message ?? "Failed to load reviews");
      } finally {
        if (mounted) setReviewsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  /* ----------------- Wait for all data to be ready ----------------- */
  useEffect(() => {
    const dataReady = !statsLoading && !reviewsLoading;

    if (statsLoading || reviewsLoading) {
      setIsLoading(true);
      return;
    }

    const timer = setTimeout(() => {
      setPageReady(true);
      setIsLoading(false);
      setTimeout(() => setIsVisible(true), 50);
    }, 500);

    return () => clearTimeout(timer);
  }, [statsLoading, reviewsLoading, setIsLoading]);

  if (!pageReady) return null;

  const slides = [
    { image: "/homepage_carousel/carousel3.png" },
    { image: "/homepage_carousel/carousel2.png" },
  ];

  const fields = [
    {
      title: "TVL-HE",
      image: "/homepage_carousel/TVL-HE.svg",
      description: "Explore programs for TVL-HE",
      color: "bg-blue-50",
      imageHeight: "190px",
      imageTop: "-30px",
      imageLeft: "1px",
      link: "/strand-programs?strand=TVL-HE",
    },
    {
      title: "TVL-ICT",
      image: "/homepage_carousel/TVL-ICT.svg",
      description: "Explore programs for TVL-ICT",
      color: "bg-blue-50",
      imageHeight: "185px",
      imageTop: "-33px",
      link: "/strand-programs?strand=TVL-ICT",
    },
    {
      title: "STEM",
      image: "/homepage_carousel/STEM.svg",
      description: "Explore programs for STEM",
      color: "bg-blue-50",
      imageHeight: "175px",
      imageTop: "-50px",
      link: "/strand-programs?strand=STEM",
    },
    {
      title: "ABM",
      image: "/homepage_carousel/ABM.svg",
      description: "Explore programs for ABM",
      color: "bg-blue-50",
      imageHeight: "225px",
      imageTop: "-50px",
      link: "/strand-programs?strand=ABM",
    },
    {
      title: "HUMSS",
      image: "/homepage_carousel/HUMSS.svg",
      description: "Explore programs for HUMSS",
      color: "bg-blue-50",
      imageHeight: "205px",
      imageTop: "-45px",
      link: "/strand-programs?strand=HUMSS",
    },
    {
      title: "GAS",
      image: "/homepage_carousel/GAS.svg",
      description: "Explore programs for GAS",
      color: "bg-blue-50",
      imageHeight: "200px",
      imageTop: "-40px",
      link: "/strand-programs?strand=GAS",
    },
    {
      title: "Arts & Design",
      image: "/homepage_carousel/artist.svg",
      description: "Explore programs for Arts & Design",
      color: "bg-blue-50",
      imageHeight: "230px",
      imageTop: "-55px",
      link: "/strand-programs?strand=Arts%20%26%20Design",
    },
  ];

  const handleAiClick = () => setIsChatbotOpen(true);
  const handleAssessmentClick = () => router.push("/assessment");
  const handleSchoolClick = () => router.push("/school");

  return (
    <>
      <div className="min-h-screen bg-white">
        {/* Navbar */}
        <div className={`transition-opacity duration-500 ${isVisible ? "opacity-100" : "opacity-0"}`}>
          <Navbar />
        </div>

        {/* Search Bar */}
        <div
          className={`w-full px-[19%] pt-20 transition-all duration-700 ease-out ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8"
          }`}
          style={{ transitionDelay: "50ms", zIndex: 9999, position: "relative" }}
        >
          <div className="relative" ref={searchRef}>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.trim().length >= 2 && setShowResults(true)}
                placeholder="Search for schools or courses..."
                className="w-full pl-12 pr-12 py-4 rounded-full border-2 border-gray-200 focus:border-yellow-500 focus:outline-none text-gray-700 font-outfit transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Search Results Dropdown */}
            {showResults && searchQuery.trim().length >= 2 && (
              <div
                className="absolute w-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-200 max-h-96 overflow-y-auto"
                style={{ zIndex: 9999 }}
              >
                {isSearching ? (
                  <div className="p-6 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto"></div>
                    <p className="mt-2 font-outfit">Searching...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="py-2">
                    {searchResults.map((result, index) => (
                      <button
                        key={`${result.type}-${result.id}-${index}`}
                        onClick={() => handleResultClick(result)}
                        className="w-full px-6 py-4 hover:bg-gray-50 flex items-start gap-4 text-left transition-colors"
                      >
                        {result.type === "school" ? (
                          <>
                            <img
                              src={result.school_logo}
                              alt={result.name}
                              className="w-18 h-18 object-cover flex-shrink-0"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = "/temporary-school-logo/placeholder.png";
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                                  School
                                </span>
                              </div>
                              <p className="font-semibold text-gray-900 font-outfit truncate">{result.name}</p>
                              {result.location && <p className="text-sm text-gray-500 truncate">{result.location}</p>}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="w-18 h-18 rounded-lg bg-yellow-100 flex items-center justify-center flex-shrink-0">
                              <span className="text-2xl">📚</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
                                  Course
                                </span>
                              </div>
                              <p className="font-semibold text-gray-900 font-outfit truncate">
                                {result.program_name}
                              </p>
                              <p className="text-sm text-gray-500 truncate">{result.school_name}</p>
                            </div>
                          </>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    <p className="font-outfit">No results found for "{searchQuery}"</p>
                    <p className="text-sm mt-1">Try searching with different keywords</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <main className="pb-1">
          {/* Main Carousel */}
          <div
            className={`mb-9 pl-[19%] pr-[19%] pt-4 transition-all duration-700 ease-out ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8"
            }`}
            style={{ transitionDelay: "100ms" }}
          >
            <HomeCards slides={slides} />
          </div>

          {/* AI / Assessment / School Cards */}
          <div
            className={`grid grid-cols-1 md:grid-cols-3 gap-8 pl-[15%] pr-[15%] transition-all duration-700 ease-out ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ transitionDelay: "200ms" }}
          >
            {/* Seek guidance */}
            <button
              onClick={handleAiClick}
              className="bg-white rounded-2xl p-8 shadow-lg border-2 border-transparent hover:border-yellow-600 cursor-pointer text-center relative group w-full h-[400px] flex flex-col justify-between"
            >
              <div className="relative flex justify-center items-center flex-grow">
                <div className="absolute w-[220px] h-[220px] bg-[#FFDE59] rounded-[30px]"></div>
                <img
                  src="/homepage_carousel/seek.png"
                  alt="Seek guidance"
                  className="relative z-10 w-[290px] h-[240px] transition-transform duration-300 ease-out group-hover:scale-110"
                  style={{ top: "2px", left: "0px" }}
                />
              </div>
              <div className="mt-4">
                <h3 className="text-[25px] font-outfit font-bold text-black mb-2">
                  Seek <span className="text-yellow-500">guidance</span>
                </h3>
                <p className="text-[25px] font-outfit font-bold text-black -mt-2">from our AI</p>
              </div>
            </button>

            {/* Find career */}
            <button
              onClick={handleAssessmentClick}
              className="bg-white rounded-2xl p-8 shadow-lg border-2 border-transparent hover:border-yellow-600 cursor-pointer text-center relative group w-full h-[400px] flex flex-col justify-between"
            >
              <div className="relative flex justify-center items-center flex-grow">
                <div className="absolute w-[220px] h-[220px] bg-[#FFDE59] rounded-[30px]"></div>
                <img
                  src="/homepage_carousel/find.png"
                  alt="Find career"
                  className="relative z-10 w-auto h-[200px] transition-transform duration-300 ease-out group-hover:scale-110"
                  style={{ top: "8px", left: "0px" }}
                />
              </div>
              <div className="mt-4">
                <h3 className="text-[25px] font-outfit font-bold text-black mb-2">
                  Find the <span className="text-yellow-500">perfect</span>
                </h3>
                <p className="text-[25px] font-outfit font-bold text-black -mt-2">career path</p>
              </div>
            </button>

            {/* Browse schools */}
            <button
              onClick={handleSchoolClick}
              className="bg-white rounded-2xl p-8 shadow-lg border-2 border-transparent hover:border-yellow-600 cursor-pointer text-center relative group w-full h-[400px] flex flex-col justify-between"
            >
              <div className="relative flex justify-center items-center flex-grow">
                <div className="absolute w-[220px] h-[220px] bg-[#FFDE59] rounded-[30px]"></div>
                <img
                  src="/homepage_carousel/browse.png"
                  alt="Browse schools"
                  className="relative z-10 w-auto h-[240px] transition-transform duration-300 ease-out group-hover:scale-110"
                  style={{ top: "-10px", left: "-8px" }}
                />
              </div>
              <div className="mt-4">
                <h3 className="text-[25px] font-outfit font-bold text-black mb-2">
                  Browse for <span className="text-yellow-500">schools</span>
                </h3>
                <p className="text-[25px] font-outfit font-bold text-black -mt-2">near you</p>
              </div>
            </button>
          </div>

          {/* Fields Carousel */}
          <div
            className={`w-full pt-[5%] transition-all duration-700 ease-out ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ transitionDelay: "300ms" }}
          >
            <div className="bg-[#FFDE59] py-12 w-full">
              <div className="px-[6%] mb-8">
                <h2 className="text-3xl font-bold font-outfit text-gray-800">
                  Fields that might <span className="text-white">interest you</span>
                </h2>
              </div>
              <MiniCarousel mini_card={fields} />
            </div>
          </div>

          {/* Top Statistics Carousel */}
          <div
            className={`w-full pl-[6%] pr-[6%] pt-[2%] mt-5 transition-all duration-700 ease-out ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ transitionDelay: "400ms" }}
          >
            <div className="px-[6%] mb-8">
              <h2 className="text-3xl font-bold font-outfit text-gray-800 text-right pl-10">
                Top-Rated Schools <span className="text-[#FFDE59]">Based on Statistics</span>
              </h2>
            </div>
            {statsError ? <div className="text-center text-red-600">{statsError}</div> : <SchoolCarousel school_card={topStatistics} />}
          </div>

          {/* Top Reviews Carousel */}
          <div
            className={`w-full pt-[3%] py-12 w-full mt-10 mb-10 pb-[2%] transition-all duration-700 ease-out ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ transitionDelay: "500ms" }}
          >
            <div className="px-[6%] mb-8">
              <h2 className="text-3xl font-bold font-outfit text-gray-800 mb-10 pl-10">
                Top-Rated Schools <span className="text-[#FFDE59]">Based on Student Reviews</span>
              </h2>
            </div>
            {reviewsError ? <div className="text-center text-red-600">{reviewsError}</div> : <SchoolCarousel school_card={topReviews} />}
          </div>
        </main>
      </div>

      {/* Chatbot */}
      <Chatbot isOpen={isChatbotOpen} onClose={() => setIsChatbotOpen(false)} />
    </>
  );
}
