import User from '../models/User.js';

export const findById = async (id) => {
  return User.findById(id);
};

export const findByEmail = async (email) => {
  return User.findOne({ email: email.toLowerCase() });
};

export const createUser = async (userData) => {
  return User.create(userData);
};

export const updateVerificationStatus = async (userId, status) => {
  return User.findByIdAndUpdate(userId, { isVerified: status }, { new: true });
};

export const updatePassword = async (userId, hashedPassword) => {
  // Directly set the password. Pre-save hook does hashing, so we only provide the raw password,
  // or we can save it. Actually, finding and saving is safer so that the pre-save hook runs!
  const user = await User.findById(userId);
  if (!user) return null;
  user.password = hashedPassword;
  return user.save();
};

export default {
  findById,
  findByEmail,
  createUser,
  updateVerificationStatus,
  updatePassword,
};
