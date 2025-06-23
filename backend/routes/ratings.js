const express = require('express');
const router = express.Router();
const Album = require('../models/Album.js');
const Rating = require('../models/Rating.js')

// post /api/ratings
router.post('/', async (req, res) => {
    const { userId, albumId, rating } = req.body;
    if (!userId || !albumId || !rating) {
        return res.status(400).json({error: 'Missing required fields'})
    }
    try {
        const userRating = await Rating.findOneAndUpdate(
            { userId, albumId },
            { rating },
            { upsert: true, new: true }
        );

        const allRatings = await Rating.find({ albumId });
        const ratingsCount = allRatings.length;
        const averageRating = allRatings.reduce((sum, r) => sum + r.rating, 0) / (ratingsCount || 1);

        await Album.findOneAndUpdate(
            { spotifyId: albumId },
            { averageRating, ratingsCount }
        );

        res.json(userRating);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/ratings/:albumId?userId=... (users rating for an album)
router.get('/:albumId', async (req, res) => {
    const { userId } = req.query;
    if (!userId){
        return res.status(400).json({error: 'Missing userId in query'});
    }
    try {
        const rating = await Rating.findOne({ albumId: req.params.albumId, userId });
        res.json(rating);
    } catch (error) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/ratings/album/:albumId (all ratings for an album)
router.get('/album/:albumId', async (req, res) => {
    try {
        const ratings = await Rating.find({ albumId: req.params.albumId }).populate('userId', 'username');
        res.json(ratings);
    } catch (error) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/ratings/user/:userId
router.get('/user/:userId', async (req, res) => {
    try {
      const ratings = await Rating.find({ userId: req.params.userId }) 
      res.json(ratings);
    } catch (error) {
      res.status(500).json({ error: err.message });
    }
});

module.exports = router;