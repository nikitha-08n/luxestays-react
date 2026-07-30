import { z } from 'zod';

export const createPropertySchema = z.object({
  body: z.object({
    title: z.string({ required_error: 'Title is required' }).min(5, 'Title must be at least 5 characters'),
    description: z.string({ required_error: 'Description is required' }).min(20, 'Description must be at least 20 characters'),
    address: z.string({ required_error: 'Address is required' }).trim(),
    city: z.string({ required_error: 'City is required' }).trim(),
    state: z.string({ required_error: 'State is required' }).trim(),
    zipCode: z.string({ required_error: 'Zip code is required' }).trim(),
    contactNumber: z.string({ required_error: 'Contact number is required' }).min(10, 'Contact number must be at least 10 digits'),
    
    // Latitude and longitude coordinates processing
    latitude: z.preprocess((val) => Number(val), z.number({ required_error: 'Latitude is required' }).min(-90).max(90)),
    longitude: z.preprocess((val) => Number(val), z.number({ required_error: 'Longitude is required' }).min(-180).max(180)),
    
    price: z.preprocess((val) => Number(val), z.number({ required_error: 'Price is required' }).min(0, 'Price must be positive')),
    bedrooms: z.preprocess((val) => Number(val), z.number({ required_error: 'Bedrooms count is required' }).min(0)),
    bathrooms: z.preprocess((val) => Number(val), z.number({ required_error: 'Bathrooms count is required' }).min(0)),
    area: z.preprocess((val) => Number(val), z.number({ required_error: 'Area size is required' }).min(0)),
    
    propertyType: z.enum(['APARTMENT', 'HOUSE', 'CONDO', 'VILLA'], {
      errorMap: () => ({ message: 'Invalid property type' }),
    }),
    furnishing: z.enum(['FURNISHED', 'SEMI-FURNISHED', 'UNFURNISHED'], {
      errorMap: () => ({ message: 'Invalid furnishing status' }),
    }),
    
    // Process stringified array inputs from multipart form data
    amenities: z.preprocess((val) => {
      if (typeof val === 'string') {
        try {
          return JSON.parse(val);
        } catch {
          return val.split(',').map((s) => s.trim()).filter(Boolean);
        }
      }
      return val || [];
    }, z.array(z.string())).optional(),
    upiId: z.string().optional(),
    bankAccountNumber: z.string().optional(),
    bankIfscCode: z.string().optional(),
  }),
});

export const updatePropertySchema = z.object({
  body: z.object({
    title: z.string().min(5).optional(),
    description: z.string().min(20).optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    contactNumber: z.string().min(10).optional(),
    latitude: z.preprocess((val) => (val !== undefined ? Number(val) : undefined), z.number().min(-90).max(90).optional()),
    longitude: z.preprocess((val) => (val !== undefined ? Number(val) : undefined), z.number().min(-180).max(180).optional()),
    price: z.preprocess((val) => (val !== undefined ? Number(val) : undefined), z.number().min(0).optional()),
    bedrooms: z.preprocess((val) => (val !== undefined ? Number(val) : undefined), z.number().min(0).optional()),
    bathrooms: z.preprocess((val) => (val !== undefined ? Number(val) : undefined), z.number().min(0).optional()),
    area: z.preprocess((val) => (val !== undefined ? Number(val) : undefined), z.number().min(0).optional()),
    propertyType: z.enum(['APARTMENT', 'HOUSE', 'CONDO', 'VILLA']).optional(),
    furnishing: z.enum(['FURNISHED', 'SEMI-FURNISHED', 'UNFURNISHED']).optional(),
    amenities: z.preprocess((val) => {
      if (typeof val === 'string') {
        try {
          return JSON.parse(val);
        } catch {
          return val.split(',').map((s) => s.trim()).filter(Boolean);
        }
      }
      return val;
    }, z.array(z.string())).optional(),
    upiId: z.string().optional(),
    bankAccountNumber: z.string().optional(),
    bankIfscCode: z.string().optional(),
  }),
});

export const moderatePropertySchema = z.object({
  body: z.object({
    status: z.enum(['APPROVED', 'REJECTED'], {
      required_error: 'Moderation status is required',
    }),
    rejectionReason: z.string().trim().optional(),
  }),
});

export default {
  createPropertySchema,
  updatePropertySchema,
  moderatePropertySchema,
};
