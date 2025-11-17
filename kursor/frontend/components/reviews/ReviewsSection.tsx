// File: components/reviews/ReviewSection.tsx
"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import { UserAuth } from "@/Context/AuthContext";
import ProfileAvatar from "../ProfileAvatar";


interface Reply {
  id: string;
  user_id?: string | null;
  username: string;
  text: string;
  created_at?: string;
  parent_reply_id: string | null;
  likes: number;
  liked: boolean;
}

interface Review {
  id: string;
  user_id?: string | null;
  username: string;
  rating: number | null;
  text: string | null;
  created_at?: string;
  likes: number;
  liked: boolean;
  replies: Reply[];
}

interface Props {
  schoolId: string;
  averageRating?: string | null;
}

export default function ReviewSection({ schoolId, averageRating }: Props) {
  const { session, getProfile } = UserAuth();
  const user = session?.user;

  const [profile, setProfile] = useState<any>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userOwnReview, setUserOwnReview] = useState<Review | null>(null);

  const [userRating, setUserRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [userReviewText, setUserReviewText] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const [replyingTo, setReplyingTo] = useState<{ id: string; type: "review" | "reply" } | null>(null);
  const [replyText, setReplyText] = useState<string>("");
  const [fetching, setFetching] = useState<boolean>(false);

  const [showDeleteDropdown, setShowDeleteDropdown] = useState(false);


  // Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const p = await getProfile(user.id);
        setProfile(p);
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };
    fetchProfile();
  }, [user, getProfile]);

  // Fetch reviews and user's review
  useEffect(() => {
    if (!schoolId) return;

    const fetchAll = async () => {
      setFetching(true);
      try {
        const { data: reviewsData, error } = await supabase
          .from("reviews")
          .select("id, user_id, username, rating, text, created_at")
          .eq("school_id", schoolId)
          .order("created_at", { ascending: false });

        if (error) throw error;

        const enriched = (await Promise.all(
            (reviewsData || []).map(async (rev: any) => {
                try {// ensure safe numeric rating
            const safeRating = rev.rating == null ? null : Number(rev.rating);

            const { count: likeCount } = await supabase
              .from("review_likes")
              .select("*", { head: true, count: "exact" })
              .eq("review_id", rev.id);

            const { data: userLike } = await supabase
              .from("review_likes")
              .select("*")
              .eq("review_id", rev.id)
              .eq("user_id", user?.id)
              .maybeSingle();

            const { data: replies } = await supabase
              .from("review_replies")
              .select("id, user_id, username, text, created_at, parent_reply_id")
              .eq("review_id", rev.id)
              .order("created_at", { ascending: true });

            const enrichedReplies: Reply[] = (await Promise.all(
                (replies || []).map(async (rep: any) => {
                    try {
                const { count: replyLikeCount } = await supabase
                  .from("reply_likes")
                  .select("*", { head: true, count: "exact" })
                  .eq("reply_id", rep.id);

                const { data: userReplyLike } = await supabase
                  .from("reply_likes")
                  .select("*")
                  .eq("reply_id", rep.id)
                  .eq("user_id", user?.id)
                  .maybeSingle();

                return {
                        ...rep,
                        likes: replyLikeCount || 0,
                        liked: !!userReplyLike,
                    } as Reply;
                    } catch (err) {
                    console.error("Error enriching reply:", err);
                    return null;
                    }
                })
                )).filter((r): r is Reply => r !== null);

            return {
                ...rev,
                rating: safeRating,
                likes: likeCount || 0,
                liked: !!userLike,
                replies: enrichedReplies,
            } as Review;
            } catch (err) {
            console.error("Error enriching review:", err);
            return null;
            }
        })
        )).filter((r): r is Review => r !== null);

        setReviews(enriched);

        if (user) {
          const { data: myRev } = await supabase
            .from("reviews")
            .select("id, user_id, username, rating, text, created_at")
            .eq("school_id", schoolId)
            .eq("user_id", user.id)
            .maybeSingle();

          if (myRev) {
            const found = enriched.find((r) => r.id === myRev.id) || {
              ...myRev,
              likes: 0,
              liked: false,
              replies: [],
            };
            setUserOwnReview(found as Review);
          } else {
            setUserOwnReview(null);
          }
        } else {
          setUserOwnReview(null);
        }
      } catch (err) {
        console.error("Failed to fetch reviews:", err);
      } finally {
        setFetching(false);
      }
    };

    fetchAll();
  }, [schoolId, user]);

  // Utility to refresh single review list (after update/delete)
 const refreshReviews = async () => {
  if (!schoolId) return;
  setFetching(true);
  try {
    const { data: reviewsData } = await supabase
      .from("reviews")
      .select("id, user_id, username, rating, text, created_at")
      .eq("school_id", schoolId)
      .order("created_at", { ascending: false });

    const enriched = (await Promise.all(
      (reviewsData || []).map(async (rev: any) => {
        try {
          const safeRating = rev.rating == null ? null : Number(rev.rating);
          const { count: likeCount } = await supabase
            .from("review_likes")
            .select("*", { head: true, count: "exact" })
            .eq("review_id", rev.id);

          const { data: replies } = await supabase
            .from("review_replies")
            .select("id, user_id, username, text, created_at, parent_reply_id")
            .eq("review_id", rev.id)
            .order("created_at", { ascending: true });

          const enrichedReplies: Reply[] = (await Promise.all(
            (replies || []).map(async (rep: any) => {
              try {
                const { count: replyLikeCount } = await supabase
                  .from("reply_likes")
                  .select("*", { head: true, count: "exact" })
                  .eq("reply_id", rep.id);

                const { data: userReplyLike } = await supabase
                  .from("reply_likes")
                  .select("*")
                  .eq("reply_id", rep.id)
                  .eq("user_id", user?.id)
                  .maybeSingle();

                return {
                  ...rep,
                  likes: replyLikeCount || 0,
                  liked: !!userReplyLike,
                } as Reply;
              } catch (err) {
                console.error("Error enriching reply in refresh:", err);
                return null;
              }
            })
          )).filter((r): r is Reply => r !== null);

          return {
            ...rev,
            rating: safeRating,
            likes: likeCount || 0,
            liked: false,
            replies: enrichedReplies,
          } as Review;
        } catch (err) {
          console.error("Error enriching review in refresh:", err);
          return null;
        }
      })
    )).filter((r): r is Review => r !== null);

    setReviews(enriched);

    if (user) {
      const { data: myRev } = await supabase
        .from("reviews")
        .select("id, user_id, username, rating, text, created_at")
        .eq("school_id", schoolId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (myRev) {
        const found = enriched.find((r) => r.id === myRev.id) || {
          ...myRev,
          rating: myRev.rating == null ? null : Number(myRev.rating),
          likes: 0,
          liked: false,
          replies: [],
        };
        setUserOwnReview(found as Review);
      } else {
        setUserOwnReview(null);
      }
    } else {
      setUserOwnReview(null);
    }
  } catch (err) {
    console.error("refreshReviews error:", err);
  } finally {
    setFetching(false);
  }
};

  // Like review
  const handleLikeReview = async (reviewId: string) => {
    if (!user) return alert("Please log in to like reviews.");
    const target = reviews.find((r) => r.id === reviewId) || (userOwnReview?.id === reviewId ? userOwnReview : null);
    if (!target) return;

    const newLiked = !target.liked;

    try {
      if (newLiked) {
        await supabase.from("review_likes").insert([{ review_id: reviewId, user_id: user.id }]);
      } else {
        await supabase.from("review_likes").delete().match({ review_id: reviewId, user_id: user.id });
      }

      // Update local state
      setReviews((prev) => prev.map((r) => (r.id === reviewId ? { ...r, liked: newLiked, likes: r.likes + (newLiked ? 1 : -1) } : r)));
      if (userOwnReview?.id === reviewId) setUserOwnReview({ ...userOwnReview, liked: newLiked, likes: userOwnReview.likes + (newLiked ? 1 : -1) });
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  // Like reply
  const handleLikeReply = async (replyId: string) => {
    if (!user) return alert("Please log in to like replies.");

    const allReplies = reviews.flatMap((r) => r.replies);
    const targetReply = allReplies.find((rep) => rep.id === replyId);
    if (!targetReply) return;

    const parentReview = reviews.find((r) => r.replies.some((rep) => rep.id === replyId));
    if (!parentReview) return;

    const newLiked = !targetReply.liked;

    try {
      if (newLiked) {
        await supabase.from("reply_likes").insert([{ reply_id: replyId, user_id: user.id }]);
      } else {
        await supabase.from("reply_likes").delete().match({ reply_id: replyId, user_id: user.id });
      }

      setReviews((prev) => prev.map((r) => ({ ...r, replies: r.replies.map((rep) => (rep.id === replyId ? { ...rep, liked: newLiked, likes: rep.likes + (newLiked ? 1 : -1) } : rep)) } )));
    } catch (err) {
      console.error("Error toggling reply like:", err);
    }
  };

  // Send reply
  const handleSendReply = async (targetId: string, type: "review" | "reply") => {
    if (!replyText.trim()) return;
    if (!user) return alert("Please log in to reply.");

    const fullName = profile?.full_name || user.email || "Anonymous";

    let reviewIdForPayload = "";
    if (type === "review") reviewIdForPayload = targetId;
    else {
      const parentReview = reviews.find((r) => r.replies.some((rep) => rep.id === targetId));
      reviewIdForPayload = parentReview ? parentReview.id : "";
    }

    const payload = {
      review_id: reviewIdForPayload,
      user_id: user.id,
      username: fullName,
      text: replyText.trim(),
      parent_reply_id: type === "reply" ? targetId : null,
    };

    try {
      const { data, error } = await supabase.from("review_replies").insert([payload]).select();
      if (error) throw error;
      const created = data![0];

      const newReply: Reply = {
        id: created.id,
        user_id: user.id,
        username: fullName,
        text: payload.text,
        created_at: created.created_at,
        parent_reply_id: payload.parent_reply_id,
        likes: 0,
        liked: false,
      };

      setReviews((prev) => prev.map((r) => (r.id === reviewIdForPayload ? { ...r, replies: [...r.replies, newReply] } : r)));
      if (userOwnReview?.id === reviewIdForPayload) setUserOwnReview({ ...userOwnReview, replies: [...userOwnReview.replies, newReply] });
    } catch (err) {
      console.error("Reply insert error:", err);
    } finally {
      setReplyText("");
      setReplyingTo(null);
    }
  };

  // Submit new review
  const handleSubmitReview = async () => {
    if (!user) return alert("Please log in to post a review.");
    if (userRating === 0) return alert("Please provide a rating (1-5).");

    const fullName = profile?.full_name || user.email || "Anonymous";

    try {
      const { data, error } = await supabase
        .from("reviews")
        .insert([
          { school_id: schoolId, user_id: user.id, username: fullName, rating: userRating, text: userReviewText || null },
        ])
        .select();
      if (error) throw error;

      const created = data![0];
      const newReview: Review = { id: created.id, user_id: user.id, username: fullName, rating: created.rating, text: created.text, created_at: created.created_at, likes: 0, liked: false, replies: [] };

      setReviews((prev) => [newReview, ...prev]);
      setUserOwnReview(newReview);
      setUserReviewText("");
      setUserRating(0);
      setIsEditing(false);
    } catch (err) {
      console.error("Review insert error:", err);
      alert("Failed to submit review.");
    }
  };

  // Start editing user's review: directly open form and prefill
  const handleStartEdit = () => {
    if (!userOwnReview) return;
    setUserRating(userOwnReview.rating ?? 0);
    setUserReviewText(userOwnReview.text ?? "");
    setIsEditing(true);
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setIsEditing(false);
    setUserRating(0);
    setUserReviewText("");
  };

const handleSubmitOrUpdateReview = async () => {
  if (!user) return alert("Please log in to submit or update a review.");
  if (userRating === 0) return alert("Please provide a rating (1-5).");

  const fullName = profile?.full_name || user.email || "Anonymous";

  try {
    if (userOwnReview) {
      // --- Update existing review ---
      console.log("Updating review with ID:", userOwnReview.id);

      const { data: updated, error } = await supabase
        .from("reviews")
        .update({ rating: userRating, text: userReviewText || null })
        .eq("id", userOwnReview.id)
        .select()
        .maybeSingle(); // prevents 406 if nothing returned

      if (error) throw error;
      if (!updated) {
        alert("Update failed: review not found. Please submit your review first.");
        return;
      }

      // Update local state safely
      setReviews((prev) =>
        prev.map((r) =>
          r.id === userOwnReview.id
            ? { ...r, rating: updated.rating ?? r.rating, text: updated.text ?? r.text }
            : r
        )
      );

      setUserOwnReview((prev) =>
        prev ? { ...prev, rating: updated.rating ?? prev.rating, text: updated.text ?? prev.text } : prev
      );

      console.log("Review updated successfully:", updated);
    } else {
      // --- Submit new review ---
      const { data: created, error } = await supabase
        .from("reviews")
        .insert([
          {
            school_id: schoolId,
            user_id: user.id,
            username: fullName,
            rating: userRating,
            text: userReviewText || null,
          },
        ])
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!created) throw new Error("Failed to create review.");

      const newReview: Review = {
        id: created.id,
        user_id: user.id,
        username: fullName,
        rating: created.rating,
        text: created.text,
        created_at: created.created_at,
        likes: 0,
        liked: false,
        replies: [],
      };

      setReviews((prev) => [newReview, ...prev]);
      setUserOwnReview(newReview);

      console.log("Review submitted successfully:", created);
    }

    // Reset UI
    setUserRating(0);
    setUserReviewText("");
    setIsEditing(false);
  } catch (err) {
    console.error("Review submit/update error:", err);
    alert("Failed to submit or update review. Please try again.");
  }
};


  // Delete review
  const handleDeleteReview = async () => {
  if (!user || !userOwnReview) return;

  try {
    const { error } = await supabase.from("reviews").delete().eq("id", userOwnReview.id);
    if (error) throw error;

    setReviews((prev) => prev.filter((r) => r.id !== userOwnReview.id));
    setUserOwnReview(null);
    setIsEditing(false);
    setUserRating(0);
    setUserReviewText("");
  } catch (err) {
    console.error("Failed to delete review:", err);
    alert("Failed to delete review.");
  }
};

  return (
    <div className="w-full py-16 px-8 md:px-20">
      <h2 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-2 font-outfit">
        Student Reviews:
        {averageRating ? (
          <span className="flex items-center gap-1 text-yellow-400 text-3xl font-semibold">
            {averageRating} <img src="/star-filled.png" className="w-9 h-9" />
          </span>
        ) : (
          <span className="text-gray-500 text-2xl">No reviews yet</span>
        )}
      </h2>

      {/* User's own review card shown at top if exists */}
      {userOwnReview && (
        <div className="mb-8">
          <div className="bg-[#FFF9E3] rounded-2xl p-6 border border-yellow-200 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <ProfileAvatar userId={userOwnReview.user_id} username={userOwnReview.username} size={48} />
                <div>
                  <p className="font-semibold text-gray-900">
                    {userOwnReview.username} <span className="text-xs text-gray-500 ml-2">Your review</span>
                  </p>
                  <div className="flex gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <img key={s} src={s <= (userOwnReview.rating ?? 0) ? "/star-filled.png" : "/star-outline.png"} className="w-5 h-5" alt="star" />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={handleStartEdit} className="px-3 py-1 bg-yellow-400 rounded-full font-semibold hover:bg-yellow-500">Edit</button>
               <button
                    onClick={() => setShowDeleteDropdown(!showDeleteDropdown)}
                    className="px-3 py-1 border border-gray-300 rounded-full hover:bg-gray-50"
                    >
                    Delete
                    </button>

                    {showDeleteDropdown && (
                    <div className="absolute mt-5  transform -translate-x-1/2 bg-yellow-100 border border-yellow-300 rounded-xl shadow-md p-3 z-50 w-[180px] flex flex-col items-center gap-2">
                        <p className="text-gray-700 mb-2 text-center font-medium">Are you sure?</p>
                        <div className="flex gap-2">
                        <button
                            onClick={() => setShowDeleteDropdown(false)}
                            className="px-4 py-1 rounded-full bg-gray-200 hover:bg-gray-300"
                        >
                            No
                        </button>
                        <button
                            onClick={async () => {
                            if (!user || !userOwnReview) return;
                            try {
                                const { error } = await supabase.from("reviews").delete().eq("id", userOwnReview.id);
                                if (error) throw error;

                                setReviews((prev) => prev.filter((r) => r.id !== userOwnReview.id));
                                setUserOwnReview(null);
                                setIsEditing(false);
                                setUserRating(0);
                                setUserReviewText("");
                                setShowDeleteDropdown(false);
                            } catch (err) {
                                console.error("Failed to delete review:", err);
                                alert("Failed to delete review.");
                            }
                            }}
                            className="px-4 py-1 rounded-full bg-red-500 text-white hover:bg-red-600"
                        >
                            Yes
                        </button>
                        </div>
                    </div>
                    )}
              </div>
            </div>

            {/* If editing, show the editing UI directly under the review */}
            {isEditing && (
              <div className="mt-4">
                <div className="flex items-center gap-3 mb-3">
                  <p className="font-outfit text-[25px] font-semibold">Edit your rating</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <img
                        key={star}
                        src={star <= (hoverRating || userRating) ? "/star-filled.png" : "/star-outline.png"}
                        className="w-8 h-8 cursor-pointer hover:scale-110 transition-transform"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setUserRating(star)}
                        alt="star"
                      />
                    ))}
                  </div>
                </div>

                <textarea
                  className="w-full p-4 rounded-xl bg-[#FDEDAA] text-gray-700 resize-none focus:ring-2 focus:ring-yellow-400"
                  rows={3}
                  placeholder="Share your thoughts (optional)..."
                  value={userReviewText}
                  onChange={(e) => setUserReviewText(e.target.value)}
                />

                <div className="flex justify-end mt-4 gap-2">
                  <button onClick={handleSubmitOrUpdateReview} className="bg-[#FFDE59] hover:bg-yellow-350 text-black font-semibold px-6 py-2 rounded-full transition-all">Save Changes</button>
                  <button onClick={handleCancelEdit} className="px-6 py-2 border border-gray-300 rounded-full hover:bg-gray-100">Cancel</button>
                </div>
              </div>
            )}

            {!isEditing && (
              <p className="mt-4 text-gray-700">{userOwnReview.text || <span className="text-gray-400 italic">No comment provided.</span>}</p>
            )}

            {/* replies under user's review (if any) */}
            {userOwnReview.replies.length > 0 && (
              <div className="mt-4 ml-6 border-l-2 border-yellow-300 pl-4 space-y-3">
                {userOwnReview.replies.map((reply) => (
                  <div key={reply.id} className="bg-[#FFF7D8] rounded-2xl p-3 border border-yellow-100">
                    <div className="flex items-center gap-2 mb-1">
                      <ProfileAvatar userId={reply.user_id} username={reply.username} size={30} />
                      <p className="font-semibold text-sm">{reply.username}</p>
                    </div>

                    <p className="text-sm text-gray-600">{reply.text}</p>

                    <div className="flex items-center gap-6 mt-2">
                      <button onClick={() => handleLikeReply(reply.id)} className="flex items-center gap-1 hover:opacity-80 transition">
                        {reply.liked ? (
                          <svg className="w-4 h-4 fill-yellow-500 transition-transform hover:scale-110" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                        ) : (
                          <svg className="w-4 h-4 stroke-gray-600 fill-none transition-transform hover:scale-110" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                        )}
                        <span className="text-xs text-gray-600">{reply.likes}</span>
                      </button>

                      <button onClick={() => setReplyingTo({ id: reply.id, type: "reply" })} className="text-sm text-gray-600 hover:opacity-80">Reply</button>
                    </div>

                    {replyingTo?.type === "reply" && replyingTo.id === reply.id && (
                      <div className="mt-3">
                        <textarea className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-700 resize-none focus:ring-2 focus:ring-yellow-400" placeholder="Write a reply..." value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={2} />
                        <div className="mt-2 flex justify-end gap-2">
                          <button onClick={() => handleSendReply(reply.id, "reply")} className="px-4 py-1 bg-yellow-400 rounded-full font-semibold hover:bg-yellow-500">Send</button>
                          <button onClick={() => setReplyingTo(null)} className="px-4 py-1 border border-gray-300 rounded-full hover:bg-gray-100">Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Review form: shown when user has NO review or when not logged in (allows posting) */}
      {!userOwnReview && (
        <div className="border-7 border-[#FFD31F] rounded-4xl p-12 mb-10">
          <div className="flex items-center gap-3 mb-6">
            <p className="font-outfit text-[25px] font-semibold">Your Rating:</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <img key={star} src={star <= (hoverRating || userRating) ? "/star-filled.png" : "/star-outline.png"} className="w-8 h-8 cursor-pointer hover:scale-110 transition-transform" onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)} onClick={() => setUserRating(star)} alt="star" />
              ))}
            </div>
          </div>

          <textarea className="w-full p-4 rounded-xl bg-[#FDEDAA] text-gray-700 resize-none focus:ring-2 focus:ring-yellow-400" rows={3} placeholder="Share your thoughts (optional)..." value={userReviewText} onChange={(e) => setUserReviewText(e.target.value)} />

          <div className="flex justify-end mt-4">
            <button onClick={handleSubmitReview} className="bg-[#FFDE59] hover:bg-yellow-350 text-black font-semibold px-6 py-2 rounded-full transition-all">Submit Review</button>
          </div>
        </div>
      )}

        {/* Other reviews list (exclude user's own review) */}
        {fetching ? (
        <p className="text-center text-gray-500">Loading reviews...</p>
        ) : (
        <div className="space-y-8">
            {reviews
            .filter((r) => r && r.id && r.rating != null) // ensure review is valid
            .filter((r) => r.id !== userOwnReview?.id)
            .map((review) => {
                if (!review) return null;

                return (
                <div key={review.id} id={`review-${review.id}`} className="bg-[#FDEDAA] rounded-3xl p-6 shadow-sm border border-yellow-100">
                    <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <ProfileAvatar userId={review.user_id} username={review.username} size={35} />
                        <p className="font-semibold text-[17px] text-gray-900">{review.username ?? "Anonymous"}</p>

                        <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                            <img
                            key={s}
                            src={s <= (review.rating ?? 0) ? "/star-filled.png" : "/star-outline.png"}
                            className="w-5 h-5"
                            alt="rating star"
                            />
                        ))}
                        </div>
                    </div>
                    </div>

            <p className="text-gray-700">
              {review.text ?? <span className="text-gray-400 italic">No comment provided.</span>}
            </p>

            <div className="flex items-center gap-6 mt-3">
              <button
                onClick={() => handleLikeReview(review.id)}
                className="flex items-center gap-2 hover:opacity-80 transition"
              >
                {review.liked ? (
                  <svg className="w-5 h-5 fill-yellow-500 transition-transform hover:scale-110" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                ) : (
                  <svg className="w-5 h-5 stroke-gray-700 fill-none transition-transform hover:scale-110" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                )}
                <span className="text-gray-700 text-sm">{review.likes ?? 0}</span>
              </button>

              <button
                onClick={() => setReplyingTo({ id: review.id, type: "review" })}
                className="flex items-center gap-2 hover:opacity-80 transition"
              >
                <span className="text-gray-700 text-sm">Reply</span>
              </button>
            </div>

            {/* Replies */}
            {review.replies?.length > 0 && (
              <div className="mt-4 ml-6 border-l-2 border-yellow-300 pl-4 space-y-3">
                {review.replies
                  .filter((reply) => reply && reply.id)
                  .map((reply) => (
                    <div key={reply.id} className="bg-[#FFF7D8] rounded-2xl p-3 border border-yellow-100">
                      <div className="flex items-center gap-2 mb-1">
                        <ProfileAvatar userId={reply.user_id} username={reply.username} size={30} />
                        <p className="font-semibold text-sm">{reply.username ?? "Anonymous"}</p>
                      </div>

                      <p className="text-sm text-gray-600">{reply.text ?? ""}</p>

                      <div className="flex items-center gap-6 mt-2">
                        <button
                          onClick={() => handleLikeReply(reply.id)}
                          className="flex items-center gap-1 hover:opacity-80 transition"
                        >
                          {reply.liked ? (
                            <svg className="w-4 h-4 fill-yellow-500 transition-transform hover:scale-110" viewBox="0 0 24 24">
                              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 stroke-gray-600 fill-none transition-transform hover:scale-110" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                            </svg>
                          )}
                          <span className="text-xs text-gray-600">{reply.likes ?? 0}</span>
                        </button>

                        <button onClick={() => setReplyingTo({ id: reply.id, type: "reply" })} className="text-sm text-gray-600 hover:opacity-80">
                          Reply
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        );
      })}
  </div>
  
)}
    </div>
    
  );
}
