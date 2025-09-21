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

export default function HomeCards({ slides }: { slides: { title?:string; subtitle?:string; image:string }[] }) {
  return (
    <Carousel className="home-w-full">
      <CarouselContent>
        {slides.map((slide, index) => (
          <CarouselItem key={index}>
            <div className="relative bg-white rounded-2xl overflow-hidden min-h-[200px] max-h-[500px]">
              {/* Full width image only */}
              <div className="w-full h-[490px] flex items-center justify-center overflow-hidden">
                <img
                  src={slide.image || "/default-slide.png"}
                  alt={slide.title || `Slide ${index + 1}`}
                  className="w-full h-full object-cover"
                />
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