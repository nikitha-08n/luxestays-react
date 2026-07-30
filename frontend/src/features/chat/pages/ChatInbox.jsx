import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useChat } from '../hooks/useChat';
import useAuthStore from '../../../store/authStore';
import { MessageSquare, Send, User, Compass, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ChatInbox() {
  const { user: currentUser } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const targetUserId = searchParams.get('userId');

  const [activeRecipient, setActiveRecipient] = useState(targetUserId || null);
  const [activeName, setActiveName] = useState('Select a chat');
  const [messageText, setMessageText] = useState('');

  const { messages, inboxList, loading, sendMessage } = useChat(activeRecipient);
  const scrollRef = useRef(null);

  // Automatically select target user if present in URL
  useEffect(() => {
    if (targetUserId) {
      setActiveRecipient(targetUserId);
      // Retrieve name from URL query parameter or default to Loading
      const targetName = searchParams.get('userName') || 'Property Landlord';
      setActiveName(targetName);
    }
  }, [targetUserId, searchParams]);

  // Scroll to bottom of message thread
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    sendMessage(messageText.trim());
    setMessageText('');
  };

  const selectConversation = (convo) => {
    setSearchParams({ userId: convo.user.id, userName: convo.user.name });
    setActiveRecipient(convo.user.id);
    setActiveName(convo.user.name);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 h-[80vh] flex flex-col md:flex-row gap-6">
      {/* Conversations side panel */}
      <div className="w-full md:w-[35%] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex flex-col shadow-lg overflow-y-auto">
        <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
          <MessageSquare className="text-brand-500" size={20} />
          Private Inbox
        </h2>

        {inboxList.length === 0 ? (
          <div className="text-center py-12 flex flex-col items-center justify-center flex-grow">
            <MessageSquare className="text-slate-350 dark:text-slate-750 mb-2 h-10 w-10" />
            <p className="text-xs font-bold text-slate-500">No chats started yet</p>
            <p className="text-[10px] text-slate-400 mt-1 max-w-xs">Contact landlords directly from listing details pages to start a conversation.</p>
          </div>
        ) : (
          <div className="space-y-2 flex-grow overflow-y-auto">
            {inboxList.map((convo) => (
              <button
                key={convo.user.id}
                onClick={() => selectConversation(convo)}
                className={`w-full p-4 rounded-2xl flex items-center gap-3 transition border text-left ${
                  activeRecipient === convo.user.id
                    ? 'bg-brand-500/10 border-brand-500/30 text-brand-600 dark:text-brand-400 font-bold'
                    : 'bg-slate-50 dark:bg-slate-950/20 border-transparent hover:border-slate-200 dark:hover:border-slate-800'
                }`}
              >
                <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-550 flex-shrink-0">
                  <User size={18} />
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold truncate">{convo.user.name}</span>
                    {convo.unread && (
                      <span className="h-2 w-2 rounded-full bg-brand-500 flex-shrink-0"></span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-450 dark:text-slate-500 truncate mt-1">
                    {convo.lastMessage}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Message Feed Window */}
      <div className="flex-grow bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col shadow-lg overflow-hidden h-full">
        {activeRecipient ? (
          <>
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-500 flex-shrink-0">
                <User size={16} />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">{activeName}</h3>
                <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span> Live Room Active
                </span>
              </div>
            </div>

            {/* Chat Messages Log */}
            <div className="flex-grow p-6 overflow-y-auto space-y-4 bg-slate-50/20 dark:bg-slate-950/5">
              {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-500" /></div>
              ) : (
                messages.map((msg) => {
                  const isSender = msg.senderId === currentUser.id;
                  return (
                    <div
                      key={msg._id}
                      className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] p-3.5 rounded-2xl text-sm shadow-sm ${
                          isSender
                            ? 'bg-brand-500 text-white rounded-tr-none font-medium'
                            : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-none'
                        }`}
                      >
                        <p>{msg.message}</p>
                        <span
                          className={`block text-[9px] text-right mt-1.5 ${
                            isSender ? 'text-white/80' : 'text-slate-400'
                          }`}
                        >
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={scrollRef}></div>
            </div>

            {/* Input send bar */}
            <form
              onSubmit={handleSendMessage}
              className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-3 bg-white dark:bg-slate-900"
            >
              <input
                type="text"
                placeholder="Type your message here..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="flex-grow bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl py-3 px-4 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
              <button
                type="submit"
                className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 px-5 rounded-xl transition duration-200 flex items-center justify-center"
              >
                <Send size={16} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center text-center p-8 bg-slate-50/20 dark:bg-slate-950/5">
            <Compass className="h-14 w-14 text-slate-350 dark:text-slate-850 mb-3" />
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">Select a Conversation</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1.5">
              Choose an active participant from your private inbox to view messages.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
