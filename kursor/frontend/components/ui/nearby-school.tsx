"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Star, Heart } from "lucide-react";
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

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace("/temporary-school-logo/", "/school_logos/");
  }
  if (trimmed.includes("/storage/v1/object/public/")) {
    return `${trimmed}`.replace("/temporary-school-logo/", "/school_logos/");
  }
  const segments = trimmed.split("/").filter(Boolean);
  if (segments[0] === "school_logos") {
    const rest = segments.slice(1).map(s => encodeURIComponent(s)).join("/");
    return `${SUPABASE_STORAGE_URL}/school_logos/${rest}`;
  }
  const encoded = segments.map(s => encodeURIComponent(s)).join("/");
  return `${SUPABASE_STORAGE_URL}/school_logos/${encoded}`;
}

export function NearbySchoolCarousel({
  school_card,
  userId,
}: {
  school_card: {
    id: number | string;
    rank: number;
    schoolname: string;
    image?: string | null;
  }[];
  userId?: string;
}) {
  const router = useRouter();
  const [failedImages, setFailedImages] = React.useState<Record<string, boolean>>({});
  const [likedSchools, setLikedSchools] = React.useState<Record<string, boolean>>({});

  // Fetch liked schools for the current user
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
      setLikedSchools(likedMap);
    };

    fetchLikes();
  }, [userId]);

  // Like/unlike handler
  const toggleLike = async (schoolId: string | number) => {
    if (!userId) {
      alert("Please log in to like a school.");
      return;
    }

    if (!schoolId) {
      console.error("Missing school ID when toggling like");
      return;
    }

    // Determine if schoolId is numeric or UUID
    const isUuid = typeof schoolId === "string" && schoolId.includes("-");
    const idValue = isUuid ? schoolId : Number(schoolId);

    if (!idValue || (typeof idValue === "number" && isNaN(idValue))) {
      console.error("Invalid schoolId:", schoolId);
      return;
    }

    const isLiked = likedSchools[String(schoolId)];
    setLikedSchools(prev => ({ ...prev, [schoolId]: !isLiked }));

    if (isLiked) {
      // Unlike
      const { error } = await supabase
        .from("school_likes")
        .delete()
        .eq("user_id", userId)
        .eq("school_id", idValue);

      if (error) {
        console.error("Failed to unlike:", error.message);
        setLikedSchools(prev => ({ ...prev, [schoolId]: true })); // revert on failure
      }
    } else {
      // Like
      const { error } = await supabase
        .from("school_likes")
        .insert([{ user_id: userId, school_id: idValue }]);

      if (error) {
        console.error("Failed to like:", error.message);
        setLikedSchools(prev => ({ ...prev, [schoolId]: false })); // revert on failure
      }
    }
  };

  const handleCardClick = (id: string | number) => {
    router.push(`/school-details/${id}`);
  };

  return (
    <Carousel className="w-full relative overflow-visible">
      <CarouselContent className="gap-2 px-12">
        {school_card.map((school, index) => {
          const imageUrl = resolveImageUrl(school.image);
          const idKey = String(school.id);
          const isFailed = !!failedImages[idKey];
          const isLiked = likedSchools[idKey];

          return (
            <CarouselItem
              key={index}
              className="basis-auto min-w-[230px] max-w-[230px]"
            >
              <div
                onClick={() => handleCardClick(school.id)}
                className="cursor-pointer bg-white rounded-3xl shadow-lg flex flex-col items-center text-center relative hover:shadow-xl transition-shadow
                          px-3 py-6 h-[320px]" // <- fixed height
              >
                {/* like button (absolute) */}
                <button
                  onClick={e => {
                    e.stopPropagation();
                    toggleLike(school.id);
                  }}
                  className={`absolute top-4 right-4 transition-colors ${
                    isLiked ? "text-red-500" : "text-gray-400 hover:text-red-500"
                  }`}
                >
                  <Heart className={`w-6 h-6 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
                </button>

                {/* MAIN CENTER WRAPPER: centers logo + name */}
                <div className="flex flex-col items-center justify-center flex-1">
                  <div className="w-32 h-32 flex items-center justify-center mb-4">
                    {imageUrl && !isFailed ? (
                      <img
                        src={imageUrl}
                        alt={school.schoolname}
                        className="w-full h-full object-contain rounded-md"
                        onError={() => setFailedImages(prev => ({ ...prev, [idKey]: true }))}
                        onLoad={() =>
                          setFailedImages(prev => {
                            if (!prev[idKey]) return prev;
                            const copy = { ...prev };
                            delete copy[idKey];
                            return copy;
                          })
                        }
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-xl text-gray-400 text-sm">
                        No image
                      </div>
                    )}
                  </div>

                  <h3
                    className="text-base font-bold font-outfit text-black mb-0 px-2 text-center"
                    style={{ lineHeight: 1.15 }}
                  >
                    {school.schoolname}
                  </h3>
                </div>

                {/* BOTTOM (reviews) — stays docked */}
                <div className="w-full mt-auto space-y-1 pt-4">
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-gray-700 font-fredoka">4.79 critique review</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-gray-700 font-fredoka">4.38 student review</span>
                  </div>
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
