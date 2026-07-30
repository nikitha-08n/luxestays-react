import RefreshToken from '../models/RefreshToken.js';

export const saveToken = async (userId, token, expiresAt) => {
  return RefreshToken.create({ userId, token, expiresAt });
};

export const findToken = async (token) => {
  return RefreshToken.findOne({ token });
};

export const deleteToken = async (token) => {
  return RefreshToken.deleteOne({ token });
};

export const deleteUserTokens = async (userId) => {
  return RefreshToken.deleteMany({ userId });
};

export default {
  saveToken,
  findToken,
  deleteToken,
  deleteUserTokens,
};
