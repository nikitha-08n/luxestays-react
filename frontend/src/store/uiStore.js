import { create } from 'zustand';

export const useUIStore = create((set) => ({
  isSidebarOpen: false,
  activeModal: null, // e.g. 'LOGIN', 'BOOK_VISIT', 'REVIEW_FORM'
  modalData: null,
  unreadNotificationCount: 0,
  theme: localStorage.getItem('luxestays_theme') || 'dark',

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  closeSidebar: () => set({ isSidebarOpen: false }),

  openModal: (modalName, data = null) => set({ activeModal: modalName, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: null }),

  setUnreadNotificationCount: (count) => set({ unreadNotificationCount: count }),
  incrementUnreadNotifications: () => set((state) => ({ unreadNotificationCount: state.unreadNotificationCount + 1 })),
  
  setTheme: (theme) => {
    localStorage.setItem('luxestays_theme', theme);
    set({ theme });
  },
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('luxestays_theme', newTheme);
    return { theme: newTheme };
  }),
}));

export default useUIStore;
