import jwt from 'jsonwebtoken';
import userRepo from '../repositories/userRepo.js';
import otpRepo from '../repositories/otpRepo.js';
import tokenRepo from '../repositories/tokenRepo.js';
import sendEmail from '../config/email.js';
import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';

/**
 * Generate Access Token (15m) and Refresh Token (7d)
 * Saves Refresh Token in the database.
 */
const generateAuthTokens = async (user) => {
  const accessToken = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
  );

  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  // Set refresh token expiration (7 days)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await tokenRepo.saveToken(user._id, refreshToken, expiresAt);

  return { accessToken, refreshToken };
};

/**
 * Register User & Send OTP
 */
export const registerUser = async ({ name, email, password, role }) => {
  const existingUser = await userRepo.findByEmail(email);
  if (existingUser) {
    throw ApiError.conflict('Email address is already registered');
  }

  // Generate 6-digit numeric OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 5); // 5 minutes expiration

  // Save OTP to DB
  await otpRepo.createOTP(email, otpCode, expiresAt);

  // Create User (unverified)
  const user = await userRepo.createUser({
    name,
    email,
    password,
    role,
    isVerified: false,
  });

  // Send Email (fail-safe log in dev)
  try {
    await sendEmail({
      to: email,
      subject: 'Verify Your LuxeStays Account',
      text: `Welcome to LuxeStays, ${name}!\n\nYour account verification code is: ${otpCode}\nThis code is valid for 5 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0ea5e9; text-align: center;">Welcome to LuxeStays</h2>
          <p>Hello ${name},</p>
          <p>Thank you for registering. Please verify your account using the security code below:</p>
          <div style="background-color: #f8fafc; padding: 15px; text-align: center; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 4px; margin: 20px 0; border: 1px solid #cbd5e1; color: #1e293b;">
            ${otpCode}
          </div>
          <p style="color: #64748b; font-size: 12px; text-align: center;">This code expires in 5 minutes. If you did not sign up for LuxeStays, please ignore this email.</p>
        </div>
      `,
    });
  } catch (err) {
    logger.error(`Failed to dispatch registration email: ${err.message}`);
  }

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
  };
};

/**
 * Verify OTP & Issue Tokens
 */
export const verifyOTP = async ({ email, otp }) => {
  const user = await userRepo.findByEmail(email);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const latestOtp = await otpRepo.findLatestOTP(email);
  if (!latestOtp) {
    throw ApiError.badRequest('Verification code has expired or was not requested');
  }

  if (latestOtp.otp !== otp) {
    throw ApiError.badRequest('Invalid verification code');
  }

  // Update user verification status
  user.isVerified = true;
  await user.save();

  // Delete consumed OTPs
  await otpRepo.deleteOTPsByEmail(email);

  // Generate session tokens
  const tokens = await generateAuthTokens(user);

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      points: user.points || 0,
    },
    ...tokens,
  };
};

/**
 * Login User
 */
export const loginUser = async ({ email, password }) => {
  const user = await userRepo.findByEmail(email);
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const isPasswordMatch = await user.comparePassword(password);
  if (!isPasswordMatch) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (!user.isVerified) {
    throw new ApiError(403, 'Email address is not verified yet. Please verify your account.');
  }

  const tokens = await generateAuthTokens(user);

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      points: user.points || 0,
    },
    ...tokens,
  };
};

/**
 * Rotate Refresh Token
 */
