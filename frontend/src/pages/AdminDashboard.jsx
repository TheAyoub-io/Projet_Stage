import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import {
  BarChart3, Clock, CheckCircle, XCircle, Users,
  FileText, Eye, Filter, ChevronLeft, ChevronRight,
  Loader2, AlertCircle, Search, User, Download, Edit3, MessageCircle,
  Home, TrendingUp, CheckSquare, Square, Trash2, ArrowUpRight, X, Send, Phone, Smartphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
  PieChart, Pie, LineChart, Line, AreaChart, Area
} from 'recharts';
import IntegratedDocumentViewer from '../components/IntegratedDocumentViewer';
import * as XLSX from 'xlsx';
import { toast } from 'react-hot-toast';
import RoomManager from '../components/RoomManager';
import ReviewPanel from '../components/ReviewPanel';

const PROVINCES = ['Beni Mellal', 'Azilal', 'Fkih Ben Salah', 'Khénifra', 'Khouribga'];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  // Filtres & Pagination
  const [statusFilter, setStatusFilter] = useState('');
  const [provinceFilter, setProvinceFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [studentTypeFilter, setStudentTypeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Stats & Onglets
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, waitlisted: 0, incomplete: 0 });
  const [analytics, setAnalytics] = useState({ by_province: [], by_filiere: [] });
  const [activeBarChart, setActiveBarChart] = useState('filiere');
  const [exporting, setExporting] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState({ isOpen: false, appId: null, feedback: '' });
  const [activeTab, setActiveTab] = useState('applications');

  const [viewingApp, setViewingApp] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [docViewer, setDocViewer] = useState({ isOpen: false, docs: [], index: 0 });

  useEffect(() => {
    let interval;
    if (viewingApp?.id) {
      const fetchChat = async () => {
        try {
          const res = await api.get(`/applications/${viewingApp.id}/messages`);
          setMessages(res.data);
        } catch (err) { console.error(err); }
      };
      fetchChat();
      interval = setInterval(fetchChat, 4000);
    } else {
      setMessages([]);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [viewingApp?.id]);

  const handleSendAdminMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !viewingApp?.id) return;
    setChatLoading(true);
    try {
      const res = await api.post(`/applications/${viewingApp.id}/messages`, { message: newMessage });
      setMessages(prev => [...prev, res.data]);
      setNewMessage('');
      const container = document.getElementById('admin-chat-box');
      if (container) {
        setTimeout(() => { container.scrollTop = container.scrollHeight; }, 100);
      }
    } catch (err) { toast.error("Erreur d'envoi"); }
    finally { setChatLoading(false); }
  };

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/admin/applications', { params });
      setApplications(res.data.items || []);
      setTotal(res.data.total);
      setTotalPages(res.data.pages);
    } catch (err) {
      if (err.response?.status === 401) navigate('/login');
    } finally { setLoading(false); }
  }, [page, statusFilter, navigate]);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/stats');
        setStats(res.data);
        const resAnalytics = await api.get('/admin/analytics');
        setAnalytics(resAnalytics.data);
      } catch { }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    const handleNotifClick = async (e) => {
      if (e.detail.type === 'message' && e.detail.id) {
        try {
          const res = await api.get(`/admin/applications/${e.detail.id}`);
          setViewingApp(res.data);
          setActiveTab('applications'); // Ensure we are on the right tab
        } catch (err) {
          toast.error("Impossible d'ouvrir la conversation");
        }
      }
    };
    window.addEventListener('notification-click', handleNotifClick);
    return () => window.removeEventListener('notification-click', handleNotifClick);
  }, []);

  const handleStatusChange = async (appId, newStatus, feedback = null) => {
    setActionLoading(appId);
    try {
      await api.patch(`/admin/applications/${appId}/status`, { status: newStatus, admin_feedback: feedback });
      toast.success("Statut mis à jour");
      fetchApplications();
      setFeedbackModal({ isOpen: false, appId: null, feedback: '' });
      if (viewingApp?.id === appId) {
        setViewingApp(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) { toast.error("Erreur de mise à jour"); }
    finally { setActionLoading(null); }
  };

  const handleBulkAction = async (newStatus) => {
    if (selectedIds.length === 0) return;
    setActionLoading('bulk');
    try {
      await Promise.all(selectedIds.map(id => api.patch(`/admin/applications/${id}/status`, { status: newStatus })));
      toast.success("Mise à jour groupée réussie");
      setSelectedIds([]);
      setIsBulkMode(false);
      fetchApplications();
    } catch (err) { toast.error("Certaines erreurs sont survenues"); }
    finally { setActionLoading(null); }
  };

  const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const toggleSelectAll = () => setSelectedIds(selectedIds.length === filtered.length ? [] : filtered.map(a => a.id));

  const filtered = applications.filter(app => {
    const p = app.profile || {};
    const q = searchQuery.toLowerCase();
    if (searchQuery && !((p.full_name || '').toLowerCase().includes(q) || (app.student_email || '').toLowerCase().includes(q) || (p.cin || '').toLowerCase().includes(q))) return false;
    if (provinceFilter && p.province !== provinceFilter) return false;
    if (cityFilter && (p.city || '').toLowerCase() !== cityFilter.toLowerCase()) return false;
    if (studentTypeFilter && app.student_type !== studentTypeFilter) return false;
    return true;
  });

  const uniqueCities = Array.from(new Set(applications.map(app => app.profile?.city).filter(Boolean)));
  const statCards = [
    { label: 'Total Dossiers', value: stats.total || 0, icon: Users, color: 'var(--primary)', bg: 'rgba(99, 102, 241, 0.1)' },
    { label: 'En Attente', value: stats.pending || 0, icon: Clock, color: 'var(--warning)', bg: 'var(--warning-bg)' },
    { label: 'Approuvés', value: stats.approved || 0, icon: CheckCircle, color: 'var(--success)', bg: 'var(--success-bg)' },
    { label: 'Incomplets', value: stats.incomplete || 0, icon: Edit3, color: '#ec4899', bg: 'rgba(236, 72, 153, 0.1)' },
  ];

  const exportToExcel = async () => {
    setExporting(true);
    try {
      const res = await api.get('/admin/applications', { params: { limit: 1000 } });
      const worksheet = XLSX.utils.json_to_sheet(res.data.items);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Candidatures");
      XLSX.writeFile(workbook, "Candidatures_Internat.xlsx");
    } finally { setExporting(false); }
  };

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="container" style={{ padding: '2.5rem 2rem' }}>
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <BarChart3 size={36} style={{ color: 'var(--primary)' }} />
            Espace Administration
          </h1>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', background: 'rgba(0,0,0,0.05)', padding: '6px', borderRadius: '14px', width: 'fit-content' }}>
            <button onClick={() => setActiveTab('applications')} style={{ padding: '0.6rem 1.25rem', border: 'none', borderRadius: '10px', fontWeight: '700', background: activeTab === 'applications' ? 'white' : 'transparent', color: activeTab === 'applications' ? 'var(--primary)' : 'var(--text-muted)', boxShadow: activeTab === 'applications' ? '0 4px 12px rgba(0,0,0,0.08)' : 'none', cursor: 'pointer' }}>Candidatures</button>
            <button onClick={() => setActiveTab('rooms')} style={{ padding: '0.6rem 1.25rem', border: 'none', borderRadius: '10px', fontWeight: '700', background: activeTab === 'rooms' ? 'white' : 'transparent', color: activeTab === 'rooms' ? 'var(--primary)' : 'var(--text-muted)', boxShadow: activeTab === 'rooms' ? '0 4px 12px rgba(0,0,0,0.08)' : 'none', cursor: 'pointer' }}>Chambres</button>
            <button onClick={() => setActiveTab('sms')} style={{ padding: '0.6rem 1.25rem', border: 'none', borderRadius: '10px', fontWeight: '700', background: activeTab === 'sms' ? 'white' : 'transparent', color: activeTab === 'sms' ? 'var(--primary)' : 'var(--text-muted)', boxShadow: activeTab === 'sms' ? '0 4px 12px rgba(0,0,0,0.08)' : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Smartphone size={16} />SMS</button>
          </div>
        </div>
        {activeTab === 'applications' && <button className="btn btn-primary" onClick={exportToExcel} disabled={exporting}>Exporter Excel</button>}
      </motion.div>

      {activeTab === 'applications' ? (
        <>
          <AnimatePresence>
            {isBulkMode && selectedIds.length > 0 && (
              <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }} style={{ position: 'sticky', top: '20px', zIndex: 100, background: 'var(--primary)', color: 'white', padding: '1rem', borderRadius: '12px', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{selectedIds.length} sélectionnés</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => handleBulkAction('approved')} className="btn" style={{ background: 'white', color: 'var(--success)' }}>Approuver</button>
                  <button onClick={() => setIsBulkMode(false)} className="btn btn-outline" style={{ color: 'white', borderColor: 'white' }}>Annuler</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {statCards.map((s, i) => (
              <div key={i} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <s.icon size={22} color={s.color} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '800' }}>{s.value}</h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500' }}>{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
            {/* Chart 1: Statut des Dossiers */}
            <div className="glass-panel" style={{ padding: '2rem', minHeight: '420px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)' }}>Statut des Dossiers</h3>
                <TrendingUp size={20} style={{ color: 'var(--primary)', opacity: 0.6 }} />
              </div>
              <div style={{ flex: 1, position: 'relative' }}>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <defs>
                      <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#059669" stopOpacity={0.8} />
                      </linearGradient>
                      <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#d97706" stopOpacity={0.8} />
                      </linearGradient>
                      <linearGradient id="colorRejected" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#dc2626" stopOpacity={0.8} />
                      </linearGradient>
                      <linearGradient id="colorIncomplete" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#db2777" stopOpacity={0.8} />
                      </linearGradient>
                    </defs>
                    <Pie
                      data={[
                        { name: 'Approuvés', value: stats.approved || 0, fill: "url(#colorApproved)" },
                        { name: 'En attente', value: stats.pending || 0, fill: "url(#colorPending)" },
                        { name: 'Incomplets', value: stats.incomplete || 0, fill: "url(#colorIncomplete)" },
                        { name: 'Rejetés', value: stats.rejected || 0, fill: "url(#colorRejected)" }
                      ]}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={5}
                      cornerRadius={8}
                      stroke="none"
                    >
                      {(analytics.by_province || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} style={{ outline: 'none' }} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: '16px',
                        border: '1px solid var(--card-border)',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(10px)',
                        padding: '10px 15px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Label */}
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
                  <div style={{ fontSize: '2.4rem', fontWeight: '900', color: 'var(--text-main)', lineHeight: 1 }}>{stats.total}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>TOTAL DOSSIERS</div>
                </div>
              </div>
              {/* Custom Legend */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1.5rem' }}>
                {[
                  { label: 'Approuvés', color: '#10b981', value: stats.approved },
                  { label: 'En attente', color: '#f59e0b', value: stats.pending },
                  { label: 'Incomplets', color: '#ec4899', value: stats.incomplete },
                  { label: 'Rejetés', color: '#ef4444', value: stats.rejected }
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.02)', padding: '6px 10px', borderRadius: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color }} />
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', flex: 1 }}>{item.label}</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-main)' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 2: Distribution par Filière */}
            <div className="glass-panel" style={{ padding: '2rem', minHeight: '420px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)' }}>Distribution par Filière</h3>
                <div style={{ display: 'flex', background: 'rgba(0,0,0,0.05)', padding: '4px', borderRadius: '10px' }}>
                  <button onClick={() => setActiveBarChart('filiere')} style={{ padding: '4px 12px', border: 'none', borderRadius: '7px', fontSize: '0.75rem', fontWeight: '700', background: activeBarChart === 'filiere' ? 'white' : 'transparent', color: activeBarChart === 'filiere' ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer' }}>Filière</button>
                  <button onClick={() => setActiveBarChart('province')} style={{ padding: '4px 12px', border: 'none', borderRadius: '7px', fontSize: '0.75rem', fontWeight: '700', background: activeBarChart === 'province' ? 'white' : 'transparent', color: activeBarChart === 'province' ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer' }}>Province</button>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={activeBarChart === 'filiere' ? analytics.by_filiere : analytics.by_province}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: '600', fill: 'var(--text-muted)' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: '600', fill: 'var(--text-muted)' }}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(0,0,0,0.02)', radius: 8 }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', background: 'rgba(255, 255, 255, 0.95)' }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={activeBarChart === 'filiere' ? 40 : 60}>
                    {(activeBarChart === 'filiere' ? analytics.by_filiere : analytics.by_province).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input className="form-input" style={{ paddingLeft: '2.6rem', marginBottom: 0, borderRadius: '12px' }} placeholder="Rechercher par nom, CIN ou email..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <select className="form-input" style={{ width: '180px', marginBottom: 0, borderRadius: '12px' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="approved">Approuvé</option>
              <option value="incomplete">Incomplet</option>
              <option value="rejected">Rejeté</option>
            </select>
            <button onClick={() => setIsBulkMode(!isBulkMode)} className={`btn ${isBulkMode ? 'btn-primary' : 'btn-outline'}`} style={{ borderRadius: '12px' }}>
              {isBulkMode ? 'Annuler Profils' : 'Sélection Groupée'}
            </button>
          </div>

          <div className="glass-panel" style={{ padding: 0, overflowX: 'auto', borderRadius: '16px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--card-border)', background: 'rgba(0,0,0,0.02)' }}>
                  {isBulkMode && <th style={{ padding: '1.25rem' }}></th>}
                  <th style={{ padding: '1.25rem', fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Étudiant</th>
                  <th style={{ padding: '1.25rem', fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Filière</th>
                  <th style={{ padding: '1.25rem', fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Moyenne</th>
                  <th style={{ padding: '1.25rem', fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Statut</th>
                  <th style={{ padding: '1.25rem', fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(app => (
                  <tr key={app.id} style={{ borderBottom: '1px solid var(--card-border)', transition: 'all 0.2s' }} className="table-row-hover">
                    {isBulkMode && <td style={{ padding: '1.25rem' }}><input type="checkbox" checked={selectedIds.includes(app.id)} onChange={() => toggleSelect(app.id)} /></td>}
                    <td style={{ padding: '1.25rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>{app.profile?.full_name || 'Non renseigné'}</span>
                          {app.has_new_message && (
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ repeat: Infinity, duration: 2 }}
                              style={{ color: 'var(--primary)', display: 'flex' }}
                              title="Nouveau message"
                            >
                              <MessageCircle size={14} fill="var(--primary)" />
                            </motion.div>
                          )}
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{app.student_email}</span>
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem', fontWeight: '500' }}>{app.filière}</td>
                    <td style={{ padding: '1.25rem', fontWeight: '700' }}>{parseFloat(app.grade_average).toFixed(2)}</td>
                    <td style={{ padding: '1.25rem' }}><StatusBadge status={app.status} /></td>
                    <td style={{ padding: '1.25rem', textAlign: 'center' }}>
                      <button className="btn btn-outline" style={{ padding: '0.4rem 1rem', borderRadius: '10px', fontSize: '0.85rem' }} onClick={() => setViewingApp(app)}>
                        <Eye size={16} /> Détails
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1.5rem', borderTop: '1px solid var(--card-border)' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Page {page} sur {totalPages}</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="btn btn-outline" style={{ padding: '0.5rem' }}><ChevronLeft size={18} /></button>
                  <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages} className="btn btn-outline" style={{ padding: '0.5rem' }}><ChevronRight size={18} /></button>
                </div>
              </div>
            )}
          </div>
        </>
      ) : activeTab === 'rooms' ? (
        <RoomManager />
      ) : (
        <SMSPanel />
      )}

      <AnimatePresence>
        {viewingApp && (
          <ReviewPanel
            application={viewingApp}
            onClose={() => setViewingApp(null)}
            onStatusChange={handleStatusChange}
          />
        )}
      </AnimatePresence>

      <IntegratedDocumentViewer isOpen={docViewer.isOpen} onClose={() => setDocViewer({ ...docViewer, isOpen: false })} documents={docViewer.docs} initialIndex={docViewer.index} />

      {/* Feedback Modal for Incomplete status */}
      {feedbackModal.isOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel" style={{ padding: '2rem', maxWidth: '450px', width: '90%', background: 'white' }}>
            <h3 style={{ marginBottom: '1rem' }}>Préciser le motif</h3>
            <textarea className="form-input" rows={4} placeholder="Ex: La copie de la CIN est illisible..." value={feedbackModal.feedback} onChange={e => setFeedbackModal({ ...feedbackModal, feedback: e.target.value })} />
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button onClick={() => setFeedbackModal({ isOpen: false, appId: null, feedback: '' })} className="btn btn-outline" style={{ flex: 1 }}>Annuler</button>
              <button onClick={() => handleStatusChange(feedbackModal.appId, 'incomplete', feedbackModal.feedback)} disabled={!feedbackModal.feedback.trim()} className="btn btn-primary" style={{ flex: 1 }}>Envoyer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const configs = {
    pending: { label: 'En attente', color: '#f59e0b', bg: '#fef3c7' },
    approved: { label: 'Approuvé', color: '#10b981', bg: '#d1fae5' },
    rejected: { label: 'Rejeté', color: '#ef4444', bg: '#fee2e2' },
    incomplete: { label: 'Incomplet', color: '#ec4899', bg: '#fce7f3' },
    waitlisted: { label: 'Liste attente', color: '#8b5cf6', bg: '#ede9fe' }
  };
  const c = configs[status] || configs.pending;
  return <span style={{ padding: '0.3rem 0.75rem', borderRadius: '8px', background: c.bg, color: c.color, fontSize: '0.8rem', fontWeight: '800', display: 'inline-block' }}>{c.label}</span>;
};

export default AdminDashboard;

const SMSPanel = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [smsStatus, setSmsStatus] = useState({ enabled: false, simulated: true });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsRes, statusRes] = await Promise.all([
          api.get('/admin/sms/inactive-students'),
          api.get('/admin/sms/status')
        ]);
        setStudents(studentsRes.data);
        setSmsStatus(statusRes.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const toggleSelect = (id) => setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const toggleAll = () => setSelected(selected.length === students.length ? [] : students.map(s => s.id));

  const handleSend = async () => {
    if (!message.trim() || selected.length === 0) return;
    const phones = students.filter(s => selected.includes(s.id)).map(s => s.phone);
    setSending(true); setResult(null);
    try {
      const res = await api.post('/admin/sms/send', { phone_numbers: phones, message });
      setResult(res.data);
      if (res.data.sent > 0) toast.success(`${res.data.sent} SMS envoyé(s) avec succès !`);
    } catch (err) { toast.error(err.response?.data?.detail || "Erreur d'envoi SMS"); }
    finally { setSending(false); }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', alignItems: 'start' }}>
      {/* Left: Student List */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>Étudiants sans candidature</h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {students.length} étudiant(s) inscrit(s) mais inactifs
            </p>
          </div>
          <button onClick={toggleAll} className="btn btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
            {selected.length === students.length ? 'Tout désélectionner' : 'Tout sélectionner'}
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}><Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} /></div>
        ) : students.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <CheckCircle size={40} style={{ opacity: 0.2 }} />
            <p style={{ marginTop: '1rem' }}>Tous les étudiants ont soumis une candidature.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '55vh', overflowY: 'auto' }}>
            {students.map(s => (
              <div key={s.id} onClick={() => toggleSelect(s.id)} className="glass-panel"
                style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', background: selected.includes(s.id) ? 'rgba(79,70,229,0.06)' : 'transparent', border: selected.includes(s.id) ? '1px solid rgba(79,70,229,0.3)' : '1px solid var(--card-border)', transition: 'all 0.2s' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '5px', border: '2px solid', borderColor: selected.includes(s.id) ? 'var(--primary)' : 'var(--text-muted)', background: selected.includes(s.id) ? 'var(--primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {selected.includes(s.id) && <CheckCircle size={12} color="white" />}
                </div>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--gradient-main)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', flexShrink: 0 }}>
                  {s.full_name.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700' }}>{s.full_name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem' }}>
                    <span>{s.email}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Phone size={12} />{s.phone}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right: Composer */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h4 style={{ margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Smartphone size={18} /> Rédiger le Message</h4>
          <textarea
            className="form-input"
            rows={6}
            maxLength={160}
            placeholder="Bonjour, nous vous rappelons que votre candidature à l'internat est en attente. Veuillez vous connecter pour finaliser votre dossier."
            value={message}
            onChange={e => setMessage(e.target.value)}
            style={{ resize: 'none', fontFamily: 'inherit', lineHeight: '1.6' }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '0.8rem', color: message.length > 140 ? 'var(--danger)' : 'var(--text-muted)', marginTop: '0.5rem' }}>
            {message.length} / 160
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '1rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Destinataires sélectionnés</span>
            <strong style={{ color: 'var(--primary)' }}>{selected.length}</strong>
          </div>
          <button
            onClick={handleSend}
            disabled={sending || selected.length === 0 || !message.trim()}
            className="btn btn-primary"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem' }}
          >
            {sending ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={18} />}
            {smsStatus.simulated ? 'Simuler l\'envoi' : `Envoyer ${selected.length} SMS`}
          </button>
        </div>

        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel" style={{ padding: '1.5rem', borderLeft: `4px solid ${result.failed === 0 ? 'var(--success)' : 'var(--warning)'}` }}>
            <div style={{ fontWeight: '700', marginBottom: '0.5rem' }}>Résultat de l'envoi</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              ✅ {result.sent} envoyé(s) {result.simulated && '(simulation)'}<br />
              {result.failed > 0 && `❌ ${result.failed} échoué(s)`}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

