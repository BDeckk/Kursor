"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";

interface NearbySchool {
  id: number | string;
  rank: number;
  schoolname: string;
  image?: string | null;
  available_courses?: string;
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

        // Fetch logos AND available_courses for those ids from 'schools' table
        const { data: schoolsData, error: schoolsError } = await supabase
          .from("schools")
          .select("id, school_logo, available_courses")
          .in("id", ids);

        if (schoolsError) {
          console.warn("Warning: failed to fetch school details:", schoolsError);
        }

        // create id -> school_logo & available_courses map
        const schoolMap = new Map<number | string, { logo: string | null; courses?: string }>();
        if (Array.isArray(schoolsData)) {
          for (const row of schoolsData) {
            schoolMap.set(row.id, {
              logo: row.school_logo ?? null,
              courses: row.available_courses ?? undefined,
            });
          }
        }

        // merge results, preserving order
        const formatted: NearbySchool[] = rpcData.map((school: any, index: number) => {
          const schoolInfo = schoolMap.get(school.id) || { logo: null, courses: undefined };
          const logoFromRpc = school.school_logo ?? school.logo ?? null;
          const image = schoolInfo.logo || logoFromRpc || null;

          return {
            id: school.id ?? index,
            rank: index + 1,
            schoolname: school.name ?? school.schoolname ?? "Unknown",
            image,
            available_courses: schoolInfo.courses,
            distance:
              typeof school.distance_km === "number"
                ? school.distance_km.toFixed(2)
                : undefined,
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
