"use client";

import Image from "next/image";
import React from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export default function HomeCards({ slides }: { slides: { title:string; subtitle:string; image:string }[] }) {
  return (
    <Carousel className="w-full">
      <CarouselContent>
        {slides.map((slide, index) => (
          <CarouselItem key={index}>
            <div className="relative bg-[#FFDE59] rounded-2xl overflow-hidden min-h-[520px] pb-5 pt-5 pl-6">

              
              {/* left image */}
              <div className="w-full md:w-2/3 h-[420px] md:h-full flex items-center justify-center overflow-hidden">
                <div className="w-full h-full">
                <img
                    src={slide.image || "/default-slide.png"}
                    alt={slide.subtitle || "Slide image"}
                    className="w-[80%] h-[80%] object-contain object-left"
                />
                </div>
              </div>

              {/* right text/content */}
              <div className="absolute top-0 right-0 w-full md:w-1/2 h-full flex flex-col justify-center pr-6 md:pr-12 z-10">
                <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-2 text-right md:text-right">
                  {slide.title || "Explore and get started with"}
                </h1>
                <div className="text-4xl md:text-5xl font-extrabold text-white leading-tight text-right md:text-right">
                  {slide.subtitle || "KURSOR"}
                </div>
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>

      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}
