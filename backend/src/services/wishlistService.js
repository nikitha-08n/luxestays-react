import wishlistRepo from '../repositories/wishlistRepo.js';
import propertyRepo from '../repositories/propertyRepo.js';
import ApiError from '../utils/ApiError.js';

export const toggleWishlist = async (userId, propertyId) => {
  const property = await propertyRepo.findById(propertyId);
  if (!property) {
    throw ApiError.notFound('Property not found');
  }

  const existing = await wishlistRepo.findOne(userId, propertyId);
  if (existing) {
    await wishlistRepo.remove(userId, propertyId);
    return { wishlisted: false, message: 'Property removed from wishlist' };
  } else {
    await wishlistRepo.create(userId, propertyId);
    return { wishlisted: true, message: 'Property added to wishlist' };
  }
};

export const getWishlist = async (userId) => {
  const items = await wishlistRepo.findAllByUser(userId);
  // Map out properties cleanly
  return items.map(item => item.propertyId).filter(prop => prop !== null);
};

export const checkIsWishlisted = async (userId, propertyId) => {
  const item = await wishlistRepo.findOne(userId, propertyId);
  return { wishlisted: !!item };
};

export default {
  toggleWishlist,
  getWishlist,
  checkIsWishlisted,
};
