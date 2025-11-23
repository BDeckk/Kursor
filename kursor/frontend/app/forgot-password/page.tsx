"use client";

import { useState } from "react";
import { supabase } from "@/supabaseClient";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
    });

    if (error) return setError(error.message);
    setSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-[420px] text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Forgot Password
        </h1>
        <p className="text-gray-600 mb-6 text-sm">
          Enter your email and we’ll send you a reset link.
        </p>

        {sent ? (
          <p className="text-green-600 font-medium">
            ✅ Reset email sent! Check your inbox.
          </p>
        ) : (
          <form onSubmit={handleReset} className="space-y-5">
            {error && (
              <p className="text-red-500 text-sm bg-red-50 py-2 rounded-lg">
                {error}
              </p>
            )}

            <input
              type="email"
              placeholder="Enter your email"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#FFDE59]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <button
              type="submit"
              className="w-full py-3 rounded-xl font-semibold text-gray-800 shadow-md hover:shadow-lg"
              style={{ backgroundColor: "#FFDE59" }}
            >
              Send Reset Link
            </button>
          </form>
        )}

        <a href="/" className="mt-6 inline-block text-gray-600 hover:underline text-sm">
          Back to Login
        </a>
      </div>
    </div>
  );
}
