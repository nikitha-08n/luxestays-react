import express from 'express';
import { create, getDetails, list, update, remove, moderate, search } from '../../controllers/propertyController.js';
import { verifyJWT } from '../../middlewares/verifyJWT.js';
import { optionalJWT } from '../../middlewares/optionalJWT.js';
import { requireRole } from '../../middlewares/requireRole.js';
import { validate } from '../../middlewares/validate.js';
import { upload } from '../../middlewares/upload.js';
import { createPropertySchema, updatePropertySchema, moderatePropertySchema } from '../../validators/propertyValidators.js';
import { searchPropertySchema } from '../../validators/propertySearchValidator.js';

const router = express.Router();

// Public / Guest listings search
router.get('/', optionalJWT, list);
router.get('/search', optionalJWT, validate(searchPropertySchema), search);
router.get('/:id', optionalJWT, getDetails);

// Owner / Admin Creation & Updates
router.post(
  '/',
  verifyJWT,
  requireRole(['OWNER', 'ADMIN']),
  upload.array('images', 10),
  validate(createPropertySchema),
  create
);

router.patch(
  '/:id',
  verifyJWT,
  requireRole(['OWNER', 'ADMIN']),
  upload.array('images', 10),
  validate(updatePropertySchema),
  update
);

router.delete(
  '/:id',
  verifyJWT,
  requireRole(['OWNER', 'ADMIN']),
  remove
);

// Admin Moderation review
router.patch(
  '/:id/moderate',
  verifyJWT,
  requireRole(['ADMIN']),
  validate(moderatePropertySchema),
  moderate
);

import Booking from '../../models/Booking.js';
import ApiResponse from '../../utils/ApiResponse.js';

router.get('/:id/booked-rooms', async (req, res, next) => {
  try {
    const bookings = await Booking.find({ propertyId: req.params.id, status: 'PAID' }).select('roomNumber');
    const bookedRooms = bookings.map(b => b.roomNumber);
    res.status(200).json(ApiResponse.success(bookedRooms, 'Booked rooms fetched successfully'));
  } catch (error) {
    next(error);
  }
});

export default router;
