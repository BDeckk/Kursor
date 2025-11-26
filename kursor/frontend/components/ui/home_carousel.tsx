"use client";
import Image from "next/image";
import React, { useEffect, useRef } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import type { CarouselApi } from "@/components/ui/carousel";

export default function HomeCards({ slides }: { slides: { title?: string; subtitle?: string; image: string }[] }) {
  const [api, setApi] = React.useState<CarouselApi>();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!api) return;

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set up auto-scroll
    intervalRef.current = setInterval(() => {
      api.scrollNext();
    }, 5000);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [api]);

  return (
    <Carousel 
      className="home-w-full"
      opts={{
        loop: true,
      }}
      setApi={setApi}
    >
      <CarouselContent>
        {slides.map((slide, index) => (
          <CarouselItem key={index}>
            <div className="relative bg-white overflow-hidden min-h-[300px] max-h-[500px]">
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
    </Carousel>
  );
}