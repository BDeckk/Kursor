"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/supabaseClient";
import { useRouter } from "next/navigation";
import { Bell, Home, User } from "lucide-react";
import { UserAuth } from "@/Context/AuthContext";

export default function Navbar() {
  const router = useRouter();
  const { session } = UserAuth();
  const user = session?.user;

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // New state for redirect overlay
  const [notLoggedIn, setNotLoggedIn] = useState(false);

  // Check login state on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        setNotLoggedIn(true);

        setTimeout(() => {
          router.replace("/");
        }, 1500);
      }
    };

    checkAuth();
  }, [router]);

  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("users")
          .select("full_name, profile_image_url")
          .eq("id", user.id)
          .maybeSingle();

        if (!error && data) {
          setProfileData(data);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user?.id]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const handleProfile = () => router.push("/profile");
  const handleSettings = () => router.push("/settings");
  const handleHomeClick = () => router.push("/dashboard");
  const handleNotificationClick = () => console.log("Notifications clicked");

  const getInitial = () => {
    if (profileData?.full_name) return profileData.full_name.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return "U";
  };

  return (
    <>
      {/* Overlay for redirecting user who is NOT logged in */}
      {notLoggedIn && (
        <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-[9999] text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            You’re not logged in
          </h2>
          <p className="text-gray-600">Redirecting to website's landing page...</p>

          <div className="mt-6">
            <svg
              className="animate-spin h-7 w-7 text-[#FFDE59]"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
        </div>
      )}

      {/* Navbar */}
      <header className="flex justify-between items-center h-20 fixed left-0 w-full z-50 bg-gradient-to-b from-white to-white/85 pr-[3%] pl-[3%]">
        <div className="flex items-center">
          <img src="/Kursor.png" alt="Kursor logo" className="h-12 w-auto" />
        </div>

        <div className="flex items-center gap-4 pt-1">
          <button
            onClick={handleHomeClick}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors duration-200"
            title="Home"
          >
            <Home className="w-5 h-5 text-gray-700" />
          </button>

          <button
            onClick={handleNotificationClick}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors duration-200 relative"
            title="Notifications"
          >
            <Bell className="w-5 h-5 text-gray-700" />
          </button>

          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center font-bold text-black hover:bg-yellow-500 transition-colors duration-200 overflow-hidden"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              ) : profileData?.profile_image_url ? (
                <img
                  src={profileData.profile_image_url}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                getInitial()
              )}
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg rounded-lg py-2 z-50">
                <button
                  onClick={handleProfile}
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  Profile
                </button>
                <button
                  onClick={handleSettings}
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
