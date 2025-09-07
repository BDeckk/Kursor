"use client";

import React from "react";
import Navbar from "@/components/homepage-navbar";
import Carousel from "@/components/carousel";

export default function DashboardPage() {
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

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="pl-[15%] pr-[15%] pt-[8%] pb-[20%]">
        {/* Carousel Section */}
        <div className="mb-8">
          <Carousel 
            slides={slides} 
            autoTransition={true} 
            interval={10000} 
          />
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Seek Guidance Card */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-transparent hover:border-yellow-600 transition-all duration-300 cursor-pointer text-center relative">
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
          </div>

          {/* Find Perfect Career Card */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-transparent hover:border-yellow-600 transition-all duration-300 cursor-pointer text-center relative">
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
          </div>

          {/* Browse Schools Card */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-transparent hover:border-yellow-600 transition-all duration-300 cursor-pointer text-center relative">
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
          </div>

        </div>
      </main>
    </div>
  );
}