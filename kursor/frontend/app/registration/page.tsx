"use client";

import { useState, useEffect, useRef } from "react";
import { Upload } from "lucide-react";
import { UserAuth } from "@/Context/AuthContext";
import { useRouter } from "next/navigation";
import { supabase } from "@/supabaseClient";

export default function KursorProfileForm() {
  const { session, insertUser, isUserExist } = UserAuth();
  const user = session?.user;
  
  const router = useRouter();
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    birthdate: "",
    gender: "",
    address: "",
    age: "",
    profile_photo_url: "",
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

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `profile-photos/${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from("profiles")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("profiles")
        .getPublicUrl(filePath);

      console.log("Upload successful! Public URL:", urlData.publicUrl);
      
      setPhotoUrl(urlData.publicUrl);
      setFormData({
        ...formData,
        profile_photo_url: urlData.publicUrl,
      });
      setSuccess("Photo uploaded successfully!");
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error uploading photo:", err);
      setError("Failed to upload photo. Please try again.");
    } finally {
      setUploading(false);
    }
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

    if (!formData.full_name || !formData.email || !formData.birthdate || !formData.gender || !formData.address || !formData.age) {
      console.log(formData);
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
      birthdate: formData.birthdate,
      profile_image_url: formData.profile_photo_url || null,
    };

    console.log("User data being sent:", userData);

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
          age: "",
          profile_photo_url: "",
        });
        setPhotoUrl(null);
 
        router.push('/dashboard');
      } else {
        setError("Error creating profile. Please try again.");
      }
    } catch (err) {
      console.error("Error inserting user:", err);
      setError("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Side - Image (45% width) */}
      <div className="w-[55%] flex flex-col">
        {/* Logo in top left */}
        <header className="flex justify-between items-center h-20 fixed left-0 w-full z-50 bg-gradient-to-b from-white to-white/85 pr-[2%]">
          {/* Logo */}
          <div className="flex items-center ">
            <img
              src="/Kursor.png"
              alt="Kursor logo"
              className="h-70 w-auto pt-1"
            />
          </div>
        </header>
        
        {/* Left Image */}
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
        <div className="w-[600px] max-w-[600px]">
          {/* Profile Photo Upload */}
          <div className="flex justify-center mt-25 mb-8">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={handlePhotoClick}
              disabled={uploading}
              className="w-40 h-40 rounded-full border-4 border-yellow-400 bg-white hover:bg-gray-50 transition-colors flex items-center justify-center group overflow-hidden relative"
            >
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt="Profile preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error("Image failed to load:", photoUrl);
                    setError("Failed to load profile image. Please try again.");
                    setPhotoUrl(null);
                  }}
                  onLoad={() => console.log("Image loaded successfully:", photoUrl)}
                />
              ) : (
                <Upload className={`w-10 h-10 text-gray-400 group-hover:text-gray-600 ${uploading ? 'animate-pulse' : ''}`} />
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </button>
          </div>

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
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 1.4rem center',
                  backgroundSize: '20px'
                }}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
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
                {uploading ? "Uploading..." : "Submit"}
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