import express from 'express';
import { verifyJWT } from '../../middlewares/verifyJWT.js';
import bookingService from '../../services/bookingService.js';
import ApiResponse from '../../utils/ApiResponse.js';

const router = express.Router();

router.use(verifyJWT); // Require login for bookings

// Submit a new visit / booking request
router.post('/', async (req, res, next) => {
  try {
    const { propertyId, visitDate, roomNumber } = req.body;
    if (!propertyId || !visitDate) {
      return res.status(400).json(ApiResponse.error('Property ID and visit date are required'));
    }
    const booking = await bookingService.createBooking(req.user.id, { propertyId, visitDate, roomNumber });
    res.status(201).json(ApiResponse.created(booking, 'Booking request submitted successfully'));
  } catch (error) {
    next(error);
  }
});

// Get logged-in renter's bookings
router.get('/my-bookings', async (req, res, next) => {
  try {
    const bookings = await bookingService.getRenterBookings(req.user.id);
    res.status(200).json(ApiResponse.success(bookings, 'My bookings fetched successfully'));
  } catch (error) {
    next(error);
  }
});

// Get landlord owner's incoming booking requests
router.get('/owner-requests', async (req, res, next) => {
  try {
    const bookings = await bookingService.getOwnerBookings(req.user.id);
    res.status(200).json(ApiResponse.success(bookings, 'Owner requests fetched successfully'));
  } catch (error) {
    next(error);
  }
});

// Update booking status (Approve / Reject / Cancel)
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json(ApiResponse.error('Status parameter is required'));
    }
    const booking = await bookingService.updateBookingStatus(
      req.params.id,
      req.user.id,
      req.user.role,
      status
    );
    res.status(200).json(ApiResponse.success(booking, `Booking status updated to ${status}`));
  } catch (error) {
    next(error);
  }
});

export default router;
