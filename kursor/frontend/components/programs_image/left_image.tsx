"use client";

import React from "react";

interface ProgramImageProps {
  title: string;
  className?: string;
  size?: number; // optional, pixel size for width/height (default 320)
}

/** Helper: determine image path from program title */
function getImageForProgram(title: string): string {
  const words = (title || "").toLowerCase();

  if (words.includes("computer") || words.includes("software") || words.includes("it")) {
    return "/career-images/programs-computer.svg";
  } else if (words.includes("business") || words.includes("management")) {
    return "/career-images/programs-business.svg";
  } else if (words.includes("engineering")) {
    return "/career-images/programs-engineer.svg";
  } else if (words.includes("science") || words.includes("biology") || words.includes("chemistry")) {
    return "/career-images/programs-science.svg";
  } else if (words.includes("art") || words.includes("design")) {
    return "/career-images/programs-artist.svg";
  } else if (words.includes("medicine") || words.includes("health") || words.includes("nursing")) {
    return "/career-images/programs-medicine.svg";
  } else if (words.includes("law")) {
    return "/career-images/programs-law.svg";
  } else if (words.includes("education") || words.includes("teaching")) {
    return "/career-images/programs-education.svg";
  } else if (words.includes("psychology")) {
    return "/career-images/programs-psychology.svg";
  } else if (words.includes("accounting") || words.includes("finance")) {
    return "/career-images/programs-accountant.svg";
  }

  return "/career-images/programs-career.svg";
}

export default function ProgramImage({ title, className = "", size = 320 }: ProgramImageProps) {
  const imageUrl = getImageForProgram(title);

  const px = `${size + 200}px`;
  const py = `${size + 150}px`
    
  return (
    <div className={`relative ${className}`}>
      <div className="relative z-10 flex items-center justify-center py-12">
        <img
          src={imageUrl}
          alt={title}   
          style={{ width: px, height: px }}
          className="object-contain"
          onError={(e) => {
            e.currentTarget.src = "/career-images/programs-career.svg";
          }}
        />
      </div>
    </div>
  );
}
