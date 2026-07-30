import express from 'express';
import { verifyJWT } from '../../middlewares/verifyJWT.js';
import notificationService from '../../services/notificationService.js';
import ApiResponse from '../../utils/ApiResponse.js';

const router = express.Router();

router.use(verifyJWT);

// Get notifications feed
router.get('/', async (req, res, next) => {
  try {
    const list = await notificationService.getUserNotifications(req.user.id);
    res.status(200).json(ApiResponse.success(list, 'Notifications loaded successfully'));
  } catch (error) {
    next(error);
  }
});

// Mark all as read
router.patch('/read-all', async (req, res, next) => {
  try {
    await notificationService.markAllAsRead(req.user.id);
    res.status(200).json(ApiResponse.success(null, 'All notifications marked as read'));
  } catch (error) {
    next(error);
  }
});

// Mark single notification as read
router.patch('/:id/read', async (req, res, next) => {
  try {
    const updated = await notificationService.markAsRead(req.params.id, req.user.id);
    res.status(200).json(ApiResponse.success(updated, 'Notification marked as read'));
  } catch (error) {
    next(error);
  }
});

export default router;
