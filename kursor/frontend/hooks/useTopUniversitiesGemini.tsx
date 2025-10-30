"use client";

import { useEffect, useState } from "react";

export interface TopUniversity {
  id: string | number;
  rank: number;
  schoolname: string;
  image?: string | null;
  reason?: string | null;
}

export function useTopUniversitiesGemini() {
  const [universities, setUniversities] = useState<TopUniversity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { 
    const fetchUniversities = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/top-universities");
        const json = await res.json();

        if (!res.ok) throw new Error(json.error || "Failed to fetch universities");

        setUniversities(json.topUniversities || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUniversities();
  }, []);

  return { universities, loading, error };
}
