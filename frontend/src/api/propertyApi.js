import { api } from '../lib/axios';

export const propertyApi = {
  create: async (formData) => {
    const response = await api.post('/properties', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  },

  list: async (params = {}) => {
    const response = await api.get('/properties', { params });
    return response;
  },

  search: async (params) => {
    const response = await api.get('/properties/search', { params });
    return response;
  },

  getDetails: async (id) => {
    const response = await api.get(`/properties/${id}`);
    return response;
  },

  update: async (id, formData) => {
    const response = await api.patch(`/properties/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  },

  delete: async (id) => {
    const response = await api.delete(`/properties/${id}`);
    return response;
  },

  moderate: async (id, { status, rejectionReason }) => {
    const response = await api.patch(`/properties/${id}/moderate`, {
      status,
      rejectionReason,
    });
    return response;
  },
};

export default propertyApi;
