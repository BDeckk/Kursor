"use client";
import Navbar from "@/components/homepage-navbar";
import { UserAuth } from "@/Context/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import { Settings } from "lucide-react";
import { LikedSchoolsCarousel } from "@/components/ui/liked-schools-carousel";
import EditProfileModal from "@/components/profile/EditProfileModal";

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

interface RiasecResult {
  id: string;
  riasec_code: string;
  r: number;
  i: number;
  a: number;
  s: number;
  e: number;
  c: number;
}

interface Recommendation {
  id?: number;
  title: string;
  school?: string | null;
  reason: string;
  rank: number;
}

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

export default function ProfilePage() {
  const [profileData, setProfileData] = useState<Profile | null>(null);
  const [riasecResult, setRiasecResult] = useState<RiasecResult | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [likedSchools, setLikedSchools] = useState<LikedSchool[]>([]);
  const [schoolDetails, setSchoolDetails] = useState<SchoolDetails[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { session, getProfile } = UserAuth();
  const user = session?.user;

  // Trigger entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Load profile
  useEffect(() => {
    if (!user?.id) return;
    const loadUserProfile = async () => {
      const data = await getProfile(user.id);
      if (data) {
        setProfileData(data);
      }
    };
    loadUserProfile();
  }, [user, getProfile]);

  // Load latest RIASEC result
  useEffect(() => {
    if (!user?.id) return;
    const fetchRiasecResult = async () => {
      const { data, error } = await supabase
        .from("riasec_results")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      
      if (error) {
        console.error("Error fetching RIASEC result:", error);
      }
      
      setRiasecResult(data || null);
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
    if (!user?.id) return;
    const fetchLikedSchools = async () => {
      const { data } = await supabase
        .from("school_likes")
        .select("*")
        .eq("user_id", user.id);
      setLikedSchools(data || []);
    };
    fetchLikedSchools();
  }, [user]);

  // Load school details
  useEffect(() => {
    if (likedSchools.length === 0) return;
    const fetchSchoolDetails = async () => {
      const schoolIds = likedSchools.map((s) => s.school_id);
      const { data, error } = await supabase
        .from("schools")
        .select("*")
        .in("id", schoolIds);
      if (error) console.error("Error loading school details:", error);
      else setSchoolDetails(data || []);
    };
    fetchSchoolDetails();
  }, [likedSchools]);

  // Handle opening modal
  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  // Handle closing modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Handle save - update local state with new profile data
  const handleSave = (updatedProfile: Profile) => {
    setProfileData(updatedProfile);
  };

  return (
    <div className="min-h-screen pb-12">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-6 pt-24">
        
        {/* Profile Header - Yellow rounded rectangle */}
        <div 
          className={`bg-yellow-400 rounded-3xl px-8 py-6 flex items-center justify-between mb-15 shadow-sm transition-all duration-700 ease-out ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
          }`}
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
                  <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {profileData?.full_name || 'Guest User'}
            </h1>
          </div>
          <button onClick={handleOpenModal} className="p-2 hover:bg-yellow-500 rounded-full transition">
            <svg className="w-7 h-7 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        {/* Personal Information Card */}
        <div 
          className={`bg-white rounded-3xl border-7 border-yellow-400 p-8 pl-25 mb-15 shadow-sm relative transition-all duration-700 ease-out ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
          style={{ transitionDelay: "100ms" }}
        >
          <h2 className="absolute -top-6 left-8 font-outfit bg-white px-4 text-[25px] font-semibold text-gray-900">
            Personal Information
          </h2>
          
          <div className="space-y-4 text-lg">
            <div className="flex">
              <span className="font-bold font-outfit text-gray-900 w-48">Name:</span>
              <span className="text-gray-900 font-fredoka">{profileData?.full_name || '—'}</span>
            </div>
            <div className="flex">
              <span className="font-bold font-outfit text-gray-900 w-48">Email Address:</span>
              <span className="text-gray-900 underline font-fredoka">{profileData?.email || '—'}</span>
            </div>
            <div className="flex">
              <span className="font-bold font-outfit text-gray-900 w-48">Gender:</span>
              <span className="text-gray-900 capitalize font-fredoka">{profileData?.gender || '—'}</span>
            </div>
            <div className="flex">
              <span className="font-bold font-outfit text-gray-900 w-48">Age:</span>
              <span className="text-gray-900 font-fredoka">{profileData?.age || '—'}</span>
            </div>
            <div className="flex">
              <span className="font-bold font-outfit text-gray-900 w-48">Strand:</span>
              <span className="text-gray-900 font-fredoka">{profileData?.strand|| '—'}</span>
            </div>
            <div className="flex">
              <span className="font-bold font-outfit text-gray-900 w-48">Address:</span>
              <span className="text-gray-900 font-fredoka">{profileData?.location || '—'}</span>
            </div>
          </div>
        </div>

        {/* Assessment History Card */}
        <div 
          className={`bg-white rounded-3xl border-7 border-yellow-400 p-12 mb-15 shadow-sm relative transition-all duration-700 ease-out ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
          style={{ transitionDelay: "200ms" }}
        >
          <h2 className="absolute -top-6 left-8 font-outfit bg-white px-4 text-[25px] font-semibold text-gray-900">
            Assessment History
          </h2>
          
          {!riasecResult ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <svg className="w-20 h-20 text-yellow-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-xl font-bold font-outfit text-gray-900 mb-2">
                You have not taken the assessment yet
              </h3>
              <p className="text-gray-600 font-fredoka">
                Take the career assessment to see your results and recommendations here.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <p className="text-lg font-fredoka text-gray-900">
                  Date: {new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                </p>
              </div>

              {/* Testing Results Bar Chart */}
              <div className="bg-yellow-50 rounded-2xl p-6 mb-8 space-y-3">
                {[
                  { label: 'Realistic', key: 'r', value: riasecResult.r },
                  { label: 'Investigative', key: 'i', value: riasecResult.i },
                  { label: 'Artistic', key: 'a', value: riasecResult.a },
                  { label: 'Social', key: 's', value: riasecResult.s },
                  { label: 'Enterprising', key: 'e', value: riasecResult.e },
                  { label: 'Conventional', key: 'c', value: riasecResult.c }
                ].map((item) => (
                  <div key={item.key} className="flex items-center gap-4">
                    <span className="font-bold font-outfit text-gray-900 w-32 text-sm">
                      {item.label}
                    </span>
                    <div className="flex-1 bg-white rounded-lg h-8 overflow-hidden border border-yellow-200">
                      <div 
                        className="bg-yellow-400 h-full transition-all duration-500"
                        style={{ width: `${(item.value / 40) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Career Prospects */}
              <div className="mb-4">
                <h3 className="text-xl font-bold font-outfit text-gray-900 mb-6">
                  Possible Career Prospects for {profileData?.full_name?.split(' ')[0] || 'You'}:
                </h3>
                
                <div className="grid grid-cols-2 gap-6">
                  {/* Engineering & Technology Card */}
                  <div className="bg-yellow-100 rounded-2xl p-6 flex flex-col items-center text-center">
                    <div className="w-32 h-32 bg-yellow-200 rounded-2xl mb-4 flex items-center justify-center">
                      <svg className="w-20 h-20 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                    </div>
                    <h4 className="font-bold font-outfit text-gray-900 text-lg">
                      Engineering &<br />Technology
                    </h4>
                  </div>

                  {/* Business & Management Card */}
                  <div className="bg-yellow-100 rounded-2xl p-6 flex flex-col items-center text-center">
                    <div className="w-32 h-32 bg-yellow-200 rounded-2xl mb-4 flex items-center justify-center">
                      <svg className="w-20 h-20 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h4 className="font-bold font-outfit text-gray-900 text-lg">
                      Business &<br />Management
                    </h4>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Liked Schools Section with Carousel */}
        <div 
          className={`bg-white rounded-3xl border-7 border-yellow-400 p-8 mb-15 shadow-sm relative transition-all duration-700 ease-out ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
          style={{ transitionDelay: "300ms" }}
        >
          <h2 className="absolute -top-6 left-8 font-outfit bg-white px-4 text-[25px] font-semibold text-gray-900">
            Liked Schools
          </h2>
          
          <div className="pt-4">
            {schoolDetails.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <svg className="w-20 h-20 text-yellow-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <h3 className="text-xl font-bold font-outfit text-gray-900 mb-2">
                  You have no liked schools yet
                </h3>
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

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        profileData={profileData}
        userId={user?.id || ''}
        onSave={handleSave}
      />
    </div>
  );
}