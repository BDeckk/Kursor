import * as React from "react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

export function MiniCarousel({ mini_card }: { mini_card: { title:string; image:string }[] }) {
  return (
    <Carousel className="w-full">
      <CarouselContent className="gap-4 px-2">``
        {mini_card.map((mini_cards, index) => (
          <CarouselItem key={index} className="basis-1/2 md:basis-1/3 lg:basis-1/4">
            <button className="bg-white rounded-2xl p-6 shadow-lg border-2 border-transparent hover:border-yellow-600 transition-all duration-300 cursor-pointer text-center relative flex flex-col items-center">
              
              {/* Yellow background shape */}
              <div className="absolute top-6 w-48 h-48 bg-[#FFDE59] rounded-2xl z-0"></div>

              {/* Image */}
              <img
                src={mini_cards.image || "/default-slide.png"}
                alt="program-career card"
                className="relative z-10 w-56 h-52 object-contain mb-4"
              />

              {/* Text */}
              <h3 className="text-lg md:text-xl font-bold text-black mb-1 z-10">
                {mini_cards.title}
              </h3>
              <p className="text-black text-base z-10">near you</p>
            </button>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  )
}
