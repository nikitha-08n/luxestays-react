import Notification from '../models/Notification.js';
import { io } from '../server.js';
import logger from '../utils/logger.js';

export const createNotification = async (userId, title, message, type = 'SYSTEM') => {
  try {
    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      read: false,
    });

    // Emit live real-time notification alert via WebSockets
    if (io) {
      io.to(userId.toString()).emit('newNotification', notification);
    }

    return notification;
  } catch (err) {
    logger.error(`Failed to create notification: ${err.message}`);
  }
};

export const getUserNotifications = async (userId) => {
  return Notification.find({ userId }).sort({ createdAt: -1 }).limit(50);
};

export const markAsRead = async (id, userId) => {
  return Notification.findOneAndUpdate({ _id: id, userId }, { read: true }, { new: true });
};

export const markAllAsRead = async (userId) => {
  return Notification.updateMany({ userId, read: false }, { read: true });
};

export default {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
};
