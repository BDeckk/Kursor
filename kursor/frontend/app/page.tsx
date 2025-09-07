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
    <div className="min-h-screen flex flex-col bg-white">
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
        <nav className="flex space-x-10 font-medium pr-20 mix-blend-difference text-white">
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
      <main className="flex flex-1 items-center justify-between relative overflow-hidden">
        {/* Left Content */}
        <div className="pl-40 max-w-3xl z-10">
          <h1 className="text-4xl md:text-5xl font-extrabold leading-snug mb-6 text-gray-900">
            The right school for <br /> 
            the perfect program <br />
            is <span className="text-yellow-500">within reach.</span>
          </h1>
          <p className="text-2lg text-gray-700 mb-8">
            Find the right school for the right program with Kursor!
          </p>

          <div className="flex space-x-4 pl-5">
            <button 
              onClick={handleGetStarted}
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold rounded-xl px-6 py-3 shadow-md transition"
            >
              Get Started
            </button>

            <button
              onClick={handleLogin}
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold rounded-xl px-6 py-3 shadow-md transition"
            >
              Log In
            </button>
          </div>
        </div>

        {/* Right Illustration */}
        <div className="hidden md:flex flex-1 justify-center relative z-1">
          <img
            src="/career.svg"
            alt="Hero illustration"
            className="h-180 w-auto ml-30 pr-50"
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