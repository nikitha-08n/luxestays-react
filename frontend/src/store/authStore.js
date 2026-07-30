import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('luxestays_user')) || null,
  accessToken: localStorage.getItem('luxestays_at') || null,
  isAuthenticated: !!localStorage.getItem('luxestays_at'),

  setAuth: (user, accessToken) => {
    localStorage.setItem('luxestays_user', JSON.stringify(user));
    localStorage.setItem('luxestays_at', accessToken);
    set({
      user,
      accessToken,
      isAuthenticated: true,
    });
  },

  setAccessToken: (accessToken) => {
    localStorage.setItem('luxestays_at', accessToken);
    set({ accessToken, isAuthenticated: true });
  },

  setUser: (user) => {
    localStorage.setItem('luxestays_user', JSON.stringify(user));
    set({ user });
  },

  logout: () => {
    localStorage.removeItem('luxestays_user');
    localStorage.removeItem('luxestays_at');
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
    });
  },
}));

export default useAuthStore;
