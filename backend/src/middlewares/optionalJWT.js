import jwt from 'jsonwebtoken';
import userRepo from '../repositories/userRepo.js';

export const optionalJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      return next(); // No token, continue as guest
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      const user = await userRepo.findById(decoded.id);
      if (user) {
        req.user = {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
        };
      }
    } catch (err) {
      console.error('Optional JWT Verification Error:', err.message);
    }
    
    console.log('--- Optional JWT Decoded Request ---');
    console.log('User Payload:', req.user);
    console.log('------------------------------------');
    next();
  } catch (error) {
    next(error);
  }
};

export default optionalJWT;
