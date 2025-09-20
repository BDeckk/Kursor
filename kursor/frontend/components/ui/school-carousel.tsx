import * as React from "react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

export function SchoolCarousel({ school_card, }: { school_card: { rank: number; schoolname: string; image: string }[]}) {
  return (
    <Carousel className="w-full">
      <CarouselContent className="gap-4 px-2">
        {school_card.map((school_cards, index) => (
          <CarouselItem
            key={index}
            className="basis-1/2 md:basis-1/3 lg:basis-1/4"
          >
            <div className="bg-white rounded-2xl p-6 shadow-md flex flex-col items-center justify-center text-center h-full relative">
              {/* Rank */}
              <div className="flex flex-col items-center mb-3">
                <span className="text-sm font-semibold text-black">TOP</span>
                <span className="text-5xl font-extrabold text-yellow-400 leading-none">
                  {school_cards.rank}
                </span>
              </div>

              {/* Image */}
              <img
                src={school_cards.image || "/default-slide.png"}
                alt={school_cards.schoolname}
                className="w-28 h-28 object-contain mb-3"
              />

              {/* Text */}
              <h3 className="text-base md:text-lg font-semibold text-black">
                {school_cards.schoolname}
              </h3>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  )
}
