import OTP from '../models/OTP.js';

export const createOTP = async (email, otp, expiresAt) => {
  return OTP.create({ email: email.toLowerCase(), otp, expiresAt });
};

export const findLatestOTP = async (email) => {
  return OTP.findOne({ email: email.toLowerCase() }).sort({ createdAt: -1 });
};

export const deleteOTPsByEmail = async (email) => {
  return OTP.deleteMany({ email: email.toLowerCase() });
};

export default {
  createOTP,
  findLatestOTP,
  deleteOTPsByEmail,
};
