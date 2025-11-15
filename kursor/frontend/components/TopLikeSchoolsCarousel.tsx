"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { LikeButton } from "./likebutton";
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
  return `${SUPABASE_STORAGE_URL}/${encoded}`;
}

interface School {
  id: number | string;
  
  schoolname: string;
  image?: string | null;
  likes?: number;
}

export function TopLikedSchoolsCarousel({ userId }: { userId?: string }) {
  const router = useRouter();
  const [schools, setSchools] = React.useState<School[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [failedImages, setFailedImages] = React.useState<Record<string, boolean>>({});

  const { likedSchools, likeCountMap, toggleLike } = useSchoolLikes(userId);

  React.useEffect(() => {
    const fetchTopLikedSchools = async () => {
      try {
        const { data: likesData, error: likesError } = await supabase
          .from("school_likes")
          .select("school_id");

        if (likesError) throw likesError;
        if (!likesData?.length) {
          setSchools([]);
          return;
        }

        const likeCount: Record<string, number> = {};
        likesData.forEach((l) => {
          const id = String(l.school_id);
          likeCount[id] = (likeCount[id] || 0) + 1;
        });

        const uniqueIds = Array.from(new Set(likesData.map((l) => l.school_id)));
        const { data: schoolsData, error: schoolError } = await supabase
          .from("schools")
          .select("id, name, school_logo")
          .in("id", uniqueIds);

        if (schoolError) throw schoolError;

        const merged = (schoolsData ?? [])
          .map((s) => ({
            id: s.id,
            schoolname: s.name,
            image: s.school_logo,
            likes: likeCount[String(s.id)] ?? 0,
          }))
          .sort((a, b) => b.likes - a.likes);

        setSchools(merged);
      } catch (err) {
        console.error("Error fetching top liked schools:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTopLikedSchools();
  }, []);

  if (loading) return <div className="text-center py-6">Loading top liked schools...</div>;
  if (schools.length === 0)
    return <div className="text-center py-6 text-gray-700">No liked schools found.</div>;

  return (
    <Carousel className="w-full relative overflow-visible">
      <CarouselContent className="gap-2 px-12">
        {schools.map((school) => {
          const idKey = String(school.id);
          const isLiked = likedSchools[idKey];
          const likeCount = likeCountMap[idKey] ?? school.likes ?? 0;
          const imageUrl = resolveImageUrl(school.image);

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
                  <h3 className="text-base font-bold text-black mb-0 px-2 text-center">
                    {school.schoolname}
                  </h3>
                </div>

                <div className="w-full mt-auto pt-4 flex items-center justify-center gap-2 text-sm">
                  <Heart
                    className={`w-4 h-4 ${
                      isLiked ? "fill-red-500 text-red-500" : "text-gray-400"
                    }`}
                  />
                  <span className="text-gray-700">{likeCount} likes</span>
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
