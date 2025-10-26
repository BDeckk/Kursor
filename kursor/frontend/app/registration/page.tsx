"use client";

import { useState, useEffect } from "react";
import { UserAuth } from "@/Context/AuthContext";
import { useRouter } from "next/navigation";

interface FormData {
  full_name: string;
  email: string;
  birthdate: string;
  gender: string;
  address: string;
  strand: string;
  age: string;
  latitude: string;
  longitude: string;
}

interface InputFieldProps {
  label: string;
  name: keyof FormData;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
}

interface SelectFieldProps {
  label: string;
  name: keyof FormData;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
}

export default function KursorProfileForm() {
  const { session, insertUser, isUserExist } = UserAuth();
  const user = session?.user;
  const router = useRouter();

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string>("");

  const [formData, setFormData] = useState<FormData>({
    full_name: "",
    email: "",
    birthdate: "",
    gender: "",
    address: "",
    strand: "",
    age: "",
    latitude: "",
    longitude: "",
  });

  useEffect(() => {
    if (user?.email) {
      setFormData((prev) => ({
        ...prev,
        email: user.email,
      }));
    }
  }, [user]);

  // Debounced address geocoding
  useEffect(() => {
    if (formData.address.trim().length > 3) {
      const timer = setTimeout(() => {
        getCoordinatesFromAddress(formData.address);
      }, 800); // 800ms debounce
      return () => clearTimeout(timer);
    } else {
      setLocationStatus("");
    }
  }, [formData.address]);

  // Auto-calculate age from birthdate
  const calculateAge = (birthdate: string): string => {
    if (!birthdate) return "";
    
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age.toString();
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Auto-calculate age when birthdate changes
    if (name === "birthdate" && value) {
      const calculatedAge = calculateAge(value);
      setFormData((prev) => ({ 
        ...prev, 
        [name]: value,
        age: calculatedAge
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    
    setSuccess("");
    setError("");
  };

  // 🗺️ Try to get coordinates from address (with GPS fallback)
  const getCoordinatesFromAddress = async (address: string) => {
    try {
      setLocationStatus("Detecting location...");
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
      );
      const geoData = await geoRes.json();

      if (geoData?.length > 0) {
        const { lat, lon } = geoData[0];
        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lon,
        }));
        setLocationStatus("📍 Location detected from address");
      } else {
        console.warn("No geocode results for address:", address);
        setLocationStatus("Address not found, trying GPS...");
        await fallbackToGPS();
      }
    } catch (err) {
      console.error("Geocode error:", err);
      setLocationStatus("Address lookup failed, trying GPS...");
      await fallbackToGPS();
    }
  };

  // 🧭 Fallback to GPS if geocoding fails
  const fallbackToGPS = async () => {
    if (!navigator.geolocation) {
      setLocationStatus("❌ GPS not supported on this browser.");
      return;
    }

    return new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setFormData((prev) => ({
            ...prev,
            latitude: latitude.toString(),
            longitude: longitude.toString(),
          }));
          setLocationStatus("✅ Using GPS location");
          resolve();
        },
        (err) => {
          console.error("GPS error:", err);
          setLocationStatus("⚠️ Could not retrieve location automatically.");
          resolve();
        }
      );
    });
  };

  const handleSubmit = async () => {
    if (!user) {
      setError("No authenticated user found.");
      return;
    }

    setIsSubmitting(true);

    try {
      const use_result = await isUserExist(user?.id);
      if (use_result.success) {
        setError("You already have a profile. You cannot submit again.");
        setIsSubmitting(false);
        return;
      }

      if (
        !formData.full_name ||
        !formData.email ||
        !formData.birthdate ||
        !formData.gender ||
        !formData.address ||
        !formData.age ||
        !formData.strand
      ) {
        setError("Please fill in all required fields.");
        setIsSubmitting(false);
        return;
      }

      // Validate minimum age (13 years old)
      const age = parseInt(formData.age);
      if (age < 13) {
        setError("You must be at least 13 years old to register.");
        setIsSubmitting(false);
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
        latitude: parseFloat(formData.latitude) || null,
        longitude: parseFloat(formData.longitude) || null,
        profile_image_url: null,
      };

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
          latitude: "",
          longitude: "",
        });
        router.push("/dashboard");
      } else {
        setError("Error creating profile. Please try again.");
      }
    } catch (err) {
      console.error("Error inserting user:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate max date for birthdate (today)
  const getMaxDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Side (image) */}
      <div className="w-[55%] flex flex-col">
        <header className="flex justify-between items-center h-20 fixed left-0 w-full z-50 bg-gradient-to-b from-white to-white/85 pr-[2%]">
          <div className="flex items-center">
            <img src="/Kursor.png" alt="Kursor logo" className="h-12 w-auto" />
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

      {/* Right Side (Form) */}
      <div className="w-[45%] flex items-center justify-center">
        <div className="w-[600px] max-w-[600px] pt-30">
          <div className="space-y-5">
            {/* Full Name */}
            <InputField 
              label="Full Name *" 
              name="full_name" 
              value={formData.full_name} 
              onChange={handleChange} 
            />

            {/* Email (readonly) */}
            <div className="relative pb-4">
              <label className="absolute -top-3 left-6 bg-[#FFFFFF] px-2 text-gray-500 text-md font-fredoka font-medium">
                Email Address *
              </label>
              <div 
                className="w-full px-6 py-3 border-2 border-gray-300 rounded-full bg-[#FFFFFF] text-gray-500 cursor-not-allowed"
                aria-label="Email Address (read-only)"
              >
                {user?.email}
              </div>
              <p className="text-xs text-gray-400 mt-1 pl-100">
                Email is auto-filled from your account
              </p>
            </div>

            {/* Birthdate */}
            <InputField 
              label="Birthdate *" 
              type="date" 
              name="birthdate" 
              value={formData.birthdate} 
              onChange={handleChange}
            />

            {/* Age (auto-calculated, readonly) */}
            <div className="relative pb-4">
              <label className="absolute -top-3 left-6 bg-[#FFFFFF] px-2 text-gray-500 text-md font-fredoka font-medium">
                Age *
              </label>
              <div 
                className="w-full px-6 py-3 border-2 border-gray-300 rounded-full bg-gray-50 text-gray-600"
                aria-label="Age (auto-calculated)"
              >
                {formData.age || "Select birthdate to calculate"}
              </div>
              <p className="text-xs text-gray-400 mt-1 pl-2">
                Age is automatically calculated from birthdate
              </p>
            </div>

            {/* Gender */}
            <SelectField 
              label="Gender *" 
              name="gender" 
              value={formData.gender} 
              onChange={handleChange} 
              options={["male", "female", "other", "prefer-not-to-say"]} 
            />

            {/* Strand */}
            <SelectField 
              label="Strand *" 
              name="strand" 
              value={formData.strand} 
              onChange={handleChange} 
              options={["TVL", "STEM", "ABM", "HUMS", "GAS", "ICT", "GA"]} 
            />

            {/* Address */}
            <InputField 
              label="Address *" 
              name="address" 
              value={formData.address} 
              onChange={handleChange} 
              placeholder="Enter your address" 
            />
            {locationStatus && (
              <p className="text-sm text-gray-600 font-fredoka pl-2">{locationStatus}</p>
            )}

            {/* Show coordinates for transparency */}
            {formData.latitude && formData.longitude && (
              <p className="text-xs text-gray-500 font-fredoka pl-2">
                Lat: {formData.latitude}, Lng: {formData.longitude}
              </p>
            )}

            {/* Submit Button */}
            <div className="pt-4 flex justify-center">
              <button
                onClick={handleSubmit}
                disabled={uploading || isSubmitting}
                className="w-[200px] mb-20 bg-yellow-400 hover:bg-yellow-500 text-black text-[20px] font-fredoka font-bold py-3.5 rounded-full transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-base"
                aria-label="Submit profile form"
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </button>
            </div>

            {success && (
              <div className="bg-green-50 border-2 border-green-400 rounded-lg p-4" role="alert">
                <p className="text-green-700 text-center font-semibold">{success}</p>
              </div>
            )}
            {error && (
              <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4" role="alert">
                <p className="text-red-700 text-center font-semibold">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 🧩 Reusable small components for cleanliness
function InputField({ label, name, value, onChange, type = "text", placeholder = "" }: InputFieldProps) {
  const isRequired = label.includes('*');
  const cleanLabel = label.replace('*', '').trim();
  
  return (
    <div className="relative pb-4">
      <label 
        className="absolute -top-3 left-6 bg-[#FFFFFF] px-2 text-gray-500 text-md font-fredoka font-medium"
        htmlFor={name}
      >
        {label}
      </label>
      <input
        id={name}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={isRequired}
        aria-label={cleanLabel}
        aria-required={isRequired}
        max={type === "date" ? new Date().toISOString().split('T')[0] : undefined}
        className="w-full px-6 py-3 border-2 font-fredoka border-yellow-400 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-transparent"
        placeholder={placeholder}
      />
    </div>
  );
}

function SelectField({ label, name, value, onChange, options }: SelectFieldProps) {
  const isRequired = label.includes('*');
  const cleanLabel = label.replace('*', '').trim();
  
  return (
    <div className="relative pb-4">
      <label 
        className="absolute -top-3 left-6 bg-[#FFFFFF] px-2 text-gray-500 text-md font-fredoka font-medium"
        htmlFor={name}
      >
        {label}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={isRequired}
        aria-label={cleanLabel}
        aria-required={isRequired}
        className="w-full px-6 py-3 pr-10 border-2 border-yellow-400 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white cursor-pointer appearance-none"
      >
        <option value="">Select option</option>
        {options.map((opt: string) => (
          <option key={opt} value={opt}>
            {opt.toUpperCase()}
          </option>
        ))}
      </select>
    </div>
  );
}