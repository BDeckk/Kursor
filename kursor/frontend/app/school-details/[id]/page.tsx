"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/homepage-navbar";
import { supabase } from "@/supabaseClient";
import { useNearbySchools } from "@/hooks/userNearbySchools";
import { NearbySchoolCarousel } from "@/components/ui/nearby-school";

interface School {
  id: string;
  name: string;
  details: string;
  school_logo: string;
  school_picture: string;
  location: string;
  institutional_email: string;
  contact_number: string;
  critique_review?: number;
}

export default function SchoolDetailsPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const { nearbySchools, loading: nearbyLoading, error: locationError } = useNearbySchools();
  const [userRating, setUserRating] = useState(0);
  const [userReview, setUserReview] = useState("");
  const [expandedReview, setExpandedReview] = useState<number | null>(null);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  const [reviews, setReviews] = useState([
  {
    username: "@ajayzzz",
    rating: 4,
    text:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam...",
    likes: 19,
    comments: 6,
    liked: false,
  },
  {
    username: "@bdeckkk",
    rating: 5,
    text:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua...",
    likes: 20,
    comments: 11,
    liked: false,
  },
]);

// Handlers
const handleLike = (index: number) => {
  setReviews((prev) =>
    prev.map((r, i) =>
      i === index
        ? { ...r, liked: !r.liked, likes: r.liked ? r.likes - 1 : r.likes + 1 }
        : r
    )
  );
};

const handleReply = (index: number) => {
  setReplyingTo(index);
};

const handleSendReply = (index: number) => {
  if (replyText.trim() === "") return;
  alert(`Reply sent to ${reviews[index].username}: "${replyText}"`);
  setReplyText("");
  setReplyingTo(null);
};

