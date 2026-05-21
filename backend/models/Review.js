const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
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
      review: {
        type: String,
        required: false
      },
      rating: {
        type: Number
      },
      likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }],
      createdAt: {
        type: Date,
        default: Date.now
      }
    }, {
      timestamps: true
});

module.exports = mongoose.model('Review', reviewSchema);