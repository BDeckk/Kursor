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
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
  readOnly?: boolean;
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
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState<FormData>({
    full_name: "",
    email: user?.email || "",
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
    if (!user?.id) return;
    if (typeof window !== "undefined" && window.location.pathname.includes("reset-password")) return;

    const checkUserExistence = async () => {
      try {
        const exist = await isUserExist(user.id);
        if (exist.success) router.replace("/dashboard");
        else setIsLoading(false);
      } catch (err) {
        console.error("Error checking user existence:", err);
        setIsLoading(false);
      }
    };

    checkUserExistence();
  }, [user, router]);

  useEffect(() => {
    if (user?.email) {
      setFormData(prev => ({ ...prev, email: user.email }));
    }
  }, [user]);

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
    try {
      if (name === "birthdate") {
        setFormData((prev) => ({ ...prev, [name]: value, age: calculateAge(value) }));
      } else {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
      setSuccess("");
      setError("");
    } catch (err) {
      console.error(`Error handling change for field ${name}:`, err);
    }
  };

  // Geocode address using multiple services with fallback
  const geocodeAddress = async (address: string): Promise<{ latitude: number; longitude: number } | null> => {
    try {
      // Add "Philippines" if not already included for better accuracy
      const fullAddress = address.toLowerCase().includes('philippines') 
        ? address 
        : `${address}, Philippines`;
      
      const encodedAddress = encodeURIComponent(fullAddress);
      
      // Try Nominatim first
      try {
        const nominatimResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&countrycodes=ph`,
          {
            headers: {
              'User-Agent': 'KursorApp/1.0'
            }
          }
        );
        
        const nominatimData = await nominatimResponse.json();
        
        if (nominatimData && nominatimData.length > 0) {
          return {
            latitude: parseFloat(nominatimData[0].lat),
            longitude: parseFloat(nominatimData[0].lon)
          };
        }
      } catch (err) {
        console.log("Nominatim failed, trying alternative...", err);
      }

      // Fallback to Photon (another OpenStreetMap service)
      try {
        await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
        const photonResponse = await fetch(
          `https://photon.komoot.io/api/?q=${encodedAddress}&limit=1`
        );
        
        const photonData = await photonResponse.json();
        
        if (photonData.features && photonData.features.length > 0) {
          const coords = photonData.features[0].geometry.coordinates;
          return {
            latitude: coords[1],
            longitude: coords[0]
          };
        }
      } catch (err) {
        console.log("Photon failed, trying final fallback...", err);
      }

      // Final fallback to geocode.maps.co
      try {
        await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
        const mapsCoResponse = await fetch(
          `https://geocode.maps.co/search?q=${encodedAddress}&countrycode=ph`
        );
        
        const mapsCoData = await mapsCoResponse.json();
        
        if (mapsCoData && mapsCoData.length > 0) {
          return {
            latitude: parseFloat(mapsCoData[0].lat),
            longitude: parseFloat(mapsCoData[0].lon)
          };
        }
      } catch (err) {
        console.log("Maps.co failed", err);
      }

      // If all services fail, try to extract city/province and use approximate coordinates
      const cebuMatch = address.toLowerCase().match(/cebu/);
      const manilaMatch = address.toLowerCase().match(/manila|metro manila|ncr/);
      const davaoMatch = address.toLowerCase().match(/davao/);
      
      if (cebuMatch) {
        return { latitude: 10.3157, longitude: 123.8854 }; // Cebu City center
      } else if (manilaMatch) {
        return { latitude: 14.5995, longitude: 120.9842 }; // Manila center
      } else if (davaoMatch) {
        return { latitude: 7.1907, longitude: 125.4553 }; // Davao center
      }
      
      return null;
    } catch (err) {
      console.error("Error geocoding address:", err);
      return null;
    }
  };

  // Validation helper
  const validateForm = (): { valid: boolean; message?: string } => {
    try {
      const requiredFields: (keyof FormData)[] = [
        "full_name",
        "email",
        "birthdate",
        "gender",
        "strand",
        "age",
        "address",
      ];

      for (const field of requiredFields) {
        if (!formData[field]) {
          console.error(`Validation error: ${field} is required.`);
          return { valid: false, message: `${field.replace("_", " ")} is required.` };
        }
      }

      const age = parseInt(formData.age);
      if (isNaN(age) || age < 13) {
        console.error("Validation error: age must be at least 13");
        return { valid: false, message: "You must be at least 13 years old to register." };
      }

      return { valid: true };
    } catch (err) {
      console.error("Error during validation:", err);
      return { valid: false, message: "Unexpected validation error." };
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      console.error("No authenticated user found");
      setError("No authenticated user found.");
      return;
    }

    const validation = validateForm();
    if (!validation.valid) {
      setError(validation.message || "Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    setIsLoading(true);
    
    try {
      const use_result = await isUserExist(user.id);
      if (use_result.success) {
        console.error("User already exists");
        setError("You already have a profile. Redirecting...");
        setTimeout(() => router.replace("/dashboard"), 1500);
        return;
      }

      // Geocode the address to get coordinates
      const coordinates = await geocodeAddress(formData.address);
      
      if (!coordinates) {
        setError("Could not locate the address. Please include City/Municipality and Province (e.g., 'Lahug, Cebu City, Cebu')");
        setIsSubmitting(false);
        setIsLoading(false);
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
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        profile_image_url: null,
      };

      const result = await insertUser(userData);
      if (result.success) {
        console.log("User profile created successfully!");
        setSuccess("User profile created successfully!");
        router.push("/dashboard");
      } else {
        console.error("InsertUser failed:", result);
        setError("Error creating profile. Please try again.");
      }
    } catch (err) {
      console.error("Error inserting user:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="loader mb-4"></div>
          <p className="text-gray-700 font-medium text-lg">Loading...</p>
        </div>
        <style jsx>{`
          .loader {
            border: 6px solid #f3f3f3;
            border-top: 6px solid #FFDE59;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
            margin: 0 auto;
          }
          @keyframes spin {
            0% { transform: rotate(0deg);}
            100% { transform: rotate(360deg);}
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left illustration */}
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
            <div className="w-full px-6 py-3 border-2 border-gray-300 rounded-full text-gray-600 cursor-not-allowed">{user?.email}</div>
          </div>
          <InputField label="Birthdate *" type="date" name="birthdate" value={formData.birthdate} onChange={handleChange} />
          <div className="relative pb-4">
            <label className="absolute -top-3 left-6 bg-white px-2 text-gray-500 text-md font-fredoka font-medium">Age *</label>
            <div className="w-full px-6 py-3 border-2 border-gray-300 rounded-full text-gray-600">{formData.age || "Select birthdate to calculate"}</div>
          </div>
          <SelectField label="Gender *" name="gender" value={formData.gender} onChange={handleChange} options={["male","female","other","prefer-not-to-say"]} />
          <SelectField label="Strand *" name="strand" value={formData.strand} onChange={handleChange} options={["TVL-HE","TVL-ICT","STEM","ABM","HUMSS","GAS","ICT","Arts & Design"]} />
          <InputField 
            label="Address *" 
            name="address" 
            value={formData.address} 
            onChange={handleChange} 
            placeholder="e.g., Barangay Lahug, Cebu City, Cebu" 
          />

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

// InputField component
function InputField({ label, name, value, onChange, type="text", placeholder="", readOnly=false }: InputFieldProps) {
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
        readOnly={readOnly}
        max={type==="date"?new Date().toISOString().split('T')[0]:undefined}
        placeholder={placeholder}
        className="w-full px-4 py-3 border-2 border-yellow-400 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-transparent"
      />
    </div>
  );
}

// SelectField component
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