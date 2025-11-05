// useNearbySchools.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";

interface NearbySchool {
  id: number | string;
  rank: number;
  schoolname: string;
  image?: string | null;
  distance?: string;
}

export function useNearbySchools() {
  const [nearbySchools, setNearbySchools] = useState<NearbySchool[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNearbySchools = async () => {
      setLoading(true);
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData?.user) {
          setError("User not logged in");
          setLoading(false);
          return;
        }

        const userId = userData.user.id;

        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("latitude, longitude")
          .eq("id", userId)
          .single();

        if (profileError || !profile?.latitude || !profile?.longitude) {
          setError("No saved location found for this user");
          setLoading(false);
          return;
        }

        const { latitude, longitude } = profile;

        // call your API route which runs the RPC
        const res = await fetch(`/api/nearby-school?lat=${latitude}&lng=${longitude}`);
        const rpcData = await res.json();

        if (!Array.isArray(rpcData) || rpcData.length === 0) {
          setNearbySchools([]);
          setLoading(false);
          return;
        }

        // get list of ids returned by RPC
        const ids = rpcData.map((s: any) => s.id).filter(Boolean);

        // Fetch logos for those ids from your 'schools' table in batch
        const { data: logosData, error: logosError } = await supabase
          .from("schools")
          .select("id, school_logo")
          .in("id", ids);

        if (logosError) {
          console.warn("Warning: failed to fetch logos:", logosError);
        }

        // create id -> school_logo map
        const logoMap = new Map<string | number, string | null>();
        if (Array.isArray(logosData)) {
          for (const row of logosData) {
            logoMap.set(row.id, row.school_logo ?? null);
          }
        }

        // merge results
        const formatted: NearbySchool[] = rpcData.map((school: any, index: number) => {
          const logoFromTable = logoMap.get(school.id) ?? null;
          const logoFromRpc = school.school_logo ?? school.logo ?? null;
          const image = logoFromTable || logoFromRpc || null;

          return {
            id: school.id ?? index,
            rank: index + 1,
            schoolname: school.name ?? school.schoolname ?? "Unknown",
            image,
            distance: typeof school.distance_km === "number" ? school.distance_km.toFixed(2) : undefined,
          };
        });

        setNearbySchools(formatted);
      } catch (err) {
        console.error("Failed to fetch nearby schools:", err);
        setError("Error fetching nearby schools.");
      } finally {
        setLoading(false);
      }
    };

    fetchNearbySchools();
  }, []);

  return { nearbySchools, loading, error };
}
