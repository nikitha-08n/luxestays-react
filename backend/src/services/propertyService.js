import propertyRepo from '../repositories/propertyRepo.js';
import { uploadImageStream, deleteImage } from '../config/cloudinary.js';
import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';

/**
 * Create a new property listing
 */
export const createProperty = async (ownerId, propertyData, files = []) => {
  const {
    title, description, address, city, state, zipCode, contactNumber,
    latitude, longitude, price, bedrooms, bathrooms, area,
    propertyType, furnishing, amenities, upiId = '', bankAccountNumber = '', bankIfscCode = ''
  } = propertyData;

  // Process image files with Cloudinary
  const images = [];
  if (files && files.length > 0) {
    for (const file of files) {
      try {
        const uploadResult = await uploadImageStream(file.buffer);
        images.push({
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
        });
      } catch (err) {
        logger.error(`Error uploading property image: ${err.message}`);
      }
    }
  }

  if (images.length === 0) {
    images.push({
      url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80',
      publicId: 'default-property-placeholder',
    });
  }

  return propertyRepo.createProperty({
    title,
    description,
    address,
    city,
    state,
    zipCode,
    contactNumber,
    location: {
      type: 'Point',
      coordinates: [Number(longitude), Number(latitude)],
    },
    price,
    bedrooms,
    bathrooms,
    area,
    propertyType,
    furnishing,
    amenities: amenities || [],
    upiId,
    bankAccountNumber,
    bankIfscCode,
    images,
    ownerId,
    status: 'APPROVED',
  });
};

/**
 * Get detailed view of individual property listing
 */
export const getPropertyById = async (id, requester = null) => {
  const property = await propertyRepo.findById(id);
  if (!property) {
    throw ApiError.notFound('Property listing not found');
  }

  // If the listing is not approved, restrict view to only owner or admin
  if (property.status !== 'APPROVED') {
    const isOwner = requester && requester.id.toString() === property.ownerId._id.toString();
    const isAdmin = requester && requester.role === 'ADMIN';
    if (!isOwner && !isAdmin) {
      throw ApiError.forbidden('Access denied: Property listing is pending review');
    }
  }

  return property;
};

/**
 * Get paginated list of properties with search queries
 */
export const getProperties = async (query = {}, requester = null) => {
  const { page = 1, limit = 12, sort = 'createdAtDesc', city, type, minPrice, maxPrice, status } = query;
  
  const filter = {};
  
  // Set boundaries on visibility
  if (requester && requester.role === 'ADMIN') {
    if (status) filter.status = status;
  } else if (requester && requester.role === 'OWNER' && query.myListings === 'true') {
    // Owners view their own listings
    filter.ownerId = requester.id;
    if (status) filter.status = status;
  } else {
    // Renters, Guests, and Landlords general browse: view all available listings
    filter.isAvailable = true;
  }

  if (city) {
    filter.city = new RegExp(city.trim(), 'i');
  }
  if (type) {
    filter.propertyType = type;
  }
  
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  const pagination = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  let sortObj = { createdAt: -1 };
  if (sort === 'priceAsc') sortObj = { price: 1 };
  if (sort === 'priceDesc') sortObj = { price: -1 };

  return propertyRepo.findAll(filter, pagination, sortObj);
};

/**
 * Update property details
 */
export const updateProperty = async (id, ownerId, requester, updateData, files = []) => {
  const property = await propertyRepo.findById(id);
  if (!property) {
    throw ApiError.notFound('Property listing not found');
  }

  const isOwner = property.ownerId._id.toString() === ownerId.toString();
  const isAdmin = requester.role === 'ADMIN';
  
  if (!isOwner && !isAdmin) {
    throw ApiError.forbidden('Unauthorized access: You do not own this listing');
  }

  const { latitude, longitude, ...fields } = updateData;

  if (latitude !== undefined && longitude !== undefined) {
    fields.location = {
      type: 'Point',
      coordinates: [Number(longitude), Number(latitude)],
    };
  }

  // Handle addition of new images
  if (files && files.length > 0) {
    const newImages = [];
    for (const file of files) {
      try {
        const uploadResult = await uploadImageStream(file.buffer);
        newImages.push({
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
        });
      } catch (err) {
        logger.error(`Error uploading image during update: ${err.message}`);
      }
    }
    fields.images = [...property.images, ...newImages];
  }

  // Trigger re-moderation on owner edits
  if (!isAdmin) {
    fields.status = 'PENDING';
  }

  return propertyRepo.updateProperty(id, fields);
};

/**
 * Delete property listing
 */
export const deleteProperty = async (id, ownerId, requester) => {
  const property = await propertyRepo.findById(id);
  if (!property) {
    throw ApiError.notFound('Property listing not found');
  }

  const isOwner = property.ownerId._id.toString() === ownerId.toString();
  const isAdmin = requester.role === 'ADMIN';

  if (!isOwner && !isAdmin) {
    throw ApiError.forbidden('Unauthorized access: You do not own this listing');
  }

  // Delete pictures from Cloudinary
  for (const img of property.images) {
    try {
      if (img.publicId !== 'default-property-placeholder') {
        await deleteImage(img.publicId);
      }
    } catch (err) {
      logger.error(`Error deleting image ${img.publicId} from Cloudinary: ${err.message}`);
    }
  }

  return propertyRepo.deleteProperty(id);
};

/**
 * Moderate property listing (Approve/Reject)
 */
export const moderateProperty = async (id, { status, rejectionReason }) => {
  const property = await propertyRepo.findById(id);
  if (!property) {
    throw ApiError.notFound('Property listing not found');
  }

  return propertyRepo.updateStatus(id, status, rejectionReason);
};

export const searchProperties = async (searchParams) => {
  const { latitude, longitude, radius = 10, city, propertyType, minPrice, maxPrice } = searchParams;
  
  const radiusInMeters = Number(radius) * 1000;
  
  const extraFilters = {};
  if (propertyType) {
    extraFilters.propertyType = propertyType;
  }
  if (minPrice || maxPrice) {
    extraFilters.price = {};
    if (minPrice !== undefined && minPrice !== '') extraFilters.price.$gte = Number(minPrice);
    if (maxPrice !== undefined && maxPrice !== '') extraFilters.price.$lte = Number(maxPrice);
  }
  if (city && city.trim() !== '') {
    const cleanCity = city.trim();
    extraFilters.$or = [
      { city: new RegExp(cleanCity, 'i') },
      { address: new RegExp(cleanCity, 'i') }
    ];
  }

  return propertyRepo.findNear(Number(longitude), Number(latitude), radiusInMeters, extraFilters);
};

export default {
  createProperty,
  getPropertyById,
  getProperties,
  updateProperty,
  deleteProperty,
  moderateProperty,
  searchProperties,
};
