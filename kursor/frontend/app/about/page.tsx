
"use client";

import Image from "next/image";
import React, { useEffect, useState } from "react";
import ScrollStack, { ScrollStackItem } from "@/components/Scrollstack/scrollstack";
import { useGlobalLoading } from "@/Context/GlobalLoadingContext"; // matches Features

export default function AboutPage() {
  const { setIsLoading } = useGlobalLoading();
  const [pageReady, setPageReady] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // list of images to preload to avoid micro-stutter when animating
  const IMAGES_TO_PRELOAD = [
    "/Devs.png",
    "/Benideck.png",
    "/Axziel.png",
    "/Christopher.png",
    "/Kursor.png",
  ];

  // Preload images helper
  const preloadImages = (srcs: string[]): Promise<boolean[]> =>
  Promise.all(
    srcs.map(
      (src: string) =>
        new Promise<boolean>((res) => {
          const img = new window.Image();
          img.src = src;

          if (img.complete) return res(true);

          img.onload = () => res(true);
          img.onerror = () => res(true);
        })
    )
  );

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);

    // Preload visual assets, then set pageReady
    preloadImages(IMAGES_TO_PRELOAD)
      .catch(() => {
        /* ignore preload errors */
      })
      .finally(() => {
        if (!mounted) return;
        setTimeout(() => {
          setPageReady(true);
          setIsLoading(false);
          setTimeout(() => setIsVisible(true), 80);
        }, 450); 
      });

    return () => {
      mounted = false;
    };
  }, [setIsLoading]);

  const scrollToTeam = () => {
    const section = document.getElementById("team-stack");
    section?.scrollIntoView({ behavior: "smooth" });
  };

  if (!pageReady) {
    return <div className="min-h-screen" />;
  }

  return (
    <>
      <style jsx global>{`
        /* Animation keyframes (same as Features) */
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
          animation: fadeInUp 800ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          opacity: 0;
        }
        .animate-fade-in-left {
          animation: fadeInLeft 800ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          opacity: 0;
        }
        .animate-fade-in-right {
          animation: fadeInRight 800ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          opacity: 0;
        }
        .animate-scale-in {
          animation: scaleIn 750ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          opacity: 0;
        }
        .animate-fade-in {
          animation: fadeIn 700ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          opacity: 0;
        }

        .delay-100 {
          animation-delay: 0.12s;
        }
        .delay-200 {
          animation-delay: 0.26s;
        }
        .delay-300 {
          animation-delay: 0.42s;
        }
        .delay-400 {
          animation-delay: 0.58s;
        }
        .delay-500 {
          animation-delay: 0.74s;
        }
        .delay-600 {
          animation-delay: 0.9s;
        }

        /* prevents flashing before animations begin */
        .pre-animation {
          opacity: 0 !important;
          transform: translateY(40px) !important;
        }

        /* keep small image elements from causing layout shifts */
        .dev-img {
          width: auto;
          height: 260px;
          object-fit: contain;
        }
      `}</style>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 py-16 overflow-hidden">
        {/* Blurred Background Shapes */}
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

        {/* Content */}
        <div className="relative z-10 max-w-6xl w-full grid md:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div
            className={`space-y-6 pl-12 md:pl-16 pt-22 ${
              isVisible ? "animate-fade-in-left delay-100" : "pre-animation"
            }`}
          >
            <h1 className="text-6xl font-extrabold font-outfit text-gray-900 leading-tight">Meet the Devs!</h1>
            <p className="text-gray-800 leading-relaxed font-fredoka text-[24px] pl-5">
              Get to know the creative minds behind Kursor — a team of dedicated innovators,
              designers, and developers committed to building seamless digital experiences.
            </p>

            <div className="pl-3 pt-2">
              <button
                onClick={scrollToTeam}
                className="bg-[#FFDE59] text-gray-800 px-8 py-4 rounded-full font-fredoka font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center space-x-2 group"
                style={{ fontSize: "22px" }}
              >
                <span>Meet the Team</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>
          </div>

          {/* Right illustration */}
          <div
            className={`flex justify-center ${isVisible ? "animate-fade-in-right delay-300" : "pre-animation"}`}
            style={{ transform: "translateX(-70px)" }}
          >
            <div style={{ width: 650, height: "auto", position: "relative" }}>
              <Image src="/Devs.png" alt="Team illustration" width={650} height={500} style={{ objectFit: "contain" }} />
            </div>
          </div>
        </div>
      </section>

      {/* Developer Scroll Stack */}
      <section id="team-stack" className="w-full min-h-screen bg-[#FFDE59] py-10">
        <div className="w-full max-w-6xl mx-auto px-4">
          <h2 className={`text-center text-4xl md:text-5xl font-semibold font-fredoka text-gray-800 mb-8 mt-10 ${isVisible ? "animate-fade-in-up delay-300" : "pre-animation"}`}>
            Our Developers
          </h2>

          <div className="scrollbar-hide h-[550px] overflow-hidden -mt-20">
            <ScrollStack useWindowScroll={false} className="scrollbar-hide">

              {/* Developer 1 */}
              <ScrollStackItem itemClassName="bg-[#FFF7D8] p-8 rounded-2xl shadow-lg border border-gray-500">
                <div className={`flex items-center gap-6 h-[220px] ${isVisible ? "animate-fade-in-up delay-400" : "pre-animation"}`}>
                  <div className="w-3/4 pl-10">
                    <h2 className="text-[40px] font-bold font-outfit mb-4">Benideck J. Longakit</h2>
                    <p className="text-gray-700 font-fredoka text-[23px]">
                      Role: Project Manager, Backend Developer <br />
                      Focuses on the features, reliability of the system, and ensures smooth workflow and team coordination.
                    </p>
                  </div>

                  <div className="w-1/3 flex justify-center pr-10">
                    <Image src="/Benideck.png" alt="Benideck" width={220} height={260} className="rounded-xl dev-img" />
                  </div>
                </div>
              </ScrollStackItem>

              {/* Developer 2 */}
              <ScrollStackItem itemClassName="bg-[#FFF7D8] p-8 rounded-2xl shadow-lg border border-gray-500">
                <div className={`flex items-center gap-6 h-[220px] ${isVisible ? "animate-fade-in-up delay-500" : "pre-animation"}`}>
                  <div className="w-3/4 pl-5">
                    <h2 className="text-[40px] font-bold font-outfit mb-4">Axziel Jay Bartolabac</h2>
                    <p className="text-gray-700 font-fredoka text-[23px]">
                      Role: UI/UX Designer, Frontend Developer <br />
                      Passionate about UI, animations, and building smooth user experiences. Designs aesthetic interfaces that users love interacting with.
                    </p>
                  </div>

                  <div className="w-1/3 flex justify-center pr-10">
                    <Image src="/Axziel.png" alt="Axziel" width={220} height={260} className="rounded-xl dev-img" />
                  </div>
                </div>
              </ScrollStackItem>

              {/* Developer 3 */}
              <ScrollStackItem itemClassName="bg-[#FFF7D8] p-8 rounded-2xl shadow-lg border border-gray-500">
                <div className={`flex items-center gap-6 h-[220px] ${isVisible ? "animate-fade-in-up delay-600" : "pre-animation"}`}>
                  <div className="w-3/4 pl-5">
                    <h2 className="text-[40px] font-bold font-outfit mb-4">Christopher John Rubio</h2>
                    <p className="text-gray-700 font-fredoka text-[23px]">
                      Role: Backend Developer <br />
                      Focused on databases, data-gathering, and ensuring the reliability and accuracy of system information.
                    </p>
                  </div>

                  <div className="w-1/3 flex justify-center pr-10">
                    <Image src="/Christopher.png" alt="Christopher" width={220} height={260} className="rounded-xl dev-img" />
                  </div>
                </div>
              </ScrollStackItem>

            </ScrollStack>
          </div>
        </div>
      </section>
    </>
  );
}
