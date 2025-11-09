import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface School {
  id?: number | string; // Optional unique ID for routing
  rank: number;
  schoolname: string;
  image: string;
}

interface SchoolCarouselProps {
  school_card: School[];
}

const SchoolCarousel: React.FC<SchoolCarouselProps> = ({ school_card }) => {
  const router = useRouter();
  const [currentSet, setCurrentSet] = useState(0);

  const allSchools = school_card.map((school) => ({
    id: school.id,
    rank: school.rank,
    name: school.schoolname,
    logo: school.image,
  }));

  const setsOfThree: Array<typeof allSchools> = [];
  for (let i = 0; i < allSchools.length; i += 3) {
    setsOfThree.push(allSchools.slice(i, i + 3));
  }

  const currentSchools = setsOfThree[currentSet] || [];

  const nextSet = () => {
    if (setsOfThree.length === 0) return;
    setCurrentSet((prev) => (prev + 1) % setsOfThree.length);
  };

  const prevSet = () => {
    if (setsOfThree.length === 0) return;
    setCurrentSet((prev) => (prev - 1 + setsOfThree.length) % setsOfThree.length);
  };

  const getCardHeight = (index: number) => {
    if (currentSchools.length === 1) return "h-48";
    if (currentSchools.length === 2) {
      return index === 0 ? "h-48" : "h-40";
    }
    if (index === 1) return "h-48"; // center tallest
    return "h-40"; // sides
  };

  const getRankTextSize = (rank: number) => {
    return rank === 1 ? "text-9xl" : "text-8xl";
  };

  const getCardOrder = () => {
    if (currentSchools.length <= 2) return currentSchools;
    const sorted = [...currentSchools].sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));
    if (sorted.length >= 3) {
      return [sorted[1], sorted[0], sorted[2]]; // rank 2, rank 1, rank 3
    }
    return sorted;
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="relative">
        {/* Navigation Buttons */}
        {setsOfThree.length > 1 && (
          <>
            <button
              onClick={prevSet}
              className="absolute left-1 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>

            <button
              onClick={nextSet}
              className="absolute right-1 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-gray-600" />
            </button>
          </>
        )}

        {/* Podium Layout */}
        <div className="flex justify-center items-end gap-5 px-16 pt-5">
          {getCardOrder().map((school, index: number) => (
            <div
              key={`school-${school.rank}-${currentSet}`}
              className="flex flex-col items-center cursor-pointer transition-transform duration-300 hover:scale-110"
              onClick={() => router.push(`/school-details/${school.id}`)}
            >
              {/* School Logo */}
              <div className="w-48 h-48 mb-4 flex items-center justify-center">
                <img
                  src={school.logo}
                  alt={school.name}
                  className="w-48 h-48 object-cover rounded-full"
                />
              </div>

              {/* School Name */}
              <h3 className="text-base font-semibold text-gray-800 mb-6 leading-tight text-center px-2">
                {school.name}
              </h3>

              {/* The Card with the rank */}
              <div
                className={`bg-white flex flex-col items-center justify-center text-center w-76 transform transition-all duration-300 shadow-lg rounded-t-3xl border-2 border-gray-100 ${getCardHeight(
                  index
                )}`}
              >
                <div>
                  <span className={`font-bold text-yellow-400 ${getRankTextSize(school.rank)}`}>
                    {school.rank}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Dots Indicator */}
        {setsOfThree.length > 1 && (
          <div className="flex justify-center mt-8 gap-2">
            {setsOfThree.map((_, index: number) => (
              <button
                key={`dot-${index}`}
                onClick={() => setCurrentSet(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentSet ? "bg-yellow-500" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export { SchoolCarousel };
