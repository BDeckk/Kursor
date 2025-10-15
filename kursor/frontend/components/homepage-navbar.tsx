"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/supabaseClient";
import { useRouter } from "next/navigation";
import { Bell, Home, User } from 'lucide-react';
import { UserAuth } from "@/Context/AuthContext";

export default function Navbar() {
  const router = useRouter();
  const { session } = UserAuth();
  const user = session?.user;
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) {
        console.log("No user ID found");
        setLoading(false);
        return;
      }

      console.log("Fetching profile for user ID:", user.id);

      try {
        const { data, error } = await supabase
          .from('users')
          .select('full_name, profile_image_url')
          .eq('id', user.id)
          .maybeSingle(); // Changed from .single() to .maybeSingle()

        if (error) {
          console.error("Error fetching profile:", error);
          console.error("Error details:", error.message, error.code);
        } else if (data) {
          console.log("Profile data fetched:", data);
          setProfileData(data);
        } else {
          console.log("No profile found for this user");
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

  const handleProfile = () => {
    router.push("/profile"); 
  };

  const handleSettings = () => {
    router.push("/settings"); 
  };

  const handleHomeClick = () => {
    router.push("/dashboard");
  };

  const handleNotificationClick = () => {
    console.log("Notifications clicked");
  };

  // Get first letter of name for fallback
  const getInitial = () => {
    if (profileData?.full_name) {
      return profileData.full_name.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "U";
  };

  return (
    <header className="flex justify-between items-center h-20 fixed left-0 w-full z-50 bg-gradient-to-b from-white to-white/85 pr-[3%] pl-[3%]">
      {/* Logo */}
      <div className="flex items-center ">
        <img
          src="/Kursor.png"
          alt="Kursor logo"
          className="h-12 w-auto"
        />
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-4 pt-1">
        {/* Home Button */}
        <button
          onClick={handleHomeClick}
          className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors duration-200"
          title="Home"
        >
          <Home className="w-5 h-5 text-gray-700" />
        </button>

        {/* Notification Bell */}
        <button
          onClick={handleNotificationClick}
          className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors duration-200 relative"
          title="Notifications"
        >
          <Bell className="w-5 h-5 text-gray-700" />
        </button>

        {/* Profile Circle */}
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
                onError={(e) => {
                  // error handling
                  console.error("Failed to load image:", profileData.profile_image_url);
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = getInitial();
                }}
                onLoad={() => console.log("Profile image loaded successfully")}
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
  );
}