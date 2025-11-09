"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Heart, Star, Award } from "lucide-react";
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
  if (trimmed.includes("/storage/v1/object/public/")) return trimmed;

  const segments = trimmed.split("/").filter(Boolean);
  const encoded = segments.map((s) => encodeURIComponent(s)).join("/");
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
    setLikedUnis((prev) => ({ ...prev, [schoolId]: !isLiked }));

    const idValue =
      typeof schoolId === "string" && schoolId.includes("-")
        ? schoolId
        : Number(schoolId);

    if (isLiked) {
      const { error } = await supabase
        .from("school_likes")
        .delete()
        .eq("user_id", userId)
        .eq("school_id", idValue);
      if (error) {
        console.error("Failed to unlike:", error.message);
        setLikedUnis((prev) => ({ ...prev, [schoolId]: true }));
      }
    } else {
      const { error } = await supabase
        .from("school_likes")
        .insert([{ user_id: userId, school_id: idValue }]);
      if (error) {
        console.error("Failed to like:", error.message);
        setLikedUnis((prev) => ({ ...prev, [schoolId]: false }));
      }
    }
  };

  const handleCardClick = (id: string | number) => {
    router.push(`/school-details/${id}`);
  };

  return (
    <Carousel className="w-full relative overflow-visible">
      <CarouselContent className="gap-2 px-12">
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
                className="cursor-pointer bg-white rounded-xl py-6 px-4 shadow-lg flex flex-col justify-between text-center h-[380px] relative hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                {/* Like Button */}
                <button
                  onClick={(e) => {
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
                <div className="w-32 h-32 flex items-center justify-center mx-auto mt-6">
                  {imageUrl && !isFailed ? (
                    <img
                      src={imageUrl}
                      alt={uni.schoolname}
                      className="w-full h-full object-contain rounded-md"
                      onError={() => {
                        setFailedImages((prev) => ({ ...prev, [idKey]: true }));
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-xl text-gray-400 text-sm">
                      No image
                    </div>
                  )}
                </div>

                {/* Docked Content Section */}
                <div className="flex flex-col justify-between flex-grow mt-4 w-full">
                  {/* Fixed-height school name */}
                  <h3 className="text-base font-bold text-black mb-2 h-[3.5rem] flex items-center justify-center text-center">
                    {uni.schoolname}
                  </h3>

                  {/* Fixed-height description area */}
                  <div className="pt-2">
                    <p className="text-xs text-gray-500 line-clamp-3 h-[3rem]">
                      {uni.reason || ""}
                    </p>
                  </div>

                  {/* Rating docked at the bottom */}
                  <div className="flex flex-col items-center justify-center border-t border-gray-100 mt-4 pt-3 pb-2">
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
