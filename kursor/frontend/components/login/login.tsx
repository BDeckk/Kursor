"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/supabaseClient";

export default function LoginModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [isVisible, setIsVisible] = useState(false);
  const [alreadyLoggedIn, setAlreadyLoggedIn] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (session?.user) {
        setAlreadyLoggedIn(true);

        const { data: profile } = await supabase
          .from("users")
          .select("id")
          .eq("id", session.user.id)
          .maybeSingle();

        setTimeout(() => {
          if (profile) {
            router.replace("/dashboard");
          } else {
            router.replace("/registration");
          }
        }, 1200);
      }
    };

    checkSession();
  }, [router]);

  // Entry animation
  useEffect(() => {
    setTimeout(() => setIsVisible(true), 50);
  }, []);

  const handleClose = () => {
    if (alreadyLoggedIn) return;
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const userId = data?.user?.id;
      if (!userId) throw new Error("User authentication failed");

      const { data: profile } = await supabase
        .from("users")
        .select("id")
        .eq("id", userId)
        .maybeSingle();

      if (profile) {
        router.push("/dashboard");
      } else {
        router.push("/registration");
      }

      handleClose();
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleClose}
    >
      {!alreadyLoggedIn && (
        <div
          className={`bg-white rounded-3xl shadow-2xl p-10 w-[440px] relative transition-all duration-300 ease-out ${
            isVisible
              ? "opacity-100 scale-100 translate-y-0"
              : "opacity-0 scale-95 -translate-y-4"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors duration-200 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
            onClick={handleClose}
          >
            ✕
          </button>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              Welcome <span style={{ color: "#FFDE59" }}>Back!</span>
            </h2>
            <p className="text-gray-500 text-sm">
              Sign in to continue your journey
            </p>
          </div>

          {error && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-center text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full text-gray-800 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#FFDE59]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                placeholder="Enter your password"
                className="w-full text-gray-800 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#FFDE59]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

           

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-gray-800 transition-all duration-300 disabled:opacity-50 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
              style={{ backgroundColor: "#FFDE59" }}
            >
              {loading ? "Logging in..." : "Log In"}
            </button>

             {/* ✅ Show only after failed login */}
                    {error && (
                      <div className="text-right text-sm">
                        <button
                          className="text-gray-600 hover:underline cebter"
                          onClick={() => {
                            handleClose();
                            router.push("/forgot-password");
                          }}
                        >
                          Forgot password?
                        </button>
                      </div>
                    )}
          </form>

       
          <div className="mt-6 text-center text-sm">
            <p className="text-gray-600">
              Don't have an account?{" "}
              <span
                className="font-semibold hover:underline cursor-pointer"
                style={{ color: "#FFDE59" }}
                onClick={() => {
                  handleClose();
                  const event = new CustomEvent("openSignup");
                  window.dispatchEvent(event);
                }}
              >
                Sign up
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
