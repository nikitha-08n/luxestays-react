import express from 'express';
import { verifyJWT } from '../../middlewares/verifyJWT.js';
import Review from '../../models/Review.js';
import ApiResponse from '../../utils/ApiResponse.js';

const router = express.Router();

// Get all reviews for a specific property (Public)
router.get('/property/:propertyId', async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const reviews = await Review.find({ propertyId })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json(ApiResponse.success(reviews, 'Property reviews loaded successfully'));
  } catch (error) {
    next(error);
  }
});

// Submit a new review (Requires login)
router.post('/', verifyJWT, async (req, res, next) => {
  try {
    const { propertyId, rating, comment } = req.body;
    if (!propertyId || !rating || !comment) {
      return res.status(400).json(ApiResponse.error('Missing review parameters'));
    }

    // Check if the user already reviewed this property
    const existingReview = await Review.findOne({ userId: req.user.id, propertyId });
    if (existingReview) {
      return res.status(400).json(ApiResponse.error('You have already submitted a review for this property'));
    }

    const review = await Review.create({
      userId: req.user.id,
      propertyId,
      rating: Number(rating),
      comment,
    });

    // Populate user info for returning payload
    const populated = await review.populate('userId', 'name email');

    res.status(201).json(ApiResponse.created(populated, 'Review submitted successfully'));
  } catch (error) {
    next(error);
  }
});

export default router;
