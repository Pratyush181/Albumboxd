const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      albumId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Album',
        required: true
      },
      rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
      },
      review: {
        type: String,
        default: ""
      }
    }, {
      timestamps: true
});

module.exports = mongoose.model('Rating', ratingSchema);