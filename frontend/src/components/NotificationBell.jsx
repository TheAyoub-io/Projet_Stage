import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, Clock, MessageSquare, AlertCircle } from 'lucide-react';
import api from '../lib/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('all'); // 'all' or 'unread'
    const dropdownRef = useRef(null);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications/');
            setNotifications(res.data);
            setUnreadCount(res.data.filter(n => !n.is_read).length);
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 10000); // refresh every 10s
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAsRead = async (notification) => {
        const id = notification.id;
        try {
            if (!notification.is_read) {
                await api.patch(`/notifications/${id}/read`);
                setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
                setUnreadCount(prev => Math.max(0, prev - 1));
            }

            // Dispatch event for actionable notifications
            if (notification.type === 'message' && notification.related_id) {
                window.dispatchEvent(new CustomEvent('notification-click', {
                    detail: { type: 'message', id: notification.related_id }
                }));
                setIsOpen(false);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const markAllRead = async () => {
        try {
            await api.patch('/notifications/read-all');
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error(err);
        }
    };

    const clearAll = async () => {
        if (!window.confirm("Voulez-vous vraiment supprimer toutes vos notifications ?")) return;
        try {
            await api.delete('/notifications/');
            setNotifications([]);
            setUnreadCount(0);
        } catch (err) {
            console.error(err);
        }
    };

    const deleteOne = async (e, id) => {
        e.stopPropagation();
        try {
            await api.delete(`/notifications/${id}`);
            const updated = notifications.filter(n => n.id !== id);
            setNotifications(updated);
            setUnreadCount(updated.filter(n => !n.is_read).length);
        } catch (err) {
            console.error(err);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'message': return <MessageSquare size={16} className="text-secondary" />;
            case 'status_change': return <AlertCircle size={16} className="text-primary" />;
            default: return <Bell size={16} className="text-muted" />;
        }
    };

    return (
        <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="btn-text"
                style={{
                    padding: '0.6rem',
                    borderRadius: '50%',
                    position: 'relative',
                    background: isOpen ? 'rgba(79, 70, 229, 0.1)' : 'transparent',
                    color: isOpen ? 'var(--primary)' : 'var(--text-main)',
                    transition: 'all 0.2s'
                }}
            >
                <Bell size={22} />
                {unreadCount > 0 && (
                    <motion.span
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: 1
                        }}
                        transition={{
                            scale: { repeat: Infinity, duration: 2 },
                            duration: 0.3
                        }}
                        style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            background: 'var(--danger)',
                            color: 'white',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '2px solid var(--bg-color)',
                            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)'
                        }}
                    >
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        style={{
                            position: 'absolute',
                            top: '100%',
                            right: '0',
                            marginTop: '0.75rem',
                            width: '320px',
                            background: 'var(--card-bg)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid var(--card-border)',
                            borderRadius: '16px',
                            boxShadow: 'var(--glass-shadow)',
                            zIndex: 1000,
                            overflow: 'hidden'
                        }}
                    >
                        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.05)', padding: '3px', borderRadius: '10px' }}>
                                <button
                                    onClick={() => setActiveTab('all')}
                                    style={{
                                        padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderRadius: '7px', border: 'none',
                                        background: activeTab === 'all' ? '#fff' : 'transparent',
                                        color: activeTab === 'all' ? 'var(--primary)' : 'var(--text-muted)',
                                        fontWeight: '700', cursor: 'pointer', transition: '0.2s'
                                    }}
                                >
                                    Toutes
                                </button>
                                <button
                                    onClick={() => setActiveTab('unread')}
                                    style={{
                                        padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderRadius: '7px', border: 'none',
                                        background: activeTab === 'unread' ? '#fff' : 'transparent',
                                        color: activeTab === 'unread' ? 'var(--primary)' : 'var(--text-muted)',
                                        fontWeight: '700', cursor: 'pointer', transition: '0.2s'
                                    }}
                                >
                                    Filtre ({unreadCount})
                                </button>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {unreadCount > 0 && (
                                    <button onClick={markAllRead} title="Tout marquer lu" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--primary)', padding: '5px', borderRadius: '6px' }}>
                                        <Check size={16} />
                                    </button>
                                )}
                                <button onClick={clearAll} title="Tout effacer" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--danger)', padding: '5px', borderRadius: '6px' }}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <div style={{ maxHeight: '380px', overflowY: 'auto', scrollbarWidth: 'thin' }}>
                            {(() => {
                                const list = activeTab === 'unread' ? notifications.filter(n => !n.is_read) : notifications;
                                if (list.length === 0) {
                                    return (
                                        <div style={{ padding: '4rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                            <Bell size={40} style={{ opacity: 0.1, marginBottom: '0.5rem' }} />
                                            <p style={{ fontSize: '0.85rem', margin: 0 }}>
                                                {activeTab === 'unread' ? "Aucune notification non lue" : "Vos notifications s'afficheront ici"}
                                            </p>
                                        </div>
                                    );
                                }
                                return list.map(notif => (
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                        key={notif.id}
                                        onClick={() => markAsRead(notif)}
                                        style={{
                                            padding: '1rem',
                                            borderBottom: '1px solid var(--card-border)',
                                            background: notif.is_read ? 'transparent' : 'rgba(79, 70, 229, 0.04)',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            gap: '0.85rem',
                                            position: 'relative'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(79, 70, 229, 0.08)'}
                                        onMouseLeave={e => e.currentTarget.style.background = notif.is_read ? 'transparent' : 'rgba(79, 70, 229, 0.04)'}
                                    >
                                        <div style={{
                                            width: '38px', height: '38px', borderRadius: '10px',
                                            background: notif.is_read ? 'var(--bg-alt)' : 'rgba(79, 70, 229, 0.1)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                        }}>
                                            {getIcon(notif.type)}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.15rem' }}>
                                                <span style={{ fontSize: '0.9rem', fontWeight: notif.is_read ? '600' : '800', color: 'var(--text-main)' }}>{notif.title}</span>
                                                <button
                                                    onClick={(e) => deleteOne(e, notif.id)}
                                                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px', opacity: 0.3 }}
                                                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                                                    onMouseLeave={e => e.currentTarget.style.opacity = 0.3}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 0.5rem 0', lineHeight: '1.4' }}>{notif.message}</p>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                                                <Clock size={10} />
                                                <span>{formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: fr })}</span>
                                            </div>
                                        </div>
                                        {!notif.is_read && (
                                            <div style={{ position: 'absolute', right: '1rem', bottom: '1rem', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 0 3px rgba(79, 70, 229, 0.1)' }}></div>
                                        )}
                                    </motion.div>
                                ));
                            })()}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationBell;
