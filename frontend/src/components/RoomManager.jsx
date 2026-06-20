import React, { useEffect, useState } from 'react';
import api from '../lib/axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Home, Users, User, Settings, Info, Box,
    Search, Filter, ChevronRight, LayoutGrid, List,
    AlertCircle, CheckCircle, Clock, UserPlus, X, Trash2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

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
            if (selectedRoom) {
                const refreshed = res.data.find(r => r.id === selectedRoom.id);
                if (refreshed) setSelectedRoom(refreshed);
            }
        } catch (err) {
            toast.error("Échec du chargement des chambres.");
        } finally {
            setLoading(false);
        }
    };

    const fetchUnassigned = async () => {
        try {
            const res = await api.get('/rooms/unassigned-students');
            setUnassignedStudents(res.data);
        } catch (err) {
            toast.error("Échec du chargement des étudiants sans chambre.");
        }
    };

    const handleRemoveStudent = async (roomId, appId) => {
        if (!window.confirm("Voulez-vous vraiment retirer cet étudiant de cette chambre ?")) return;
        setActionLoading(true);
        try {
            await api.delete(`/rooms/${roomId}/remove/${appId}`);
            toast.success("Étudiant retiré avec succès.");
            fetchRooms();
        } catch (err) {
            toast.error("Erreur lors du retrait de l'étudiant.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleAssignStudent = async (roomId, appId) => {
        setActionLoading(true);
        try {
            await api.post(`/rooms/${roomId}/assign/${appId}`);
            toast.success("Étudiant affecté avec succès !");
            setShowAssignModal(false);
            fetchRooms();
        } catch (err) {
            toast.error(err.response?.data?.detail || "Erreur lors de l'affectation.");
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
        const rate = room.occupancy_rate;
        if (rate >= 100) return 'var(--danger)';
        if (rate >= 75) return 'var(--warning)';
        return 'var(--success)';
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Header & Controls */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                flexWrap: 'wrap', gap: '1.5rem', background: 'rgba(255,255,255,0.6)',
                padding: '1.5rem', borderRadius: '24px', border: '1px solid var(--card-border)',
                backdropFilter: 'blur(10px)', boxShadow: '0 8px 32px rgba(0,0,0,0.05)'
            }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.7 }} />
                        <input
                            className="form-input"
                            placeholder="Rechercher une chambre..."
                            style={{
                                width: '300px',
                                paddingLeft: '3rem',
                                marginBottom: 0,
                                borderRadius: '14px',
                                background: 'white',
                                border: '1px solid rgba(0,0,0,0.05)',
                                fontSize: '0.95rem'
                            }}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div style={{ display: 'flex', background: 'rgba(0,0,0,0.04)', padding: '5px', borderRadius: '14px', gap: '5px' }}>
                        {[
                            { id: 'all', label: 'Toutes' },
                            { id: 'available', label: 'Disponibles' },
                            { id: 'full', label: 'Pleines' }
                        ].map(f => (
                            <button
                                key={f.id}
                                onClick={() => setFilter(f.id)}
                                style={{
                                    padding: '0.6rem 1.2rem',
                                    border: 'none',
                                    borderRadius: '10px',
                                    fontSize: '0.85rem',
                                    fontWeight: '750',
                                    background: filter === f.id ? 'white' : 'transparent',
                                    color: filter === f.id ? 'var(--primary)' : 'var(--text-muted)',
                                    boxShadow: filter === f.id ? '0 4px 12px rgba(0,0,0,0.08)' : 'none',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    transform: filter === f.id ? 'scale(1.02)' : 'scale(1)'
                                }}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', background: 'rgba(0,0,0,0.04)', padding: '5px', borderRadius: '14px' }}>
                    <button
                        onClick={() => setViewMode('grid')}
                        style={{
                            padding: '0.6rem',
                            border: 'none',
                            borderRadius: '10px',
                            background: viewMode === 'grid' ? 'white' : 'transparent',
                            boxShadow: viewMode === 'grid' ? '0 4px 12px rgba(0,0,0,0.08)' : 'none',
                            cursor: 'pointer',
                            transition: 'all 0.3s'
                        }}
                    >
                        <LayoutGrid size={20} color={viewMode === 'grid' ? 'var(--primary)' : 'var(--text-muted)'} />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        style={{
                            padding: '0.6rem',
                            border: 'none',
                            borderRadius: '10px',
                            background: viewMode === 'list' ? 'white' : 'transparent',
                            boxShadow: viewMode === 'list' ? '0 4px 12px rgba(0,0,0,0.08)' : 'none',
                            cursor: 'pointer',
                            transition: 'all 0.3s'
                        }}
                    >
                        <List size={20} color={viewMode === 'list' ? 'var(--primary)' : 'var(--text-muted)'} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="loader-container" style={{ minHeight: '40vh' }}>
                    <div className="spinner"></div>
                </div>
            ) : (
                <motion.div
                    layout
                    style={{
                        display: viewMode === 'grid' ? 'grid' : 'flex',
                        flexDirection: 'column',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                        gap: '2rem'
                    }}
                >
                    <AnimatePresence mode='popLayout'>
                        {filteredRooms.map((room) => (
                            <motion.div
                                layout
                                key={room.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
                                className="glass-panel"
                                style={{
                                    padding: '1.75rem',
                                    border: '1px solid var(--card-border)',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    transition: 'box-shadow 0.3s ease'
                                }}
                                onClick={() => setSelectedRoom(room)}
                            >
                                {/* Active background glow for occupied status */}
                                <div style={{
                                    position: 'absolute', top: 0, right: 0, width: '6px', height: '100%',
                                    background: `linear-gradient(to bottom, ${getStatusColor(room)}, ${getStatusColor(room)}cc)`
                                }} />

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(79, 70, 229, 0.08)', color: 'var(--primary)' }}>
                                            <Home size={20} />
                                        </div>
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--text-main)', fontWeight: '900' }}>
                                                N° {room.room_number}
                                            </h4>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                {room.gender_type === 'Male' ? '🏢 Pavillon Garçons' : '🏢 Pavillon Filles'}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{
                                        padding: '6px 14px', borderRadius: '10px', background: 'var(--primary-bg)',
                                        fontSize: '0.9rem', fontWeight: '800', color: 'var(--primary)',
                                        border: '1px solid rgba(79, 70, 229, 0.1)'
                                    }}>
                                        {room.occupants.length} / {room.capacity}
                                    </div>
                                </div>

                                {/* Modern Capacity Progress Bar */}
                                <div style={{ height: '8px', background: 'rgba(0,0,0,0.05)', borderRadius: '10px', marginBottom: '1.5rem', overflow: 'hidden' }}>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(room.occupants.length / room.capacity) * 100}%` }}
                                        style={{ height: '100%', background: getStatusColor(room), borderRadius: '10px' }}
                                    />
                                </div>

                                {/* Bed Icons Grid - more visual */}
                                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                    {Array.from({ length: room.capacity }).map((_, idx) => {
                                        const isOccupied = idx < room.occupants.length;
                                        const occupant = isOccupied ? room.occupants[idx] : null;
                                        return (
                                            <div
                                                key={idx}
                                                title={occupant ? occupant.student_name : 'Place libre'}
                                                style={{
                                                    flex: 1, height: '48px', borderRadius: '12px',
                                                    background: isOccupied ? 'var(--primary)' : 'white',
                                                    border: isOccupied ? 'none' : '2px dashed rgba(0,0,0,0.1)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: isOccupied ? 'white' : 'var(--text-muted)',
                                                    boxShadow: isOccupied ? '0 6px 12px rgba(79, 70, 229, 0.2)' : 'none',
                                                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                                                }}
                                            >
                                                <User size={20} style={{ opacity: isOccupied ? 1 : 0.25 }} />
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Occupants Preview with Avatars */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {room.occupants.length > 0 ? (
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', marginRight: '10px' }}>
                                                {room.occupants.map((occ, i) => (
                                                    <div
                                                        key={i}
                                                        style={{
                                                            width: '28px', height: '28px', borderRadius: '50%',
                                                            background: 'var(--gradient-main)', border: '2px solid white',
                                                            marginLeft: i === 0 ? 0 : '-10px', display: 'flex',
                                                            alignItems: 'center', justifyContent: 'center',
                                                            fontSize: '0.7rem', fontWeight: '800', color: 'white',
                                                            zIndex: 5 - i, boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                        }}
                                                    >
                                                        {occ.student_name.charAt(0)}
                                                    </div>
                                                ))}
                                            </div>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: '600' }}>
                                                {room.occupants.length} étudiant{room.occupants.length > 1 ? 's' : ''} assigné{room.occupants.length > 1 ? 's' : ''}
                                            </span>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                                            <Clock size={14} /> Aucune occupation
                                        </div>
                                    )}
                                </div>

                                <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: getStatusColor(room), fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase' }}>
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: getStatusColor(room) }} />
                                        {room.occupancy_rate >= 100 ? 'Complet' : 'Disponible'}
                                    </div>
                                    <button
                                        onClick={() => setSelectedRoom(room)}
                                        className="btn-text"
                                        style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem', borderRadius: '8px', background: 'rgba(79, 70, 229, 0.05)' }}
                                    >
                                        Gérer <ChevronRight size={16} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}

            {/* Side Panel: Détails de la Chambre */}
            <AnimatePresence>
                {selectedRoom && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedRoom(null)}
                            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)', zIndex: 1100 }}
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            style={{
                                position: 'fixed', top: 0, right: 0, bottom: 0, width: '480px',
                                background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(30px)',
                                borderLeft: '1px solid var(--card-border)', padding: '3rem',
                                zIndex: 1200, display: 'flex', flexDirection: 'column', gap: '2.5rem',
                                boxShadow: '-20px 0 50px rgba(0,0,0,0.1)',
                                overflowY: 'auto'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                        <div style={{ padding: '8px', borderRadius: '10px', background: 'var(--primary-bg)', color: 'var(--primary)' }}>
                                            <Home size={20} />
                                        </div>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '750', textTransform: 'uppercase', letterSpacing: '1px' }}>Détails de la Chambre</span>
                                    </div>
                                    <h2 style={{ margin: 0, fontSize: '2.2rem', fontWeight: '900', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>Chambre {selectedRoom.room_number}</h2>
                                    <div style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1rem', borderRadius: '10px',
                                        background: getStatusColor(selectedRoom) + '15',
                                        color: getStatusColor(selectedRoom), fontWeight: '800', fontSize: '0.85rem', marginTop: '1rem'
                                    }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: getStatusColor(selectedRoom) }} />
                                        {selectedRoom.occupants.length >= selectedRoom.capacity ? 'Chambre Complète' : 'Places Disponibles'}
                                    </div>
                                </div>
                                <button onClick={() => setSelectedRoom(null)} className="btn-text" style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.04)', borderRadius: '14px', color: 'var(--text-muted)' }}><X size={24} /></button>
                            </div>

                            <div className="glass-panel" style={{ padding: '1.75rem', background: 'white', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '600' }}>Capacité Max</div>
                                    <div style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--text-main)' }}>{selectedRoom.capacity}</div>
                                </div>
                                <div style={{ textAlign: 'center', borderLeft: '1px solid var(--card-border)' }}>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '600' }}>Taux d'occupation</div>
                                    <div style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--primary)' }}>{Math.round(selectedRoom.occupancy_rate)}%</div>
                                </div>
                            </div>

                            <div>
                                <h4 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.1rem', fontWeight: '800' }}>
                                    <Users size={20} style={{ color: 'var(--primary)' }} />
                                    Occupants ({selectedRoom.occupants.length})
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    {selectedRoom.occupants.length === 0 ? (
                                        <div style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.02)', borderRadius: '20px', border: '2px dashed var(--card-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ opacity: 0.2 }}><Users size={48} /></div>
                                            <p style={{ margin: 0, fontWeight: '600' }}>Aucun étudiant affecté à cette chambre.</p>
                                        </div>
                                    ) : (
                                        selectedRoom.occupants.map(occ => (
                                            <motion.div
                                                layout
                                                key={occ.student_id}
                                                className="glass-panel"
                                                style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--gradient-main)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '1.1rem' }}>
                                                        {occ.student_name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--text-main)' }}>{occ.student_name}</div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>Étudiant Interne</div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveStudent(selectedRoom.id, occ.id)}
                                                    className="btn-text"
                                                    style={{ color: 'var(--danger)', padding: '0.6rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '10px' }}
                                                    title="Libérer cette place"
                                                    disabled={actionLoading}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {selectedRoom.occupants.length < selectedRoom.capacity && (
                                <button
                                    onClick={() => { fetchUnassigned(); setShowAssignModal(true); }}
                                    className="btn btn-primary"
                                    style={{
                                        marginTop: 'auto',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        justifyContent: 'center',
                                        padding: '1.25rem',
                                        borderRadius: '16px',
                                        fontWeight: '800',
                                        fontSize: '1rem',
                                        boxShadow: '0 10px 20px rgba(79, 70, 229, 0.2)'
                                    }}
                                >
                                    <UserPlus size={22} /> Affecter un étudiant
                                </button>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Modal: Affectation d'étudiant */}
            <AnimatePresence>
                {showAssignModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            style={{ background: 'white', padding: '2rem', borderRadius: '20px', width: '90%', maxWidth: '500px', boxShadow: 'var(--glass-shadow)' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                <h3 style={{ margin: 0 }}>Choisir un étudiant</h3>
                                <button onClick={() => setShowAssignModal(false)} className="btn-text"><X size={20} /></button>
                            </div>

                            <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {unassignedStudents.length === 0 ? (
                                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Aucun étudiant approuvé sans chambre.</p>
                                ) : (
                                    unassignedStudents.map(student => (
                                        <div key={student.id} className="glass-panel" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontWeight: '700' }}>{student.student_name}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{student.filiere}</div>
                                            </div>
                                            <button
                                                onClick={() => handleAssignStudent(selectedRoom.id, student.id)}
                                                className="btn btn-primary"
                                                style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
                                                disabled={actionLoading}
                                            >
                                                Affecter
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Room detail side panel or modal could go here */}
        </div>
    );
};

export default RoomManager;
