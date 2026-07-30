import { api } from '../lib/axios';

export const wishlistApi = {
  toggle: async (propertyId) => {
    const response = await api.post('/wishlist/toggle', { propertyId });
    return response;
  },

  list: async () => {
    const response = await api.get('/wishlist');
    return response;
  },

  check: async (propertyId) => {
    const response = await api.get(`/wishlist/check/${propertyId}`);
    return response;
  },
};

export default wishlistApi;
