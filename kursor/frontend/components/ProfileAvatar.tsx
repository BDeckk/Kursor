"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";

interface ProfileAvatarProps {
  userId?: string | null;
  username: string;
  size?: number; // optional size, default 40
}

const colors = ["#F87171", "#FBBF24", "#34D399", "#60A5FA", "#A78BFA", "#F472B6"];

export default function ProfileAvatar({ userId, username, size = 40 }: ProfileAvatarProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfileImage = async () => {
      if (!userId) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("profile_image_url")
        .eq("id", userId)
        .single();

      if (profile?.profile_image_url) {
        setImageUrl(`${process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL}/profiles/profile-photos/${profile.profile_image_url}`);
      }
    };

    fetchProfileImage();
  }, [userId]);

  // Get initials for default avatar
  const initials = username ? username[0].toUpperCase() : "?";
  const color = colors[username.charCodeAt(0) % colors.length];

  // Scale font size to avatar size (50% of the avatar height)
  const fontSize = size * 0.5;

  return imageUrl ? (
    <img
      src={imageUrl}
      alt={username}
      className="rounded-full object-cover"
      width={size}
      height={size}
    />
  ) : (
    <div
      className="rounded-full flex items-center justify-center text-white font-semibold"
      style={{ width: size, height: size, backgroundColor: color, fontSize: fontSize }}
    >
      {initials}
    </div>
  );
}
