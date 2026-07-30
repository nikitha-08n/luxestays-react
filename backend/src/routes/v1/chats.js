import express from 'express';
import { verifyJWT } from '../../middlewares/verifyJWT.js';
import Message from '../../models/Message.js';
import User from '../../models/User.js';
import ApiResponse from '../../utils/ApiResponse.js';

const router = express.Router();

router.use(verifyJWT); // Require login for all chats

// Get conversation message history between logged-in user and recipient
router.get('/:recipientId', async (req, res, next) => {
  try {
    const { recipientId } = req.params;
    const userId = req.user.id;

    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: recipientId },
        { senderId: recipientId, receiverId: userId },
      ],
    })
      .populate('propertyId')
      .sort({ createdAt: 1 }); // Chronological order

    // Mark these messages as read
    await Message.updateMany(
      { senderId: recipientId, receiverId: userId, read: false },
      { read: true }
    );

    res.status(200).json(ApiResponse.success(messages, 'Conversation message history loaded'));
  } catch (error) {
    next(error);
  }
});

// Get inbox list: unique list of users the logged-in user has had conversations with
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Find all messages involving the user
    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
    })
      .sort({ createdAt: -1 })
      .populate('senderId', 'name email')
      .populate('receiverId', 'name email');

    // Aggregate to get unique users and their last message
    const conversationsMap = new Map();

    for (const msg of messages) {
      const isSender = msg.senderId._id.toString() === userId;
      const otherUser = isSender ? msg.receiverId : msg.senderId;

      if (!otherUser) continue;
      const otherId = otherUser._id.toString();

      if (!conversationsMap.has(otherId)) {
        conversationsMap.set(otherId, {
          user: {
            id: otherUser._id,
            name: otherUser.name,
            email: otherUser.email,
          },
          lastMessage: msg.message,
          unread: !isSender && !msg.read,
          updatedAt: msg.createdAt,
        });
      } else {
        // If there are unread messages from this other user, increment or mark
        if (!isSender && !msg.read) {
          const current = conversationsMap.get(otherId);
          conversationsMap.set(otherId, { ...current, unread: true });
        }
      }
    }

    const conversations = Array.from(conversationsMap.values());
    res.status(200).json(ApiResponse.success(conversations, 'Conversation inbox list loaded'));
  } catch (error) {
    next(error);
  }
});

export default router;
