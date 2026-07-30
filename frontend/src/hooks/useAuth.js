import { useMutation } from '@tanstack/react-query';
import authApi from '../api/authApi';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

export const useRegisterMutation = (options) => {
  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      toast.success(data.message || 'OTP verification code sent to email.');
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      toast.error(error.message || 'Registration failed');
      options?.onError?.(error);
    },
  });
};

export const useVerifyOTPMutation = (options) => {
  const setAuth = useAuthStore((state) => state.setAuth);
  return useMutation({
    mutationFn: authApi.verifyOTP,
    onSuccess: (response) => {
      const { user, accessToken } = response.data;
      setAuth(user, accessToken);
      toast.success(response.message || 'Email verified successfully. Welcome!');
      options?.onSuccess?.(response.data);
    },
    onError: (error) => {
      toast.error(error.message || 'OTP verification failed');
      options?.onError?.(error);
    },
  });
};

export const useLoginMutation = (options) => {
  const setAuth = useAuthStore((state) => state.setAuth);
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (response) => {
      const { user, accessToken } = response.data;
      setAuth(user, accessToken);
      toast.success(response.message || 'Logged in successfully');
      options?.onSuccess?.(response.data);
    },
    onError: (error) => {
      toast.error(error.message || 'Login failed');
      options?.onError?.(error);
    },
  });
};

export const useForgotPasswordMutation = (options) => {
  return useMutation({
    mutationFn: authApi.forgotPassword,
    onSuccess: (response) => {
      toast.success(response.message || 'Verification code sent to your email.');
      options?.onSuccess?.(response.data);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to send verification code');
      options?.onError?.(error);
    },
  });
};

export const useResetPasswordMutation = (options) => {
  return useMutation({
    mutationFn: authApi.resetPassword,
    onSuccess: (response) => {
      toast.success(response.message || 'Password reset successfully. Please login.');
      options?.onSuccess?.(response.data);
    },
    onError: (error) => {
      toast.error(error.message || 'Password reset failed');
      options?.onError?.(error);
    },
  });
};

export const useLogoutMutation = (options) => {
  const logout = useAuthStore((state) => state.logout);
  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: (response) => {
      logout();
      toast.success('Logged out successfully');
      options?.onSuccess?.();
    },
    onError: (error) => {
      logout();
      toast.error(error.message || 'Logout error, session cleared locally');
      options?.onError?.();
    },
  });
};

export default {
  useRegisterMutation,
  useVerifyOTPMutation,
  useLoginMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useLogoutMutation,
};
