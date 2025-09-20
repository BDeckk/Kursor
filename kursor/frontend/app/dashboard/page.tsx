"use client";

import React, {useState} from "react";
import Navbar from "@/components/homepage-navbar";
import { useRouter } from "next/navigation";
import HomeCards from "@/components/ui/home_carousel";
import { MiniCarousel } from "@/components/ui/mini-carousel";
import { imageConfigDefault } from "next/dist/shared/lib/image-config";
import { SchoolCarousel } from "@/components/ui/school-carousel";


export default function DashboardPage() {

  const router = useRouter(); 

   //Temporary! Coursel slides content - need some adjustments, can insert the contents here : kanang first carousel
  const slides = [
    {
      title: "Explore and get started with",
      subtitle: "KURSOR",
      image: "/homepage_carousel/hp-c1.png"
    },
    {
      title: "Explore and get started with", 
      subtitle: "Lezgo",
      image: "/homepage_carousel/hp-c1.png"
    }
  ];

  //Temporary! Coursel slides content, second carousel "Fields that might interest you"
  const fields = [
    { title: "Engineering & Technology", image: "/images/engineering.png" },
    { title: "Arts, Humanities & Design", image: "/images/arts.png" },
    { title: "Business & Management", image: "/images/business.png" },
    { title: "Law & Legal Studies", image: "/images/law.png" },
  ]

  //Temporary!Coursel slides content, second carousel "Fields that might interest you"
  const schoolList = [
    { rank: 1, schoolname: "Cebu Insitute of Technology - University", image: "/temporary-school-logo/CIT.png"},
    { rank: 2, schoolname: "University of San Carlos", image: "/temporary-school-logo/USC.png"},
    { rank: 3, schoolname: "Cebu Normal University", image: "/temporary-school-logo/USC.png"},
    { rank: 4, schoolname: " Southwestern University PHINMA", image: "/temporary-school-logo/USC.png"},
    { rank: 5, schoolname: "Cebu Institute of Medicine", image: "/temporary-school-logo/USC.png"},
  ]
  const handleAiClick = () => {
    router.push("/chatbot");
  }

  const handleAssessmentClick = () => {
    router.push("/assessment");
  }

  const handleSchoolClick = () => {
    router.push("/school");
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="pb-[10%]">

        {/* Carousel Section */}
        <div className="mb-9 pl-[19%] pr-[19%] pt-[6%]">
         <HomeCards slides={slides}/>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pl-[15%] pr-[15%]">

          {/* Seek Guidance Card */}
          <button 
          onClick={handleAiClick}
          className="bg-white rounded-2xl p-8 shadow-lg border-2 border-transparent hover:border-yellow-600 transition-all duration-300 cursor-pointer text-center relative">
              <div className="absolute w-[225px] h-[225px] bg-[#FFDE59] top-11 rounded-2xl flex items-center justify-center mb-6 mx-auto overflow-hidden left-1/2 -translate-x-1/2 top-6 z-0"></div>
              
              <img 
                src="\homepage_carousel\seek.png" 
                alt="Seek guidance illustration"
                className="relative z-10 w-[314px] h-[288px] object-contain"
              />

            <h3 className="text-xl font-bold text-black mb-2">
              Seek <span className="text-yellow-500">guidance</span>
            </h3>
            <p className="text-black text-lg">from our AI</p>
          </button>

          {/* Find Perfect Career Card */}
          <button onClick={handleAssessmentClick} className="bg-white rounded-2xl p-8 shadow-lg border-2 border-transparent hover:border-yellow-600 transition-all duration-300 cursor-pointer text-center relative">
              <div className="absolute w-[220px] h-[220px] bg-[#FFDE59] top-11 rounded-2xl flex items-center justify-center mb-6 mx-auto overflow-hidden left-1/2 -translate-x-1/2 top-6 z-0"></div>
             
              <img 
                src="\homepage_carousel\find.png" 
                alt="Find career illustration"
                className="relative z-10 w-[314px] h-[288px] object-contain"
              />

            <h3 className="text-xl font-bold text-black mb-2">
              Find the <span className="text-yellow-500">perfect</span>
            </h3>
            <p className="text-black text-lg">career path</p>
          </button>

          {/* Browse Schools Card */}
          <button onClick={handleSchoolClick} className="bg-white rounded-2xl p-8 shadow-lg border-2 border-transparent hover:border-yellow-600 transition-all duration-300 cursor-pointer text-center relative">
            <div className="absolute w-[235px] h-[235px] bg-[#FFDE59] top-11 rounded-2xl flex items-center justify-center mb-6 mx-auto overflow-hidden left-1/2 -translate-x-1/2 top-6 z-0"></div>

            <img 
              src="\homepage_carousel\browse.png" 
              alt="Browse schools illustration"
              className="relative z-10 w-[314px] h-[288px] object-contain"
            />

            <h3 className="text-xl font-bold text-black mb-2">
              Browse for <span className="text-yellow-500">schools</span>
            </h3>
            <p className="text-black text-lg">near you</p>
          </button>

        </div>

        {/* Fields that might interest you */}
        <div className="w-full pl-[6%] pr-[6%] pt-[15%]">
          <h1>Fields that might interest you</h1>
          <MiniCarousel mini_card={fields}/>
        </div>

         {/*School - mini carousel - thingy */}
          <div className="w-full pl-[6%] pr-[6%] pt-[15%]">
          <h1>Top Rated Schools Based on Statistics</h1>
          <SchoolCarousel school_card={schoolList}/>
        </div>

        {/* Top Rated Schools Based on Student Reviews */}
          <div className="w-full pl-[6%] pr-[6%] pt-[15%]">
          <h1>Top Rated Schools Based on Statistics</h1>
          <SchoolCarousel school_card={schoolList}/>
        </div>
      </main>
    </div>
  );
}