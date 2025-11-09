"use client";

import { useState, useEffect } from "react";

const LoadingScreen = () => {
  const [dots, setDots] = useState(".");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length < 3 ? prev + "." : "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
      {/* Centered GIF */}
      <img
        src="/paperplane.gif" // ← Path to your loading animation
        alt="Loading"
        className="h-55 w-75"
      />

      {/* Loading Text */}
      <p className="text-lg font-semibold text-gray-800 font-fredoka">
        Loading{dots}
      </p>
    </div>
  );
};

export default LoadingScreen;
