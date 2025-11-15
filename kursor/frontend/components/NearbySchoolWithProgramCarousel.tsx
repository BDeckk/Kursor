// NearbySchoolFilteredByProgram.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/supabaseClient";
import { Heart } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

// ---------------- Supabase Storage URL ----------------
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

// ---------------- Types ----------------
interface NearbySchool {
  id: string | number;
  schoolname: string;
  image?: string | null;
  available_courses?: string; // JSON string like '["BS Computer","BS Nursing"]'
}

interface Props {
  schools: NearbySchool[];
  programTitle: string;
  userId?: string;
}

// ---------------- Star Renderer ----------------
function renderStars(rating: number) {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  for (let i = 0; i < 5; i++) {
    const isFull = i < fullStars;
    const isHalf = i === fullStars && hasHalfStar;

    stars.push(
      <svg key={i} viewBox="0 0 20 20" className="w-4 h-4">
        {isHalf && (
          <defs>
            <linearGradient id={`halfGrad-${i}`} x1="0" x2="1" y1="0" y2="0">
              <stop offset="50%" stopColor="#FFD700" />
              <stop offset="50%" stopColor="#E5E7EB" />
            </linearGradient>
          </defs>
        )}
        <path
          d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.946a1 1 0 00.95.69h4.15c.969 0 1.371 1.24.588 1.81l-3.36 2.44a1 1 0 00-.364 1.118l1.287 3.945c.3.921-.755 1.688-1.54 1.118l-3.36-2.44a1 1 0 00-1.176 0l-3.36 2.44c-.784.57-1.838-.197-1.539-1.118l1.286-3.945a1 1 0 00-.364-1.118L2.025 9.373c-.783-.57-.38-1.81.588-1.81h4.15a1 1 0 00.95-.69l1.286-3.946z"
          fill={isFull ? "#FFD700" : "#E5E7EB"}
        />
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

// ---------------- Like Hook ----------------
function useSchoolLikes(userId?: string) {
  const [likedSchools, setLikedSchools] = React.useState<Record<string, boolean>>({});
  const [likeCountMap, setLikeCountMap] = React.useState<Record<string, number>>({});

  // Fetch initial likes
  React.useEffect(() => {
    if (!userId) return;
    const fetchLikes = async () => {
      const { data, error } = await supabase.from("school_likes").select("*");
      if (error) return console.error(error);

      const likedMap: Record<string, boolean> = {};
      const countMap: Record<string, number> = {};

      data.forEach((row: any) => {
        const idStr = String(row.school_id);
        if (row.user_id === userId) likedMap[idStr] = true;
        countMap[idStr] = (countMap[idStr] || 0) + 1;
      });

      setLikedSchools(likedMap);
      setLikeCountMap(countMap);
    };
    fetchLikes();
  }, [userId]);

  // Toggle like
  const toggleLike = async (schoolId: string | number) => {
    if (!userId) return;
    const idStr = String(schoolId);
    const isLiked = likedSchools[idStr];

    setLikedSchools((prev) => ({ ...prev, [idStr]: !isLiked }));
    setLikeCountMap((prev) => ({ ...prev, [idStr]: (prev[idStr] || 0) + (isLiked ? -1 : 1) }));

    try {
      if (isLiked) {
        await supabase.from("school_likes").delete().match({ user_id: userId, school_id: idStr });
      } else {
        await supabase
          .from("school_likes")
          .upsert({ user_id: userId, school_id: idStr }, { onConflict: "user_id,school_id" });
      }
    } catch (err) {
      console.error("Error toggling like:", err);
      // rollback
      setLikedSchools((prev) => ({ ...prev, [idStr]: isLiked }));
      setLikeCountMap((prev) => ({ ...prev, [idStr]: (prev[idStr] || 0) + (isLiked ? 1 : -1) }));
    }
  };

  return { likedSchools, likeCountMap, toggleLike };
}

// ---------------- Like Button ----------------
interface LikeButtonProps {
  userId?: string;
  schoolId: string | number;
  liked: boolean;
  toggleLike: (schoolId: string | number) => void;
  className?: string;
}

function LikeButton({ userId, schoolId, liked, toggleLike, className = "" }: LikeButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId) {
      alert("Please log in to like this school.");
      return;
    }
    toggleLike(schoolId);
  };

  return (
    <button
      onClick={handleClick}
      className={`absolute ${className} p-1 hover:scale-110 transition-transform z-10`}
    >
      <Heart
        className={`w-6 h-6 ${liked ? "fill-yellow-500 text-yellow-500" : "text-gray-400"} transition-all duration-300`}
      />
    </button>
  );
}

// ---------------- NearbySchoolFilteredByProgram Component ----------------
export function NearbySchoolFilteredByProgram({ schools, programTitle, userId }: Props) {
  const router = useRouter();
  const [failedImages, setFailedImages] = React.useState<Record<string, boolean>>({});
  const [averageRatings, setAverageRatings] = React.useState<Record<string, number>>({});
  const { likedSchools, toggleLike } = useSchoolLikes(userId);

  // Filter schools by program
  const filteredSchools = React.useMemo(() => {
    return schools.filter((s) => {
      if (!s.available_courses) return false;
      try {
        const courses: string[] = JSON.parse(s.available_courses.trim());
        return courses.some((c) =>
          c.toLowerCase().includes(programTitle.trim().toLowerCase())
        );
      } catch {
        return false;
      }
    });
  }, [schools, programTitle]);

  // Fetch average ratings
  React.useEffect(() => {
    const fetchAverageRatings = async () => {
      if (filteredSchools.length === 0) return;
      const schoolIds = filteredSchools.map((s) => s.id);

      const { data: reviewsData, error } = await supabase
        .from("reviews")
        .select("school_id, rating")
        .in("school_id", schoolIds);

      if (error) return console.error(error);

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
    };

    fetchAverageRatings();
  }, [filteredSchools]);

  if (filteredSchools.length === 0) {
    return <p className="text-center text-gray-800 font-fredoka">No nearby schools offer this program.</p>;
  }

  return (
    <Carousel className="w-full relative overflow-visible">
      <CarouselContent className="gap-2 px-12">
        {filteredSchools.map((school) => {
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
                  className="top-4 right-4"
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
                  <h3 className="text-base font-bold text-black mb-2 px-2 text-center">{school.schoolname}</h3>
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
