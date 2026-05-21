const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Rating = require('../models/Rating');
const Review = require('../models/Review');
const Album = require('../models/Album');

// GET /api/profile/social/following-activity
router.get('/social/following-activity', async (req, res) => {
    const { userId } = req.query;
    if (!userId) {
        return res.status(400).json({ error: 'Missing userId in query' });
    }

    try {
        const currentUser = await User.findById(userId);
        if (!currentUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (!currentUser.following || currentUser.following.length === 0) {
            return res.json([]);
        }

        const followingIds = currentUser.following;

        // Fetch ratings and reviews by followed users
        const ratings = await Rating.find({ userId: { $in: followingIds } }).populate('userId', 'username avatarUrl');
        const reviews = await Review.find({ userId: { $in: followingIds } }).populate('userId', 'username avatarUrl');

        const activityMap = {};

        // Merge ratings
        ratings.forEach(r => {
            if (!r.userId) return;
            const key = `${r.userId._id}_${r.albumId}`;
            activityMap[key] = {
                userId: r.userId,
                albumId: r.albumId,
                rating: r.rating,
                review: '',
                likes: [],
                date: r.updatedAt || r.createdAt || new Date(),
                type: 'rating'
            };
        });

        // Merge reviews
        reviews.forEach(rev => {
            if (!rev.userId) return;
            const key = `${rev.userId._id}_${rev.albumId}`;
            const revDate = rev.updatedAt || rev.createdAt || new Date();
            if (activityMap[key]) {
                activityMap[key].review = rev.review || '';
                activityMap[key].likes = rev.likes || [];
                activityMap[key].type = 'review';
                if (revDate > activityMap[key].date) {
                    activityMap[key].date = revDate;
                }
            } else {
                activityMap[key] = {
                    userId: rev.userId,
                    albumId: rev.albumId,
                    rating: rev.rating || null,
                    review: rev.review || '',
                    likes: rev.likes || [],
                    date: revDate,
                    type: 'review'
                };
            }
        });

        const activityItems = Object.values(activityMap);
        const albumIds = activityItems.map(item => item.albumId);

        // Fetch Album details to hydrate
        const albums = await Album.find({ spotifyId: { $in: albumIds } });
        const albumMap = {};
        albums.forEach(alb => {
            albumMap[alb.spotifyId] = {
                title: alb.title,
                artist: alb.artist,
                imageUrl: alb.imageUrl || ''
            };
        });

        // Hydrate
        const hydratedActivity = activityItems.map(item => {
            const albInfo = albumMap[item.albumId] || {
                title: 'Unknown Album',
                artist: 'Unknown Artist',
                imageUrl: ''
            };
            return {
                ...item,
                title: albInfo.title,
                artist: albInfo.artist,
                imageUrl: albInfo.imageUrl
            };
        });

        // Sort by date newest first
        hydratedActivity.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json(hydratedActivity);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/profile/social/follow-status/:username
router.get('/social/follow-status/:username', async (req, res) => {
    const { userId } = req.query;
    try {
        const targetUser = await User.findOne({ username: { $regex: new RegExp(`^${req.params.username}$`, 'i') } });
        if (!targetUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        const isFollowing = userId ? (targetUser.followers && targetUser.followers.includes(userId)) : false;

        res.json({
            isFollowing,
            followersCount: targetUser.followers ? targetUser.followers.length : 0,
            followingCount: targetUser.following ? targetUser.following.length : 0
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/profile/social/follow/:username
router.post('/social/follow/:username', async (req, res) => {
    const { userId } = req.body;
    if (!userId) {
        return res.status(400).json({ error: 'Missing userId in body' });
    }

    try {
        const targetUser = await User.findOne({ username: { $regex: new RegExp(`^${req.params.username}$`, 'i') } });
        if (!targetUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (targetUser._id.toString() === userId.toString()) {
            return res.status(400).json({ error: 'You cannot follow yourself!' });
        }

        const currentUser = await User.findById(userId);
        if (!currentUser) {
            return res.status(404).json({ error: 'Current user not found' });
        }

        if (!currentUser.following) {
            currentUser.following = [];
        }
        if (!targetUser.followers) {
            targetUser.followers = [];
        }

        if (!currentUser.following.includes(targetUser._id)) {
            currentUser.following.push(targetUser._id);
            await currentUser.save();
        }

        if (!targetUser.followers.includes(currentUser._id)) {
            targetUser.followers.push(currentUser._id);
            await targetUser.save();
        }

        res.json({
            success: true,
            followingCount: currentUser.following.length,
            followersCount: targetUser.followers.length,
            isFollowing: true
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/profile/social/unfollow/:username
router.post('/social/unfollow/:username', async (req, res) => {
    const { userId } = req.body;
    if (!userId) {
        return res.status(400).json({ error: 'Missing userId in body' });
    }

    try {
        const targetUser = await User.findOne({ username: { $regex: new RegExp(`^${req.params.username}$`, 'i') } });
        if (!targetUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        const currentUser = await User.findById(userId);
        if (!currentUser) {
            return res.status(404).json({ error: 'Current user not found' });
        }

        if (currentUser.following) {
            currentUser.following = currentUser.following.filter(id => id.toString() !== targetUser._id.toString());
            await currentUser.save();
        }

        if (targetUser.followers) {
            targetUser.followers = targetUser.followers.filter(id => id.toString() !== currentUser._id.toString());
            await targetUser.save();
        }

        res.json({
            success: true,
            followingCount: currentUser.following ? currentUser.following.length : 0,
            followersCount: targetUser.followers ? targetUser.followers.length : 0,
            isFollowing: false
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/profile/:username
router.get('/:username', async (req, res) => {
    try {
        const user = await User.findOne({ username: { $regex: new RegExp(`^${req.params.username}$`, 'i') } }).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const ratingsCount = await Rating.countDocuments({ userId: user._id });
        const reviewsCount = await Review.countDocuments({ userId: user._id, review: { $ne: '' } });

        // Retrieve top 4 highest rated albums dynamically
        const topRatings = await Rating.find({ userId: user._id })
            .sort({ rating: -1, updatedAt: -1 })
            .limit(4);

        const albumIds = topRatings.map(r => r.albumId);
        const albums = await Album.find({ spotifyId: { $in: albumIds } });

        const albumMap = {};
        albums.forEach(alb => {
            albumMap[alb.spotifyId] = {
                title: alb.title,
                artist: alb.artist,
                imageUrl: alb.imageUrl || ''
            };
        });

        const favorites = topRatings.map(r => {
            const alb = albumMap[r.albumId] || {
                title: 'Unknown Album',
                artist: 'Unknown Artist',
                imageUrl: ''
            };
            return {
                spotifyId: r.albumId,
                title: alb.title,
                artist: alb.artist,
                imageUrl: alb.imageUrl
            };
        });

        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            bio: user.bio || '',
            avatarUrl: user.avatarUrl || '',
            favorites,
            ratingsCount,
            reviewsCount,
            followersCount: user.followers ? user.followers.length : 0,
            followingCount: user.following ? user.following.length : 0,
            createdAt: user.createdAt
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/profile
router.put('/', async (req, res) => {
    const { userId, bio, avatarUrl } = req.body;
    if (!userId) {
        return res.status(400).json({ error: 'Missing userId' });
    }

    try {
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { bio, avatarUrl },
            { new: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            message: 'Profile updated successfully',
            user: {
                _id: updatedUser._id,
                username: updatedUser.username,
                email: updatedUser.email,
                bio: updatedUser.bio || '',
                avatarUrl: updatedUser.avatarUrl || '',
                favorites: updatedUser.favorites || []
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/profile/favorites/add
router.post('/favorites/add', async (req, res) => {
    const { userId, album } = req.body;
    if (!userId || !album || !album.spotifyId || !album.title || !album.artist) {
        return res.status(400).json({ error: 'Missing required fields: userId, album with spotifyId, title, artist' });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Enforce maximum of 4 favorites
        if (user.favorites.length >= 4) {
            return res.status(400).json({ error: 'You can only pin up to 4 favorites. Remove one before pinning another!' });
        }

        // Check if already exists in favorites
        const exists = user.favorites.some(fav => fav.spotifyId === album.spotifyId);
        if (exists) {
            return res.status(400).json({ error: 'Album is already pinned in favorites' });
        }

        user.favorites.push({
            spotifyId: album.spotifyId,
            title: album.title,
            artist: album.artist,
            imageUrl: album.imageUrl || ''
        });

        await user.save();
        res.json({ favorites: user.favorites });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/profile/favorites/remove
router.post('/favorites/remove', async (req, res) => {
    const { userId, spotifyId } = req.body;
    if (!userId || !spotifyId) {
        return res.status(400).json({ error: 'Missing required fields: userId, spotifyId' });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.favorites = user.favorites.filter(fav => fav.spotifyId !== spotifyId);
        await user.save();

        res.json({ favorites: user.favorites });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/profile/:username/diary
router.get('/:username/diary', async (req, res) => {
    try {
        const user = await User.findOne({ username: { $regex: new RegExp(`^${req.params.username}$`, 'i') } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Fetch user's ratings and reviews
        const ratings = await Rating.find({ userId: user._id });
        const reviews = await Review.find({ userId: user._id });

        const diaryMap = {};

        // Process ratings first
        ratings.forEach(r => {
            diaryMap[r.albumId] = {
                spotifyId: r.albumId,
                rating: r.rating,
                review: '',
                date: r.updatedAt || r.createdAt || new Date(),
            };
        });

        // Overlay/merge reviews
        reviews.forEach(rev => {
            const revDate = rev.updatedAt || rev.createdAt || new Date();
            if (diaryMap[rev.albumId]) {
                diaryMap[rev.albumId].review = rev.review || '';
                // Keep the newer date
                if (revDate > diaryMap[rev.albumId].date) {
                    diaryMap[rev.albumId].date = revDate;
                }
            } else {
                diaryMap[rev.albumId] = {
                    spotifyId: rev.albumId,
                    rating: rev.rating || null,
                    review: rev.review || '',
                    date: revDate,
                };
            }
        });

        const diaryItems = Object.values(diaryMap);
        const albumIds = diaryItems.map(item => item.spotifyId);

        // Fetch Album details to hydrate
        const albums = await Album.find({ spotifyId: { $in: albumIds } });
        const albumMap = {};
        albums.forEach(alb => {
            albumMap[alb.spotifyId] = {
                title: alb.title,
                artist: alb.artist,
                imageUrl: alb.imageUrl || ''
            };
        });

        // Hydrate
        const hydratedDiary = diaryItems.map(item => {
            const albInfo = albumMap[item.spotifyId] || {
                title: 'Unknown Album',
                artist: 'Unknown Artist',
                imageUrl: ''
            };
            return {
                ...item,
                title: albInfo.title,
                artist: albInfo.artist,
                imageUrl: albInfo.imageUrl
            };
        });

        // Default sort: newest first
        hydratedDiary.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json(hydratedDiary);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
