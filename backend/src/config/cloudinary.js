import { v2 as cloudinary } from 'cloudinary';
import logger from '../utils/logger.js';

// Configure Cloudinary SDK
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload an image buffer stream to Cloudinary
 * Falls back to a mock URL in development if credentials are default.
 * @param {Buffer} fileBuffer
 * @param {string} folder
 */
export const uploadImageStream = (fileBuffer, folder = 'luxestays') => {
  return new Promise((resolve, reject) => {
    // Development fallback
    if (!process.env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_API_SECRET === 'demo_secret') {
      logger.warn('⚠️ Cloudinary credentials not configured. Using placeholder image mock.');
      
      // Return a set of premium Unsplash property images randomly
      const placeholders = [
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80'
      ];
      const selected = placeholders[Math.floor(Math.random() * placeholders.length)];

      return resolve({
        secure_url: selected,
        public_id: `mock-cloudinary-id-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [{ width: 1200, height: 800, crop: 'limit', quality: 'auto' }],
      },
      (error, result) => {
        if (error) {
          logger.error(`❌ Cloudinary Stream Upload Error: ${error.message}`);
          return reject(error);
        }
        resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Delete an image by its publicId
 * @param {string} publicId
 */
export const deleteImage = async (publicId) => {
  try {
    if (!process.env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_API_SECRET === 'demo_secret') {
      logger.warn('⚠️ Cloudinary credentials not configured. Mocking file destroy.');
      return { result: 'ok' };
    }
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    logger.error(`❌ Cloudinary Destroy Error: ${error.message}`);
    throw error;
  }
};

export default cloudinary;
