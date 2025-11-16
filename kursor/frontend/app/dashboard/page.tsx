"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/homepage-navbar";
import { useRouter } from "next/navigation";
import HomeCards from "@/components/ui/home_carousel";
import { MiniCarousel } from "@/components/ui/mini-carousel";
import { SchoolCarousel } from "@/components/ui/school-carousel";
import { supabase } from "@/supabaseClient";
import { useGlobalLoading } from "@/Context/GlobalLoadingContext";
import Chatbot from "@/components/chatbot/page";

export default function DashboardPage() {
  const router = useRouter();
  const { setIsLoading } = useGlobalLoading();

  const [isVisible, setIsVisible] = useState(false);
  const [pageReady, setPageReady] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  const [topStatistics, setTopStatistics] = useState<any[]>([]);
  const [topReviews, setTopReviews] = useState<any[]>([]);

  const [statsLoading, setStatsLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  const [statsError, setStatsError] = useState<string | null>(null);
  const [reviewsError, setReviewsError] = useState<string | null>(null);

  /* ----------------- Fetch Top Statistics ----------------- */
  useEffect(() => {
    const fetchTopStatistics = async () => {
      setStatsLoading(true);
      setStatsError(null);

      try {
        const { data, error } = await supabase
          .from("top_universities")
          .select("*")
          .order("rank", { ascending: true })
          .limit(10);

        if (error) throw error;

        const formatted = data.map((u) => ({
          id: u.university_id,
          rank: u.rank,
          schoolname: u.schoolname,
          image: u.image ?? "/temporary-school-logo/placeholder.png",
        }));

        setTopStatistics(formatted);
      } catch (err: any) {
        setStatsError(err.message ?? "Failed to load data");
      } finally {
        setStatsLoading(false);
      }
    };

    fetchTopStatistics();
  }, []);

  /* ----------------- Fetch Top Reviews ----------------- */
  useEffect(() => {
    const fetchTopReviews = async () => {
      setReviewsLoading(true);
      setReviewsError(null);

      try {
        const { data: reviewRows, error: reviewErr } = await supabase
          .from("reviews")
          .select("school_id, rating");

        if (reviewErr) throw reviewErr;

        if (!reviewRows || reviewRows.length === 0) {
          setTopReviews([]);
          return;
        }

        const ratingMap: Record<string, { total: number; count: number }> = {};
        reviewRows.forEach((row) => {
          const id = row.school_id;
          if (!id) return;
          if (!ratingMap[id]) ratingMap[id] = { total: 0, count: 0 };
          ratingMap[id].total += row.rating;
          ratingMap[id].count += 1;
        });

        const averages = Object.entries(ratingMap).map(([schoolId, stats]) => ({
          school_id: schoolId,
          average: stats.total / stats.count,
        }));

        averages.sort((a, b) => b.average - a.average);

        const top10 = averages.slice(0, 10);
        if (top10.length === 0) {
          setTopReviews([]);
          return;
        }

        const schoolIds = top10.map((s) => s.school_id);
        const { data: schoolRows, error: schoolErr } = await supabase
          .from("schools")
          .select("id, name, school_logo")
          .in("id", schoolIds);

        if (schoolErr) throw schoolErr;

        const merged = top10.map((entry, index) => {
          const school = schoolRows.find((s) => s.id === entry.school_id);
          return {
            id: school?.id,
            rank: index + 1,
            schoolname: school?.name ?? "Unknown School",
            image: school?.school_logo ?? "/temporary-school-logo/placeholder.png",
            rating: entry.average,
          };
        });

        setTopReviews(merged);
      } catch (err: any) {
        setReviewsError(err.message ?? "Failed to load reviews");
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchTopReviews();
  }, []);

  /* ----------------- Wait for all data to be ready ----------------- */
  useEffect(() => {
    const dataReady = !statsLoading && !reviewsLoading;

    if (statsLoading || reviewsLoading) {
      setIsLoading(true);
    } else {
      const timer = setTimeout(() => {
        setPageReady(true);
        setIsLoading(false);
        setTimeout(() => setIsVisible(true), 50);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [statsLoading, reviewsLoading, setIsLoading]);

  if (!pageReady) return null;

  const slides = [
    { image: "/homepage_carousel/carousel3.png" },
    { image: "/homepage_carousel/carousel2.png" },
  ];

  const strands = ["TVL-HE","TVL-ICT","STEM","ABM","HUMSS","GAS","ICT","Arts & Design"];
    const fields = strands.map(strand => ({
      title: strand,
      image: `/homepage_carousel/${strand}.svg`,  
      description: `Explore programs for ${strand}`,
      color: "bg-blue-50",
      imageWidth: "250px",
      imageHeight: "250px",
      imageTop: "4px",
      link: `/strand-programs?strand=${encodeURIComponent(strand)}`
    }));


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

        <main className="pb-1">
          {/* Main Carousel */}
          <div className={`mb-9 pl-[19%] pr-[19%] pt-[7%] transition-all duration-700 ease-out ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8"
          }`} style={{ transitionDelay: "100ms" }}>
            <HomeCards slides={slides} />
          </div>

          {/* AI / Assessment / School Cards */}
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 pl-[15%] pr-[15%] transition-all duration-700 ease-out ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`} style={{ transitionDelay: "200ms" }}>
            {/* Seek guidance */}
            <button onClick={handleAiClick} className="bg-white rounded-2xl p-8 shadow-lg border-2 border-transparent hover:border-yellow-600 cursor-pointer text-center relative group w-full h-[400px] flex flex-col justify-between">
              <div className="relative flex justify-center items-center flex-grow">
                <div className="absolute w-[220px] h-[220px] bg-[#FFDE59] rounded-[30px]"></div>
                <img src="/homepage_carousel/seek.png" alt="Seek guidance" className="relative z-10 w-[290px] h-[240px] transition-transform duration-300 ease-out group-hover:scale-110" style={{ top: '2px', left: '0px' }} />
              </div>
              <div className="mt-4"><h3 className="text-[25px] font-outfit font-bold text-black mb-2">Seek <span className="text-yellow-500">guidance</span></h3><p className="text-[25px] font-outfit font-bold text-black -mt-2">from our AI</p></div>
            </button>

            {/* Find career */}
            <button onClick={handleAssessmentClick} className="bg-white rounded-2xl p-8 shadow-lg border-2 border-transparent hover:border-yellow-600 cursor-pointer text-center relative group w-full h-[400px] flex flex-col justify-between">
              <div className="relative flex justify-center items-center flex-grow">
                <div className="absolute w-[220px] h-[220px] bg-[#FFDE59] rounded-[30px]"></div>
                <img src="/homepage_carousel/find.png" alt="Find career" className="relative z-10 w-auto h-[200px] transition-transform duration-300 ease-out group-hover:scale-110" style={{ top: '8px', left: '0px' }} />
              </div>
              <div className="mt-4"><h3 className="text-[25px] font-outfit font-bold text-black mb-2">Find the <span className="text-yellow-500">perfect</span></h3><p className="text-[25px] font-outfit font-bold text-black -mt-2">career path</p></div>
            </button>

            {/* Browse schools */}
            <button onClick={handleSchoolClick} className="bg-white rounded-2xl p-8 shadow-lg border-2 border-transparent hover:border-yellow-600 cursor-pointer text-center relative group w-full h-[400px] flex flex-col justify-between">
              <div className="relative flex justify-center items-center flex-grow">
                <div className="absolute w-[220px] h-[220px] bg-[#FFDE59] rounded-[30px]"></div>
                <img src="/homepage_carousel/browse.png" alt="Browse schools" className="relative z-10 w-auto h-[240px] transition-transform duration-300 ease-out group-hover:scale-110" style={{ top: '-10px', left: '-8px' }} />
              </div>
              <div className="mt-4"><h3 className="text-[25px] font-outfit font-bold text-black mb-2">Browse for <span className="text-yellow-500">schools</span></h3><p className="text-[25px] font-outfit font-bold text-black -mt-2">near you</p></div>
            </button>
          </div>

          {/* Fields Carousel */}
          <div className={`w-full pt-[5%] transition-all duration-700 ease-out ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`} style={{ transitionDelay: "300ms" }}>
            <div className="bg-[#FFDE59] py-12 w-full">
              <div className="px-[6%] mb-8">
                <h2 className="text-3xl font-bold font-outfit text-gray-800">Fields that might <span className="text-white">interest you</span></h2>
              </div>
              <MiniCarousel mini_card={fields} />
            </div>
          </div>

          {/* Top Statistics Carousel */}
          <div className={`w-full pl-[6%] pr-[6%] pt-[2%] mt-5 transition-all duration-700 ease-out ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`} style={{ transitionDelay: "400ms" }}>
            <div className="px-[6%] mb-8">
              <h2 className="text-3xl font-bold font-outfit text-gray-800 text-right pl-10">Top-Rated Schools <span className="text-[#FFDE59]">Based on Statistics</span></h2>
            </div>
            {statsError ? <div className="text-center text-red-600">{statsError}</div> : <SchoolCarousel school_card={topStatistics} />}
          </div>

          {/* Top Reviews Carousel */}
          <div className={`w-full pt-[3%] py-12 w-full mt-20 mb-20 pb-[2%] transition-all duration-700 ease-out ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`} style={{ transitionDelay: "500ms" }}>
            <div className="px-[6%] mb-8">
              <h2 className="text-3xl font-bold font-outfit text-gray-800 mb-10 pl-10">Top-Rated Schools <span className="text-[#FFDE59]">Based on Student Reviews</span></h2>
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
