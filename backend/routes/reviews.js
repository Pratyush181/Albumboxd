const express = require('express');
const router = express.Router();
const Album = require('../models/Album.js');
const Rating = require('../models/Rating.js')
const Review = require('../models/Review.js')

//post /api/reviews
router.post('/', async (req, res) => {
    const { userId, albumId, rating, review } = req.body;

    if (!userId || !albumId || !review) {
        return res.status(400).json({error: 'Missing required fields'})
    }
    let reviewRating = rating;
    if (typeof reviewRating === 'undefined' || reviewRating === null) {
        // Try to fetch the user's existing rating for this album
        const existingRating = await Rating.findOne({ userId, albumId });
        reviewRating = existingRating ? existingRating.rating : null;
    }
    try {
        const userReview = await Review.findOneAndUpdate(
            { userId, albumId},
            { review, rating: reviewRating },
            { upsert: true, new: true }
        );

        const allReviews = await Review.find({ albumId });
        const reviewsCount = allReviews.length;

        await Album.findOneAndUpdate(
            { spotifyId: albumId },
            { reviewsCount }
        );

        res.json(userReview);
    } catch (err) {
        res.status(500).json({ error: err.message });
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
        res.status(500).json({ error: err.message });
    }
});

// GET /api/reviews/album/:albumId (all reviews for an album)
router.get('/album/:albumId', async (req, res) => {
    try {
        const review = await Review.find({ albumId: req.params.albumId }).populate('userId', 'username');
        res.json(review);
    } catch (error) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/reviews/user/:userId
router.get('/user/:userId', async (req, res) => {
    try {
      const review = await Rating.find({ userId: req.params.userId }) 
      res.json(review);
    } catch (error) {
      res.status(500).json({ error: err.message });
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