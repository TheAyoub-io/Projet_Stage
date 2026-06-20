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
            case 'message': return <MessageSquare size={16} className="text-indigo-600" />;
            case 'status_change': return <AlertCircle size={16} className="text-blue-600" />;
            default: return <Bell size={16} className="text-slate-400" />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-2 rounded-full transition-all relative ${isOpen ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-100'}`}
                aria-label="Notifications"
            >
                <Bell size={22} />
                {unreadCount > 0 && (
                    <motion.span
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: [1, 1.2, 1], opacity: 1 }}
                        transition={{ scale: { repeat: Infinity, duration: 2 }, duration: 0.3 }}
                        className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm"
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
                        className="absolute top-full right-0 mt-3 w-80 glass-panel overflow-hidden z-[1000] border-slate-200 dark:border-slate-700 shadow-2xl shadow-slate-200/50"
                    >
                        <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveTab('all')}
                                    className={`px-3 py-1 text-[10px] uppercase font-black rounded-md transition-all ${activeTab === 'all' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500'}`}
                                >
                                    Toutes
                                </button>
                                <button
                                    onClick={() => setActiveTab('unread')}
                                    className={`px-3 py-1 text-[10px] uppercase font-black rounded-md transition-all ${activeTab === 'unread' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500'}`}
                                >
                                    Non lues
                                </button>
                            </div>
                            <div className="flex gap-1">
                                {unreadCount > 0 && (
                                    <button onClick={markAllRead} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Tout marquer lu">
                                        <Check size={16} />
                                    </button>
                                )}
                                <button onClick={clearAll} className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors" title="Tout effacer">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800">
                            {(() => {
                                const list = activeTab === 'unread' ? notifications.filter(n => !n.is_read) : notifications;
                                if (list.length === 0) {
                                    return (
                                        <div className="py-12 px-6 text-center">
                                            <Bell size={40} className="mx-auto text-slate-200 mb-3" />
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                {activeTab === 'unread' ? "Aucune nouvelle alerte" : "Vide"}
                                            </p>
                                        </div>
                                    );
                                }
                                return list.map(notif => (
                                    <div
                                        key={notif.id}
                                        onClick={() => markAsRead(notif)}
                                        className={`p-4 flex gap-4 transition-colors cursor-pointer relative group ${notif.is_read ? 'bg-white dark:bg-slate-900' : 'bg-blue-50/30 dark:bg-blue-900/10 hover:bg-blue-50/50'}`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${notif.is_read ? 'bg-slate-100 dark:bg-slate-800' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                                            {getIcon(notif.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <h5 className={`text-sm leading-tight truncate ${notif.is_read ? 'font-semibold text-slate-700 dark:text-slate-300' : 'font-bold text-slate-900 dark:text-white'}`}>{notif.title}</h5>
                                                <button
                                                    onClick={(e) => deleteOne(e, notif.id)}
                                                    className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                            <p className="text-xs text-slate-500 line-clamp-2 mb-2 leading-relaxed">{notif.message}</p>
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                <Clock size={10} />
                                                <span>{formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: fr })}</span>
                                            </div>
                                        </div>
                                        {!notif.is_read && (
                                            <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-600"></div>
                                        )}
                                    </div>
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
