import React, { useState, useEffect, useRef } from 'react';
import { Send, X, MessageCircle } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const ChatWindow = ({ applicationId, isOpen, onClose }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [socket, setSocket] = useState(null);
    const messagesEndRef = useRef(null);
    const token = localStorage.getItem('token');

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (!isOpen || !applicationId) return;

        // Load History
        axios.get(`http://localhost:8000/chat/${applicationId}`, {
            headers: { Authorization: `Bearer ${token}` }
        }).then(res => setMessages(res.data));

        // Connect WebSocket
        const ws = new WebSocket(`ws://localhost:8000/chat/ws/${applicationId}?token=${token}`);

        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            setMessages((prev) => [...prev, msg]);
        };

        setSocket(ws);

        return () => {
            ws.close();
        };
    }, [isOpen, applicationId, token]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !socket) return;

        const data = { message: newMessage };
        socket.send(JSON.stringify(data));
        setNewMessage('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-6 right-6 w-96 max-w-[90vw] z-[200]">
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                className="glass-panel"
                style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '500px' }}
            >
                <div className="dash-header" style={{ justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <MessageCircle size={20} className="text-primary" />
                        <h3 style={{ fontSize: '1.1rem' }}>Discussion Directe</h3>
                    </div>
                    <button onClick={onClose} className="btn-text" style={{ padding: '0.5rem' }}>
                        <X size={20} />
                    </button>
                </div>

                <div className="dash-body" style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem' }}>
                    {messages.map((msg, index) => {
                        const isMe = msg.sender_id === JSON.parse(atob(token.split('.')[1])).id;
                        return (
                            <div
                                key={index}
                                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}
                            >
                                <div
                                    className={`max-w-[80%] p-3 rounded-2xl ${isMe ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100'}`}
                                    style={{
                                        padding: '0.75rem 1rem',
                                        borderRadius: '16px',
                                        maxWidth: '80%',
                                        background: isMe ? 'var(--primary)' : 'var(--card-border)',
                                        color: isMe ? 'white' : 'var(--text-main)',
                                        alignSelf: isMe ? 'flex-end' : 'flex-start'
                                    }}
                                >
                                    <p style={{ margin: 0, fontSize: '0.95rem' }}>{msg.message}</p>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSendMessage} style={{ padding: '1rem', borderTop: '1px solid var(--card-border)', display: 'flex', gap: '0.5rem' }}>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="form-input"
                        placeholder="Écrivez un message..."
                        style={{ borderRadius: '12px' }}
                    />
                    <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem', borderRadius: '12px' }}>
                        <Send size={18} />
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default ChatWindow;
