import React, { useState, useEffect } from 'react';
import { useUser } from '../UserContext';
import StarRating from './StarRating';
import defaultProfile from '../assets/defaultprofilepicture.jpg';

const ReviewSection = ({ albumId }) => {
  const { user } = useUser();
  const userId = user?._id;

  const [reviews, setReviews] = useState([]);
  const [myReview, setMyReview] = useState('');
  const [myRating, setMyRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Fetch all reviews
  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      const res = await fetch(`/api/reviews/album/${albumId}`);
      const data = await res.json();
      // Sort reviews by newest first
      setReviews((data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      setLoading(false);
    };
    fetchReviews();
  }, [albumId]);

  // Fetch my review (if logged in)
  useEffect(() => {
    if (!userId) return;
    const fetchMyReview = async () => {
      const res = await fetch(`/api/reviews/${albumId}?userId=${userId}`);
      const data = await res.json();
      if (data) {
        setMyReview(data.review || '');
        setMyRating(data.rating || 0);
      }
    };
    fetchMyReview();
  }, [albumId, userId]);

  // Submit review
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        albumId,
        review: myReview,
        rating: myRating
      })
    });
    setSubmitting(false);
    // Refresh reviews
    const res = await fetch(`/api/reviews/album/${albumId}`);
    const data = await res.json();
    setReviews((data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  };

  // Delete review
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete your review?')) return;
    setDeleting(true);
    await fetch(`/api/reviews/${albumId}?userId=${userId}`, {
      method: 'DELETE',
    });
    setMyReview('');
    setMyRating(0);
    // Refresh reviews
    const res = await fetch(`/api/reviews/album/${albumId}`);
    const data = await res.json();
    setReviews((data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    setDeleting(false);
  };

  return (
    <div className="mt-10 max-w-2xl mx-auto ph">
      <h2 className="text-2xl font-bold mb-4">Reviews</h2>
      {user && (
        <form onSubmit={handleSubmit} className="mb-6">
          <textarea
            className="w-full p-2 border rounded mb-2"
            rows={3}
            placeholder="Leave a review..."
            value={myReview}
            onChange={e => setMyReview(e.target.value)}
            required
          />
          <div className="flex flex-col items-center gap-2 mb-2">
            <div className="flex items-center gap-2 mb-2">
              <span>Your rating:</span>
              <StarRating
                initialRating={myRating}
                onRatingChange={setMyRating}
              />
            </div>
            <button
              type="submit"
              className="bg-[#1db954] text-white px-4 py-2 rounded hover:bg-[#169c43] transition mb-2"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
            {myReview && (
              <button
                type="button"
                className="bg-none text-[#ab0a35] px-4 py-2 rounded hover:bg-[#ab0a354b] transition"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Removing...' : 'Remove Review'}
              </button>
            )}
          </div>
        </form>
      )}
      {loading ? (
        <p>Loading reviews...</p>
      ) : (
        <div className="space-y-4">
          {reviews.length === 0 && <p>No reviews yet.</p>}
          {reviews.map((r) => (
            <div
              key={r._id}
              className={`p-4 rounded border flex gap-3 items-start ${r.userId && r.userId._id === userId ? 'border-[#1db954] bg-[#1db95410]' : 'border-zinc-700 bg-zinc-800'}`}
            >
              <img
                src={r.userId && r.userId.profilePicture ? r.userId.profilePicture : defaultProfile}
                alt="profile"
                className="w-10 h-10 rounded-full object-cover mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">{r.userId ? r.userId.username : 'Unknown User'}</span>
                  {r.rating && (
                    <StarRating initialRating={r.rating} readOnly={true} />
                  )}
                  <span className="text-xs text-zinc-400 ml-auto">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p>{r.review}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewSection;