import { api } from '../lib/axios';

export const bookingApi = {
  create: async ({ propertyId, visitDate, roomNumber }) => {
    const response = await api.post('/bookings', { propertyId, visitDate, roomNumber });
    return response;
  },

  myBookings: async () => {
    const response = await api.get('/bookings/my-bookings');
    return response;
  },

  ownerRequests: async () => {
    const response = await api.get('/bookings/owner-requests');
    return response;
  },

  updateStatus: async (id, status) => {
    const response = await api.patch(`/bookings/${id}/status`, { status });
    return response;
  },
};

export default bookingApi;
