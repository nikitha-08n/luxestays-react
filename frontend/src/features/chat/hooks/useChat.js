import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '../../../store/authStore';
import { api } from '../../../lib/axios';

const SOCKET_URL = 'http://localhost:5000';

export function useChat(recipientId) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [inboxList, setInboxList] = useState([]);
  const [loading, setLoading] = useState(false);
  const socketRef = useRef(null);

  // 1. Fetch message logs history
  useEffect(() => {
    if (!recipientId || !user?.id) return;

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/chats/${recipientId}`);
        if (response.success) {
          setMessages(response.data);
        }
      } catch (err) {
        console.error('Chat history fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [recipientId, user?.id]);

  // 2. Fetch conversation inbox list
  const fetchInbox = async () => {
    try {
      const response = await api.get('/chats');
      if (response.success) {
        setInboxList(response.data);
      }
    } catch (err) {
      console.error('Inbox list fetch failed:', err);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchInbox();
    }
  }, [user?.id, messages]);

  // 3. Socket Event dispatchers
  useEffect(() => {
    if (!user?.id) return;

    // Establish WebSocket Connection
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket'],
      withCredentials: true,
    });

    const socket = socketRef.current;

    // Join room
    socket.emit('join', user.id);

    // Listen for incoming messages
    socket.on('receiveMessage', (message) => {
      // If the message is from our current active chat recipient, append it
      if (
        (message.senderId === recipientId && message.receiverId === user.id) ||
        (message.senderId === user.id && message.receiverId === recipientId)
      ) {
        setMessages((prev) => [...prev, message]);
      }
    });

    socket.on('messageSent', (message) => {
      if (
        (message.senderId === user.id && message.receiverId === recipientId) ||
        (message.senderId === recipientId && message.receiverId === user.id)
      ) {
        setMessages((prev) => [...prev, message]);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id, recipientId]);

  const sendMessage = (text, propertyId = null) => {
    if (!socketRef.current || !recipientId || !user?.id) return;

    socketRef.current.emit('sendMessage', {
      senderId: user.id,
      receiverId: recipientId,
      propertyId,
      message: text,
    });
  };

  return {
    messages,
    inboxList,
    loading,
    sendMessage,
    refetchInbox: fetchInbox,
  };
}
