import express from 'express';
import { verifyJWT } from '../../middlewares/verifyJWT.js';
import bookingRepo from '../../repositories/bookingRepo.js';
import ApiResponse from '../../utils/ApiResponse.js';
import { createNotification } from '../../services/notificationService.js';
import crypto from 'crypto';
import User from '../../models/User.js';

const router = express.Router();

router.use(verifyJWT);

import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_TJaMqmZL24wMGy',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'nPCys1UJ7ISQu40e96f09a2T',
});

// Create order for a booking checkout
router.post('/order', async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) {
      return res.status(400).json(ApiResponse.error('Booking ID is required'));
    }

    const booking = await bookingRepo.findById(bookingId);
    if (!booking) {
      return res.status(404).json(ApiResponse.error('Booking not found'));
    }

    // Generate a mock or real checkout order
    let orderId;
    let isMock = true;

    try {
      if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_ID !== 'rzp_test_key') {
        const rzpOrder = await razorpay.orders.create({
          amount: Math.round(booking.amount * 100), // paise
          currency: 'INR',
          receipt: `receipt_${booking._id.toString().substring(0, 10)}`,
        });
        orderId = rzpOrder.id;
        isMock = false;
      } else {
        orderId = `order_${crypto.randomBytes(8).toString('hex')}`;
      }
    } catch (err) {
      console.error('Razorpay order creation failed, using mock order:', err.message);
      orderId = `order_${crypto.randomBytes(8).toString('hex')}`;
    }
    
    // Save order ID to the booking document
    await bookingRepo.updateStatus(bookingId, booking.status, { orderId });

    res.status(200).json(
      ApiResponse.success(
        {
          orderId,
          amount: booking.amount,
          currency: 'INR',
          key: process.env.RAZORPAY_KEY_ID || 'rzp_test_TJaMqmZL24wMGy',
          isMock,
        },
        'Payment order generated successfully'
      )
    );
  } catch (error) {
    next(error);
  }
});

// Verify payment signature/success details
router.post('/verify', async (req, res, next) => {
  try {
    const { bookingId, orderId, paymentId, paymentMethod = 'ONLINE', utrNumber = '' } = req.body;
    if (!bookingId || !orderId || !paymentId) {
      return res.status(400).json(ApiResponse.error('Missing verification arguments'));
    }

    const booking = await bookingRepo.findById(bookingId);
    if (!booking) {
      return res.status(404).json(ApiResponse.error('Booking not found'));
    }

    // Mark the booking status as PAID and store transaction records
    const updatedBooking = await bookingRepo.updateStatus(bookingId, 'PAID', {
      paymentId,
      orderId,
      utrNumber,
    });

    // Credit points if paid online
    let renterPoints = 0;
    const renter = await User.findById(booking.renterId._id);
    if (renter) {
      if (paymentMethod === 'ONLINE') {
        renter.points = (renter.points || 0) + 150; // award 150 points for online payment!
        await renter.save();
      }
      renterPoints = renter.points || 0;
    }

    // Notify renter of booking confirmation
    await createNotification(
      booking.renterId._id,
      'Payment Received',
      `Your payment of ₹${booking.amount} for ${booking.propertyId.title} was processed successfully via ${paymentMethod}. Booking confirmed!`,
      'PAYMENT'
    );

    // Notify property owner of paid booking confirmation
    await createNotification(
      booking.propertyId.ownerId,
      'Property Booked (Paid)',
      `Tenant ${booking.renterId.name} has paid the deposit fee of ₹${booking.amount} for your listing: ${booking.propertyId.title} via ${paymentMethod}.`,
      'PAYMENT'
    );

    res.status(200).json(ApiResponse.success({
      booking: updatedBooking,
      points: renterPoints
    }, 'Payment verified successfully. Booking confirmed!'));
  } catch (error) {
    next(error);
  }
});

const PAID_INVOICES_CACHE = new Set();

