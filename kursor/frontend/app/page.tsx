"use client";

import React, { useState } from "react";
import LoginModal from "../components/login/login";
import SignupModal from "../components/signup/page";

export default function HomePage() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);

  const handleGetStarted = () => {
    setShowSignupModal(true);
  };

  const handleLogin = () => {
    setShowLoginModal(true);
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Navbar */}
      <header className="flex justify-between items-center h-20 pl-10 pr-20 fixed top-6 left-0 w-full z-50 bg-transparent">
        {/* Logo (not affected by blend mode) */}
        <div className="flex items-center">
          <img
            src="/Kursor.png"
            alt="Kursor logo"
            className="h-70 pl-10 w-auto pt-1"
          />
        </div>

        {/* Nav links (only these invert depending on background) */}
        <nav className="flex space-x-10 font-medium font-outfit pr-20 mix-blend-difference text-white">
          <a
            href="#features"
            className="hover:text-yellow-500 font-semibold transition text-2xl"
          >
            Features
          </a>
          <a
            href="#about"
            className="hover:text-yellow-500 font-semibold transition text-2xl"
          >
            About Us
          </a>
        </nav>
      </header>


      {/* Hero Section */}
      <main className="relative flex flex-1 items-center overflow-hidden pt-15">
          {/* Text + overlap */}
          <div className="pl-40 max-w-4xl relative z-20">
            <h1 className="text-[55px] font-bold font-outfit leading-snug mb-2 text-gray-900">
              The right school for <br /> 
              the perfect program <br />
              is <span className="text-[#FFD600]">within reach.</span>
            </h1>
            <p className="text-[25px] font-fredoka text-gray-700 mb-15">
              Find the right school for the right program <br />
              with Kursor!
            </p>

            <div className="flex space-x-4 gap-6">
              <button 
                onClick={handleGetStarted}
                className="w-50 bg-[#FFEB99] text-[18px] hover:bg-[#FFD600] text-black font-semibold rounded-xl px-6 py-3 shadow-md transition"
              >
                Get Started
              </button>
              <button
                onClick={handleLogin}
                className="w-50 bg-[#FFEB99] text-[18px] hover:bg-[#FFD600] text-black font-semibold rounded-xl px-6 py-3 shadow-md transition"
              >
                Log In
              </button>
            </div>
          </div>

          {/* Right Illustration */}
          <div className="absolute right-0 z-10 pr-23">
            <img
              src="/career.svg"
              alt="Hero illustration"
              className="h-[500px] w-auto"
            />
          </div>

          {/* Background Rectangle */}
          <div className="absolute w-[1021.04px] h-[1210.81px] left-[970px] top-[-350px] z-0 bg-[#FFDE59] rotate-[-20deg]"></div>
        </main>


      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
        />
      )}

      {/* Signup Modal */}
      {showSignupModal && (
        <SignupModal
          onClose={() => setShowSignupModal(false)}
        />
      )}
    </div>
  );
}