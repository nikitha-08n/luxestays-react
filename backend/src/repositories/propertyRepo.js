import Property from '../models/Property.js';

export const createProperty = async (propertyData) => {
  return Property.create(propertyData);
};

export const findById = async (id) => {
  return Property.findById(id).populate('ownerId', 'name email');
};

export const findByIdAndOwner = async (id, ownerId) => {
  return Property.findOne({ _id: id, ownerId });
};

export const findAll = async (filter = {}, pagination = { page: 1, limit: 10 }, sort = { createdAt: -1 }) => {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const query = Property.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('ownerId', 'name email');

  const total = await Property.countDocuments(filter);
  const items = await query.exec();

  return {
    items,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
};

export const updateProperty = async (id, updateData) => {
  return Property.findByIdAndUpdate(id, updateData, { new: true });
};

export const deleteProperty = async (id) => {
  return Property.findByIdAndDelete(id);
};

export const updateStatus = async (id, status, rejectionReason = '') => {
  return Property.findByIdAndUpdate(id, { status, rejectionReason }, { new: true });
};

export const findNear = async (longitude, latitude, radiusInMeters, extraFilters = {}) => {
  return Property.find({
    isAvailable: true,
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        $maxDistance: radiusInMeters,
      },
    },
    ...extraFilters,
  }).populate('ownerId', 'name email');
};

export default {
  createProperty,
  findById,
  findByIdAndOwner,
  findAll,
  updateProperty,
  deleteProperty,
  updateStatus,
  findNear,
};
