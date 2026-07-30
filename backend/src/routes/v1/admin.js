import express from 'express';
import { verifyJWT } from '../../middlewares/verifyJWT.js';
import { requireRole } from '../../middlewares/requireRole.js';
import User from '../../models/User.js';
import Property from '../../models/Property.js';
import Booking from '../../models/Booking.js';
import ApiResponse from '../../utils/ApiResponse.js';

const router = express.Router();

router.use(verifyJWT, requireRole(['ADMIN']));

// Get admin command center dashboard statistics
router.get('/analytics', async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalProperties = await Property.countDocuments();
    const totalBookings = await Booking.countDocuments();
    
    // Sum revenue of completed paid bookings
    const paidBookings = await Booking.find({ status: 'PAID' }).select('amount');
    const totalRevenue = paidBookings.reduce((sum, b) => sum + b.amount, 0);

    // Group revenue by property cities for analytics charting
    const citiesStats = await Property.aggregate([
      { $group: { _id: '$city', count: { $sum: 1 } } }
    ]);

    res.status(200).json(
      ApiResponse.success(
        {
          totalUsers,
          totalProperties,
          totalBookings,
          totalRevenue,
          citiesStats: citiesStats.map(c => ({ name: c._id || 'Other', value: c.count })),
        },
        'Admin dashboard stats loaded'
      )
    );
  } catch (error) {
    next(error);
  }
});

export default router;
