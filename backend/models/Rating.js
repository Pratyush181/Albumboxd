const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      albumId: {
        type: String,
        ref: 'Album',
        required: true
      },
      rating: {
        type: Number,
        required: true,
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }, {
      timestamps: true
});

module.exports = mongoose.model('Rating', ratingSchema);