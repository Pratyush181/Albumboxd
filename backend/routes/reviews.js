const express = require('express');
const router = express.Router();
const Album = require('../models/Album.js');
const Rating = require('../models/Rating.js')
const Review = require('../models/Review.js')

//post /api/reviews
router.post('/', async (req, res) => {
    const { userId, albumId, rating, review } = req.body;

    if (!userId || !albumId) {
        return res.status(400).json({ error: 'Missing required fields: userId and albumId are required' });
    }

    const hasReview = typeof review !== 'undefined' && review !== null && review.trim() !== '';
    const hasRating = typeof rating !== 'undefined' && rating !== null;

    if (!hasReview && !hasRating) {
        return res.status(400).json({ error: 'Please provide either a rating or review text' });
    }

    if (hasRating) {
        const ratingNum = Number(rating);
        if (isNaN(ratingNum) || ratingNum < 0 || ratingNum > 100) {
            return res.status(400).json({ error: 'Rating must be an integer between 0 and 100' });
        }
    }

    try {
        let reviewRating = rating;
        if (hasRating) {
            await Rating.findOneAndUpdate(
                { userId, albumId },
                { rating: Number(rating) },
                { upsert: true, new: true }
            );

            const allRatings = await Rating.find({ albumId });
            const ratingsCount = allRatings.length;
            const averageRating = allRatings.reduce((sum, r) => sum + r.rating, 0) / (ratingsCount || 1);

            await Album.findOneAndUpdate(
                { spotifyId: albumId },
                { averageRating, ratingsCount }
            );
        } else {
            // Try to fetch the user's existing rating for this album
            const existingRating = await Rating.findOne({ userId, albumId });
            reviewRating = existingRating ? existingRating.rating : null;
        }

        const userReview = await Review.findOneAndUpdate(
            { userId, albumId },
            { review: hasReview ? review : '', rating: reviewRating },
            { upsert: true, new: true }
        );

        const allReviews = await Review.find({ albumId });
        const reviewsCount = allReviews.length;

        await Album.findOneAndUpdate(
            { spotifyId: albumId },
            { reviewsCount }
        );

        res.json(userReview);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/reviews/:reviewId/toggle-like
router.post('/:reviewId/toggle-like', async (req, res) => {
    const { userId } = req.body;
    if (!userId) {
        return res.status(400).json({ error: 'Missing userId' });
    }

    try {
        const review = await Review.findById(req.params.reviewId);
        if (!review) {
            return res.status(404).json({ error: 'Review not found' });
        }

        if (!review.likes) {
            review.likes = [];
        }

        const likeIndex = review.likes.indexOf(userId);
        let liked = false;
        if (likeIndex > -1) {
            review.likes.splice(likeIndex, 1);
        } else {
            review.likes.push(userId);
            liked = true;
        }

        await review.save();
        res.json({ liked, likesCount: review.likes.length, likes: review.likes });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// GET /api/reviews/:albumId?userId=... (users reviews for an album)
router.get('/:albumId', async (req, res) => {
    const { userId } = req.query;
    if (!userId){
        return res.status(400).json({error: 'Missing userId in query'});
    }
    try {
        const review = await Review.findOne({ albumId: req.params.albumId, userId });
        res.json(review);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/reviews/album/:albumId (all reviews for an album)
router.get('/album/:albumId', async (req, res) => {
    try {
        const review = await Review.find({ albumId: req.params.albumId }).populate('userId', 'username avatarUrl');
        res.json(review);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/reviews/user/:userId
router.get('/user/:userId', async (req, res) => {
    try {
      const review = await Review.find({ userId: req.params.userId }) 
      res.json(review);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
});

// DELETE /api/reviews/:albumId?userId=...
router.delete('/:albumId', async (req, res) => {
    const { userId } = req.query;
    if (!userId) {
        return res.status(400).json({ error: 'Missing userId in query' });
    }
    try {
        const deleted = await Review.findOneAndDelete({ albumId: req.params.albumId, userId });
        if (!deleted) {
            return res.status(404).json({ error: 'Review not found' });
        }
        // Update reviewsCount on Album
        const allReviews = await Review.find({ albumId: req.params.albumId });
        const reviewsCount = allReviews.length;
        await Album.findOneAndUpdate(
            { spotifyId: req.params.albumId },
            { reviewsCount }
        );
        res.json({ message: 'Review deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;