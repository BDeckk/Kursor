"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import ScrollStack, { ScrollStackItem } from "@/components/Scrollstack/scrollstack";
import { useGlobalLoading } from "@/Context/GlobalLoadingContext";

export default function FeaturesHero() {
  const router = useRouter();
  const { setIsLoading } = useGlobalLoading();
  const [isVisible, setIsVisible] = useState(false);
  const [pageReady, setPageReady] = useState(false);

  useEffect(() => {
    setIsLoading(true);

    const timer = setTimeout(() => {
      setPageReady(true);
      setIsLoading(false);

      setTimeout(() => setIsVisible(true), 50);
    }, 1000);

    return () => clearTimeout(timer);
  }, [setIsLoading]);

  const scrollToFeatures = () => {
    const featuresSection = document.getElementById("features-stack");
    featuresSection?.scrollIntoView({ behavior: "smooth" });
  };

  if (!pageReady) {
    return <div className="min-h-screen"></div>;
  }

  return (
    <>
      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInLeft {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeInRight {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.85);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-fade-in-up {
          animation: fadeInUp 1s ease forwards;
          opacity: 0;
        }

        .animate-fade-in-left {
          animation: fadeInLeft 1s ease forwards;
          opacity: 0;
        }

        .animate-fade-in-right {
          animation: fadeInRight 1s ease forwards;
          opacity: 0;
        }

        .animate-scale-in {
          animation: scaleIn 1s ease forwards;
          opacity: 0;
        }

        .animate-fade-in {
          animation: fadeIn 1s ease forwards;
          opacity: 0;
        }

        .delay-100 {
          animation-delay: 0.15s;
        }
        .delay-200 {
          animation-delay: 0.3s;
        }
        .delay-300 {
          animation-delay: 0.45s;
        }
        .delay-400 {
          animation-delay: 0.6s;
        }
        .delay-500 {
          animation-delay: 0.75s;
        }
        .delay-600 {
          animation-delay: 0.9s;
        }

        /* NEW: prevents flashing before animations begin */
        .pre-animation {
          opacity: 0 !important;
          transform: translateY(40px) !important;
        }
      `}</style>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 py-16 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute rounded-full bg-yellow-100 opacity-60"
            style={{
              width: "1100px",
              height: "1100px",
              top: "-800px",
              left: "-400px",
              filter: "blur(90px)",
            }}
          />

          <div
            className="absolute rounded-full bg-yellow-100 opacity-100"
            style={{
              width: "700px",
              height: "700px",
              top: "50px",
              right: "-130px",
              filter: "blur(100px)",
            }}
          />

          <div
            className="absolute rounded-full bg-gray-300 opacity-80"
            style={{
              width: "800px",
              height: "800px",
              bottom: "-600px",
              left: "100px",
              filter: "blur(90px)",
            }}
          />
        </div>

        <div className="relative z-10 max-w-6xl w-full grid md:grid-cols-2 gap-12 items-center">
          {/* Left Side */}
          <div className="space-y-6 pl-12 md:pl-16">
            <div
              className={`flex items-center space-x-2 ${
                isVisible ? "animate-fade-in-left delay-100" : "pre-animation"
              }`}
            >
              <Image src="/Kursor.png" width={250} height={160} alt="Kursor Logo" />
            </div>

            <div
              className={`pl-10 ${
                isVisible ? "animate-fade-in-left delay-200" : "pre-animation"
              }`}
            >
              <p className="text-gray-800 leading-relaxed font-fredoka" style={{ fontSize: "30px" }}>
                A web app that helps students explore schools, degree options, and career paths
                with ease.
              </p>
            </div>

            <div
              className={`pl-10 ${
                isVisible ? "animate-fade-in-left delay-300" : "pre-animation"
              }`}
            >
              <button
                onClick={scrollToFeatures}
                className="bg-[#FFDE59] text-gray-800 px-8 py-4 rounded-full font-fredoka font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center space-x-2 group"
                style={{ fontSize: "22px" }}
              >
                <span>See Features</span>
                <svg
                  className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>
          </div>

          {/* Right Side */}
          <div
            className={`flex flex-col gap-8 items-center justify-center ${
              isVisible ? "animate-fade-in-right delay-400" : "pre-animation"
            }`}
          >
            <img
              src="/feature 3.png"
              alt="Student exploring options"
              style={{ width: "700px", height: "auto", transform: "translateX(-80px)" }}
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features-stack" className="w-full min-h-screen bg-[#FFDE59] py-10">
        <div className="w-full max-w-6xl mx-auto px-4">
          <div
            className={`text-center mb-8 ${
              isVisible ? "animate-fade-in-up delay-500" : "pre-animation"
            }`}
          >
            <h2 className="text-4xl md:text-5xl font-semibold font-fredoka text-gray-800 mb-2 mt-10">
              Scroll down to see Kursor's core features!
            </h2>
          </div>

          <div
            className={`scrollbar-hide h-[550px] overflow-hidden -mt-20 ${
              isVisible ? "animate-fade-in delay-600" : "pre-animation"
            }`}
          >
            <ScrollStack useWindowScroll={false} className="scrollbar-hide">
              {/* STACK ITEMS (unchanged layout, all stable) */}
              {/* --- ITEM 1 --- */}
              <ScrollStackItem itemClassName="bg-[#FFF7D8] p-8 rounded-2xl shadow-lg border border-gray-500">
                <div className="flex items-center gap-5 h-[210px]">
                  <div className="w-1/2 pl-5">
                    <h2 className="text-[40px] font-bold font-outfit mb-4">Browse Nearby Schools</h2>
                    <p className="text-gray-700 font-fredoka text-[25px]">
                      Find schools close to your location with details on programs, facilities, and
                      ratings.
                    </p>
                  </div>
                  <div className="w-1/2 flex justify-center">
                    <div className="transform translate-y-[6px] translate-x-[10px]">
                      <img
                        src="/Browse.png"
                        alt="placeholder"
                        className="rounded-xl w-auto h-[250px] object-contain"
                      />
                    </div>
                  </div>
                </div>
              </ScrollStackItem>

              {/* --- ITEM 2 --- */}
              <ScrollStackItem itemClassName="bg-[#FFF7D8] p-8 rounded-2xl shadow-lg border border-gray-500">
                <div className="flex items-center gap-8 h-[210px]">
                  <div className="w-1/2 pl-5">
                    <h2 className="text-[40px] font-bold font-outfit mb-4">
                      Check School Ratings and Reviews
                    </h2>
                    <p className="text-gray-700 font-fredoka text-[23px]">
                      Compare schools based on credibility, performance, and feedback from students.
                    </p>
                  </div>
                  <div className="w-1/2 flex justify-center">
                    <div className="transform translate-y-[6px] translate-x-[10px]">
                      <img
                        src="/Reviews 1.svg"
                        alt="placeholder"
                        className="w-auto h-[280px] object-contain"
                      />
                    </div>
                  </div>
                </div>
              </ScrollStackItem>

              {/* --- ITEM 3 --- */}
              <ScrollStackItem itemClassName="bg-[#FFF7D8] p-8 rounded-2xl shadow-lg border border-gray-500">
                <div className="flex items-center gap-5 h-[210px]">
                  <div className="w-1/2 pl-5">
                    <h2 className="text-[40px] font-bold font-outfit mb-4">AI-Powered Support</h2>
                    <p className="text-gray-700 font-fredoka text-[25px]">
                      Chat with our AI assistant to quickly get answers, personalized
                      recommendations, and career insights.
                    </p>
                  </div>
                  <div className="w-1/2 flex justify-center">
                    <div className="transform translate-y-[6px] translate-x-[10px]">
                      <img
                        src="AI.svg"
                        alt="placeholder"
                        className="rounded-xl w-auto h-[250px] object-contain"
                      />
                    </div>
                  </div>
                </div>
              </ScrollStackItem>

              {/* --- ITEM 4 --- */}
              <ScrollStackItem itemClassName="bg-[#FFF7D8] p-8 rounded-2xl shadow-lg border border-gray-500">
                <div className="flex items-center gap-5 h-[210px]">
                  <div className="w-1/2 pl-5">
                    <h2 className="text-[38px] font-bold font-outfit mb-4">
                      Personalized Career Path Guidance
                    </h2>
                    <p className="text-gray-700 font-fredoka text-[21px]">
                      Take assessments to understand your strengths and interests, and get
                      suggestions on degrees or career paths that suit you.
                    </p>
                  </div>
                  <div className="w-1/2 flex justify-center">
                    <div
                      className="transform translate-y-[6px] translate-x-[10px]"
                    >
                      <img
                        src="Guidance.svg"
                        alt="placeholder"
                        className="rounded-xl w-auto h-[280px] object-contain"
                      />
                    </div>
                  </div>
                </div>
              </ScrollStackItem>

              {/* --- ITEM 5 --- */}
              <ScrollStackItem itemClassName="bg-[#FFF7D8] p-8 rounded-2xl shadow-lg border border-gray-500">
                <div className="flex items-center gap-5 h-[210px]">
                  <div className="w-1/2 pl-5">
                    <h2 className="text-[40px] font-bold font-outfit mb-4">
                      Match Programs to Schools
                    </h2>
                    <p className="text-gray-700 font-fredoka text-[25px]">
                      Discover which institutions best fit the degree or program you want to
                      pursue.
                    </p>
                  </div>
                  <div className="w-1/2 flex justify-center">
                    <div className="transform translate-y-[6px] translate-x-[10px]">
                      <img
                        src="Match.svg"
                        alt="placeholder"
                        className="rounded-xl w-auto h-[270px] object-contain"
                      />
                    </div>
                  </div>
                </div>
              </ScrollStackItem>
            </ScrollStack>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-30 flex flex-col items-center justify-center text-center">
        <div
          className={`flex items-center gap-3 mb-10 ${
            isVisible ? "animate-scale-in delay-500" : "pre-animation"
          }`}
        >
          <p className="text-5xl font-outfit font-bold text-gray-900">Try</p>

          <img src="/Kursor.png" alt="Kursor Logo" className="h-15 w-auto object-contain" />

          <p className="text-5xl font-outfit font-bold text-gray-900">Now!</p>
        </div>

        <button
          onClick={() => router.push("/")}
          className={`bg-[#FFDE59] text-gray-800 px-10 py-4 rounded-full font-fredoka font-semibold text-2xl hover:shadow-lg transform hover:scale-105 transition-all flex items-center gap-2 ${
            isVisible ? "animate-fade-in-up delay-500" : "pre-animation"
          }`}
        >
          Get Started
          <svg className="w-6 h-6 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </button>
      </section>
    </>
  );
}
