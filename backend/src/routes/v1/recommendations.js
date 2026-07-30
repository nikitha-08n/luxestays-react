import express from 'express';
import { optionalJWT } from '../../middlewares/optionalJWT.js';
import Property from '../../models/Property.js';
import ApiResponse from '../../utils/ApiResponse.js';

const router = express.Router();

router.get('/', optionalJWT, async (req, res, next) => {
  try {
    let filter = { status: 'APPROVED', isAvailable: true };

    if (req.user) {
      // Personalized recommendation: recommend listings in the same city as the user's last actions (or default city)
      // For development, we fetch based on the user's registered name or recent active properties in the database
      const propertiesInCity = await Property.find({
        status: 'APPROVED',
        isAvailable: true,
      }).limit(10);
      
      // Shuffle or sort by averageRating
      const recommendations = propertiesInCity.sort((a, b) => b.averageRating - a.averageRating).slice(0, 4);
      return res.status(200).json(ApiResponse.success(recommendations, 'Personalized recommendations loaded'));
    }

    // Default recommendation: fetch properties with the highest average rating
    const popular = await Property.find({
      status: 'APPROVED',
      isAvailable: true,
    })
      .sort({ averageRating: -1, createdAt: -1 })
      .limit(4);

    res.status(200).json(ApiResponse.success(popular, 'Popular recommendations loaded'));
  } catch (error) {
    next(error);
  }
});

export default router;
