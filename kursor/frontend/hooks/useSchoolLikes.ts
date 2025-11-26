"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/supabaseClient";

interface LikeData {
  likedSchools: Record<string, boolean>;
  likeCountMap: Record<string, number>;
  toggleLike: (schoolId: string | number) => Promise<void>;
  loading: boolean;
}

export function useSchoolLikes(userId?: string): LikeData {
  const [likedSchools, setLikedSchools] = useState<Record<string, boolean>>({});
  const [likeCountMap, setLikeCountMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Fetch initial likes
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchLikes = async () => {
      try {
        const { data: likes, error } = await supabase
          .from("school_likes")
          .select("school_id, user_id");

        if (error) throw error;

        const likedMap: Record<string, boolean> = {};
        const countMap: Record<string, number> = {};

        likes?.forEach((row) => {
          const id = String(row.school_id);
          // Track if current user liked this school
          if (row.user_id === userId) {
            likedMap[id] = true;
          }
          // Count all likes for this school
          countMap[id] = (countMap[id] || 0) + 1;
        });

        console.log("🔍 DEBUG - Total likes fetched:", likes?.length);
        console.log("🔍 DEBUG - Count map:", countMap);
        console.log("🔍 DEBUG - Liked map:", likedMap);

        setLikedSchools(likedMap);
        setLikeCountMap(countMap);
      } catch (err) {
        console.error("Error fetching likes:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLikes();
  }, [userId]);

  // Real-time updates
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("school_likes_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "school_likes" },
        (payload: any) => {
          const schoolIdRaw = payload?.new?.school_id ?? payload?.old?.school_id;
          if (!schoolIdRaw) return;
          const schoolId = String(schoolIdRaw);

          setLikeCountMap((prev) => {
            const newMap = { ...prev };
            if (payload.eventType === "INSERT") {
              newMap[schoolId] = (newMap[schoolId] || 0) + 1;
            }
            if (payload.eventType === "DELETE") {
              newMap[schoolId] = Math.max(0, (newMap[schoolId] || 1) - 1);
            }
            return newMap;
          });

          // Update liked state for current user
          if (payload?.new?.user_id === userId) {
            setLikedSchools((prev) => ({ ...prev, [schoolId]: payload.eventType === "INSERT" }));
          }
          if (payload?.old?.user_id === userId && payload.eventType === "DELETE") {
            setLikedSchools((prev) => ({ ...prev, [schoolId]: false }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Toggle like
  const toggleLike = useCallback(
    async (schoolId: string | number) => {
      if (!userId) return;
      const idStr = String(schoolId);
      const isLiked = likedSchools[idStr];

      // Optimistic update
      setLikedSchools((prev) => ({ ...prev, [idStr]: !isLiked }));
      setLikeCountMap((prev) => ({
        ...prev,
        [idStr]: Math.max(0, (prev[idStr] || 0) + (isLiked ? -1 : 1)),
      }));

      try {
        if (isLiked) {
          // Unlike
          const { error } = await supabase
            .from("school_likes")
            .delete()
            .match({ user_id: userId, school_id: idStr });
          if (error) throw error;
        } else {
          // Like 
          const { error } = await supabase
            .from("school_likes")
            .insert({ user_id: userId, school_id: idStr });
          if (error) throw error;
        }
      } catch (err) {
        console.error("Error toggling like:", err);
        // Rollback on error
        setLikedSchools((prev) => ({ ...prev, [idStr]: isLiked }));
        setLikeCountMap((prev) => ({
          ...prev,
          [idStr]: Math.max(0, (prev[idStr] || 0) + (isLiked ? 1 : -1)),
        }));
      }
    },
    [userId, likedSchools]
  );

  return { likedSchools, likeCountMap, toggleLike, loading };
}