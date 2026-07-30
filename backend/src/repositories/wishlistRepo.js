import Wishlist from '../models/Wishlist.js';

export const create = async (userId, propertyId) => {
  return Wishlist.create({ userId, propertyId });
};

export const remove = async (userId, propertyId) => {
  return Wishlist.findOneAndDelete({ userId, propertyId });
};

export const findOne = async (userId, propertyId) => {
  return Wishlist.findOne({ userId, propertyId });
};

export const findAllByUser = async (userId) => {
  return Wishlist.find({ userId })
    .populate({
      path: 'propertyId',
      populate: {
        path: 'ownerId',
        select: 'name email',
      },
    })
    .sort({ createdAt: -1 });
};

export default {
  create,
  remove,
  findOne,
  findAllByUser,
};
