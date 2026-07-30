import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import { globalLimiter } from './middlewares/rateLimiter.js';
import logger from './utils/logger.js';

// Route Imports
import healthRouter from './routes/health.js';
import authRouter from './routes/v1/auth.js';
import propertyRouter from './routes/v1/properties.js';
import wishlistRouter from './routes/v1/wishlist.js';
import bookingRouter from './routes/v1/bookings.js';
import chatRouter from './routes/v1/chats.js';
import paymentRouter from './routes/v1/payments.js';
import reviewRouter from './routes/v1/reviews.js';
import notificationRouter from './routes/v1/notifications.js';
import recommendationRouter from './routes/v1/recommendations.js';
import adminRouter from './routes/v1/admin.js';
import ownerRouter from './routes/v1/owner.js';
import externalListingsRouter from './routes/v1/externalListings.js';

dotenv.config();

const app = express();

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow during dev/testing
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Request Logging Middleware
const morganFormat = process.env.NODE_ENV === 'development' ? 'dev' : 'combined';
app.use(morgan(morganFormat, {
  stream: {
    write: (message) => logger.http(message.trim()),
  },
}));

// Body Parsers & Parsers
app.use(express.json({ limit: '16mb' }));
app.use(express.urlencoded({ extended: true, limit: '16mb' }));
app.use(cookieParser());
app.use(compression());

// Global Rate Limiter
app.use('/api', globalLimiter);

// API Version 1 Route Registrations
app.use('/api/v1/health', healthRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/properties', propertyRouter);
app.use('/api/v1/wishlist', wishlistRouter);
app.use('/api/v1/bookings', bookingRouter);
app.use('/api/v1/chats', chatRouter);
app.use('/api/v1/payments', paymentRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/notifications', notificationRouter);
app.use('/api/v1/recommendations', recommendationRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/owner', ownerRouter);
app.use('/api/v1/external-listings', externalListingsRouter);

// 404 & Central Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
