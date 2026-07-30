import { create } from 'zustand';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const useSocketStore = create((set, get) => ({
  socket: null,
  isConnected: false,

  connectSocket: (userId) => {
    const currentSocket = get().socket;
    if (currentSocket) return;

    const newSocket = io(SOCKET_URL, {
      withCredentials: true,
      query: { userId },
    });

    newSocket.on('connect', () => {
      set({ isConnected: true });
    });

    newSocket.on('disconnect', () => {
      set({ isConnected: false });
    });

    set({ socket: newSocket });
  },

  disconnectSocket: () => {
    const currentSocket = get().socket;
    if (currentSocket) {
      currentSocket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },
}));

export default useSocketStore;
