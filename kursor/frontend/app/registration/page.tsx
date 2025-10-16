"use client";

import { useState, useEffect } from "react";
import { UserAuth } from "@/Context/AuthContext";
import { useRouter } from "next/navigation";

export default function KursorProfileForm() {
  const { session, insertUser, isUserExist } = UserAuth();
  const user = session?.user;
  
  const router = useRouter();
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    birthdate: "",
    gender: "",
    address: "",
    strand: "",
    age: "",
  });

  useEffect(() => {
    if (user?.email) {
      setFormData(prev => ({
        ...prev,
        email: user.email
      }));
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setSuccess("");
    setError("");
  };

  const handleSubmit = async () => {
    if (!user) {
      setError("No authenticated user found.");
      return;
    }

    const use_result = await isUserExist(user?.id);
    if (use_result.success) {
      setError("You already have a profile. You cannot submit again.");
      return;
    }

    if (!formData.full_name || !formData.email || !formData.birthdate || !formData.gender || !formData.address || !formData.age || !formData.strand) {
      setError("Please fill in all required fields.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    const userData = {
      id: user?.id,
      email: formData.email,
      full_name: formData.full_name,
      location: formData.address,
      gender: formData.gender,
      age: formData.age,
      strand: formData.strand,
      birthdate: formData.birthdate,
      profile_image_url: null, // always null now
    };

    try {
      const result = await insertUser(userData);

      if (result.success) {
        setSuccess("User profile created successfully!");
        setError("");
        setFormData({
          full_name: "",
          email: user.email || "",
          birthdate: "",
          gender: "",
          address: "",
          strand: "",
          age: "",
        });
        router.push("/dashboard");
      } else {
        setError("Error creating profile. Please try again.");
      }
    } catch (err) {
      console.error("Error inserting user:", err);
      setError("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-white flex ">
      {/* Left Side - Image (45% width) */}
      <div className="w-[55%] flex flex-col">
        <header className="flex justify-between items-center h-20 fixed left-0 w-full z-50 bg-gradient-to-b from-white to-white/85 pr-[2%]">
          <div className="flex items-center">
            <img
              src="/Kursor.png"
              alt="Kursor logo"
              className="h-12 w-auto"
            />
          </div>
        </header>
        <div className="flex-1 flex items-center">
          <img 
            src="/registration-career.png" 
            alt="Registration illustration" 
            className="w-full max-w-[780px] h-auto object-contain -mt-20"
          />
        </div>
      </div>

      {/* Right Side - Form (55% width) */}
      <div className="w-[45%] flex items-center justify-center">
        <div className="w-[600px] max-w-[600px] pt-30">
          {/* Form Fields */}
          <div className="space-y-5">
            {/* Full Name */}
            <div className="relative pb-4">
              <label className="absolute -top-3 left-6 bg-[#FFFFFF] px-2 text-gray-500 text-md font-fredoka font-medium">
                Full Name *
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className="w-full px-6 py-3 border-2 font-fredoka border-yellow-400 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-transparent"
                placeholder="Enter your full name"
              />
            </div>

            {/* Email */}
            <div className="relative pb-4">
              <label className="absolute -top-3 left-6 bg-[#FFFFFF] px-2 text-gray-500 text-md font-fredoka font-medium">
                Email Address *
              </label>
              <div className="w-full px-6 py-3 border-2 border-gray-300 rounded-full bg-[#FFFFFF] text-gray-500 cursor-not-allowed">
                {user?.email}
              </div>
              <p className="text-xs text-gray-400 mt-1 pl-100">Email is auto-filled from your account</p>
            </div>

            {/* Birthdate */}
            <div className="relative pb-4">
              <label className="absolute -top-3 left-6 bg-[#FFFFFF] px-2 text-gray-500 text-md font-fredoka font-medium">
                Birthdate *
              </label>
              <input
                type="date"
                name="birthdate"
                value={formData.birthdate}
                onChange={handleChange}
                className="w-full px-6 py-3 border-2 border-yellow-400 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white"
              />
            </div>

            {/* Age */}
            <div className="relative pb-4">
              <label className="absolute -top-3 left-6 bg-[#FFFFFF] px-2 text-gray-500 text-md font-fredoka font-medium">
                Age *
              </label>
              <input
                type="number"
                name="age"
                value={formData.age || ""}
                onChange={handleChange}
                min="0"
                max="100"
                className="w-full px-6 py-3 border-2 border-yellow-400 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white"
                placeholder="Enter your age"
              />
            </div>

            {/* Gender */}
            <div className="relative pb-4">
              <label className="absolute -top-3 left-6 bg-[#FFFFFF] px-2 text-gray-500 text-md font-fredoka font-medium">
                Gender *
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-6 py-3 pr-10 border-2 border-yellow-400 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white cursor-pointer appearance-none"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
            </div>

            {/* Strand */}
            <div className="relative pb-4">
              <label className="absolute -top-3 left-6 bg-[#FFFFFF] px-2 text-gray-500 text-md font-fredoka font-medium">
                Strand *
              </label>
              <select
                name="strand"
                value={formData.strand}
                onChange={handleChange}
                className="w-full px-6 py-3 pr-10 border-2 border-yellow-400 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white cursor-pointer appearance-none"
              >
                <option value="">Select strand</option>
                <option value="TVL">TVL</option>
                <option value="STEM">STEM</option>
                <option value="ABM">ABM</option>
                <option value="HUMS">HUMS</option>
                <option value="GAS">GAS</option>
                <option value="ICT">ICT</option>
                <option value="GA">GA</option>
              </select>
            </div>

            {/* Address */}
            <div className="relative pb-4">
              <label className="absolute -top-3 left-6 bg-[#FFFFFF] px-2 text-gray-500 text-md font-fredoka font-medium">
                Address *
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-6 py-3 border-2 border-yellow-400 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white"
                placeholder="Enter your address"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4 flex justify-center">
              <button
                onClick={handleSubmit}
                disabled={uploading}
                className="w-[200px] mb-20 bg-yellow-400 hover:bg-yellow-500 text-black text-[20px] font-fredoka font-bold py-3.5 rounded-full transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-base"
              >
                Submit
              </button>
            </div>

            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border-2 border-green-400 rounded-lg p-4">
                <p className="text-green-700 text-center font-semibold">
                  {success}
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4">
                <p className="text-red-700 text-center font-semibold">
                  {error}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
