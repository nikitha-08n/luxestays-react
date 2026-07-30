import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { propertyApi } from '../../../api/propertyApi';
import toast from 'react-hot-toast';

export const usePropertiesQuery = (params = {}) => {
  return useQuery({
    queryKey: ['properties', params],
    queryFn: () => propertyApi.list(params),
  });
};

export const useSearchPropertiesQuery = (params, options = {}) => {
  return useQuery({
    queryKey: ['propertiesSearch', params],
    queryFn: () => propertyApi.search(params),
    enabled: !!params?.latitude && !!params?.longitude,
    ...options,
  });
};

export const usePropertyDetailsQuery = (id) => {
  return useQuery({
    queryKey: ['property', id],
    queryFn: () => propertyApi.getDetails(id),
    enabled: !!id,
  });
};

export const useCreatePropertyMutation = (options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData) => propertyApi.create(formData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success(data.message || 'Property submitted for admin moderation!');
      if (options.onSuccess) options.onSuccess(data.data);
    },
    onError: (error) => {
      const msg = error.response?.data?.message || 'Failed to list property';
      toast.error(msg);
      if (options.onError) options.onError(error);
    },
  });
};

export const useUpdatePropertyMutation = (id, options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData) => propertyApi.update(id, formData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['property', id] });
      toast.success(data.message || 'Property updated successfully!');
      if (options.onSuccess) options.onSuccess(data.data);
    },
    onError: (error) => {
      const msg = error.response?.data?.message || 'Failed to save changes';
      toast.error(msg);
      if (options.onError) options.onError(error);
    },
  });
};

export const useDeletePropertyMutation = (options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => propertyApi.delete(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success(data.message || 'Property deleted successfully!');
      if (options.onSuccess) options.onSuccess(data);
    },
    onError: (error) => {
      const msg = error.response?.data?.message || 'Failed to remove listing';
      toast.error(msg);
      if (options.onError) options.onError(error);
    },
  });
};

export const useModeratePropertyMutation = (options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, rejectionReason }) =>
      propertyApi.moderate(id, { status, rejectionReason }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['property', variables.id] });
      toast.success(data.message || 'Listing moderation completed!');
      if (options.onSuccess) options.onSuccess(data.data);
    },
    onError: (error) => {
      const msg = error.response?.data?.message || 'Moderation update failed';
      toast.error(msg);
      if (options.onError) options.onError(error);
    },
  });
};
