"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/supabaseClient";

interface Profile {
  id: string;
  full_name?: string;
  profile_image_url: string;
  email?: string;
  strand?: string;
  location?: string;
  gender?: string;
  age?: number;
  birthdate?: number;
}

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileData: Profile | null;
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
  const [editedProfile, setEditedProfile] = useState<Profile | null>(profileData);
  const [isSaving, setIsSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update editedProfile when profileData changes
  useEffect(() => {
    if (profileData) {
      setEditedProfile(profileData);
      setImagePreview(profileData.profile_image_url || null);
    }
  }, [profileData]);

  // Handle animations
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

  // Handle input changes
  const handleInputChange = (field: keyof Profile, value: string | number) => {
    if (editedProfile) {
      setEditedProfile({
        ...editedProfile,
        [field]: value,
      });
    }
  };

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        alert("Please select an image file");
        return;
      }

      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload image to Supabase Storage
  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || !userId) return null;

    setIsUploadingImage(true);
    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `profile-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, imageFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image. Please try again.");
      return null;
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Handle save
  const handleSave = async () => {
    if (!editedProfile || !userId) return;

    setIsSaving(true);
    try {
      let updatedImageUrl = editedProfile.profile_image_url;

      // Upload new image if selected
      if (imageFile) {
        const newImageUrl = await uploadImage();
        if (newImageUrl) {
          updatedImageUrl = newImageUrl;
        }
      }

      // Update profile in database
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: editedProfile.full_name,
          gender: editedProfile.gender,
          age: editedProfile.age,
          strand: editedProfile.strand,
          location: editedProfile.location,
          profile_image_url: updatedImageUrl,
        })
        .eq("id", userId);

      if (error) throw error;

      // Update local state with new data
      const updatedProfile = {
        ...editedProfile,
        profile_image_url: updatedImageUrl,
      };

      onSave(updatedProfile);
      onClose();
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center px-4 transition-opacity duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}>
      {/* Blurred backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className={`relative bg-white rounded-3xl border-[6px] border-yellow-400 max-w-2xl w-full max-h-[85vh] shadow-2xl flex flex-col transition-all duration-300 ${isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
        
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-10 pb-6 border-b border-gray-100">
          <h2 className="text-4xl font-bold font-outfit text-gray-900">
            Edit Profile
          </h2>
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-2.5 hover:bg-yellow-100 rounded-full transition-colors duration-200"
            aria-label="Close modal"
          >
            <svg
              className="w-7 h-7 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto px-10 py-6 flex-1 scrollbar-thin scrollbar-thumb-yellow-400 scrollbar-track-gray-100">
          
          {/* Profile Picture Section */}
          <div className="flex flex-col items-center pb-8 border-b border-gray-100">
            <div className="relative group">
              <div className="w-50 h-50 rounded-full overflow-hidden border-4 border-yellow-400 bg-gray-200">
                {imagePreview || editedProfile?.profile_image_url ? (
                  <img 
                    src={imagePreview || editedProfile?.profile_image_url} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-yellow-100">
                    <svg className="w-25 h-25 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>
              
              {/* Overlay on hover */}
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
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>
            
            <p className="text-sm text-gray-600 mt-3 font-fredoka">
              Click on the image to change your profile picture
            </p>
            <p className="text-xs text-gray-400 mt-1 font-fredoka">
              Max file size: 5MB
            </p>
          </div>

          {/* Form */}
          <div className="space-y-6">
            {/* Full Name */}
            <div className="space-y-2">
              <label className="block text-base font-bold font-outfit text-gray-800">
                Full Name
              </label>
              <input
                type="text"
                value={editedProfile?.full_name || ""}
                onChange={(e) => handleInputChange("full_name", e.target.value)}
                className="w-full px-5 py-3.5 rounded-2xl border-2 border-yellow-400 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 focus:outline-none font-fredoka text-gray-900 transition-all duration-200"
                placeholder="Enter your full name"
              />
            </div>

            {/* Gender */}
            <div className="space-y-2">
                <label className="block text-base font-bold font-outfit text-gray-800">
                    Gender
                </label>
                <select
                    value={editedProfile?.gender || ""}
                    onChange={(e) => handleInputChange("gender", e.target.value)}
                    className="w-full px-5 py-3.5 pr-12 rounded-2xl border-2 border-yellow-400 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 focus:outline-none font-fredoka text-gray-900 capitalize transition-all duration-200 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22currentColor%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3e%3cpolyline points=%226 9 12 15 18 9%22%3e%3c/polyline%3e%3c/svg%3e')] bg-[length:1.5em] bg-[right_1rem_center] bg-no-repeat"
                >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer not to say">Prefer not to say</option>
                </select>
            </div>

            {/* Age */}
            <div className="space-y-2">
              <label className="block text-base font-bold font-outfit text-gray-800">
                Age
              </label>
              <input
                type="number"
                value={editedProfile?.age || ""}
                onChange={(e) =>
                  handleInputChange("age", parseInt(e.target.value))
                }
                className="w-full px-5 py-3.5 rounded-2xl border-2 border-yellow-400 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 focus:outline-none font-fredoka text-gray-900 transition-all duration-200"
                placeholder="Enter your age"
                min="1"
                max="120"
              />
            </div>

            {/* Strand */}
            <div className="space-y-2">
              <label className="block text-base font-bold font-outfit text-gray-800">
                Strand
              </label>
              <input
                type="text"
                value={editedProfile?.strand || ""}
                onChange={(e) => handleInputChange("strand", e.target.value)}
                className="w-full px-5 py-3.5 rounded-2xl border-2 border-yellow-400 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 focus:outline-none font-fredoka text-gray-900 transition-all duration-200"
                placeholder="Enter your strand (e.g., STEM, ABM, HUMSS)"
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label className="block text-base font-bold font-outfit text-gray-800">
                Address
              </label>
              <input
                type="text"
                value={editedProfile?.location || ""}
                onChange={(e) => handleInputChange("location", e.target.value)}
                className="w-full px-5 py-3.5 rounded-2xl border-2 border-yellow-400 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 focus:outline-none font-fredoka text-gray-900 transition-all duration-200"
                placeholder="Enter your address"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons - Fixed at bottom */}
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
            {isSaving ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}