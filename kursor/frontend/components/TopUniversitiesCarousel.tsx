"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LikeButton } from "./likebutton";
import { useSchoolLikes } from "@/hooks/useSchoolLikes";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

//converts rank (1 = best) to star rating (minStars → maxStars)
const getStarRating = (rank: number, maxRank = 10, minStars = 3, maxStars = 5) => {
  const stars = maxStars - ((rank - 1) * (maxStars - minStars)) / (maxRank - 1);
  return Math.round(stars * 2) / 2; // round to nearest 0.5
};


export function TopUniversitiesCarousel({
  universities,
  userId,
}: {
  universities: {
    id: number | string;
    university_id: number | string;
    rank: number;
    schoolname: string;
    image?: string | null;
    reason?: string | null;
  }[];
  userId: string;
}) {
  const router = useRouter();
  const { likedSchools, likeCountMap, toggleLike } = useSchoolLikes(userId);

  const handleCardClick = (id: string | number) => {
    router.push(`/school-details/${id}`);
  };

  return (
    <Carousel className="w-full relative overflow-visible">
      <CarouselContent className="gap-2 px-12">
        {universities.map((uni, index) => {
          const idKey = String(uni.university_id);
          const isLiked = likedSchools[idKey];
          const likeCount = likeCountMap[idKey] || 0;
          const rating = getStarRating(uni.rank);

          return (
            <CarouselItem key={index} className="basis-auto min-w-[230px] max-w-[230px]">
              <div
                onClick={() => handleCardClick(uni.university_id)}
                className="cursor-pointer bg-white rounded-xl py-6 px-4 shadow-lg flex flex-col justify-between text-center h-[370px] relative hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                {/* Like Button */}
                <LikeButton
                  userId={userId}
                  schoolId={uni.university_id}
                  liked={isLiked}
                  toggleLike={toggleLike}
                  className="top-4 right-4"
                />

                {/* Rank */}
                <div className="absolute top-4 left-4 flex items-center gap-1 text-sm font-semibold text-gray-700">
                  <span>#{uni.rank}</span>
                </div>

                {/* School Image */}
                <div className="w-32 h-32 flex items-center justify-center mx-auto mt-6">
                  {uni.image ? (
                    <img
                      src={uni.image}
                      alt={uni.schoolname}
                      className="w-full h-full object-contain rounded-md"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-xl text-gray-400 text-sm">
                      No image
                    </div>
                  )}
                </div>

                {/* Name and Reason */}
                <div className="flex flex-col justify-between flex-grow mt-4 w-full">
                  <h3 className="text-base font-bold text-black mb-2 h-[3.5rem] flex items-center justify-center text-center">
                    {uni.schoolname}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-3 h-[3rem]">
                    {uni.reason || ""}
                  </p>
                </div>

                {/* Star Rating */}
                <div className="border-t border-gray-100 mt-4 pt-3 pb-2">
                  <div className="flex justify-center items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => {
                      const fullStars = Math.floor(rating);
                      const hasHalfStar = rating % 1 === 0.5;
                      const isFull = i < fullStars;
                      const isHalf = i === fullStars && hasHalfStar;

                      return (
                        <svg
                          key={i}
                          viewBox="0 0 20 20"
                          className="w-4 h-4"
                        >
                          {/* Empty Star */}
                          <path
                            d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.946a1 1 0 00.95.69h4.15c.969 0 1.371 1.24.588 1.81l-3.36 2.44a1 1 0 00-.364 1.118l1.287 3.945c.3.921-.755 1.688-1.54 1.118l-3.36-2.44a1 1 0 00-1.176 0l-3.36 2.44c-.784.57-1.838-.197-1.539-1.118l1.286-3.945a1 1 0 00-.364-1.118L2.025 9.373c-.783-.57-.38-1.81.588-1.81h4.15a1 1 0 00.95-.69l1.286-3.946z"
                            fill="#E5E7EB"
                          />
                          {/* Full or Half Star */}
                          {isFull && (
                            <path
                              d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.946a1 1 0 00.95.69h4.15c.969 0 1.371 1.24.588 1.81l-3.36 2.44a1 1 0 00-.364 1.118l1.287 3.945c.3.921-.755 1.688-1.54 1.118l-3.36-2.44a1 1 0 00-1.176 0l-3.36 2.44c-.784.57-1.838-.197-1.539-1.118l1.286-3.945a1 1 0 00-.364-1.118L2.025 9.373c-.783-.57-.38-1.81.588-1.81h4.15a1 1 0 00.95-.69l1.286-3.946z"
                              fill="#FFD700"
                            />
                          )}
                          {isHalf && (
                            <defs>
                              <linearGradient id={`halfGrad${index}`} x1="0" x2="1" y1="0" y2="0">
                                <stop offset="50%" stopColor="#FFD700" />
                                <stop offset="50%" stopColor="#E5E7EB" />
                              </linearGradient>
                            </defs>
                          )}
                          {isHalf && (
                            <path
                              d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.946a1 1 0 00.95.69h4.15c.969 0 1.371 1.24.588 1.81l-3.36 2.44a1 1 0 00-.364 1.118l1.287 3.945c.3.921-.755 1.688-1.54 1.118l-3.36-2.44a1 1 0 00-1.176 0l-3.36 2.44c-.784.57-1.838-.197-1.539-1.118l1.286-3.945a1 1 0 00-.364-1.118L2.025 9.373c-.783-.57-.38-1.81.588-1.81h4.15a1 1 0 00.95-.69l1.286-3.946z"
                              fill={`url(#halfGrad${index})`}
                            />
                          )}
                        </svg>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CarouselItem>
          );
        })}
      </CarouselContent>

      <CarouselPrevious className="text-gray-800 hover:text-blue-500 -left-20" />
      <CarouselNext className="text-gray-800 hover:text-blue-500 -right-20" />
    </Carousel>
  );
}
