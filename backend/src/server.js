import 'dotenv/config';

// Ensure JWT secrets have default fallbacks to prevent crashes on cloud deployments like Render
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'luxestays_access_secret_super_key_2026_prod_key_987654';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'luxestays_refresh_secret_super_key_2026_prod_key_123456';

import http from 'http';
import { Server as SocketServer } from 'socket.io';
import app from './app.js';
import connectDB from './config/db.js';
import logger from './utils/logger.js';

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize Socket.io Server
export const io = new SocketServer(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

import Message from './models/Message.js';

io.on('connection', (socket) => {
  logger.info(`Socket Connected: ${socket.id}`);

  socket.on('join', (userId) => {
    socket.join(userId);
    logger.info(`User ${userId} joined private socket room`);
  });

  socket.on('sendMessage', async (data) => {
    try {
      const { senderId, receiverId, propertyId, message } = data;
      if (!senderId || !receiverId || !message) return;

      logger.info(`WebSocket: Message from ${senderId} to ${receiverId}: "${message}" (Property: ${propertyId || 'none'})`);

      const savedMessage = await Message.create({
        senderId,
        receiverId,
        propertyId: propertyId || null,
        message,
        read: false,
      });

      // Broadcast to receiver room
      io.to(receiverId).emit('receiveMessage', savedMessage);
      
      // Confirm to sender room
      io.to(senderId).emit('messageSent', savedMessage);
    } catch (err) {
      logger.error(`Socket message error: ${err.message}`);
    }
  });

  socket.on('disconnect', () => {
    logger.info(`Socket Disconnected: ${socket.id}`);
  });
});

const startServer = async () => {
  await connectDB();

  server.listen(PORT, () => {
    logger.info(`==================================================`);
    logger.info(`🚀 LuxeStays Server Running on Port ${PORT}`);
    logger.info(`📍 API Health URL: http://localhost:${PORT}/api/v1/health`);
    logger.info(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`==================================================`);
  });
};

// Handle process terminations gracefully
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Promise Rejection: ${err.message}`);
  logger.error(err.stack);
});

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  logger.error(err.stack);
  process.exit(1);
});

startServer();
