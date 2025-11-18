"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/supabaseClient";
import { UserAuth } from "@/Context/AuthContext";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { session } = UserAuth();
  const user = session?.user;

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

  const handleSaveChanges = async () => {
    // Reset messages
    setError("");
    setSuccess("");

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill in all password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }

    if (newPassword === currentPassword) {
      setError("New password must be different from current password");
      return;
    }

    setIsLoading(true);

    try {
      // First, verify the current password by attempting to sign in
      if (!user?.email) {
        throw new Error("No user email found");
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        throw new Error("Current password is incorrect");
      }

      // If current password is correct, update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      setSuccess("Password changed successfully!");
      
      // Clear form after 2 seconds
      setTimeout(() => {
        handleCancelChanges();
        setSuccess("");
      }, 2000);

    } catch (err: any) {
      console.error("Password change error:", err);
      setError(err.message || "Failed to change password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelChanges = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setSuccess("");
  };

  const handleDeleteAccount = async () => {
  const confirmed = window.confirm(
    "Are you sure you want to delete your account? This action cannot be undone."
  );

  if (!confirmed) return;

  const doubleConfirm = window.confirm(
    "This will permanently delete all your data. Are you absolutely sure?"
  );

  if (!doubleConfirm) return;

  setIsLoading(true);

  try {
    if (!user?.id) {
      throw new Error("No user found");
    }

    // Just delete from users table - everything else cascades
    const { error: deleteError } = await supabase
      .from("users")
      .delete()
      .eq("id", user.id);

    if (deleteError) throw deleteError;

    // Sign out
    await supabase.auth.signOut();

    alert("Your account has been deleted successfully.");
    onClose();
    window.location.href = "/";

  } catch (err: any) {
    console.error("Delete account error:", err);
    alert(`Failed to delete account: ${err.message}`);
  } finally {
    setIsLoading(false);
  }
};
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      onClose();
      window.location.href = "/";
    } catch (err: any) {
      console.error("Logout error:", err);
      alert("Failed to log out");
    }
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

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-2xl">
                <p className="text-red-600 font-outfit">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-2xl">
                <p className="text-green-600 font-outfit">{success}</p>
              </div>
            )}

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
                  disabled={isLoading}
                  className="flex-1 px-6 py-3 rounded-full border-2 border-gray-200 focus:border-[#FFDE59] outline-none transition-colors font-outfit bg-gray-50 disabled:opacity-50"
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
                  disabled={isLoading}
                  className="flex-1 px-6 py-3 rounded-full border-2 border-gray-200 focus:border-[#FFDE59] outline-none transition-colors font-outfit bg-gray-50 disabled:opacity-50"
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
                  disabled={isLoading}
                  className="flex-1 px-6 py-3 rounded-full border-2 border-gray-200 focus:border-[#FFDE59] outline-none transition-colors font-outfit bg-gray-50 disabled:opacity-50"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4 mt-8">
                <button
                  onClick={handleCancelChanges}
                  disabled={isLoading}
                  className="px-8 py-3 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-outfit font-semibold transition-colors disabled:opacity-50"
                >
                  Cancel Changes
                </button>
                <button
                  onClick={handleSaveChanges}
                  disabled={isLoading}
                  className="px-8 py-3 rounded-full bg-[#FFDE59] hover:bg-yellow-400 text-gray-900 font-outfit font-semibold transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Saving..." : "Save Changes"}
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
                className="px-8 py-4 rounded-full bg-red-500 hover:bg-red-600 text-white font-outfit font-bold text-lg transition-all shadow-md hover:shadow-lg"
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