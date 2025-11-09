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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationStatus, setLocationStatus] = useState("");

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

  // Check if user already exists
  useEffect(() => {
    const checkUserExistence = async () => {
      if (!user?.id) return;
      try {
        const exist = await isUserExist(user.id);
        if (exist.success) router.replace("/dashboard");
        else setFormData((prev) => ({ ...prev, email: user.email || "" }));
      } catch (err) {
        console.error("Error checking user existence:", err);
      }
    };
    checkUserExistence();
  }, [user, isUserExist, router]);

  // Calculate age
  const calculateAge = (birthdate: string): string => {
    if (!birthdate) return "";
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
    return age.toString();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "birthdate") {
      setFormData((prev) => ({ ...prev, [name]: value, age: calculateAge(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    setSuccess("");
    setError("");
  };

  // Set latitude and longitude using GPS
  const setLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("❌ GPS not supported on this browser.");
      return;
    }

    setLocationStatus("Getting GPS location...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setFormData((prev) => ({
          ...prev,
          latitude: latitude.toString(),
          longitude: longitude.toString(),
        }));
        setLocationStatus("✅ Location set successfully.");
      },
      (err) => {
        console.error("GPS error:", err);
        setLocationStatus("⚠️ Could not retrieve GPS location. Please enter manually.");
      }
    );
  };

  const handleSubmit = async () => {
    if (!user) {
      setError("No authenticated user found.");
      return;
    }

    if (
      !formData.full_name ||
      !formData.email ||
      !formData.birthdate ||
      !formData.gender ||
      !formData.strand ||
      !formData.age ||
      !formData.address ||
      !formData.latitude ||
      !formData.longitude
    ) {
      setError("Please fill in all required fields, including address, latitude, and longitude.");
      return;
    }

    const age = parseInt(formData.age);
    if (age < 13) {
      setError("You must be at least 13 years old to register.");
      return;
    }

    setIsSubmitting(true);
    try {
      const use_result = await isUserExist(user.id);
      if (use_result.success) {
        setError("You already have a profile. Redirecting...");
        setTimeout(() => router.replace("/dashboard"), 1500);
        return;
      }

      const userData = {
        id: user.id,
        email: formData.email,
        full_name: formData.full_name,
        location: formData.address,
        gender: formData.gender,
        age: formData.age,
        strand: formData.strand,
        birthdate: formData.birthdate,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        profile_image_url: null,
      };

      const result = await insertUser(userData);
      if (result.success) {
        setSuccess("User profile created successfully!");
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

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left */}
      <div className="w-[55%] flex flex-col">
        <header className="flex justify-between items-center h-20 fixed left-0 w-full z-50 bg-gradient-to-b from-white to-white/85 pr-[2%]">
          <div className="flex items-center pl-7">
            <img src="/Kursor.png" alt="Kursor logo" className="h-12 w-auto" />
          </div>
        </header>
        <div className="flex-1 flex items-center">
          <img src="/registration-career.png" alt="Registration illustration" className="w-full max-w-[780px] h-auto object-contain -mt-20" />
        </div>
      </div>

      {/* Right Form */}
      <div className="w-[45%] flex items-center justify-center">
        <div className="w-[600px] max-w-[600px] pt-30 space-y-5">
          <InputField label="Full Name *" name="full_name" value={formData.full_name} onChange={handleChange} />
          <div className="relative pb-4">
            <label className="absolute -top-3 left-6 bg-white px-2 text-gray-500 text-md font-fredoka font-medium">Email Address *</label>
            <div className="w-full px-6 py-3 border-2 border-gray-300 rounded-full bg-gray-50 text-gray-600 cursor-not-allowed">{user?.email}</div>
          </div>
          <InputField label="Birthdate *" type="date" name="birthdate" value={formData.birthdate} onChange={handleChange} />
          <div className="relative pb-4">
            <label className="absolute -top-3 left-6 bg-white px-2 text-gray-500 text-md font-fredoka font-medium">Age *</label>
            <div className="w-full px-6 py-3 border-2 border-gray-300 rounded-full bg-gray-50 text-gray-600">{formData.age || "Select birthdate to calculate"}</div>
          </div>
          <SelectField label="Gender *" name="gender" value={formData.gender} onChange={handleChange} options={["male","female","other","prefer-not-to-say"]} />
          <SelectField label="Strand *" name="strand" value={formData.strand} onChange={handleChange} options={["TVL","STEM","ABM","HUMSS","GAS","ICT","GA"]} />

          {/* Address */}
          <InputField label="Address *" name="address" value={formData.address} onChange={handleChange} placeholder="Enter your address" />

          {/* Latitude / Longitude side by side with button */}
          <div className="flex items-center space-x-2">
            <InputField label="Latitude *" name="latitude" value={formData.latitude} onChange={handleChange} placeholder="Latitude" />
            <InputField label="Longitude *" name="longitude" value={formData.longitude} onChange={handleChange} placeholder="Longitude" />
            <button onClick={setLocation} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded">Set Location</button>
          </div>
          {locationStatus && <p className="text-sm text-gray-600">{locationStatus}</p>}

          <div className="pt-4 flex justify-center">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-[200px] mb-20 bg-yellow-400 hover:bg-yellow-500 text-black text-[20px] font-fredoka font-semibold py-3.5 rounded-full transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          </div>

          {success && <div className="bg-green-50 border-2 border-green-400 rounded-lg p-4 text-center text-green-700 font-semibold">{success}</div>}
          {error && <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4 text-center text-red-700 font-semibold">{error}</div>}
        </div>
      </div>
    </div>
  );
}

function InputField({ label, name, value, onChange, type="text", placeholder="" }: InputFieldProps) {
  const isRequired = label.includes('*');
  return (
    <div className="relative pb-4 flex-1">
      <label className="absolute -top-3 left-3 bg-white px-2 text-gray-500 text-md font-fredoka font-medium">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={isRequired}
        max={type==="date"?new Date().toISOString().split('T')[0]:undefined}
        placeholder={placeholder}
        className="w-full px-4 py-3 border-2 border-yellow-400 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-transparent"
      />
    </div>
  );
}

function SelectField({ label, name, value, onChange, options }: SelectFieldProps) {
  const isRequired = label.includes('*');
  return (
    <div className="relative pb-4">
      <label className="absolute -top-3 left-6 bg-white px-2 text-gray-500 text-md font-fredoka font-medium">{label}</label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        required={isRequired}
        className="w-full px-6 py-3 pr-10 border-2 border-yellow-400 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white cursor-pointer appearance-none"
      >
        <option value="">Select option</option>
        {options.map(opt => <option key={opt} value={opt}>{opt.toUpperCase()}</option>)}
      </select>
    </div>
  );
}