export const rotateRefreshToken = async (oldToken) => {
  if (!oldToken) {
    throw ApiError.unauthorized('Session expired or refresh token missing');
  }

  let decoded;
  try {
    decoded = jwt.verify(oldToken, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    throw ApiError.unauthorized('Session expired or invalid refresh token');
  }

  const tokenInDb = await tokenRepo.findToken(oldToken);
  if (!tokenInDb) {
    // Stale/reused/stolen refresh token. For security, invalidate all user sessions!
    await tokenRepo.deleteUserTokens(decoded.id);
    throw ApiError.unauthorized('Token reuse detected. Invalided all sessions.');
  }

  const user = await userRepo.findById(decoded.id);
  if (!user) {
    throw ApiError.unauthorized('Associated user account does not exist');
  }

  // Delete used refresh token
  await tokenRepo.deleteToken(oldToken);

  // Generate new rotated session pair
  const tokens = await generateAuthTokens(user);
  return tokens;
};

/**
 * Forgot Password Request (OTP Sent)
 */
export const forgotPassword = async ({ email }) => {
  const user = await userRepo.findByEmail(email);
  if (!user) {
    // Avoid user enumeration, return generic success
    return { success: true };
  }

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 5);

  // Save OTP
  await otpRepo.createOTP(email, otpCode, expiresAt);

  try {
    await sendEmail({
      to: email,
      subject: 'Reset Your LuxeStays Password',
      text: `Hello ${user.name},\n\nYou requested to reset your password. Use verification code: ${otpCode} to complete the reset.\nThis code is valid for 5 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #e11d48; text-align: center;">Reset LuxeStays Password</h2>
          <p>Hello ${user.name},</p>
          <p>You requested a password reset code. Please enter the security code below in the password reset page:</p>
          <div style="background-color: #f8fafc; padding: 15px; text-align: center; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 4px; margin: 20px 0; border: 1px solid #cbd5e1; color: #1e293b;">
            ${otpCode}
          </div>
          <p style="color: #64748b; font-size: 12px; text-align: center;">This code expires in 5 minutes. If you did not request a password reset, please secure your account.</p>
        </div>
      `,
    });
  } catch (err) {
    logger.error(`Forgot password email failed: ${err.message}`);
  }

  return { success: true };
};

/**
 * Reset Password with OTP
 */
export const resetPassword = async ({ email, otp, newPassword }) => {
  const user = await userRepo.findByEmail(email);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const latestOtp = await otpRepo.findLatestOTP(email);
  if (!latestOtp) {
    throw ApiError.badRequest('Password reset code has expired or was not requested');
  }

  if (latestOtp.otp !== otp) {
    throw ApiError.badRequest('Invalid password reset code');
  }

  // Update password (using repository save helper so pre-save hook hashes it)
  await userRepo.updatePassword(user._id, newPassword);

  // Clear consumed OTPs
  await otpRepo.deleteOTPsByEmail(email);

  // Invalidate user sessions to force login with new password
  await tokenRepo.deleteUserTokens(user._id);

  return { success: true };
};

/**
 * Change Password (Authenticated)
 */
export const changePassword = async (userId, { oldPassword, newPassword }) => {
  const user = await userRepo.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const isPasswordMatch = await user.comparePassword(oldPassword);
  if (!isPasswordMatch) {
    throw ApiError.unauthorized('Incorrect old password');
  }

  await userRepo.updatePassword(user._id, newPassword);
  await tokenRepo.deleteUserTokens(user._id);

  return { success: true };
};

/**
 * Logout
 */
export const logoutUser = async (token) => {
  if (token) {
    await tokenRepo.deleteToken(token);
  }
  return { success: true };
};

/**
 * Resend OTP Code
 */
export const resendOTP = async ({ email }) => {
  const user = await userRepo.findByEmail(email);
  if (!user) {
    throw ApiError.notFound('User account not found');
  }
  if (user.isVerified) {
    throw ApiError.badRequest('Email is already verified');
  }

  // Generate 6-digit numeric OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 5);

  // Re-create OTP in DB
  await otpRepo.deleteOTPsByEmail(email);
  await otpRepo.createOTP(email, otpCode, expiresAt);

  try {
    await sendEmail({
      to: email,
      subject: 'Verify Your LuxeStays Account (New OTP)',
      text: `Your new LuxeStays account verification code is: ${otpCode}\nThis code is valid for 5 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0ea5e9; text-align: center;">New Verification Code</h2>
          <p>Hello ${user.name},</p>
          <p>You requested a new verification code. Please verify your account using the code below:</p>
          <div style="background-color: #f8fafc; padding: 15px; text-align: center; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 4px; margin: 20px 0; border: 1px solid #cbd5e1; color: #1e293b;">
            ${otpCode}
          </div>
          <p style="color: #64748b; font-size: 12px; text-align: center;">This code expires in 5 minutes.</p>
        </div>
      `,
    });
  } catch (err) {
    logger.error(`Resend OTP email failed: ${err.message}`);
  }

  return { success: true };
};

export default {
  registerUser,
  verifyOTP,
  loginUser,
  rotateRefreshToken,
  forgotPassword,
  resetPassword,
  changePassword,
  logoutUser,
  resendOTP,
};
