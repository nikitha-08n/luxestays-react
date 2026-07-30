import express from 'express';
import * as authController from '../../controllers/authController.js';
import validate from '../../middlewares/validate.js';
import verifyJWT from '../../middlewares/verifyJWT.js';
import { authLimiter } from '../../middlewares/rateLimiter.js';
import {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from '../../validators/authValidators.js';

const router = express.Router();

// Public Authentications & Registries
router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/verify-otp', authLimiter, validate(verifyOtpSchema), authController.verify);
router.post('/resend-otp', authLimiter, authController.resend);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh-token', authController.refresh);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), authController.resetPassword);

// Session Protected Operations
router.post('/change-password', verifyJWT, validate(changePasswordSchema), authController.changePassword);
router.post('/logout', verifyJWT, authController.logout);
router.get('/profile', verifyJWT, authController.getProfile);
router.patch('/profile', verifyJWT, authController.updateProfile);

export default router;
