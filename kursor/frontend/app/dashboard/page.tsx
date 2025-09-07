"use client";

import React, { useState } from "react";
import { supabase } from "@/supabaseClient";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/"); // back to homepage
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar with Profile Circle */}
      <header className="flex justify-between items-center h-20 px-10 shadow-md bg-white">
        <div className="flex items-center space-x-3">
          <img src="/Kursor.png" alt="Logo" className="h-12 w-auto" />
        </div>

        {/* Profile Circle */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center font-bold text-black"
          >
            {/* Example: first letter of email/name */}
            U
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg rounded-lg py-2">
              <a
                href="#profile"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
                Profile
              </a>
              <a
                href="#settings"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
                Settings
              </a>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="px-10 py-16">
        <div className="bg-yellow-400 rounded-xl p-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-black mb-4">
              Explore and get started with <span className="text-white">Kursor</span>
            </h1>
            <p className="text-black">Your personalized dashboard starts here.</p>
          </div>
          <img src="/dashboard-illustration.png" alt="Illustration" className="h-40" />
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-yellow-100 rounded-lg p-6 text-center">
            <img src="/ai.png" alt="AI guidance" className="h-16 mx-auto mb-4" />
            <h3 className="font-bold">Seek <span className="text-yellow-600">guidance</span> from our AI</h3>
          </div>

          <div className="bg-yellow-100 rounded-lg p-6 text-center">
            <img src="/career.png" alt="Career path" className="h-16 mx-auto mb-4" />
            <h3 className="font-bold">Find the <span className="text-yellow-600">perfect</span> career path</h3>
          </div>

          <div className="bg-yellow-100 rounded-lg p-6 text-center">
            <img src="/schools.png" alt="Schools" className="h-16 mx-auto mb-4" />
            <h3 className="font-bold">Browse for <span className="text-yellow-600">schools</span> near you</h3>
          </div>
        </div>
      </main>
    </div>
  );
}
