"use client";

import { useEffect } from "react";
import { supabase } from "@/supabaseClient";

export function useRealtimeUpdates(onUpdate: () => void) {
  useEffect(() => {
    const channel = supabase
      .channel("realtime-schools")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "likes" },
        () => onUpdate()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reviews" },
        () => onUpdate()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onUpdate]);
}
