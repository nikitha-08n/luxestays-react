import bookingRepo from '../repositories/bookingRepo.js';
import propertyRepo from '../repositories/propertyRepo.js';
import { createNotification } from './notificationService.js';
import ApiError from '../utils/ApiError.js';

export const createBooking = async (renterId, { propertyId, visitDate, roomNumber = 1 }) => {
  const property = await propertyRepo.findById(propertyId);
  if (!property) {
    throw ApiError.notFound('Property not found');
  }

  // If type is APARTMENT, check room choice and verify if it's already booked!
  if (property.propertyType === 'APARTMENT') {
    const parsedRoom = Number(roomNumber);
    if (parsedRoom < 1 || parsedRoom > property.bedrooms) {
      throw ApiError.badRequest(`Invalid room choice. This apartment has ${property.bedrooms} rooms.`);
    }

    const existingPaid = await bookingRepo.findOne({
      propertyId,
      roomNumber: parsedRoom,
      status: 'PAID'
    });

    if (existingPaid) {
      throw ApiError.badRequest(`Room ${parsedRoom} in this apartment is already booked by another tenant. Please select a different room.`);
    }
  }

  const amount = property.price;

  const booking = await bookingRepo.create({
    renterId,
    propertyId,
    visitDate,
    roomNumber: property.propertyType === 'APARTMENT' ? Number(roomNumber) : 1,
    amount,
    status: 'PENDING',
  });

  // Notify Owner of visit request
  await createNotification(
    property.ownerId,
    'New Visit Request',
    `Renter submitted a new visit request for your listing: ${property.title}`,
    'BOOKING'
  );

  return booking;
};

export const getRenterBookings = async (renterId) => {
  return bookingRepo.findRenterBookings(renterId);
};

export const getOwnerBookings = async (ownerId) => {
  return bookingRepo.findOwnerBookings(ownerId);
};

export const updateBookingStatus = async (bookingId, userId, userRole, status) => {
  const booking = await bookingRepo.findById(bookingId);
  if (!booking) {
    throw ApiError.notFound('Booking not found');
  }

  const ownerIdString = booking.propertyId && booking.propertyId.ownerId
    ? (booking.propertyId.ownerId._id || booking.propertyId.ownerId).toString()
    : null;
  const renterIdString = booking.renterId
    ? (booking.renterId._id || booking.renterId).toString()
    : null;

  const isOwner = ownerIdString === userId.toString();
  const isRenter = renterIdString === userId.toString();

  if (status === 'APPROVED' || status === 'REJECTED') {
    if (!isOwner && userRole !== 'ADMIN') {
      throw ApiError.forbidden('Only the property owner can approve/reject visits');
    }
  }

  if (status === 'CANCELLED') {
    if (!isRenter && !isOwner && userRole !== 'ADMIN') {
      throw ApiError.forbidden('You are not authorized to cancel this booking');
    }
  }

  const updatedBooking = await bookingRepo.updateStatus(bookingId, status);

  // Notify Renter of status update
  if (status === 'APPROVED' || status === 'REJECTED') {
    if (booking.renterId) {
      await createNotification(
        booking.renterId._id || booking.renterId,
        `Visit Request ${status.toLowerCase()}`,
        `The landlord has ${status.toLowerCase()} your visit request for ${booking.propertyId?.title || 'Property'}`,
        'BOOKING'
      );
    }
  }

  // Notify Owner if Renter cancels
  if (status === 'CANCELLED' && isRenter) {
    if (ownerIdString) {
      await createNotification(
        ownerIdString,
        'Visit Cancelled by Tenant',
        `Renter has cancelled their visit schedule request for ${booking.propertyId?.title || 'Property'}`,
        'BOOKING'
      );
    }
  }

  return updatedBooking;
};

export default {
  createBooking,
  getRenterBookings,
  getOwnerBookings,
  updateBookingStatus,
};
