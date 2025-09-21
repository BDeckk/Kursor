"use client";

import React, {useState} from "react";
import Navbar from "@/components/homepage-navbar";
import { useRouter } from "next/navigation";
import HomeCards from "@/components/ui/home_carousel";
import { MiniCarousel } from "@/components/ui/mini-carousel";
import { SchoolCarousel } from "@/components/ui/school-carousel";


export default function DashboardPage() {

  const router = useRouter(); 

   //Temporary! Carousel slides content - need some adjustments, can insert the contents here : kanang first carousel
  const slides = [
    {
      image: "/homepage_carousel/carousel2.png"
    },
    {
      image: "/homepage_carousel/carousel2.png"
    }
  ];

  //Temporary! Coursel slides content, second carousel "Fields that might interest you"
  const fields = [
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
      imageWidth: "250px",  // Medium
      imageHeight: "250px",
      imageTop: "6px",
      imageLeft: "3px"
    },
    { 
      title: "Law & Legal Studies", 
      image: "/homepage_carousel/judge.svg",
      description: "Advocate for justice",
      color: "bg-red-50",
      imageWidth: "250px",  // Largest
      imageHeight: "250px",
      imageTop: "8px"
    },
    { 
      title: "Health & Medical Sciences", 
      image: "/homepage_carousel/doctor.svg",
      description: "Care for others' wellbeing",
      color: "bg-teal-50",
      imageWidth: "230px",  // Default
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
    }
  ];

  //Temporary! Coursel slides content, third carousel "School - mini carousel - thingy"
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
      <main className="pb-1">

        {/* Carousel Section */}
        <div className="mb-9 pl-[19%] pr-[19%] pt-[7%]">
         <HomeCards slides={slides}/>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pl-[15%] pr-[15%]">

          {/* Seek Guidance Card */}
          <button 
            onClick={handleAiClick}
            className="bg-white rounded-2xl p-8 min-h-93 max-h-93 shadow-lg border-2 border-transparent hover:border-yellow-600 transition-all duration-300 cursor-pointer text-center relative group">
              <div className="absolute w-[200px] h-[200px] bg-[#FFDE59] top-11 rounded-2xl flex items-center justify-center mb-6 mx-auto overflow-hidden left-1/2 -translate-x-1/2 z-0"></div>
              
              <img 
                src="\homepage_carousel\seek.png" 
                alt="Seek guidance illustration"
                className="relative z-10 w-[314px] h-[288px] object-contain transition-transform duration-300 group-hover:scale-110 -translate-y-7.5"
              />
            <div className="-translate-y-10 transition-transform duration-300 group-hover:scale-104">
              <h3 className="text-xl font-bold text-black mb-2">
                Seek <span className="text-yellow-500">guidance</span>
              </h3>
              <p className="text-xl font-bold text-black -mt-2">from our AI</p>
              </div>
          </button>

          {/* Find Perfect Career Card */}
          <button onClick={handleAssessmentClick} 
            className="bg-white rounded-2xl p-8 min-h-93 max-h-93 shadow-lg border-2 border-transparent hover:border-yellow-600 transition-all duration-300 cursor-pointer text-center relative group">
              <div className="absolute w-[200px] h-[200px] bg-[#FFDE59] top-11 rounded-2xl flex items-center justify-center mb-6 mx-auto overflow-hidden left-1/2 -translate-x-1/2 top-6 z-0"></div>
             
              <img 
                src="\homepage_carousel\find.png" 
                alt="Find career illustration"
                className="relative z-10 w-[314px] h-[288px] object-contain transition-transform duration-300 group-hover:scale-110 -translate-y-7"
              />
            <div className="-translate-y-10 transition-transform duration-300 group-hover:scale-104">
              <h3 className="text-xl font-bold text-black mb-2">
                Find the <span className="text-yellow-500">perfect</span>
              </h3>
              <p className="text-xl font-bold text-black -mt-2">career path</p>
            </div>
          </button>

          {/* Browse Schools Card */}
          <button onClick={handleSchoolClick} 
            className="bg-white rounded-2xl p-8 min-h-93 max-h-93 shadow-lg border-2 border-transparent hover:border-yellow-600 transition-all duration-300 cursor-pointer text-center relative group">
            <div className="absolute w-[200px] h-[208px] bg-[#FFDE59] top-11 rounded-2xl flex items-center justify-center mb-6 mx-auto overflow-hidden left-1/2 -translate-x-1/2 top-6 z-0"></div>

            <img 
              src="\homepage_carousel\browse.png" 
              alt="Browse schools illustration"
              className="relative z-10 w-[314px] h-[288px] object-contain transition-transform duration-300 group-hover:scale-110 -translate-y-12 -translate-x-2"
            />

            <div className = "-translate-y-10 transition-transform duration-300 group-hover:scale-104">
              <h3 className="text-xl font-bold text-black mb-2">
                Browse for <span className="text-yellow-500">schools</span>
              </h3>
              <p className="text-xl font-bold text-black -mt-2">near you</p>
            </div>
          </button>

        </div>

        {/* Fields that might interest you */}
        <div className="w-full pt-[5%]">
          {/* Yellow background section with title and carousel inside */}
          <div className="bg-[#FFDE59] py-12 w-full">
            {/* Title inside yellow background */}
            <div className="px-[6%] mb-8">
              <h2 className="text-3xl font-bold text-gray-800">
                Fields that might <span className="text-[#FFFFFF]">interest you</span>
              </h2>
            </div>
            <MiniCarousel mini_card={fields}/>
          </div>
        </div>

         {/*School - mini carousel - thingy */}
          <div className="w-full pl-[6%] pr-[6%] pt-[2%] mt-5">
          <div className="px-[6%] mb-8">
              <h2 className="text-3xl font-bold text-gray-800 text-right pl-10" >
                Top-Rated Schools <span className="text-[#FFDE59]">Based on Statistics</span>
              </h2>
            </div>
          <SchoolCarousel school_card={schoolList}/>
        </div>


        {/* Top Rated Schools Based on Student Reviews */}
          <div className="w-full pt-[3%] bg-[#FFDE59] py-12 w-full mt-20 pb-[2%]">
          <div className="px-[6%] mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-10 pl-10">
                Top-Rated Schools <span className="text-white">Based on Student Reviews</span>
              </h2>
            </div>
          <SchoolCarousel school_card={schoolList}/>
        </div>
      </main>
    </div>
  );
}