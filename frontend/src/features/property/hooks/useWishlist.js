import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wishlistApi } from '../../../api/wishlistApi';
import toast from 'react-hot-toast';

export const useWishlistQuery = (options = {}) => {
  return useQuery({
    queryKey: ['wishlist'],
    queryFn: () => wishlistApi.list(),
    ...options,
  });
};

export const useWishlistCheckQuery = (propertyId, options = {}) => {
  return useQuery({
    queryKey: ['wishlistCheck', propertyId],
    queryFn: () => wishlistApi.check(propertyId),
    enabled: !!propertyId,
    ...options,
  });
};

export const useToggleWishlistMutation = (options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (propertyId) => wishlistApi.toggle(propertyId),
    onSuccess: (data, propertyId) => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      queryClient.invalidateQueries({ queryKey: ['wishlistCheck', propertyId] });
      toast.success(data.message || 'Wishlist updated successfully');
      if (options.onSuccess) options.onSuccess(data);
    },
    onError: (error) => {
      const msg = error.response?.data?.message || 'Failed to update wishlist';
      toast.error(msg);
      if (options.onError) options.onError(error);
    },
  });
};
