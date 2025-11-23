"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/supabaseClient";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [updated, setUpdated] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const [confirmPassword, setConfirmPassword] = useState("");


  const handleUpdate = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");

  if (password !== confirmPassword) {
    return setError("Passwords do not match.");
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) return setError(error.message);

  setUpdated(true);
  setTimeout(() => router.push("/"), 1800);
};


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-[420px] text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Reset Password
        </h1>

        {updated ? (
          <p className="text-green-600 font-medium">
            ✅ Password updated! Redirecting…
          </p>
        ) : (
          <form onSubmit={handleUpdate} className="space-y-5">
                {error && (
                    <p className="text-red-500 bg-red-50 py-2 rounded-lg text-sm">
                    {error}
                    </p>
                )}

                <input
                    type="password"
                    placeholder="New password"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#FFDE59]"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                />

                <input
                    type="password"
                    placeholder="Confirm password"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#FFDE59]"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                />

                <button
                    type="submit"
                    className="w-full py-3 rounded-xl font-semibold text-gray-800 shadow-md hover:shadow-lg"
                    style={{ backgroundColor: "#FFDE59" }}
                >
                    Update Password
                </button>
                </form>

        )}
      </div>
    </div>
  );
}
