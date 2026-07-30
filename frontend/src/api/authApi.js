import api from '../lib/axios';

export const register = async (userData) => {
  return api.post('/auth/register', userData);
};

export const verifyOTP = async ({ email, otp }) => {
  return api.post('/auth/verify-otp', { email, otp });
};

export const login = async (credentials) => {
  return api.post('/auth/login', credentials);
};

export const forgotPassword = async (email) => {
  return api.post('/auth/forgot-password', { email });
};

export const resetPassword = async ({ email, otp, newPassword }) => {
  return api.post('/auth/reset-password', { email, otp, newPassword });
};

export const logout = async () => {
  return api.post('/auth/logout');
};

export const changePassword = async ({ oldPassword, newPassword }) => {
  return api.post('/auth/change-password', { oldPassword, newPassword });
};

export default {
  register,
  verifyOTP,
  login,
  forgotPassword,
  resetPassword,
  logout,
  changePassword,
};
