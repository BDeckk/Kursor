"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Heart, Star, Award, MapPin } from "lucide-react";
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

// Simplified image resolver
function resolveImageUrl(imagePath?: string | null) {
  if (!imagePath) return null;
  const trimmed = String(imagePath).trim();
  if (!trimmed) return null;

  // Keep logic to handle full URLs vs. path segments
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.includes("/storage/v1/object/public/")) return trimmed;

  const segments = trimmed.split("/").filter(Boolean);
  const encoded = segments.map(s => encodeURIComponent(s)).join("/");
  return `${SUPABASE_STORAGE_URL}/school_logos/${encoded}`;
}

export function TopUniversitiesCarousel({
  universities,
  userId,
}: {
  universities: {
    id: number | string;
    rank: number;
    schoolname: string;
    image?: string | null;
    country?: string | null;
    reason?: string | null;
  }[];
  userId: string;
}) {
  const router = useRouter();
  const [failedImages, setFailedImages] = React.useState<Record<string, boolean>>({});
  const [likedUnis, setLikedUnis] = React.useState<Record<string, boolean>>({});

  // --- Data Fetching and Liking Logic (Kept as is) ---
  React.useEffect(() => {
    if (!userId) return;

    const fetchLikes = async () => {
      const { data, error } = await supabase
        .from("school_likes")
        .select("school_id")
        .eq("user_id", userId);

      if (error) {
        console.error("Error fetching likes:", error.message);
        return;
      }

      const likedMap = (data ?? []).reduce(
        (acc: Record<string, boolean>, row) => {
          acc[String(row.school_id)] = true;
          return acc;
        },
        {}
      );
      setLikedUnis(likedMap);
    };

    fetchLikes();
  }, [userId]);

  const toggleLike = async (schoolId: string | number) => {
    if (!userId) {
      alert("Please log in to like a university.");
      return;
    }

    const isLiked = likedUnis[String(schoolId)];
    setLikedUnis(prev => ({ ...prev, [schoolId]: !isLiked }));

    const idValue = typeof schoolId === "string" && schoolId.includes("-") ? schoolId : Number(schoolId);

    if (isLiked) {
      const { error } = await supabase
        .from("school_likes")
        .delete()
        .eq("user_id", userId)
        .eq("school_id", idValue);
      if (error) {
        console.error("Failed to unlike:", error.message);
        setLikedUnis(prev => ({ ...prev, [schoolId]: true }));
      }
    } else {
      const { error } = await supabase
        .from("school_likes")
        .insert([{ user_id: userId, school_id: idValue }]);
      if (error) {
        console.error("Failed to like:", error.message);
        setLikedUnis(prev => ({ ...prev, [schoolId]: false }));
      }
    }
  };

  const handleCardClick = (id: string | number) => {
    router.push(`/school-details/${id}`);
  };

  // --- Simplified UI Rendering ---

  return (
    <Carousel className="w-full relative overflow-visible">
      <CarouselContent className="gap-4 px-12">
        {universities.map((uni, index) => {
          const imageUrl = resolveImageUrl(uni.image);
          const idKey = String(uni.id);
          const isFailed = !!failedImages[idKey];
          const isLiked = likedUnis[idKey];

          return (
            <CarouselItem
              key={index}
              className="basis-auto min-w-[230px] max-w-[230px]"
            >
              <div
                onClick={() => handleCardClick(uni.id)}
                className="cursor-pointer bg-white rounded-xl py-6 px-4 shadow-lg flex flex-col items-center text-center h-full relative hover:shadow-xl transition-shadow"
              >
                
                {/* Like Button */}
                <button
                  onClick={e => {
                    e.stopPropagation();
                    toggleLike(uni.id);
                  }}
                  className={`absolute top-4 right-4 transition-colors ${
                    isLiked ? "text-red-500" : "text-gray-400 hover:text-red-500"
                  }`}
                >
                  <Heart
                    className={`w-6 h-6 ${
                      isLiked ? "fill-red-500 text-red-500" : ""
                    }`}
                  />
                </button>
                
                {/* Rank Badge */}
                <div className="absolute top-4 left-4 flex items-center gap-1 text-sm font-semibold text-gray-700">
                    <Award className="w-4 h-4 text-gray-500" />
                    <span>#{uni.rank}</span>
                </div>

                {/* Image Section */}
                <div className="w-32 h-32 flex items-center justify-center mb-4 mt-6">
                  {imageUrl && !isFailed ? (
                    <img
                      src={imageUrl}
                      alt={uni.schoolname}
                      className="w-full h-full object-contain rounded-md"
                      onError={() => {
                        setFailedImages(prev => ({ ...prev, [idKey]: true }));
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-xl text-gray-400 text-sm">
                      No image
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <h3 className="text-base font-bold text-black mb-2 min-h-[3rem] flex items-center justify-center">
                  {uni.schoolname}
                </h3>

                <div className="w-full space-y-1">
                  {uni.reason && (
                    // Reason: Simple text, using a smaller font
                    <p className="text-xs text-gray-500 line-clamp-2 mt-2">
                      {uni.reason}
                    </p>
                  )}

                  {/* Simplified Rating Section */}
                  <div className="flex items-center justify-center pt-3 border-t border-gray-100 mt-4">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= 4
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-blue-600 block mt-1">
                      View Details →
                  </span>
                </div>
              </div>
            </CarouselItem>
          );
        })}
      </CarouselContent>

      {/* Simplified Carousel Navigation Buttons */}
      <CarouselPrevious className="text-gray-800 hover:text-blue-500 -left-6" />
      <CarouselNext className="text-gray-800 hover:text-blue-500 -right-6" />
    </Carousel>
  );
}
