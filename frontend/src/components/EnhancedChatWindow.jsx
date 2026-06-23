import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import api from '../lib/axios';
import { Button, Input, Spinner, Alert } from './ui';

const EnhancedChatWindow = ({ applicationId, className = '' }) => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom on new messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!applicationId) return;

    try {
      setError('');
      const response = await api.get(`/applications/${applicationId}/messages`);
      setMessages(response.data || []);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
      setError('Unable to load messages');
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  // Initial fetch and polling
  useEffect(() => {
    if (isOpen) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000); // Poll every 3 seconds
      return () => clearInterval(interval);
    }
  }, [isOpen, fetchMessages]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();

    if (!newMessage.trim()) return;

    setSending(true);
    setError('');

    try {
      await api.post(`/applications/${applicationId}/messages`, {
        message: newMessage,
      });

      setNewMessage('');
      await fetchMessages();
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to send message';
      setError(errorMsg);
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`fixed bottom-6 right-6 ${className}`}>
      {/* Chat Bubble Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 rounded-full bg-gradient-to-r from-emerald-600 to-indigo-600 text-white shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow z-40"
        aria-label="Open chat"
      >
        <svg
          className="w-6 h-6"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5z" />
          <path d="M3 7h14M3 11h10" strokeWidth="2" stroke="currentColor" />
        </svg>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-20 right-0 w-96 max-w-[90vw] h-[500px] bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col overflow-hidden z-40 border border-gray-200 dark:border-gray-700"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-indigo-600 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">{t('support_chat')}</h3>
                <p className="text-sm opacity-90">{t('we_are_here_to_help')}</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
                aria-label="Close chat"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900/50">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Spinner size="md" message={t('loading_messages')} />
                </div>
              ) : error && messages.length === 0 ? (
                <Alert
                  type="error"
                  title={t('error')}
                  message={error}
                  dismissible
                  onClose={() => setError('')}
                />
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 text-center">
                  <p>{t('no_messages_yet')}</p>
                </div>
              ) : (
                <>
                  {messages.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.sender === 'admin' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${
                          msg.sender === 'admin'
                            ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                            : 'bg-emerald-600 text-white'
                        }`}
                      >
                        <p className="text-sm">{msg.message || msg.content}</p>
                        <span className="text-xs opacity-75 mt-1 block">
                          {new Date(msg.timestamp || msg.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input Area */}
            <form
              onSubmit={handleSendMessage}
              className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            >
              {error && (
                <Alert
                  type="error"
                  message={error}
                  dismissible
                  onClose={() => setError('')}
                  className="mb-3"
                />
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={t('type_message')}
                  className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  disabled={sending}
                  aria-label="Message input"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  icon={sending ? undefined : Send}
                  loading={sending}
                  disabled={!newMessage.trim() || sending}
                >
                  {sending ? '' : t('send')}
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedChatWindow;
