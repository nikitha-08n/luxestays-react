import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewApi } from '../../../api/reviewApi';
import toast from 'react-hot-toast';

export const usePropertyReviewsQuery = (propertyId, options = {}) => {
  return useQuery({
    queryKey: ['reviews', propertyId],
    queryFn: () => reviewApi.listByProperty(propertyId),
    enabled: !!propertyId,
    ...options,
  });
};

export const useCreateReviewMutation = (options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => reviewApi.create(data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.propertyId] });
      queryClient.invalidateQueries({ queryKey: ['property', variables.propertyId] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success(data.message || 'Review submitted successfully!');
      if (options.onSuccess) options.onSuccess(data);
    },
    onError: (error) => {
      const msg = error?.message || 'Failed to submit review';
      toast.error(msg);
      if (options.onError) options.onError(error);
    },
  });
};