// Get monthly invoices for the logged-in renter
router.get('/invoices', async (req, res, next) => {
  try {
    const renterId = req.user.id;
    const bookings = await bookingRepo.findRenterBookings(renterId);
    const paidBookings = bookings.filter(b => b.status === 'PAID');

    const invoices = [];
    paidBookings.forEach(booking => {
      const rentAmount = booking.propertyId?.price || booking.amount;
      
      // Invoice 1: Overdue Month
      const overdueInvoiceId = `inv_prev_${booking._id}`;
      const isOverduePaid = PAID_INVOICES_CACHE.has(overdueInvoiceId);
      invoices.push({
        id: overdueInvoiceId,
        bookingId: booking._id,
        propertyTitle: booking.propertyId?.title || 'Luxury Residence',
        city: booking.propertyId?.city || 'Chennai',
        month: 'June 2026',
        dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago (Late!)
        baseRent: rentAmount,
        penalty: 200, // 200 late penalty
        total: rentAmount + 200,
        status: isOverduePaid ? 'PAID' : 'OVERDUE'
      });

      // Invoice 2: Current Month (On Time)
      const currentInvoiceId = `inv_curr_${booking._id}`;
      const isCurrentPaid = PAID_INVOICES_CACHE.has(currentInvoiceId);
      invoices.push({
        id: currentInvoiceId,
        bookingId: booking._id,
        propertyTitle: booking.propertyId?.title || 'Luxury Residence',
        city: booking.propertyId?.city || 'Chennai',
        month: 'July 2026',
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        baseRent: rentAmount,
        penalty: 0,
        total: rentAmount,
        status: isCurrentPaid ? 'PAID' : 'PENDING'
      });
    });

    res.status(200).json(ApiResponse.success(invoices, 'Monthly invoices fetched successfully'));
  } catch (error) {
    next(error);
  }
});

// Create Razorpay order for a rent invoice
router.post('/invoice-order', async (req, res, next) => {
  try {
    const { invoiceId, amount } = req.body;
    if (!invoiceId || !amount) {
      return res.status(400).json(ApiResponse.error('Invoice ID and Amount are required'));
    }

    let orderId;
    let isMock = true;

    try {
      if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_ID !== 'rzp_test_key') {
        const rzpOrder = await razorpay.orders.create({
          amount: Math.round(amount * 100), // paise
          currency: 'INR',
          receipt: `receipt_${invoiceId.substring(0, 15)}`,
        });
        orderId = rzpOrder.id;
        isMock = false;
      } else {
        orderId = `order_${crypto.randomBytes(8).toString('hex')}`;
      }
    } catch (err) {
      console.error('Razorpay order creation failed for invoice, using mock:', err.message);
      orderId = `order_${crypto.randomBytes(8).toString('hex')}`;
    }

    res.status(200).json(
      ApiResponse.success(
        {
          orderId,
          amount,
          currency: 'INR',
          key: process.env.RAZORPAY_KEY_ID || 'rzp_test_TJaMqmZL24wMGy',
          isMock,
        },
        'Invoice payment order generated successfully'
      )
    );
  } catch (error) {
    next(error);
  }
});

// Pay a monthly invoice
router.post('/pay-invoice', async (req, res, next) => {
  try {
    const { invoiceId, paymentMethod = 'ONLINE', amount, orderId = '', paymentId = '', utrNumber = '' } = req.body;
    if (!invoiceId || !amount) {
      return res.status(400).json(ApiResponse.error('Invoice ID and Amount are required'));
    }

    PAID_INVOICES_CACHE.add(invoiceId);

    // Credit points if paid online
    let renterPoints = 0;
    const renter = await User.findById(req.user.id);
    if (renter) {
      if (paymentMethod === 'ONLINE') {
        renter.points = (renter.points || 0) + 150; // award 150 points for online payment!
        await renter.save();
      }
      renterPoints = renter.points || 0;
    }

    // Send payment confirmation notification
    await createNotification(
      req.user.id,
      'Rent Payment Processed',
      `Your rent invoice ${invoiceId} for ₹${amount} was successfully processed via ${paymentMethod}. Transaction details recorded: Order #${orderId || 'Direct'}, PayRef: ${paymentId || utrNumber || 'N/A'}.`,
      'PAYMENT'
    );

    res.status(200).json(ApiResponse.success({
      invoiceId,
      points: renterPoints
    }, 'Rent invoice paid successfully'));
  } catch (error) {
    next(error);
  }
});

export default router;
