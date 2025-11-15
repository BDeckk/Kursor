"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/supabaseClient";

interface LikeData {
  likedSchools: Record<string, boolean>;
  likeCountMap: Record<string, number>;
  toggleLike: (schoolId: string | number) => Promise<void>;
  loading: boolean;
}

/**
 * Custom hook to manage like state, counts, and real-time updates.
 */
export function useSchoolLikes(userId?: string): LikeData {
  const [likedSchools, setLikedSchools] = useState<Record<string, boolean>>({});
  const [likeCountMap, setLikeCountMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Fetch initial likes and counts
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchLikes = async () => {
      const { data: likes, error } = await supabase
        .from("school_likes")
        .select("school_id, user_id");

      if (error) {
        console.error("Error fetching likes:", error.message);
        setLoading(false);
        return;
      }

      const likedMap: Record<string, boolean> = {};
      const countMap: Record<string, number> = {};

      likes?.forEach((row) => {
        const id = String(row.school_id);
        if (row.user_id === userId) likedMap[id] = true;
        countMap[id] = (countMap[id] || 0) + 1;
      });

      setLikedSchools(likedMap);
      setLikeCountMap(countMap);
      setLoading(false);
    };

    fetchLikes();
  }, [userId]);

  // Real-time listener for school_likes table
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("school_likes_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "school_likes" },
        (payload: any) => {
          const schoolIdRaw = payload?.new?.school_id ?? payload?.old?.school_id ?? null;
          if (!schoolIdRaw) return;
          const schoolId = String(schoolIdRaw);

          setLikeCountMap((prev) => {
            const newMap = { ...prev };
            if (payload.eventType === "INSERT") {
              newMap[schoolId] = (newMap[schoolId] || 0) + 1;
            } else if (payload.eventType === "DELETE") {
              newMap[schoolId] = Math.max(0, (newMap[schoolId] || 1) - 1);
            }
            return newMap;
          });

          // Update current user's local liked map
          if (payload?.new?.user_id === userId) {
            setLikedSchools((prev) => ({
              ...prev,
              [schoolId]: payload.eventType === "INSERT",
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Like/unlike toggle
  const toggleLike = useCallback(
    async (schoolId: string | number) => {
      if (!userId) return;

      const idStr = String(schoolId);
      const isLiked = likedSchools[idStr];

      // Optimistic update
      setLikedSchools((prev) => ({ ...prev, [idStr]: !isLiked }));
      setLikeCountMap((prev) => ({
        ...prev,
        [idStr]: (prev[idStr] || 0) + (isLiked ? -1 : 1),
      }));

      try {
        if (isLiked) {
          const { error } = await supabase
            .from("school_likes")
            .delete()
            .match({ user_id: userId, school_id: idStr });
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("school_likes")
            .upsert({ user_id: userId, school_id: idStr }, { onConflict: "user_id,school_id" });
          if (error) throw error;
        }
      } catch (err: any) {
        console.error("Error toggling like:", err.message || err);
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
