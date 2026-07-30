import Booking from '../models/Booking.js';
import Property from '../models/Property.js';

export const create = async (bookingData) => {
  return Booking.create(bookingData);
};

export const findById = async (id) => {
  return Booking.findById(id)
    .populate('renterId', 'name email')
    .populate({
      path: 'propertyId',
      populate: { path: 'ownerId', select: 'name email phone upiId bankAccountNumber bankIfscCode' }
    });
};

export const findRenterBookings = async (renterId) => {
  return Booking.find({ renterId })
    .populate('propertyId')
    .populate({
      path: 'propertyId',
      populate: { path: 'ownerId', select: 'name email phone upiId bankAccountNumber bankIfscCode' }
    })
    .sort({ createdAt: -1 });
};

export const findOwnerBookings = async (ownerId) => {
  // First, find all property IDs owned by this owner
  const properties = await Property.find({ ownerId }).select('_id');
  const propertyIds = properties.map(p => p._id);

  // Find bookings for these properties
  return Booking.find({ propertyId: { $in: propertyIds } })
    .populate('renterId', 'name email')
    .populate('propertyId')
    .sort({ createdAt: -1 });
};

export const updateStatus = async (id, status, extraFields = {}) => {
  return Booking.findByIdAndUpdate(id, { status, ...extraFields }, { new: true });
};

export const findOne = async (filter) => {
  return Booking.findOne(filter);
};

export default {
  create,
  findById,
  findRenterBookings,
  findOwnerBookings,
  updateStatus,
  findOne,
};
