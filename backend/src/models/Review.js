import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: [true, 'Property ID is required'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating (1 to 5) is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      trim: true,
      minlength: [5, 'Comment must be at least 5 characters long'],
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate reviews from the same user for the same property
reviewSchema.index({ userId: 1, propertyId: 1 }, { unique: true });

// Static method to calculate average rating and review counts on the Property model
reviewSchema.statics.calculateAverageRating = async function (propertyId) {
  const stats = await this.aggregate([
    { $match: { propertyId } },
    {
      $group: {
        _id: '$propertyId',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  if (stats.length > 0) {
    await mongoose.model('Property').findByIdAndUpdate(propertyId, {
      totalReviews: stats[0].nRating,
      averageRating: Math.round(stats[0].avgRating * 10) / 10,
    });
  } else {
    await mongoose.model('Property').findByIdAndUpdate(propertyId, {
      totalReviews: 0,
      averageRating: 0,
    });
  }
};

// Calculate stats on Save
reviewSchema.post('save', function () {
  this.constructor.calculateAverageRating(this.propertyId);
});

// Calculate stats on Delete
reviewSchema.post('findOneAndDelete', function (doc) {
  if (doc) {
    doc.constructor.calculateAverageRating(doc.propertyId);
  }
});

const Review = mongoose.model('Review', reviewSchema);

export default Review;
