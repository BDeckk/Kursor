"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import { UserAuth } from "@/Context/AuthContext";
import ProfileAvatar from "../ProfileAvatar";

interface Review {
  id: string;
  user_id?: string | null;
  username: string;
  rating: number;
  text: string;
  created_at?: string;
  likes: number;
  liked: boolean;
  replies: Reply[];
}

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

interface ReviewSectionProps {
  schoolId: string;
  averageRating?: string | null;
}

export default function ReviewSection({ schoolId, averageRating }: ReviewSectionProps) {
  const { session, getProfile } = UserAuth();
  const user = session?.user;
  const [profile, setProfile] = useState<any>(null);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [userReview, setUserReview] = useState("");
  const [replyingTo, setReplyingTo] = useState<{ id: string; type: "review" | "reply" } | null>(null);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!session?.user) return;
      const data = await getProfile(session.user.id);
      setProfile(data);
    };
    fetchProfile();
  }, [session, getProfile]);

  // Fetch reviews + replies
 useEffect(() => {
  if (!schoolId) return;

  const fetchData = async () => {
    if (!user) return; // we need user info to check likes
    setLoading(true);

    try {
      const { data: reviewsData, error } = await supabase
        .from("reviews")
        .select("id, user_id, username, rating, text, created_at")
        .eq("school_id", schoolId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const reviewsWithExtras = await Promise.all(
        (reviewsData || []).map(async (review: any) => {
          // Likes count
          const { count: likeCount } = await supabase
            .from("review_likes")
            .select("*", { count: "exact", head: true })
            .eq("review_id", review.id);

          // Check if current user liked this review
          const { data: userLikeData } = await supabase
            .from("review_likes")
            .select("*")
            .eq("review_id", review.id)
            .eq("user_id", user.id)
            .single();

          // Replies
          const { data: replies } = await supabase
            .from("review_replies")
            .select("id, user_id, username, text, created_at, parent_reply_id")
            .eq("review_id", review.id)
            .order("created_at", { ascending: true });

          const enrichedReplies = await Promise.all(
            (replies || []).map(async (reply: any) => {
              const { count: replyLikeCount } = await supabase
                .from("reply_likes")
                .select("*", { count: "exact", head: true })
                .eq("reply_id", reply.id);

              const { data: userReplyLike } = await supabase
                .from("reply_likes")
                .select("*")
                .eq("reply_id", reply.id)
                .eq("user_id", user.id)
                .single();

              return {
                ...reply,
                likes: replyLikeCount || 0,
                liked: !!userReplyLike,
              } as Reply;
            })
          );

          return {
            ...review,
            likes: likeCount || 0,
            liked: !!userLikeData,
            replies: enrichedReplies,
          } as Review;
        })
      );

      setReviews(reviewsWithExtras);
    } catch (err) {
      console.error("Error fetching reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [schoolId, user]);


  // Like a review
  const handleLikeReview = async (reviewId: string) => {
    if (!user) return alert("Please log in to like reviews.");
    const target = reviews.find((r) => r.id === reviewId);
    if (!target) return;

    const newLiked = !target.liked;

    try {
      if (newLiked) {
        await supabase.from("review_likes").insert([{ review_id: reviewId, user_id: user.id }]);
      } else {
        await supabase.from("review_likes").delete().match({ review_id: reviewId, user_id: user.id });
      }

      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId ? { ...r, liked: newLiked, likes: r.likes + (newLiked ? 1 : -1) } : r
        )
      );
    } catch (err) {
      console.error("Error toggling review like:", err);
    }
  };

  // Like a reply
const handleLikeReply = async (replyId: string) => {
  if (!user) return alert("Please log in to like replies.");

  // Flatten all replies to find the target
  const allReplies = reviews.flatMap((r) => r.replies);
  const targetReply = allReplies.find((rep) => rep.id === replyId);
  if (!targetReply) return;

  const newLiked = !targetReply.liked;

  // Find parent review (needed for review_id and school_id)
  const parentReview = reviews.find((r) => r.replies.some((rep) => rep.id === replyId));
  if (!parentReview) return;

  try {
    if (newLiked) {
      // Insert like
      await supabase.from("reply_likes").insert([{ reply_id: replyId, user_id: user.id }]);

      // Insert notification for the author of the reply
      // Avoid sending notification to yourself
      if (targetReply.user_id && targetReply.user_id !== user.id) {
        await supabase.from("notifications").insert([{
          recipient_user_id: targetReply.user_id,  // reply author
          sender_user_id: user.id,                 // liker
          type: "like_reply",
          metadata: {
            reply_id: replyId,
            review_id: parentReview.id,
            school_id: schoolId // pass current schoolId from props
          },
          is_read: false,
        }]);
      }
    } else {
      // Remove like
      await supabase.from("reply_likes").delete().match({ reply_id: replyId, user_id: user.id });

      // Optionally: remove notification (if you want)
      await supabase
        .from("notifications")
        .delete()
        .match({
          sender_user_id: user.id,
          recipient_user_id: targetReply.user_id,
          type: "like_reply",
          "metadata->>reply_id": replyId,
        });
    }

    // Update local state
    setReviews((prev) =>
      prev.map((r) => ({
        ...r,
        replies: r.replies.map((rep) =>
          rep.id === replyId
            ? { ...rep, liked: newLiked, likes: rep.likes + (newLiked ? 1 : -1) }
            : rep
        ),
      }))
    );
  } catch (err) {
    console.error("Error toggling reply like:", err);
  }
};


  // Send a reply
  const handleSendReply = async (targetId: string, type: "review" | "reply") => {
    if (!replyText.trim()) return;
    if (!user) return alert("Please log in to reply.");

    const fullName = profile?.full_name || user.email || "Anonymous";

    // find the review id if replying to a reply
    let reviewIdForPayload = "";
    if (type === "review") {
      reviewIdForPayload = targetId;
    } else {
      // find parent review that holds the reply
      const parentReview = reviews.find((r) => r.replies.some((rep) => rep.id === targetId));
      reviewIdForPayload = parentReview ? parentReview.id : "";
    }

    const replyPayload = {
      review_id: reviewIdForPayload,
      user_id: user.id,
      username: fullName,
      text: replyText.trim(),
      parent_reply_id: type === "reply" ? targetId : null,
    };

    try {
      const { data, error } = await supabase.from("review_replies").insert([replyPayload]).select();
      if (error) throw error;

      const newReply = {
        id: data![0].id,
        user_id: user.id,
        username: fullName,
        text: replyPayload.text,
        created_at: data![0].created_at,
        parent_reply_id: replyPayload.parent_reply_id,
        likes: 0,
        liked: false,
      };

      setReviews((prev) =>
        prev.map((r) =>
          r.id === replyPayload.review_id ? { ...r, replies: [...r.replies, newReply] } : r
        )
      );
    } catch (err) {
      console.error("Reply insert error:", err);
    } finally {
      setReplyText("");
      setReplyingTo(null);
    }
  };

  // Submit a review
  const handleSubmitReview = async () => {
    if (!user) return alert("Please log in to post a review.");
    if (!userReview.trim() || userRating === 0) return alert("Add both text and rating.");

    const fullName = profile?.full_name || user.email || "Anonymous";
    try {
      const { data, error } = await supabase
        .from("reviews")
        .insert([{ school_id: schoolId, user_id: user.id, username: fullName, rating: userRating, text: userReview }])
        .select();

      if (error) throw error;

      const newReview: Review = {
        id: data![0].id,
        user_id: user.id,
        username: fullName,
        rating: userRating,
        text: userReview,
        likes: 0,
        liked: false,
        replies: [],
        created_at: data![0].created_at,
      };

      setReviews([newReview, ...reviews]);
      setUserReview("");
      setUserRating(0);
    } catch (err) {
      console.error("Review insert error:", err);
    }
  };

  return (
    <div className="w-full py-16 px-8 md:px-20">
      {/* Average Rating */}
      <h2 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-2 font-outfit">
        Student Reviews:
        {averageRating ? (
          <span className="flex items-center gap-1 text-yellow-400 text-3xl font-semibold">
             {averageRating} <img src='/star-filled.png' className="w-9 h-9"/>
          </span>
        ) : (
          <span className="text-gray-500 text-2xl">No reviews yet</span>
        )}
      </h2>

      {/* Write Review */}
      <div className="border-7 border-[#FFD31F] rounded-4xl p-12 mb-10">
        <div className="flex items-center gap-3 mb-10">
          <p className="font-outfit text-[25px] font-semibold">Your Rating:</p>
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
          placeholder="Share your thoughts..."
          value={userReview}
          onChange={(e) => setUserReview(e.target.value)}
        />
        <div className="flex justify-end mt-4">
          <button
            onClick={handleSubmitReview}
            className="bg-[#FFDE59] hover:bg-yellow-350 text-black font-semibold px-6 py-2 rounded-full transition-all"
          >
            Submit Review
          </button>
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <p className="text-center text-gray-500">Loading reviews...</p>
      ) : (
        <div className="space-y-8">
          <div> </div>
          {reviews.map((review) => (
            <div key={review.id} id={`review-${review.id}`} className="bg-[#FDEDAA] rounded-3xl p-6 shadow-sm border border-yellow-100">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ProfileAvatar userId={review.user_id} username={review.username} size={35} />
                  <p className="font-semibold text-[17px] text-gray-900">{review.username}</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <img
                        key={s}
                        src={s <= review.rating ? "/star-filled.png" : "/star-outline.png"}
                        className="w-5 h-5"
                        alt="rating star"
                      />
                    ))}
                  </div>
                </div>

              </div>

              {/* Text */}
              <p className="text-gray-700">{review.text}</p>

              {/* Actions */}
              <div className="flex items-center gap-6 mt-3">
                <button onClick={() => handleLikeReview(review.id)} className="flex items-center gap-2 hover:opacity-80 transition">
                  {review.liked ? (
                    <svg className="w-5 h-5 fill-yellow-500 transition-transform hover:scale-110" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 stroke-gray-700 fill-none transition-transform hover:scale-110" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                  )}
                  <span className="text-gray-700 text-sm">{review.likes}</span>
                </button>

                <button onClick={() => setReplyingTo({ id: review.id, type: "review" })} className="flex items-center gap-2 hover:opacity-80 transition">
                  <span className="text-gray-700 text-sm">Reply</span>
                </button>
              </div>

              {/* Replies */}
              {review.replies.length > 0 && (
                <div className="mt-4 ml-6 border-l-2 border-yellow-300 pl-4 space-y-3">
                  {review.replies.map((reply) => (
                    <div key={reply.id} className="bg-[#FFF7D8] rounded-2xl p-3 border border-yellow-100">
                      <div className="flex items-center gap-2 mb-1">
                        <ProfileAvatar userId={reply.user_id} username={reply.username} size={30} />
                        <p className="font-semibold text-sm">{reply.username}</p>
                      </div>

                      <p className="text-sm text-gray-600">{reply.text}</p>
                      <div className="flex items-center gap-6 mt-2">
                        <button onClick={() => handleLikeReply(reply.id)} className="flex items-center gap-1 hover:opacity-80 transition">
                          {reply.liked ? (
                            <svg className="w-4 h-4 fill-yellow-500 transition-transform hover:scale-110" viewBox="0 0 24 24">
                              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 stroke-gray-600 fill-none transition-transform hover:scale-110" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                            </svg>
                          )}
                          <span className="text-xs text-gray-600">{reply.likes}</span>
                        </button>
                        <button onClick={() => setReplyingTo({ id: reply.id, type: "reply" })} className="text-sm text-gray-600 hover:opacity-80">Reply</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply input */}
              {replyingTo?.id === review.id && replyingTo.type === "review" && (
                <div className="mt-3">
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-700 resize-none focus:ring-2 focus:ring-yellow-400"
                    placeholder="Write a reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={2}
                  />
                  <div className="mt-2 flex justify-end gap-2">
                    <button onClick={() => handleSendReply(review.id, "review")} className="px-4 py-1 bg-yellow-400 rounded-full font-semibold hover:bg-yellow-500">Send</button>
                    <button onClick={() => setReplyingTo(null)} className="px-4 py-1 border border-gray-300 rounded-full hover:bg-gray-100">Cancel</button>
                  </div>
                </div>
              )}

              {/* Reply input for replying to a reply */}
              {replyingTo?.type === "reply" && (
                <div className="mt-3">
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-700 resize-none focus:ring-2 focus:ring-yellow-400"
                    placeholder="Write a reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={2}
                  />
                  <div className="mt-2 flex justify-end gap-2">
                    <button onClick={() => handleSendReply(replyingTo.id, "reply")} className="px-4 py-1 bg-yellow-400 rounded-full font-semibold hover:bg-yellow-500">Send</button>
                    <button onClick={() => setReplyingTo(null)} className="px-4 py-1 border border-gray-300 rounded-full hover:bg-gray-100">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
