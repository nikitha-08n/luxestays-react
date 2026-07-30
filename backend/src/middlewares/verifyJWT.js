import jwt from 'jsonwebtoken';
import ApiError from '../utils/ApiError.js';
import userRepo from '../repositories/userRepo.js';

export const verifyJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      return next(ApiError.unauthorized('Access token is missing or malformed'));
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return next(ApiError.unauthorized('Access token is missing'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      
      const user = await userRepo.findById(decoded.id);
      if (!user) {
        return next(ApiError.unauthorized('User not found in system'));
      }

      // Attach minimal user info to request
      req.user = {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      };

      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new ApiError(401, 'Access token has expired'));
      }
      return next(ApiError.unauthorized('Invalid access token'));
    }
  } catch (error) {
    next(error);
  }
};

export default verifyJWT;
