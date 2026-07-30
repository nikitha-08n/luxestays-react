import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingApi } from '../../../api/bookingApi';
import toast from 'react-hot-toast';

export const useMyBookingsQuery = (options = {}) => {
  return useQuery({
    queryKey: ['myBookings'],
    queryFn: () => bookingApi.myBookings(),
    ...options,
  });
};

export const useOwnerRequestsQuery = (options = {}) => {
  return useQuery({
    queryKey: ['ownerRequests'],
    queryFn: () => bookingApi.ownerRequests(),
    ...options,
  });
};

export const useCreateBookingMutation = (options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => bookingApi.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
      toast.success(data.message || 'Visit request submitted successfully!');
      if (options.onSuccess) options.onSuccess(data);
    },
    onError: (error) => {
      const msg = error.message || error.response?.data?.message || 'Failed to submit visit request';
      toast.error(msg);
      if (options.onError) options.onError(error);
    },
  });
};

export const useUpdateBookingStatusMutation = (options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => bookingApi.updateStatus(id, status),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
      queryClient.invalidateQueries({ queryKey: ['ownerRequests'] });
      toast.success(data.message || 'Booking status updated successfully!');
      if (options.onSuccess) options.onSuccess(data);
    },
    onError: (error) => {
      const msg = error.message || error.response?.data?.message || 'Failed to update booking status';
      toast.error(msg);
      if (options.onError) options.onError(error);
    },
  });
};
