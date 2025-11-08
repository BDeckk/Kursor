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

interface LikedSchool {
  id: number | string;
  schoolname: string;
  image?: string | null;
  location?: string;
}

export function LikedSchoolsCarousel({ userId }: { userId?: string }) {
  const router = useRouter();
  const [failedImages, setFailedImages] = React.useState<Record<string, boolean>>({});
  const [likedSchools, setLikedSchools] = React.useState<LikedSchool[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Fetch liked schools for the current user
  React.useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchLikedSchools = async () => {
      try {
        // Get school IDs that the user has liked
        const { data: likes, error: likesError } = await supabase
          .from("school_likes")
          .select("school_id")
          .eq("user_id", userId);

        if (likesError) {
          console.error("Error fetching likes:", likesError.message);
          setLoading(false);
          return;
        }

        if (!likes || likes.length === 0) {
          setLikedSchools([]);
          setLoading(false);
          return;
        }

        // Get school details for liked schools
        const schoolIds = likes.map(like => like.school_id);
        const { data: schools, error: schoolsError } = await supabase
          .from("schools")
          .select("id, name, image_url, location")
          .in("id", schoolIds);

        if (schoolsError) {
          console.error("Error fetching schools:", schoolsError.message);
          setLoading(false);
          return;
        }

        // Map to the expected format
        const formattedSchools = (schools || []).map(school => ({
          id: school.id,
          schoolname: school.name,
          image: school.image_url,
          location: school.location
        }));

        setLikedSchools(formattedSchools);
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLikedSchools();
  }, [userId]);

  // Unlike handler (removes from liked list)
  const handleUnlike = async (schoolId: string | number) => {
    if (!userId) {
      alert("Please log in to unlike a school.");
      return;
    }

    if (!schoolId) {
      console.error("Missing school ID when unliking");
      return;
    }

    // Determine if schoolId is numeric or UUID
    const isUuid = typeof schoolId === "string" && schoolId.includes("-");
    const idValue = isUuid ? schoolId : Number(schoolId);

    if (!idValue || (typeof idValue === "number" && isNaN(idValue))) {
      console.error("Invalid schoolId:", schoolId);
      return;
    }

    // Optimistically remove from UI
    setLikedSchools(prev => prev.filter(school => String(school.id) !== String(schoolId)));

    // Delete from database
    const { error } = await supabase
      .from("school_likes")
      .delete()
      .eq("user_id", userId)
      .eq("school_id", idValue);

    if (error) {
      console.error("Failed to unlike:", error.message);
      // Optionally re-fetch to restore the item if deletion failed
      // For now, we'll leave it removed from UI
    }
  };

  const handleCardClick = (id: string | number) => {
    router.push(`/school-details/${id}`);
  };

  if (loading) {
    return (
      <div className="w-full py-12 text-center text-gray-500 font-fredoka">
        Loading liked schools...
      </div>
    );
  }

  if (likedSchools.length === 0) {
    return (
      <div className="w-full py-12 text-center text-gray-500 font-fredoka">
        No liked schools yet. Start exploring schools and save your favorites!
      </div>
    );
  }

  return (
    <Carousel className="w-full relative overflow-visible">
      <CarouselContent className="gap-2 px-12">
        {likedSchools.map((school, index) => {
          const imageUrl = resolveImageUrl(school.image);
          const idKey = String(school.id);
          const isFailed = !!failedImages[idKey];

          return (
            <CarouselItem
              key={index}
              className="basis-auto min-w-[230px] max-w-[230px]"
            >
              <div
                onClick={() => handleCardClick(school.id)}
                className="cursor-pointer bg-white rounded-3xl shadow-lg flex flex-col items-center text-center relative hover:shadow-xl hover:scale-105 transition-all duration-300
                          px-3 py-6 h-[320px]"
              >
                {/* unlike button (absolute) - always filled red since these are liked schools */}
                <button
                  onClick={e => {
                    e.stopPropagation();
                    handleUnlike(school.id);
                  }}
                  className="absolute top-4 right-4 text-red-500 hover:text-red-600 transition-colors"
                >
                  <Heart className="w-6 h-6 fill-red-500 text-red-500" />
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

                {/* BOTTOM (reviews) */}
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