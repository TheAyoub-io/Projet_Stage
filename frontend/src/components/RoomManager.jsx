import React, { useEffect, useState } from 'react';
import api from '../lib/axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Home, Users, User, ChevronRight, LayoutGrid, List,
    CheckCircle, UserPlus, X, Trash2, Search
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Skeleton from './ui/Skeleton';

const RoomManager = () => {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, available, full
    const [viewMode, setViewMode] = useState('grid'); // grid, list
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [unassignedStudents, setUnassignedStudents] = useState([]);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        setLoading(true);
        try {
            const res = await api.get('/rooms/all');
            setRooms(res.data);
        } catch {
            toast.error("Échec du chargement des chambres.");
        } finally {
            setLoading(false);
        }
    };

    const fetchUnassigned = async () => {
        try {
            const res = await api.get('/rooms/unassigned-students');
            setUnassignedStudents(res.data);
        } catch {
            toast.error("Échec du chargement des étudiants sans chambre.");
        }
    };

    const handleRemoveStudent = async (roomId, appId) => {
        if (!window.confirm("Voulez-vous vraiment retirer cet étudiant ?")) return;
        setActionLoading(true);
        try {
            await api.delete(`/rooms/${roomId}/remove/${appId}`);
            toast.success("Étudiant retiré.");
            fetchRooms();
            if (selectedRoom) {
               const updated = {...selectedRoom};
               updated.occupants = updated.occupants.filter(o => o.id !== appId);
               updated.occupancy_rate = (updated.occupants.length / updated.capacity) * 100;
               setSelectedRoom(updated);
            }
        } catch {
            toast.error("Erreur lors du retrait.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleAssignStudent = async (roomId, appId) => {
        setActionLoading(true);
        try {
            await api.post(`/rooms/${roomId}/assign/${appId}`);
            toast.success("Affecté avec succès !");
            setShowAssignModal(false);
            fetchRooms();
            setSelectedRoom(null);
        } catch (err) {
            toast.error(err.response?.data?.detail || "Erreur.");
        } finally {
            setActionLoading(false);
        }
    };

    const filteredRooms = rooms.filter(room => {
        const matchesSearch = room.room_number.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter =
            filter === 'all' ||
            (filter === 'available' && room.occupants.length < room.capacity) ||
            (filter === 'full' && room.occupants.length >= room.capacity);
        return matchesSearch && matchesFilter;
    });

    const getStatusColor = (room) => {
        if (room.occupancy_rate >= 100) return 'text-red-500 bg-red-500';
        if (room.occupancy_rate >= 75) return 'text-amber-500 bg-amber-500';
        return 'text-emerald-500 bg-emerald-500';
    };

    return (
        <div className="space-y-10">
            {/* Header Controls */}
            <div className="glass-panel p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex flex-1 items-center gap-3 w-full">
                    <div className="relative flex-1">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            className="form-input pl-12 h-11 border-none bg-slate-50 dark:bg-slate-900"
                            placeholder="N° de chambre..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        {['all', 'available', 'full'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${filter === f ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500'}`}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-400'}`}><LayoutGrid size={18} /></button>
                    <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-400'}`}><List size={18} /></button>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[1, 2, 3].map(i => <div key={i} className="glass-panel p-8 h-48 animate-pulse bg-slate-100" />)}
                </div>
            ) : (
                <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8" : "flex flex-col gap-4"}>
                    <AnimatePresence>
                        {filteredRooms.map((room) => (
                            <motion.div
                                layout
                                key={room.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="glass-panel p-6 cursor-pointer group hover:border-blue-500/50 relative overflow-hidden"
                                onClick={() => setSelectedRoom(room)}
                            >
                                <div className={`absolute top-0 right-0 w-1.5 h-full ${getStatusColor(room).split(' ')[1]}`}></div>

                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl">
                                            <Home size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-black text-slate-800 dark:text-white leading-tight">CH {room.room_number}</h4>
                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{room.gender_type}</p>
                                        </div>
                                    </div>
                                    <div className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                                        {room.occupants.length}/{room.capacity}
                                    </div>
                                </div>

                                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full mb-6 overflow-hidden">
                                    <div className={`h-full transition-all duration-500 ${getStatusColor(room).split(' ')[1]}`} style={{ width: `${room.occupancy_rate}%` }}></div>
                                </div>

                                <div className="flex -space-x-2 overflow-hidden">
                                    {room.occupants.map((occ, i) => (
                                        <div key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-slate-900 bg-gradient-main flex items-center justify-center text-[10px] font-black text-white">
                                            {occ.student_name.charAt(0)}
                                        </div>
                                    ))}
                                    {Array.from({ length: room.capacity - room.occupants.length }).map((_, i) => (
                                        <div key={i} className="inline-block h-8 w-8 rounded-full border-2 border-dashed border-slate-200 dark:border-slate-800 bg-transparent"></div>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Selected Room Side Panel */}
            <AnimatePresence>
                {selectedRoom && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedRoom(null)} className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[1100]" />
                        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white dark:bg-slate-900 z-[1200] shadow-2xl p-8 flex flex-col gap-8">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-1">Chambre {selectedRoom.room_number}</h2>
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{selectedRoom.gender_type === 'Male' ? 'Pavillon Hommes' : 'Pavillon Femmes'}</p>
                                </div>
                                <button onClick={() => setSelectedRoom(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><X size={24} /></button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Capacité</p>
                                    <p className="text-xl font-black">{selectedRoom.capacity} Lits</p>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Occupation</p>
                                    <p className="text-xl font-black text-blue-600">{Math.round(selectedRoom.occupancy_rate)}%</p>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-4">
                                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><Users size={14} /> Occupants Actuels</h3>
                                {selectedRoom.occupants.length === 0 ? (
                                    <div className="p-10 border-2 border-dashed border-slate-100 rounded-3xl text-center">
                                        <p className="text-slate-400 font-bold">Aucun occupant</p>
                                    </div>
                                ) : (
                                    selectedRoom.occupants.map(occ => (
                                        <div key={occ.id} className="glass-panel p-4 flex justify-between items-center group">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-black">{occ.student_name.charAt(0)}</div>
                                                <div>
                                                    <p className="font-bold text-slate-900 dark:text-white leading-none mb-1">{occ.student_name}</p>
                                                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">{occ.filiere}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => handleRemoveStudent(selectedRoom.id, occ.id)} className="p-2 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                                        </div>
                                    ))
                                )}
                            </div>

                            {selectedRoom.occupants.length < selectedRoom.capacity && (
                                <button onClick={() => { fetchUnassigned(); setShowAssignModal(true); }} className="btn btn-primary w-full py-4 text-sm font-black shadow-blue-500/20">
                                    <UserPlus size={20} className="mr-2" /> Affecter Étudiant
                                </button>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Assign Modal */}
            <AnimatePresence>
                {showAssignModal && (
                    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[2000] flex items-center justify-center p-6">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                                <h3 className="font-black text-xl">Choisir un Étudiant</h3>
                                <button onClick={() => setShowAssignModal(false)} className="p-2 hover:bg-slate-50 rounded-lg"><X size={20} /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {unassignedStudents.length === 0 ? (
                                    <p className="text-center py-10 text-slate-400 font-bold">Aucun étudiant en attente d'affectation.</p>
                                ) : (
                                    unassignedStudents.map(s => (
                                        <div key={s.id} className="p-4 rounded-2xl border border-slate-50 hover:border-blue-200 transition-colors flex justify-between items-center">
                                            <div>
                                                <p className="font-bold text-slate-900 leading-none mb-1">{s.student_name}</p>
                                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{s.filiere}</p>
                                            </div>
                                            <button onClick={() => handleAssignStudent(selectedRoom.id, s.id)} className="btn btn-primary py-2 px-6 text-xs font-black shadow-none">Affecter</button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default RoomManager;
