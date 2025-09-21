import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface School {
  rank: number;
  schoolname: string;
  image: string;
}

interface SchoolCarouselProps {
  school_card: School[];
}

const SchoolCarousel: React.FC<SchoolCarouselProps> = ({ school_card }) => {
  const [currentSet, setCurrentSet] = useState(0);

  const allSchools = school_card.map(school => ({
    rank: school.rank,
    name: school.schoolname,
    logo: school.image
  }));

  const setsOfThree = [];
  for (let i = 0; i < allSchools.length; i += 3) {
    setsOfThree.push(allSchools.slice(i, i + 3));
  }

  const currentSchools = setsOfThree[currentSet] || [];

  const nextSet = () => {
    setCurrentSet((prev) => (prev + 1) % setsOfThree.length);
  };

  const prevSet = () => {
    setCurrentSet((prev) => (prev - 1 + setsOfThree.length) % setsOfThree.length);
  };

  const getCardHeight = (index: number) => {
    if (currentSchools.length === 1) return 'h-48';
    if (currentSchools.length === 2) {
      return index === 0 ? 'h-48' : 'h-40';
    }
    // For 3 schools: center is tallest, sides are shorter
    if (index === 1) return 'h-48'; // Center (should be rank 1)
    return 'h-40'; // Sides
  };

  const getRankTextSize = (rank: number) => {
    return rank === 1 ? 'text-9xl' : 'text-8xl';
  };

  const getCardOrder = () => {
    if (currentSchools.length <= 2) return currentSchools;
    // Rearrange to put rank 1 in center, rank 2 on left, rank 3 on right
    const sorted = [...currentSchools].sort((a, b) => a.rank - b.rank);
    if (sorted.length >= 3) {
      return [sorted[1], sorted[0], sorted[2]]; // rank 2, rank 1, rank 3
    }
    return sorted;
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-8 bg-gray-50 min-h-screen">
      <div className="relative">
        {/* Navigation Buttons */}
        {setsOfThree.length > 1 && (
          <>
            <button
              onClick={prevSet}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>

            <button
              onClick={nextSet}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-gray-600" />
            </button>
          </>
        )}

        {/* Podium Layout */}
        <div className="flex justify-center items-end gap-4 px-16">
          {getCardOrder().map((school, index: number) => (
            <div key={`school-${school.rank}-${currentSet}`} className="flex flex-col items-center">
              {/* School Logo - Outside and above the card */}
              <div className="w-32 h-32 mb-4 flex items-center justify-center">
                <img
                  src={school.logo}
                  alt={school.name}
                  className="w-28 h-28 object-cover rounded-full border-4 border-gray-100"
                />
              </div>

              {/* School Name - Outside and above the card */}
              <h3 className="text-base font-semibold text-gray-800 mb-6 leading-tight text-center px-2">
                {school.name}
              </h3>

              {/* The Card with just the rank */}
              <div
                className={`bg-white flex flex-col items-center justify-center text-center w-72 transform transition-all duration-300 shadow-lg border-2 border-gray-200 ${getCardHeight(index)}`}
              >
                <div className="rounded-2xl px-8 py-6 shadow-inner">
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
            {setsOfThree.map((_: any, index: number) => (
              <button
                key={`dot-${index}`}
                onClick={() => setCurrentSet(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentSet ? 'bg-yellow-500' : 'bg-gray-300'
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