import { api } from '../lib/axios';

export const reviewApi = {
  create: async ({ propertyId, rating, comment }) => {
    const response = await api.post('/reviews', { propertyId, rating, comment });
    return response;
  },

  listByProperty: async (propertyId) => {
    const response = await api.get(`/reviews/property/${propertyId}`);
    return response;
  },
};

export default reviewApi;
