const mongoose = require('mongoose');

const albumSchema = new mongoose.Schema({
    spotifyId: {
        type: String,
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true
    },
    artist: {
        type: String,
        required: true
    },
    releaseDate: {
        type: Date
    },
    imageUrl: {
        type: String
    },
    spotifyUrl: {
        type: String
    },
    genre: {
        type: [String],
        default: []
    },
    albumType: {
        type: String,
        enum: ['album', 'single', 'compilation'],
        default: 'album'
    },
    total_tracks: {
        type: Number
    },
    tracks: {
        type: [{
            trackId: {
                type: String,
                required: true
            },
            trackName: {
                type: String,
                required: true
            },
            trackArtists: [{
                type: String,
                required: true
            }],
        }],
        default: []
    },
}, 
{
    timestamps: true
}
);

module.exports = mongoose.model('Album', albumSchema);