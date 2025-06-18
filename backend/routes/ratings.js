const express = require('express');
const router = express.Router();


router.post('/ratings', async (req, res) => {
    try {
        
        const { userId, albumId, rating, review } = req.body;

        // check if rating is valid
        const validRatings = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
        if (!validRatings.includes(rating)) {
            return res.status(400).json({ 
                message: 'Invalid rating value. Must be one of: 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, or 5.' 
            });
        }

        // Check if user already rated this album
        const existingRating = await Rating.findOne({ userId, albumId });

        if (existingRating) {
        // Update existing rating
        existingRating.rating = rating;
        existingRating.review = review || '';
        await existingRating.save();
        
        res.json({ 
            message: 'Rating updated successfully', 
            rating: existingRating 
        });
        } else {
        // Create new rating
        const newRating = new Rating({
            userId,
            albumId,
            rating,
            review: review || ''
        });
        await newRating.save();
        
        res.status(201).json({ 
            message: 'Rating created successfully', 
            rating: newRating 
        });
        }

    } catch (error) {
        console.error('Error in creating ratings:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
})


module.exports = router;