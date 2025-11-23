"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthHashHandler() {
  const router = useRouter();

  useEffect(() => {
    // Supabase recovery URL always contains type=recovery
    if (window?.location?.hash.includes("type=recovery")) {
      const hash = window.location.hash;
      router.replace(`/reset-password${hash}`);
    }
  }, [router]);

  return null;
}
