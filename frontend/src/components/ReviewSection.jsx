import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../UserContext';
import defaultProfile from '../assets/defaultprofilepicture.jpg';

const ReviewSection = ({ albumId, userRating, onReviewSubmitted }) => {
  const { user } = useUser();
  const userId = user?._id;
  const navigate = useNavigate();

  const [reviews, setReviews] = useState([]);
  const [myReview, setMyReview] = useState('');
  const [hasExistingReview, setHasExistingReview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Fetch all reviews
  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/reviews/album/${albumId}`);
        const data = await res.json();
        // Sort reviews by newest first
        setReviews((data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [albumId]);

  // Fetch my review (if logged in)
  useEffect(() => {
    if (!userId) return;
    const fetchMyReview = async () => {
      try {
        const res = await fetch(`/api/reviews/${albumId}?userId=${userId}`);
        const data = await res.json();
        if (data) {
          setMyReview(data.review || '');
          setHasExistingReview(true);
        } else {
          setHasExistingReview(false);
        }
      } catch (error) {
        console.error('Error fetching my review:', error);
      }
    };
    fetchMyReview();
  }, [albumId, userId]);

  // Submit review
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!myReview.trim()) {
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          albumId,
          review: myReview,
          rating: userRating // Automatically sync and lock with parent's userRating score
        })
      });
      if (response.ok) {
        setHasExistingReview(true);
        if (onReviewSubmitted) onReviewSubmitted();
      }
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setSubmitting(false);
    }

    // Refresh reviews
    try {
      const res = await fetch(`/api/reviews/album/${albumId}`);
      const data = await res.json();
      setReviews((data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (error) {
      console.error('Error refreshing reviews:', error);
    }
  };

  // Delete review
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete your review?')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/reviews/${albumId}?userId=${userId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setMyReview('');
        setHasExistingReview(false);
        if (onReviewSubmitted) onReviewSubmitted();
      }
    } catch (error) {
      console.error('Error deleting review:', error);
    } finally {
      setDeleting(false);
    }

    // Refresh reviews
    try {
      const res = await fetch(`/api/reviews/album/${albumId}`);
      const data = await res.json();
      setReviews((data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (error) {
      console.error('Error refreshing reviews:', error);
    }
  };

  // Like / Unlike review
  const handleLike = async (reviewId) => {
    if (!userId) {
      alert('You must be logged in to like reviews!');
      return;
    }
    try {
      const response = await fetch(`/api/reviews/${reviewId}/toggle-like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (response.ok) {
        const data = await response.json();
        setReviews(prevReviews => 
          prevReviews.map(r => {
            if (r._id === reviewId) {
              return { ...r, likes: data.likes };
            }
            return r;
          })
        );
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  return (
    <div className="mt-12 max-w-2xl mx-auto px-4 sm:px-6">
      <h2 className="text-2xl font-black text-white tracking-tight mb-6 border-b border-white/5 pb-2 text-left">
        Reviews
      </h2>
      
      {user && (
        <form onSubmit={handleSubmit} className="bg-zinc-900/60 backdrop-blur-md p-5 sm:p-6 rounded-3xl border border-white/10 shadow-2xl mb-8 text-left">
          <textarea
            className="w-full bg-zinc-950/60 border border-white/10 text-white rounded-2xl p-4 text-sm focus:outline-none focus:border-[#1db954] transition mb-4 resize-none placeholder-zinc-500 shadow-inner"
            rows={3}
            placeholder="Write your review here..."
            value={myReview}
            onChange={e => setMyReview(e.target.value)}
          />
          
          <div className="flex gap-3 items-center justify-end">
            {hasExistingReview && (
              <button
                type="button"
                className="btn btn-sm btn-ghost hover:bg-[#ab0a3520] text-[#ff4c7d] hover:text-[#ff336a] rounded-full px-5 text-xs font-bold transition duration-200"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Removing...' : 'Delete Review'}
              </button>
            )}
            <button
              type="submit"
              className="btn btn-sm bg-[#1db954] text-black hover:bg-[#1db954bb] disabled:bg-zinc-800 disabled:text-zinc-600 rounded-full px-6 text-xs font-black tracking-wide shadow-lg hover:scale-102 active:scale-98 transition duration-200"
              disabled={submitting || !myReview.trim()}
            >
              {submitting ? 'Submitting...' : 'Post Review'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <span className="loading loading-spinner text-[#1db954] loading-md"></span>
        </div>
      ) : (
        <div className="space-y-4 text-left">
          {reviews.length === 0 && (
            <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-8 text-center text-zinc-500 font-semibold text-sm">
              No reviews yet. Be the first to share your thoughts!
            </div>
          )}
          {reviews.map((r) => {
            const hasReviewText = r.review && r.review.trim() !== '';
            const rRating = r.rating;
            const hasReviewRating = typeof rRating === 'number' && rRating !== null;
            const isLikedByMe = r.likes && userId && r.likes.includes(userId);
            
            return (
              <div
                key={r._id}
                className={`p-5 rounded-2xl border flex gap-4 items-start transition-all duration-200 ${
                  r.userId && r.userId._id === userId 
                    ? 'border-[#1db954]/40 bg-[#1db95405] hover:border-[#1db954]/60' 
                    : 'border-white/5 bg-zinc-900/40 hover:border-white/10'
                }`}
              >
                <img
                  src={r.userId && r.userId.avatarUrl ? r.userId.avatarUrl : defaultProfile}
                  alt="profile"
                  className="w-10 h-10 rounded-full object-cover mt-0.5 border border-white/10 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span 
                      onClick={() => r.userId && navigate(`/user/${r.userId.username}`)}
                      className="font-bold text-white text-sm tracking-wide hover:text-[#1db954] cursor-pointer hover:underline transition-colors"
                    >
                      {r.userId ? r.userId.username : 'Unknown User'}
                    </span>
                    
                    <span className={`text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full border ${
                      hasReviewRating 
                        ? 'text-[#1db954] bg-[#1db95410] border-[#1db95420]' 
                        : 'text-zinc-500 bg-white/5 border-white/5'
                    }`}>
                      SCORE: {hasReviewRating ? rRating : '—'}
                    </span>
                    
                    <span className="text-[10px] text-zinc-500 font-bold ml-auto">
                      {new Date(r.createdAt).toLocaleDateString(undefined, { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                  {hasReviewText ? (
                    <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap break-words">{r.review}</p>
                  ) : (
                    <p className="text-zinc-500 text-xs italic">Rated without writing a review</p>
                  )}
                  
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      id={`like-btn-${r._id}`}
                      onClick={() => handleLike(r._id)}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all duration-200 border ${
                        isLikedByMe
                          ? 'bg-[#ff4c7d]/10 text-[#ff4c7d] border-[#ff4c7d]/30 hover:bg-[#ff4c7d]/20'
                          : 'bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10 hover:text-zinc-200'
                      }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill={isLikedByMe ? "currentColor" : "none"}
                        stroke="currentColor"
                        strokeWidth="2"
                        className="w-3.5 h-3.5 transition-transform duration-200 active:scale-75"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                      </svg>
                      <span>{(r.likes && r.likes.length) || 0}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ReviewSection;