import express from 'express';
import { verifyJWT } from '../../middlewares/verifyJWT.js';
import { requireRole } from '../../middlewares/requireRole.js';
import Property from '../../models/Property.js';
import Booking from '../../models/Booking.js';
import ApiResponse from '../../utils/ApiResponse.js';

const router = express.Router();

router.use(verifyJWT, requireRole(['OWNER', 'ADMIN']));

// Get owner dashboard stats
router.get('/analytics', async (req, res, next) => {
  try {
    const ownerId = req.user.id;

    const myProperties = await Property.find({ ownerId });
    const propertyIds = myProperties.map(p => p._id);

    const totalProperties = myProperties.length;
    const visits = await Booking.find({ propertyId: { $in: propertyIds } });
    
    const totalVisits = visits.length;
    const totalRevenue = visits
      .filter(v => v.status === 'PAID')
      .reduce((sum, v) => sum + v.amount, 0);

    // Group bookings by status for analytics mapping
    const statusStats = {
      PENDING: visits.filter(v => v.status === 'PENDING').length,
      APPROVED: visits.filter(v => v.status === 'APPROVED').length,
      PAID: visits.filter(v => v.status === 'PAID').length,
      CANCELLED: visits.filter(v => v.status === 'CANCELLED').length,
    };

    res.status(200).json(
      ApiResponse.success(
        {
          totalProperties,
          totalVisits,
          totalRevenue,
          statusStats,
        },
        'Owner analytics loaded'
      )
    );
  } catch (error) {
    next(error);
  }
});

export default router;
