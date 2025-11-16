"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";

interface ProfileAvatarProps {
  userId?: string | null;
  username: string;
  size?: number; // default 40
}

const colors = ["#F87171", "#FBBF24", "#34D399", "#60A5FA", "#A78BFA", "#F472B6"];

export default function ProfileAvatar({ userId, username, size = 40 }: ProfileAvatarProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfileImage = async () => {
      if (!userId) return;

      // FIXED: Your table is "users", not "profiles"
      const { data, error } = await supabase
        .from("users")
        .select("profile_image_url")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("Avatar fetch error:", error);
        return;
      }

      if (data?.profile_image_url) {
        // FIXED: profile_image_url is already a public URL
        setImageUrl(data.profile_image_url);
      }
    };

    fetchProfileImage();
  }, [userId]);

  // Get initials for fallback avatar
  const initials = username ? username[0].toUpperCase() : "?";
  const color = colors[username.charCodeAt(0) % colors.length];
  const fontSize = size * 0.5;

  return imageUrl ? (
    <img
        src={imageUrl}
        alt={username}
        className="rounded-full object-cover flex-shrink-0"
        width={size}
        height={size}
      />
  ) : (
    <div
      className="rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0"
      style={{ width: size, height: size, backgroundColor: color, fontSize }}
    >
      {initials}
    </div>
  );
}
