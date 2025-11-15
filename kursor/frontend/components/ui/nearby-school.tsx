"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LikeButton } from "../likebutton";
import { useSchoolLikes } from "@/hooks/useSchoolLikes";
import { supabase } from "@/supabaseClient";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const SUPABASE_STORAGE_URL =
  "https://fiujlzfouidrxbechcxa.supabase.co/storage/v1/object/public";

function resolveImageUrl(imagePath?: string | null) {
  if (!imagePath) return null;
  const trimmed = String(imagePath).trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const segments = trimmed.split("/").filter(Boolean);
  const encoded = segments.map((s) => encodeURIComponent(s)).join("/");
  return `${SUPABASE_STORAGE_URL}/school_logos/${encoded}`;
}

interface NearbySchool {
  id: string | number;
  rank?: number;
  schoolname: string;
  image?: string | null;
}

interface NearbySchoolCarouselProps {
  school_card: NearbySchool[];
  userId?: string;
}

// Function to render star icons with half-star support
function renderStars(rating: number) {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  for (let i = 0; i < 5; i++) {
    const isFull = i < fullStars;
    const isHalf = i === fullStars && hasHalfStar;

    stars.push(
      <svg
        key={i}
        viewBox="0 0 20 20"
        className="w-4 h-4"
      >
        {/* Define gradient for half star */}
        {isHalf && (
          <defs>
            <linearGradient id={`halfGrad-${i}`} x1="0" x2="1" y1="0" y2="0">
              <stop offset="50%" stopColor="#FFD700" />
              <stop offset="50%" stopColor="#E5E7EB" />
            </linearGradient>
          </defs>
        )}
        {/* Base star (empty gray) */}
        <path
          d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.946a1 1 0 00.95.69h4.15c.969 0 1.371 1.24.588 1.81l-3.36 2.44a1 1 0 00-.364 1.118l1.287 3.945c.3.921-.755 1.688-1.54 1.118l-3.36-2.44a1 1 0 00-1.176 0l-3.36 2.44c-.784.57-1.838-.197-1.539-1.118l1.286-3.945a1 1 0 00-.364-1.118L2.025 9.373c-.783-.57-.38-1.81.588-1.81h4.15a1 1 0 00.95-.69l1.286-3.946z"
          fill="#E5E7EB"
        />
        {/* Full star overlay */}
        {isFull && (
          <path
            d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.946a1 1 0 00.95.69h4.15c.969 0 1.371 1.24.588 1.81l-3.36 2.44a1 1 0 00-.364 1.118l1.287 3.945c.3.921-.755 1.688-1.54 1.118l-3.36-2.44a1 1 0 00-1.176 0l-3.36 2.44c-.784.57-1.838-.197-1.539-1.118l1.286-3.945a1 1 0 00-.364-1.118L2.025 9.373c-.783-.57-.38-1.81.588-1.81h4.15a1 1 0 00.95-.69l1.286-3.946z"
            fill="#FFD700"
          />
        )}
        {/* Half star overlay */}
        {isHalf && (
          <path
            d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.946a1 1 0 00.95.69h4.15c.969 0 1.371 1.24.588 1.81l-3.36 2.44a1 1 0 00-.364 1.118l1.287 3.945c.3.921-.755 1.688-1.54 1.118l-3.36-2.44a1 1 0 00-1.176 0l-3.36 2.44c-.784.57-1.838-.197-1.539-1.118l1.286-3.945a1 1 0 00-.364-1.118L2.025 9.373c-.783-.57-.38-1.81.588-1.81h4.15a1 1 0 00.95-.69l1.286-3.946z"
            fill={`url(#halfGrad-${i})`}
          />
        )}
      </svg>
    );
  }

  return stars;
}

export function NearbySchoolCarousel({ school_card, userId }: NearbySchoolCarouselProps) {
  const router = useRouter();
  const [failedImages, setFailedImages] = React.useState<Record<string, boolean>>({});
  const [averageRatings, setAverageRatings] = React.useState<Record<string, number>>({});
  const { likedSchools, toggleLike } = useSchoolLikes(userId);

  // Fetch average student ratings for all nearby schools
  React.useEffect(() => {
    const fetchAverageRatings = async () => {
      try {
        const schoolIds = school_card.map((s) => s.id);
        const { data: reviewsData, error } = await supabase
          .from("reviews")
          .select("school_id, rating")
          .in("school_id", schoolIds);

        if (error) throw error;

        const ratingMap: Record<string, { sum: number; count: number }> = {};
        reviewsData?.forEach((r: any) => {
          const idStr = String(r.school_id);
          if (!ratingMap[idStr]) ratingMap[idStr] = { sum: 0, count: 0 };
          ratingMap[idStr].sum += r.rating;
          ratingMap[idStr].count += 1;
        });

        const avgMap: Record<string, number> = {};
        Object.entries(ratingMap).forEach(([id, val]) => {
          avgMap[id] = val.count > 0 ? val.sum / val.count : 0;
        });

        setAverageRatings(avgMap);
      } catch (err) {
        console.error("Failed to fetch average ratings:", err);
      }
    };

    if (school_card.length > 0) fetchAverageRatings();
  }, [school_card]);

  return (
    <Carousel className="w-full relative overflow-visible">
      <CarouselContent className="gap-2 px-12">
        {school_card.map((school) => {
          const idKey = String(school.id);
          const isLiked = likedSchools[idKey];
          const imageUrl = resolveImageUrl(school.image);
          const avgRating = averageRatings[idKey];

          return (
            <CarouselItem key={idKey} className="basis-auto min-w-[230px] max-w-[230px]">
              <div
                onClick={() => router.push(`/school-details/${school.id}`)}
                className="cursor-pointer bg-white rounded-3xl shadow-lg flex flex-col items-center text-center relative hover:shadow-xl hover:scale-105 transition-all duration-300 px-3 py-6 h-[320px]"
              >
                <LikeButton
                  userId={userId}
                  schoolId={school.id}
                  liked={isLiked}
                  toggleLike={toggleLike}
                  className="absolute top-4 right-4"
                />

                <div className="flex flex-col items-center justify-center flex-1">
                  <div className="w-32 h-32 flex items-center justify-center mb-4">
                    {imageUrl && !failedImages[idKey] ? (
                      <img
                        src={imageUrl}
                        alt={school.schoolname}
                        className="w-full h-full object-contain rounded-md"
                        onError={() => setFailedImages((p) => ({ ...p, [idKey]: true }))}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-xl text-gray-400 text-sm">
                        No image
                      </div>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-black mb-2 px-2 text-center">
                    {school.schoolname}
                  </h3>
                </div>

                <div className="w-full mt-auto flex items-center justify-center gap-1 border-t border-gray-100 mt-4 pt-3 pb-1">
                  {avgRating ? renderStars(avgRating) : <span className="text-gray-500">No student reviews yet</span>}
                </div>
              </div>
            </CarouselItem>
          );
        })}
      </CarouselContent>

      <CarouselPrevious className="text-gray-800 hover:text-yellow-500 -left-20" />
      <CarouselNext className="text-gray-800 hover:text-yellow-500 -right-20" />
    </Carousel>
  );
}