const handleSubmitReview = () => {
  if (userRating === 0 || userReview.trim() === "") {
    alert("Please provide a rating and review.");
    return;
  }
  const newReview = {
    username: "@you",
    rating: userRating,
    text: userReview,
    likes: 0,
    comments: 0,
    liked: false,
  };
  setReviews([newReview, ...reviews]);
  setUserRating(0);
  setUserReview("");
};

  // Visibility animation
  useEffect(() => {
    const timeout = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timeout);
  }, []);

  // Fetch school data
  useEffect(() => {
    if (!id) return;

    async function fetchSchoolDetails() {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from("schools")
          .select("*")
          .eq("id", id)
          .single();

        if (fetchError) throw new Error(fetchError.message);
        setSchool(data);
      } catch (err) {
        console.error("Error fetching school:", err);
        setError((err as Error).message || "Failed to load school details");
      } finally {
        setLoading(false);
      }
    }

    fetchSchoolDetails();
  }, [id]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-lg">
        Loading...
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-red-600">
        Error: {error}
      </div>
    );

  if (!school)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        School not found.
      </div>
    );

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ===== Hero Banner Section ===== */}
      <div
        className={`w-full pt-[5.2%] mb-5 transition-all duration-700 ease-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8"
        }`}
      >
        {/* Back Button */}
        <div className="fixed top-24 left-3 z-10">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 bg-transparent transition-all duration-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </button>
        </div>

        {/* Top Banner with Overlay and Title */}
        <div className="relative w-full h-[350px] md:h-[450px] overflow-hidden">
          <img
            src={school.school_picture || "/placeholder-picture.png"}
            alt={`${school.name} background`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#FFDE59] via-[#FFDE59]/80 to-transparent pointer-events-none"></div>

          {/* School Name */}
          <div className="absolute inset-0 flex items-center">
            <div className="max-w-7xl mx-auto w-full px-7">
              <h1 className="text-4xl md:text-5xl font-outfit font-bold text-gray-900 leading-tight max-w-md">
                {school.name}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Yellow Stripe Below Banner ===== */}
      <div
        className={`w-full h-7 bg-[#FFDE59] transition-all duration-700 ease-out ${
          isVisible ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"
        }`}
        style={{ transitionDelay: "200ms" }}
      ></div>

      {/* ===== Main Content Grid ===== */}
      <div
        className={`grid grid-cols-1 lg:grid-cols-2 items-center gap-5 px-8 md:px-30 pt-20 transition-all duration-700 ease-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
        style={{ transitionDelay: "400ms" }}
      >
        {/* Left Side - School Logo */}
        <div className="flex justify-center">
          <div className="flex flex-col items-center">
            <img
              src={school.school_logo || "/placeholder-logo.png"}
              alt={`${school.name} logo`}
              className="w-100 h-100 object-contain mb-4"
            />
          </div>
        </div>

        {/* Right Side - School Info */}
        <div className="flex flex-col justify-start w-[80%] space-y-6">
          <div>
            <h2 className="text-3xl font-outfit font-bold mb-2 text-gray-900 leading-tight">
              {school.name}
            </h2>
            <p className="text-lg font-fredoka text-gray-600">{school.location}</p>
          </div>

          <div className="text-gray-700 text-base leading-relaxed space-y-2">
            <p><strong>Email:</strong> {school.institutional_email}</p>
            <p><strong>Contact:</strong> {school.contact_number}</p>
            <p className="flex items-center gap-2">
              <strong>Critique Review:</strong>
              <span className="text-gray-800 font-fredoka">
                {school.critique_review ?? "⭐ 4.78"}
              </span>
            </p>
          
          </div>

          <div className="pt-6 border-t border-gray-200">
            <h3 className="text-xl font-outfit font-semibold mb-3 text-gray-900">
              School Details
            </h3>
            <p className="text-gray-700 font-fredoka whitespace-pre-wrap leading-relaxed">
              {school.details || "No additional details available."}
            </p>
          </div>
        </div>
      </div>

{/* ===== Student Reviews Section (Interactive) ===== */}

<div
  className={`w-full py-16 px-8 md:px-50 transition-all duration-700 ease-out ${
    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
  }`}
  style={{ transitionDelay: "800ms" }}
>
  {/* Bottom yellow line */}
  <div className="mb-10 border-b-4 border-yellow-400 w-full rounded-full"></div>
  <h2 className="text-2xl md:text-3xl font-bold font-outfit text-gray-900 mb-6 flex items-center gap-2">
    Student Review: <span className="text-yellow-400 text-3xl">⭐</span>
    <span className="text-gray-800 font-fredoka text-2xl">4.37</span>
  </h2>

  {/* Review Form */}
  <div className="border-7 border-[#FFD31F] rounded-4xl p-8 mb-10">
    <p className="font-outfit text-[20px] font-semibold mb-2">Your Rating:</p>
    {/* Star Rating */}
    <div className="flex gap-1 mb-4">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => setUserRating(star)}
          className="text-2xl focus:outline-none"
        >
          {star <= userRating ? "⭐" : "☆"}
        </button>
      ))}
    </div>

    <textarea
      value={userReview}
      onChange={(e) => setUserReview(e.target.value)}
      placeholder="Tell us how you feel about this school..."
      className="w-full p-4 rounded-xl border border-gray-200 bg-[#fff8e1] text-gray-700 resize-none mb-4 focus:outline-none focus:ring-2 focus:ring-yellow-400"
      rows={3}
    ></textarea>
    <div className="flex justify-end mt-4">
      <button
        onClick={handleSubmitReview}
        className="bg-[#FFDE59] hover:bg-yellow-400 text-black font-semibold px-6 py-2 rounded-full transition-all duration-200"
      >
        Submit Review
      </button>
    </div>
  </div>

  {/* Student Reviews */}
  <div className="space-y-8">
    {reviews.map((review, index) => (
      <div
        key={index}
        className="bg-[#fff8e1] p-6 rounded-4xl shadow-sm border border-yellow-100"
      >
        <div className="flex items-center gap-3 mb-3">
          <p className="font-semibold font-outfit text-[18px] text-gray-900">
            {review.username}
          </p>
          <div className="text-yellow-400 text-lg">
            {"⭐".repeat(review.rating)}{" "}
            {"⭐".repeat(5 - review.rating).replace(/⭐/g, "☆")}
          </div>
        </div>

        {/* Expandable Review Text */}
        <p className="text-gray-700 font-fredoka leading-relaxed">
          {expandedReview === index
            ? review.text
            : `${review.text.slice(0, 120)}... `}
          {review.text.length > 120 && (
            <span
              onClick={() =>
                setExpandedReview(
                  expandedReview === index ? null : index
                )
              }
              className="text-yellow-500 cursor-pointer"
            >
              {expandedReview === index ? "see less" : "see more"}
            </span>
          )}
        </p>

        {/* Like & Reply Buttons */}
        <div className="flex items-center gap-6 mt-4 text-gray-700">
          <button
            onClick={() => handleLike(index)}
            className="flex items-center gap-2 hover:text-yellow-500 transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill={review.liked ? "currentColor" : "none"}
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5A4.69 4.69 0 0012 5.91a4.69 4.69 0 00-4.312-2.16C5.099 3.75 3 5.765 3 8.25c0 7.42 9 12 9 12s9-4.58 9-12z"
              />
            </svg>
            <span>{review.likes}</span>
          </button>

          <button
            onClick={() => handleReply(index)}
            className="flex items-center gap-2 hover:text-yellow-500 transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7.5 8.25h9m-9 3.75h6m7.5 0a9.75 9.75 0 11-19.5 0 9.75 9.75 0 0119.5 0z"
              />
            </svg>
            <span>{review.comments}</span>
          </button>
        </div>

        {/* Optional Reply Input */}
        {replyingTo === index && (
          <div className="mt-4">
            <textarea
              placeholder="Write a reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400"
              rows={2}
            ></textarea>
            <div className="mt-2 flex justify-end gap-2">
              <button
                onClick={() => handleSendReply(index)}
                className="px-4 py-1 bg-yellow-400 text-black rounded-full font-semibold hover:bg-yellow-500"
              >
                Send
              </button>
              <button
                onClick={() => setReplyingTo(null)}
                className="px-4 py-1 border border-gray-300 rounded-full text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    ))}
  </div>

  {/* Bottom yellow line */}
  <div className="mt-10 border-b-4 border-yellow-400 w-full rounded-full"></div>
</div>

          {/* ===== Nearby Schools Section ===== */}
          <div
          className={`w-full bg-[#FFDE59] py-10 px-15 transition-all duration-700 ease-out ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ transitionDelay: "600ms" }}
        >
          <div className="mb-8">
            <h2 className="text-3xl font-bold font-outfit text-gray-800 mb-10 pl-10">
              Explore <span className="text-white">Nearby Universities</span>
            </h2>
          </div>

          {nearbyLoading ? (
            <div className="text-center text-gray-800 font-fredoka">
              Finding nearby schools...
            </div>
          ) : locationError ? (
            <div className="text-center text-red-600 font-fredoka">{locationError}</div>
          ) : nearbySchools.length > 0 ? (
            <div className="max-w-[1300px] mx-auto"> 
              <NearbySchoolCarousel school_card={nearbySchools} />
            </div>
          ) : (
            <div className="text-center text-gray-800 font-fredoka">
              No nearby schools found.
            </div>
          )}
        </div>
    </div>
  );
}
