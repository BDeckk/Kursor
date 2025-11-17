"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import ReviewSection from "./ReviewsSection";

interface Props {
  schoolId: string;
}

export default function SchoolReviewsPage({ schoolId }: Props) {
  const [averageRating, setAverageRating] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!schoolId) return;

    const fetchAverage = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("reviews")
          .select("rating")
          .eq("school_id", schoolId);

        if (error) throw error;

        const numericRatings = (data || [])
          .map((r: any) => Number(r.rating || 0))
          .filter((n: number) => n > 0);

        if (!numericRatings.length) {
          setAverageRating(null);
        } else {
          const avg = numericRatings.reduce((sum, r) => sum + r, 0) / numericRatings.length;
          setAverageRating(avg.toFixed(2));
        }
      } catch (err) {
        console.error("Failed to fetch average rating:", err);
        setAverageRating(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAverage();
  }, [schoolId]);

  return <ReviewSection schoolId={schoolId} averageRating={averageRating} />;
}
