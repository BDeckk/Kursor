"use client";
import { useState, useEffect } from "react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

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

  const handleSaveChanges = () => {
    // Add your password change logic here
    console.log("Saving password changes...");
  };

  const handleCancelChanges = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleDeleteAccount = () => {
    // Add delete account confirmation logic
    console.log("Delete account...");
  };

  const handleLogout = () => {
    // Add logout logic
    console.log("Logging out...");
    onClose();
  };

  return (
    <div className={`fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}>
      {/* Modal Container */}
      <div className={`bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[100vh] overflow-y-auto relative border-7 border-yellow-400 transition-all duration-300 ${isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-6 top-6 w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors z-10"
        >
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-10">
          {/* Security Section */}
          <div className="mb-12">
            <h1 className="text-4xl font-outfit font-bold text-gray-900 mb-8">
              Security
            </h1>

            <div className="space-y-6">
              {/* Current Password */}
              <div className="flex items-center gap-6">
                <label className="w-44 text-lg font-outfit text-gray-700">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="flex-1 px-6 py-3 rounded-full border-2 border-gray-200 focus:border-[#FFDE59] outline-none transition-colors font-outfit bg-gray-50"
                />
              </div>

              {/* New Password */}
              <div className="flex items-center gap-6">
                <label className="w-44 text-lg font-outfit text-gray-700">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="flex-1 px-6 py-3 rounded-full border-2 border-gray-200 focus:border-[#FFDE59] outline-none transition-colors font-outfit bg-gray-50"
                />
              </div>

              {/* Confirm Password */}
              <div className="flex items-center gap-6">
                <label className="w-44 text-lg font-outfit text-gray-700">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="flex-1 px-6 py-3 rounded-full border-2 border-gray-200 focus:border-[#FFDE59] outline-none transition-colors font-outfit bg-gray-50"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4 mt-8">
                <button
                  onClick={handleCancelChanges}
                  className="px-8 py-3 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-outfit font-semibold transition-colors"
                >
                  Cancel Changes
                </button>
                <button
                  onClick={handleSaveChanges}
                  className="px-8 py-3 rounded-full bg-[#FFDE59] hover:bg-yellow-400 text-gray-900 font-outfit font-semibold transition-colors shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t-2 border-gray-300 my-10"></div>

          {/* Account Settings Section */}
          <div>
            <h2 className="text-4xl font-outfit font-bold text-gray-900 mb-8">
              Account Settings
            </h2>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleDeleteAccount}
                className="px-8 py-4 rounded-full bg-[#FFDE59] hover:bg-yellow-400 text-gray-900 font-outfit font-bold text-lg transition-all shadow-md hover:shadow-lg"
              >
                DELETE ACCOUNT
              </button>
              <button
                onClick={handleLogout}
                className="px-8 py-4 rounded-full bg-[#FFDE59] hover:bg-yellow-400 text-gray-900 font-outfit font-bold text-lg transition-all shadow-md hover:shadow-lg"
              >
                LOG OUT
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}