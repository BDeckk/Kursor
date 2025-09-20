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
            <div className="flex flex-col md:flex-row items-center bg-[#FFDE59] rounded-2xl overflow-hidden min-h-[520px] gap-x-8 p-6 pt-5">
              
              {/* left image */}
              <div className="w-full md:w-2/3 h-[420px] md:h-full flex items-center justify-center overflow-hidden">
                <div className="w-full h-full flex items-center justify-center">
                <img
                    src={slide.image || "/default-slide.png"}
                    alt={slide.subtitle || "Slide image"}
                    className="w-full h-full object-contain object-left"
                />
                </div>
              </div>

              {/* right text/content */}
              <div className="w-full md:w-1/3 h-full flex flex-col justify-center pr-6 md:pr-12">
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
