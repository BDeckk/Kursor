"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/supabaseClient";
import { Profile } from "@/types/profile";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileData: Profile;
  userId: string;
  onSave: (updatedProfile: Profile) => void;
}

export default function EditProfileModal({
  isOpen,
  onClose,
  profileData,
  userId,
  onSave,
}: EditProfileModalProps) {
 const [editedProfile, setEditedProfile] = useState<Profile>({
  ...profileData,         
  id: userId,              
  full_name: profileData.full_name || "",
  gender: profileData.gender || "",
  age: profileData.age ?? undefined,
  strand: profileData.strand || "",
  location: profileData.location || "",
  profile_image_url: profileData.profile_image_url ?? undefined,
  birthdate: profileData.birthdate ?? undefined,
});


  const [isSaving, setIsSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(profileData.profile_image_url || null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditedProfile({
      ...profileData,
      profile_image_url: profileData.profile_image_url ?? undefined,
      birthdate: profileData.birthdate ?? undefined,
    });
    setImagePreview(profileData.profile_image_url || null);
  }, [profileData]);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
      setTimeout(() => setIsVisible(false), 300);
    }
  }, [isOpen]);

  if (!isVisible) return null;

  const handleInputChange = (field: keyof Profile, value: string | number | undefined) => {
    setEditedProfile({ ...editedProfile, [field]: value });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return alert("Image must be <5MB");
    if (!file.type.startsWith("image/")) return alert("Select an image file");

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const uploadImage = async (): Promise<string | null> => {
      if (!imageFile) return null;
      setIsUploadingImage(true);

      try {
        const bucketName = "users_profile";
        const ext = imageFile.name.split(".").pop();
        const filePath = `profiles/${userId}-${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(filePath, imageFile, { cacheControl: "3600", upsert: true });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
        return data.publicUrl || null;
      } catch (error) {
        console.error("Image upload failed:", error);
        alert("Failed to upload image.");
        return null;
      } finally {
        setIsUploadingImage(false);
      }
    };


 const handleSave = async () => {
  setIsSaving(true);
  try {
    let updatedImageUrl = editedProfile.profile_image_url;

    if (imageFile) {
      const newUrl = await uploadImage();
      if (newUrl) updatedImageUrl = newUrl;
    }

    const payload = {
      id: userId,
      email: editedProfile.email || null,
      full_name: editedProfile.full_name || null,
      profile_image_url: updatedImageUrl ?? null,
      gender:
        editedProfile.gender === "prefer not to say"
          ? "prefer-not-to-say"
          : editedProfile.gender || null,
      age: editedProfile.age ?? null,
      strand: editedProfile.strand || null,
      location: editedProfile.location || null,
      birthdate: editedProfile.birthdate
        ? new Date(editedProfile.birthdate).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from("users").upsert(payload, {
      onConflict: "id",
    });

    if (error) throw error;

    // Call onSave for any local updates
    onSave({ ...editedProfile, profile_image_url: updatedImageUrl });

    // Close modal
    onClose();

    // Refresh the page
    window.location.reload();
  } catch (err) {
    console.error("Failed to save profile:", err);
    alert("Failed to save profile. Check RLS, DB constraints, or bucket permissions.");
  } finally {
    setIsSaving(false);
  }
};



  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center px-4 transition-opacity duration-300 ${
        isAnimating ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className="absolute inset-0 bg-black/50"
        style={{ backdropFilter: "blur(8px)" }}
        onClick={onClose}
      ></div>

      <div
        className={`relative bg-white rounded-3xl border-[6px] border-yellow-400 max-w-2xl w-full max-h-[85vh] shadow-2xl flex flex-col transition-all duration-300 ${
          isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-10 pb-6 border-b border-gray-100">
          <h2 className="text-4xl font-bold font-outfit text-gray-900">Edit Profile</h2>
          <button
            onClick={onClose}
            className="p-2.5 hover:bg-yellow-100 rounded-full transition-colors duration-200"
            aria-label="Close modal"
          >
            <svg className="w-7 h-7 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-10 py-6 flex-1 scrollbar-thin scrollbar-thumb-yellow-400 scrollbar-track-gray-100">
          {/* Profile Picture */}
          <div className="flex flex-col items-center pb-8 border-b border-gray-100">
            <div className="relative group">
              <div className="w-50 h-50 rounded-full overflow-hidden border-4 border-yellow-400 bg-gray-200">
                {imagePreview ? (
                  <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-yellow-100">
                    <svg className="w-25 h-25 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center cursor-pointer"
                type="button"
              >
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
            </div>
            <p className="text-sm text-gray-600 mt-3 font-fredoka">Click on the image to change your profile picture</p>
            <p className="text-xs text-gray-400 mt-1 font-fredoka">Max file size: 5MB</p>
          </div>

          {/* Form Fields */}
          <div className="space-y-6 mt-6">
            {/* Full Name */}
            <div>
              <label className="block text-base font-bold font-outfit text-gray-800">Full Name</label>
              <input
                type="text"
                value={editedProfile.full_name || ""}
                onChange={(e) => handleInputChange("full_name", e.target.value)}
                className="w-full px-5 py-3.5 rounded-2xl border-2 border-yellow-400 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 focus:outline-none font-fredoka text-gray-900 transition-all duration-200"
                placeholder="Enter your full name"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-base font-bold font-outfit text-gray-800">Gender</label>
              <select
                value={editedProfile.gender || ""}
                onChange={(e) => handleInputChange("gender", e.target.value)}
                className="w-full px-5 py-3.5 pr-12 rounded-2xl border-2 border-yellow-400 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 focus:outline-none font-fredoka text-gray-900 capitalize transition-all duration-200 cursor-pointer appearance-none"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
            </div>

            {/* Age */}
            <div>
              <label className="block text-base font-bold font-outfit text-gray-800">Age</label>
              <input
                type="number"
                value={editedProfile.age || ""}
                onChange={(e) => handleInputChange("age", parseInt(e.target.value))}
                className="w-full px-5 py-3.5 rounded-2xl border-2 border-yellow-400 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 focus:outline-none font-fredoka text-gray-900 transition-all duration-200"
                placeholder="Enter your age"
                min={1}
                max={150}
              />
            </div>

           {/* Strand */}
              <div>
                <label className="block text-base font-bold font-outfit text-gray-800">Strand</label>
                <select
                  value={editedProfile.strand || ""}
                  onChange={(e) => handleInputChange("strand", e.target.value)}
                  className="w-full px-5 py-3.5 pr-12 rounded-2xl border-2 border-yellow-400 
                    focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 focus:outline-none
                    font-fredoka text-gray-900 capitalize transition-all duration-200 cursor-pointer appearance-none"
                >
                  <option value="">Select strand</option>
                  <option value="TVL-HE">TVL-HE</option>
                  <option value="TVL-ICT">TVL-ICT</option>
                  <option value="STEM">STEM</option>
                  <option value="ABM">ABM</option>
                  <option value="HUMSS">HUMSS</option>
                  <option value="GAS">GAS</option>
                  <option value="ICT">ICT</option>
                  <option value="Arts & Design">Arts & Design</option>
                </select>
              </div>


            {/* Location */}
            <div>
              <label className="block text-base font-bold font-outfit text-gray-800">Address</label>
              <input
                type="text"
                value={editedProfile.location || ""}
                onChange={(e) => handleInputChange("location", e.target.value)}
                className="w-full px-5 py-3.5 rounded-2xl border-2 border-yellow-400 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 focus:outline-none font-fredoka text-gray-900 transition-all duration-200"
                placeholder="Enter your address"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-4 p-10 pt-6 border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-4 rounded-2xl border-2 border-yellow-400 text-gray-900 font-bold font-outfit hover:bg-yellow-50 transition-all duration-200 text-lg"
            disabled={isSaving || isUploadingImage}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-6 py-4 rounded-2xl bg-yellow-400 text-gray-900 font-bold font-outfit hover:bg-yellow-500 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-lg"
            disabled={isSaving || isUploadingImage}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
