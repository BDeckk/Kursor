"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  // Animation mount
  useEffect(() => {
    setTimeout(() => setIsVisible(true), 50);
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `https://kursor-project.vercel.app/reset-password`,
    });

    if (error) return setError(error.message);
    setSent(true);
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      window.location.href = "/";
    }, 300);
  };

  return (
    <div
      className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleClose}
    >
      {/* Modal container */}
      <div
        className={`bg-white rounded-3xl shadow-2xl p-10 w-[440px] relative transition-all duration-300 ease-out ${
          isVisible
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 -translate-y-4"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors duration-200 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
          onClick={handleClose}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Forgot <span style={{ color: "#FFDE59" }}>Password</span>
          </h2>
          <p className="text-gray-500 text-sm">
            Enter your email and we’ll send you a reset link.
          </p>
        </div>

        {sent ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm font-medium text-center">
            ✅ Reset email sent! Check your inbox.
          </div>
        ) : (
          <form onSubmit={handleReset} className="flex flex-col space-y-5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <input
              type="email"
              placeholder="Enter your email"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-800 focus:border-[#FFDE59] focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <button
              type="submit"
              className="w-full py-3 rounded-xl font-semibold text-gray-800 shadow-md hover:shadow-lg transform hover:scale-[1.02] transition duration-300"
              style={{ backgroundColor: "#FFDE59" }}
            >
              Send Reset Link
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={handleClose}
            className="text-gray-600 hover:underline text-sm"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
