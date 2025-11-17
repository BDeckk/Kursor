"use client";

import Navbar from "@/components/homepage-navbar";
import { UserAuth } from "@/Context/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import { LikedSchoolsCarousel } from "@/components/ui/liked-schools-carousel";
import EditProfileModal from "@/components/profile/EditProfileModal";
import { useGlobalLoading } from "@/Context/GlobalLoadingContext";
import AssessmentHistory from "@/components/profile/AssessmentHistory";
import { Profile } from "@/types/profile";

interface LikedSchool {
  id: number;
  school_id: string;
}

interface SchoolDetails {
  id: string;
  name: string;
  location?: string;
  description?: string;
  image_url?: string;
}

interface RiasecResult {
  id: string;
  [key: string]: any;
}

export default function ProfilePage() {
  const [profileData, setProfileData] = useState<Profile | null>(null);
  const [likedSchools, setLikedSchools] = useState<LikedSchool[]>([]);
  const [schoolDetails, setSchoolDetails] = useState<SchoolDetails[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pageReady, setPageReady] = useState(false);

  const [riasecResult, setRiasecResult] = useState<RiasecResult | null>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  const { session, getProfile } = UserAuth();
  const { setIsLoading } = useGlobalLoading();
  const user = session?.user;

  const [profileLoading, setProfileLoading] = useState(true);
  const [riasecLoading, setRiasecLoading] = useState(true);
  const [schoolsLoading, setSchoolsLoading] = useState(true);

  // Entrance animation
  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  // Load profile
  useEffect(() => {
    if (!user?.id) {
      setProfileLoading(false);
      return;
    }
    const loadProfile = async () => {
      const data = await getProfile(user.id);
      if (data) {
        // Convert birthdate to ISO string if it's a number
        setProfileData({
          ...data,
          birthdate: data.birthdate
            ? typeof data.birthdate === "number"
              ? new Date(data.birthdate).toISOString()
              : data.birthdate
            : undefined,
        });
      }
      setProfileLoading(false);
    };
    loadProfile();
  }, [user, getProfile]);

  // Load latest RIASEC result
  useEffect(() => {
    if (!user?.id) {
      setRiasecLoading(false);
      return;
    }

    const fetchRiasecResult = async () => {
      const { data, error } = await supabase
        .from("riasec_results")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error fetching RIASEC result:", error);
        setRiasecResult(null);
      } else {
        setRiasecResult(data);
      }
      setRiasecLoading(false);
    };

    fetchRiasecResult();
  }, [user]);

  // Load recommendations
  useEffect(() => {
    if (!riasecResult?.id) return;

    const fetchRecommendations = async () => {
      const { data } = await supabase
        .from("riasec_recommendations")
        .select("*")
        .eq("result_id", riasecResult.id)
        .order("rank");

      setRecommendations(data || []);
    };

    fetchRecommendations();
  }, [riasecResult]);

  // Load liked schools
  useEffect(() => {
    if (!user?.id) {
      setSchoolsLoading(false);
      return;
    }

    const fetchLiked = async () => {
      const { data } = await supabase
        .from("school_likes")
        .select("*")
        .eq("user_id", user.id);

      setLikedSchools(data || []);
      setSchoolsLoading(false);
    };

    fetchLiked();
  }, [user]);

  // Load school details
  useEffect(() => {
    if (likedSchools.length === 0) {
      setSchoolDetails([]);
      return;
    }

    const loadDetails = async () => {
      const ids = likedSchools.map((l) => l.school_id);
      const { data } = await supabase
        .from("schools")
        .select("*")
        .in("id", ids);

      setSchoolDetails(data || []);
    };

    loadDetails();
  }, [likedSchools]);

  // Page ready logic
  useEffect(() => {
    const dataReady = !profileLoading && !riasecLoading && !schoolsLoading;

    if (!dataReady) {
      setIsLoading(true);
    } else {
      const timer = setTimeout(() => {
        setPageReady(true);
        setIsLoading(false);
        setTimeout(() => setIsVisible(true), 50);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [profileLoading, riasecLoading, schoolsLoading, setIsLoading]);

  if (!pageReady) return null;

  return (
    <div className="min-h-screen pb-12">
      <div className={`transition-opacity duration-500 ${isVisible ? "opacity-100" : "opacity-0"}`}>
        <Navbar />
      </div>
      
      {/* Profile Header */}
      <div className="max-w-6xl mx-auto px-6 pt-24">
          <div
            className={`bg-[#FFDE59] rounded-3xl px-8 py-6 flex items-center justify-between mb-15 shadow-sm transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
            }`}
            style={{ transitionDelay: "100ms" }}
          >
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 bg-gray-300 rounded-full overflow-hidden">
                {profileData?.profile_image_url ? (
                  <img
                    src={profileData.profile_image_url}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-yellow-100">
                    <svg
                      className="w-10 h-10 text-yellow-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{profileData?.full_name || "Guest User"}</h1>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="p-2 hover:bg-yellow-500 rounded-full transition"
            >
              <svg className="w-7 h-7 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>

      <div className="max-w-5xl mx-auto">
        {/* Personal Information */}
        <div
          className={`bg-white rounded-3xl border-7 border-[#FFDE59] p-8 pl-25 mb-15 shadow-sm relative transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
          style={{ transitionDelay: "200ms" }}
        >
          <h2 className="absolute -top-6 left-8 font-outfit bg-white px-4 text-[25px] font-semibold text-gray-900">
            Personal Information
          </h2>

          <div className="space-y-4 text-lg">
            <div className="flex">
              <span className="font-bold font-outfit text-gray-900 w-48">Name:</span>
              <span className="text-gray-900 font-fredoka">{profileData?.full_name || "—"}</span>
            </div>
            <div className="flex">
              <span className="font-bold font-outfit text-gray-900 w-48">Email Address:</span>
              <span className="text-gray-900 underline font-fredoka">{profileData?.email || "—"}</span>
            </div>
            <div className="flex">
              <span className="font-bold font-outfit text-gray-900 w-48">Gender:</span>
              <span className="text-gray-900 capitalize font-fredoka">{profileData?.gender || "—"}</span>
            </div>
            <div className="flex">
              <span className="font-bold font-outfit text-gray-900 w-48">Age:</span>
              <span className="text-gray-900 font-fredoka">{profileData?.age || "—"}</span>
            </div>
            <div className="flex">
              <span className="font-bold font-outfit text-gray-900 w-48">Strand:</span>
              <span className="text-gray-900 font-fredoka">{profileData?.strand || "—"}</span>
            </div>
            <div className="flex">
              <span className="font-bold font-outfit text-gray-900 w-48">Address:</span>
              <span className="text-gray-900 font-fredoka">{profileData?.location || "—"}</span>
            </div>
          </div>
        </div>

        {/* Assessment History - Now with separated sections */}
        <div
          className={`bg-white rounded-3xl border-7 border-[#FFDE59] px-18 pt-8 pb-10 mb-15 shadow-sm relative transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
          style={{ transitionDelay: "300ms" }}
        >
          <h2 className="absolute -top-6 left-8 font-outfit bg-white px-4 text-[25px] font-semibold text-gray-900">
            Assessment History
          </h2>

          <div>{user?.id && <AssessmentHistory userId={user.id} />}</div>
        </div>
      </div>

      {/* Liked Schools - Fixed with more padding */}
      <div
        className={`w-full px-6 transition-all duration-700 ease-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
        style={{ transitionDelay: "400ms" }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-3xl border-7 border-[#FFDE59] px-25 py-10 shadow-sm relative">
            <h2 className="absolute -top-6 left-8 font-outfit bg-white px-4 text-[25px] font-semibold text-gray-900">
              Liked Schools
            </h2>

            <div className="pt-2">
              {schoolDetails.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <svg className="w-20 h-20 text-yellow-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>

                  <h3 className="text-xl font-bold font-outfit text-gray-900 mb-2">You have no liked schools yet</h3>
                  <p className="text-gray-600 font-fredoka">
                    Browse schools and like the ones you're interested in to see them here.
                  </p>
                </div>
              ) : (
                <LikedSchoolsCarousel userId={user?.id} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {user?.id && profileData && (
        <EditProfileModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          profileData={profileData}
          userId={user.id}
          onSave={(updated) => setProfileData(updated)}
        />
      )}
    </div>
  );
}