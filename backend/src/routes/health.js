import express from 'express';
import mongoose from 'mongoose';
import ApiResponse from '../utils/ApiResponse.js';
import { isRedisConnected } from '../config/redis.js';

const router = express.Router();

/**
 * @route GET /api/v1/health
 * @desc Public system health and status check endpoint
 */
router.get('/', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatesMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const healthData = {
    uptime: `${Math.floor(process.uptime())} seconds`,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: dbStatesMap[dbState] || 'unknown',
      name: mongoose.connection.name || 'N/A',
    },
    redis: {
      status: isRedisConnected ? 'connected' : 'offline',
    },
    memoryUsage: {
      rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
    },
  };

  res.status(200).json(ApiResponse.success(healthData, 'System is healthy and operational'));
});

export default router;
