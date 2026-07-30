import { z } from 'zod';

export const searchPropertySchema = z.object({
  query: z.object({
    latitude: z.preprocess((val) => Number(val), z.number({ required_error: 'Latitude is required for radius searches' }).min(-90).max(90)),
    longitude: z.preprocess((val) => Number(val), z.number({ required_error: 'Longitude is required for radius searches' }).min(-180).max(180)),
    radius: z.preprocess((val) => (val ? Number(val) : 10), z.number().min(1).max(200).default(10)),
    city: z.string().optional(),
    propertyType: z.preprocess((val) => (val === '' ? undefined : val), z.enum(['APARTMENT', 'HOUSE', 'CONDO', 'VILLA']).optional()),
    minPrice: z.preprocess((val) => (val !== undefined && val !== '' ? Number(val) : undefined), z.number().min(0).optional()),
    maxPrice: z.preprocess((val) => (val !== undefined && val !== '' ? Number(val) : undefined), z.number().min(0).optional()),
  }),
});

export default {
  searchPropertySchema,
};
