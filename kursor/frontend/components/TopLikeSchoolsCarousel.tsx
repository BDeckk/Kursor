"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { supabase } from "@/supabaseClient";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useSchoolLikes } from "@/hooks/useSchoolLikes";

interface School {
  id: string;
  schoolname: string;
  image?: string | null;
}

const SUPABASE_STORAGE_URL = "https://fiujlzfouidrxbechcxa.supabase.co/storage/v1/object/public";

function resolveImageUrl(imagePath?: string | null) {
  if (!imagePath) return null;
  if (/^https?:\/\//i.test(imagePath)) return imagePath;
  const segments = String(imagePath).trim().split("/").filter(Boolean);
  return `${SUPABASE_STORAGE_URL}/${segments.map(encodeURIComponent).join("/")}`;
}

export default function TopLikedSchoolsCarousel({ userId }: { userId?: string }) {
  const [schools, setSchools] = useState<School[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const { likedSchools, likeCountMap, toggleLike, loading: loadingLikes } = useSchoolLikes(userId);

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const { data: likes, error } = await supabase.from("school_likes").select("school_id");
        if (error) throw error;

        const schoolIds = [...new Set(likes?.map(row => String(row.school_id)) || [])];
        if (!schoolIds.length) {
          setSchools([]);
          return;
        }

        const { data: schoolsData, error: schoolError } = await supabase
          .from("schools")
          .select("id, name, school_logo")
          .in("id", schoolIds);

        if (schoolError) throw schoolError;

        const schoolsList: School[] = (schoolsData ?? []).map((s) => ({
          id: s.id,
          schoolname: s.name,
          image: s.school_logo,
        }));

        setSchools(schoolsList);
      } catch (err) {
        console.error("Error fetching schools:", err);
      } finally {
        setLoadingSchools(false);
      }
    };

    fetchSchools();
  }, []);

  const sortedSchools = React.useMemo(() => {
    return [...schools].sort((a, b) => {
      const likesA = likeCountMap[a.id] || 0;
      const likesB = likeCountMap[b.id] || 0;
      return likesB - likesA;
    });
  }, [schools, likeCountMap]);

  if (loadingSchools || loadingLikes) return <div className="text-center py-6">Loading top liked schools...</div>;
  if (!sortedSchools.length) return <div className="text-center py-6 text-gray-700">No liked schools found.</div>;

  return (
    <Carousel className="w-full relative overflow-visible">
      <CarouselContent className="gap-2 px-12">
        {sortedSchools.map((school) => {
          const idKey = String(school.id);
          const isLiked = likedSchools[idKey] || false;
          const likes = likeCountMap[idKey] || 0;
          const imageUrl = resolveImageUrl(school.image);

          return (
            <CarouselItem key={idKey} className="basis-auto min-w-[230px] max-w-[230px]">
              <Link href={`/school-details/${school.id}`} className="cursor-pointer">
                <div className="bg-white rounded-3xl shadow-lg flex flex-col items-center text-center relative hover:shadow-xl hover:scale-105 transition-all duration-300 px-3 py-6 h-[320px]">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLike(school.id);
                    }}
                    className="absolute top-4 right-4"
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? "fill-red-500 text-red-500" : "text-gray-400"}`} />
                  </button>

                  <div className="flex flex-col items-center justify-center flex-1">
                    <div className="w-32 h-32 flex items-center justify-center mb-4">
                      {imageUrl && !failedImages[idKey] ? (
                        <img
                          src={imageUrl}
                          alt={school.schoolname}
                          className="w-full h-full object-contain rounded-md"
                          onError={() => setFailedImages((prev) => ({ ...prev, [idKey]: true }))}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-xl text-gray-400 text-sm">
                          No image
                        </div>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-black mb-0 px-2 text-center">{school.schoolname}</h3>
                  </div>

                  <div className="w-full mt-auto pt-4 flex items-center justify-center gap-2 text-sm">
                    <Heart className={`w-4 h-4 ${isLiked ? "fill-red-500 text-red-500" : "text-gray-400"}`} />
                    <span className="text-gray-700">{likes} {likes === 1 ? 'like' : 'likes'}</span>
                  </div>
                </div>
              </Link>
            </CarouselItem>
          );
        })}
      </CarouselContent>

      <CarouselPrevious className="text-gray-800 hover:text-yellow-500 -left-20" />
      <CarouselNext className="text-gray-800 hover:text-yellow-500 -right-20" />
    </Carousel>
  );
}
