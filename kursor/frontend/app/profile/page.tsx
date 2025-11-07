"use client";
import Navbar from "@/components/homepage-navbar";
import { UserAuth } from "@/Context/AuthContext";
import { useEffect, useState } from "react";
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

  const { session, getProfile } = UserAuth();
  const user = session?.user;

  // LOAD USER PROFILE
  useEffect(() => {
    if (!user?.id) return;

    const loadUserProfile = async () => {
      const data = await getProfile(user.id);
      if (data) setProfileData(data);
    };

    loadUserProfile();
  }, [user, getProfile]);

  // LOAD LATEST RIASEC RESULT
  useEffect(() => {
    if (!user?.id) return;

    const fetchRiasecResult = async () => {
      const { data } = await supabase
        .from("riasec_results")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      setRiasecResult(data || null);
    };

    fetchRiasecResult();
  }, [user]);

  // LOAD RIASEC RECOMMENDATIONS
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

  // LOAD LIKED SCHOOLS
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

  // LOAD SCHOOL DETAILS for each liked school
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

  return (
    <div className="min-h-screen bg-white-100">
      <Navbar />

      <div className="pt-50">

        {/*PROFILE */}
        <h2>{user?.id}</h2>
        <h2>{profileData?.email}</h2>
        <h2>{profileData?.full_name}</h2>
        <h2>{profileData?.profile_image_url}</h2>
        <h2>{profileData?.strand}</h2>
        <h2>{profileData?.location}</h2>
        <h2>{profileData?.gender}</h2>
        <h2>{profileData?.age}</h2>
        <h2>{profileData?.birthdate}</h2>

        <br />

        {/*RIASEC RESULTS */}
        <h2>RIASEC Code: {riasecResult?.riasec_code}</h2>
        <h2>R: {riasecResult?.r}</h2>
        <h2>I: {riasecResult?.i}</h2>
        <h2>A: {riasecResult?.a}</h2>
        <h2>S: {riasecResult?.s}</h2>
        <h2>E: {riasecResult?.e}</h2>
        <h2>C: {riasecResult?.c}</h2>

        <br />

        {/*RECOMMENDATIONS */}
        {recommendations.map((rec, index) => (
          <div key={index}>
            <h2>Rank {rec.rank}</h2>
            <h2>Title: {rec.title}</h2>
            <h2>School: {rec.school}</h2>
            <h2>Reason: {rec.reason}</h2>
            <br />
          </div>
        ))}

        <br />

        {/* ✅ LIKED SCHOOLS WITH DETAILS */}
        <h2>Liked Schools (with details):</h2>

        {schoolDetails.length === 0 ? (
          <h2>No liked schools yet.</h2>
        ) : (
          schoolDetails.map((school) => (
            <div key={school.id}>
              <h2>School Name: {school.name}</h2>
              <h2>Location: {school.location}</h2>
              <h2>Description: {school.description}</h2>
              <h2>ID: {school.id}</h2>
              <br />
            </div>
          ))
        )}

      </div>
    </div>
  );
}
