import * as authService from '../services/authService.js';
import ApiResponse from '../utils/ApiResponse.js';

// Central cookie options configuration
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const register = async (req, res, next) => {
  try {
    const user = await authService.registerUser(req.body);
    res.status(201).json(ApiResponse.created(user, 'User registered successfully. Please verify your email.'));
  } catch (error) {
    next(error);
  }
};

export const verify = async (req, res, next) => {
  try {
    const result = await authService.verifyOTP(req.body);
    res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);
    res.status(200).json(ApiResponse.success({
      user: result.user,
      accessToken: result.accessToken,
    }, 'Email verified and logged in successfully'));
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const result = await authService.loginUser(req.body);
    res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);
    res.status(200).json(ApiResponse.success({
      user: result.user,
      accessToken: result.accessToken,
    }, 'Logged in successfully'));
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const oldToken = req.cookies.refreshToken;
    const result = await authService.rotateRefreshToken(oldToken);
    res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);
    res.status(200).json(ApiResponse.success({
      accessToken: result.accessToken,
    }, 'Token rotated successfully'));
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const result = await authService.forgotPassword(req.body);
    res.status(200).json(ApiResponse.success(result, 'Password reset instructions sent'));
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const result = await authService.resetPassword(req.body);
    res.status(200).json(ApiResponse.success(result, 'Password has been reset successfully. Please sign in.'));
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const result = await authService.changePassword(req.user.id, req.body);
    res.clearCookie('refreshToken', COOKIE_OPTIONS);
    res.status(200).json(ApiResponse.success(result, 'Password changed successfully. Please sign in again.'));
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const oldToken = req.cookies.refreshToken;
    await authService.logoutUser(oldToken);
    res.clearCookie('refreshToken', COOKIE_OPTIONS);
    res.status(200).json(ApiResponse.success(null, 'Logged out successfully'));
  } catch (error) {
    next(error);
  }
};

export const resend = async (req, res, next) => {
  try {
    const result = await authService.resendOTP(req.body);
    res.status(200).json(ApiResponse.success(result, 'New verification code dispatched'));
  } catch (error) {
    next(error);
  }
};

import User from '../models/User.js';

export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json(ApiResponse.error('User not found'));
    }
    res.status(200).json(ApiResponse.success({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      points: user.points || 0,
      phone: user.phone || '',
      upiId: user.upiId || '',
      bankAccountNumber: user.bankAccountNumber || '',
      bankIfscCode: user.bankIfscCode || '',
    }, 'Profile retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, upiId, bankAccountNumber, bankIfscCode } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json(ApiResponse.error('User not found'));
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (upiId !== undefined) user.upiId = upiId;
    if (bankAccountNumber !== undefined) user.bankAccountNumber = bankAccountNumber;
    if (bankIfscCode !== undefined) user.bankIfscCode = bankIfscCode;

    await user.save();
    
    // Omit password from return
    const updatedUser = user.toObject();
    delete updatedUser.password;

    res.status(200).json(ApiResponse.success(updatedUser, 'Profile updated successfully'));
  } catch (error) {
    next(error);
  }
};

export default {
  register,
  verify,
  login,
  refresh,
  forgotPassword,
  resetPassword,
  changePassword,
  logout,
  resend,
  getProfile,
  updateProfile,
};
