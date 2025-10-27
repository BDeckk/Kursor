"use client"; // <<< THIS FIXES "use client" errors

import * as React from "react";
import { useRouter } from "next/navigation"; // App Router
import { Star, Heart } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export function NearbySchoolCarousel({
  school_card,
}: {
  school_card: { id: number | string; rank: number; schoolname: string; image: string }[];
}) {
  const router = useRouter();

  const handleCardClick = (id: string | number) => {
    router.push(`/school-details/${id}`);
  };

  return (
    <Carousel className="w-full relative overflow-visible">
      <CarouselContent className="gap-2 px-12">
        {school_card.map((school, index) => (
          <CarouselItem key={index} className="basis-auto min-w-[230px] max-w-[230px]">
            <div
              onClick={() => handleCardClick(school.id)}
              className="cursor-pointer bg-white rounded-3xl py-6 px-4 shadow-lg flex flex-col items-center text-center h-full relative hover:shadow-xl transition-shadow"
            >
              <button className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors">
                <Heart className="w-6 h-6" />
              </button>

              <div className="w-32 h-32 flex items-center justify-center mb-4">
                <img
                  src={school.image || "/default-slide.png"}
                  alt={school.schoolname}
                  className="w-full h-full object-contain"
                />
              </div>

              <h3 className="text-base font-bold font-outfit text-black mb-4 min-h-[3rem] flex items-center">
                {school.schoolname}
              </h3>

              <div className="w-full space-y-1">
                <div className="flex items-center justify-center gap-2 text-sm">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-gray-700 font-fredoka font-regular">4.79 critique review</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-gray-700 font-fredoka font-regular">4.38 student review</span>
                </div>
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>

      <CarouselPrevious className="text-gray-800 hover:text-yellow-500 -left-6" />
      <CarouselNext className="text-gray-800 hover:text-yellow-500 -right-6" />
    </Carousel>
  );
}
