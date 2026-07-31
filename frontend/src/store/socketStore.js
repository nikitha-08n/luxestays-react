import { create } from 'zustand';
import { io } from 'socket.io-client';

const getSocketUrl = () => {
  const socketUrl = import.meta.env.VITE_SOCKET_URL;
  if (socketUrl) return socketUrl;

  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    try {
      return new URL(apiUrl).origin;
    } catch (e) {
      console.error(e);
    }
  }
  return 'http://localhost:5000';
};
const SOCKET_URL = getSocketUrl();

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
