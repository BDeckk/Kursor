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

  // Update email when user session loads
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

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      // Create unique file name
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `profile-photos/${fileName}`;

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from("profiles") // Make sure this bucket exists in your Supabase project
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
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
      
      // Clear success message after 3 seconds
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

    // Profile Validation
    const use_result = await isUserExist(user?.id);
    if (use_result.success) {
      setError("You already have a profile. You cannot submit again.");
      return;
    }

    // Validation
    if (!formData.full_name || !formData.email || !formData.birthdate || !formData.gender || !formData.address || !formData.age) {
      console.log(formData);
      setError("Please fill in all required fields.");
      return;
    }

    // Email validation
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
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-6xl p-8">
        {/* Header */}
        <div className="flex items-center gap-2 mb-8">
          <img
            src="/Kursor.png"
            alt="Kursor logo"
            className="h-70 w-auto pt-1"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Left side image */}
          <div className="flex items-center justify-center">
            <div className="relative w-full max-w-md aspect-square flex items-center justify-center">
              <div className="text-gray-400 text-center">
                <img src={'/registration-career.png'} alt="Left Side Image"/>
              </div>
            </div>
          </div>

          {/* Right side form */}
          <div className="flex flex-col justify-center">
            <div className="flex justify-end mb-8">
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
                className="w-20 h-20 rounded-full border-4 border-yellow-400 bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center group overflow-hidden relative"
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
                  <Upload className={`w-8 h-8 text-gray-400 group-hover:text-gray-600 ${uploading ? 'animate-pulse' : ''}`} />
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </button>
              {photoUrl && (
                <p className="text-xs text-gray-400 text-right mt-1">Photo uploaded</p>
              )}
            </div>

            <div className="space-y-6">
              {/* Full Name */}
              <div>
                <label className="block text-gray-500 text-sm font-medium mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="w-full px-6 py-4 border-2 border-yellow-400 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white"
                  placeholder="Enter your full name"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-gray-500 text-sm font-medium mb-2">
                  Email Address *
                </label>
                <h1 className="w-full px-6 py-4 border-2 border-gray-300 rounded-full bg-gray-50 text-gray-500 cursor-not-allowed">
                  {user?.email}
                </h1>
                <p className="text-xs text-gray-400 mt-1">Email is auto-filled from your account</p>
              </div>

              {/* Birthdate */}
              <div>
                <label className="block text-gray-500 text-sm font-medium mb-2">
                  Birthdate *
                </label>
                <input
                  type="date"
                  name="birthdate"
                  value={formData.birthdate}
                  onChange={handleChange}
                  className="w-full px-6 py-4 border-2 border-yellow-400 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white"
                />
              </div>

              {/* Age */}
              <div>
                <label className="block text-gray-500 text-sm font-medium mb-2">
                  Age *
                </label>
                <input
                  type="number"
                  name="age"
                  value={formData.age || ""}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  className="w-full px-6 py-4 border-2 border-yellow-400 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white"
                  placeholder="Enter your age"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-gray-500 text-sm font-medium mb-2">
                  Gender *
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-6 py-4 border-2 border-yellow-400 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white cursor-pointer"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </div>

              {/* Address */}
              <div>
                <label className="block text-gray-500 text-sm font-medium mb-2">
                  Address *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-6 py-4 border-2 border-yellow-400 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white"
                  placeholder="Enter your address"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  onClick={handleSubmit}
                  disabled={uploading}
                  className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-4 rounded-full transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
    </div>
  );
}