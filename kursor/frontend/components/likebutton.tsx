"use client";

import { Heart } from "lucide-react";
import React from "react";

interface LikeButtonProps {
  userId?: string;
  schoolId: string | number;
  liked: boolean;
  toggleLike: (schoolId: string | number) => void;
  className?: string;
  color?: string;
}

export function LikeButton({
  userId,
  schoolId,
  liked,
  toggleLike,
  className = "",
  color = "yellow-500",
}: LikeButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId) {
      alert("Please log in to like this school.");
      return;
    }
    toggleLike(schoolId);
  };

  return (
    <button
      onClick={handleClick}
      className={`absolute ${className} p-1 hover:scale-110 transition-transform`}
    >
      <Heart
        className={`w-6 h-6 ${liked ? `fill-${color} text-${color}` : "text-gray-400"} transition-all duration-300`}
      />
    </button>
  );
}
