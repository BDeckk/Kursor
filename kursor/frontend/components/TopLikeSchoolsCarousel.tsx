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
  id: string;
  schoolname: string;
  image?: string | null;
  likes: number;
}

export function TopLikedSchoolsCarousel({ userId }: { userId?: string }) {
  const router = useRouter();
  const [schools, setSchools] = React.useState<School[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [failedImages, setFailedImages] = React.useState<Record<string, boolean>>({});

  // Only for coloring the heart
  const { likedSchools, toggleLike } = useSchoolLikes(userId);

  React.useEffect(() => {
    const fetchSchools = async () => {
      try {
        // 1️⃣ Fetch total likes per school using RPC
        const { data: likeData, error: likeError } = await supabase.rpc(
          "get_total_likes_per_school"
        );

        if (likeError) throw likeError;
        if (!likeData || likeData.length === 0) {
          setSchools([]);
          return;
        }

        const schoolIds = likeData.map((l: any) => l.school_id);

        // 2️⃣ Fetch school details
        const { data: schoolsData, error: schoolsError } = await supabase
          .from("schools")
          .select("id, name, school_logo")
          .in("id", schoolIds);

        if (schoolsError) throw schoolsError;

        // 3️⃣ Merge school details with total likes
        const merged: School[] = (schoolsData ?? [])
          .map((s) => {
            const likeRow = likeData.find((l: any) => l.school_id === s.id);
            return {
              id: s.id,
              schoolname: s.name,
              image: s.school_logo,
              likes: Number(likeRow?.total_likes ?? 0),
            };
          })
          .sort((a, b) => b.likes - a.likes); // sort descending

        setSchools(merged);
      } catch (err) {
        console.error("Error fetching top liked schools:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSchools();
  }, []);

  if (loading)
    return <div className="text-center py-6">Loading top liked schools...</div>;
  if (!schools.length)
    return (
      <div className="text-center py-6 text-gray-700">
        No liked schools found.
      </div>
    );

  return (
    <Carousel className="w-full relative overflow-visible">
      <CarouselContent className="gap-2 px-12">
        {schools.map((school) => {
          const idKey = String(school.id);
          const isLiked = likedSchools[idKey];
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
                        onError={() =>
                          setFailedImages((prev) => ({ ...prev, [idKey]: true }))
                        }
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
                  <span className="text-gray-700">{school.likes} likes</span>
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
