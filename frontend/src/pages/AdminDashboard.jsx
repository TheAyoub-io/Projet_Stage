import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import {
  BarChart3, Clock, CheckCircle, XCircle, Users,
  FileText, Eye, Filter, ChevronLeft, ChevronRight,
  Loader2, AlertCircle, Search, User, Download, Edit3, MessageCircle,
  Home, TrendingUp, CheckSquare, Square, Trash2, ArrowUpRight, X, Send, Phone, Smartphone, LayoutDashboard, Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
  PieChart, Pie, Legend
} from 'recharts';
import IntegratedDocumentViewer from '../components/IntegratedDocumentViewer';
import * as XLSX from 'xlsx';
import { toast } from 'react-hot-toast';
import RoomManager from '../components/RoomManager';
import ReviewPanel from '../components/ReviewPanel';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  // Filters & Pagination
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Stats & Tabs
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, waitlisted: 0, incomplete: 0 });
  const [analytics, setAnalytics] = useState({ by_province: [], by_filiere: [] });
  const [activeTab, setActiveTab] = useState('overview');
  const [exporting, setExporting] = useState(false);
  const [viewingApp, setViewingApp] = useState(null);

  const [selectedIds, setSelectedIds] = useState([]);
  const [isBulkMode, setIsBulkMode] = useState(false);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/admin/applications', { params });
      setApplications(res.data.items || []);
      setTotal(res.data.total);
      setTotalPages(res.data.pages);
    } catch (err) {
      if (err.response?.status === 401) navigate('/login');
      else setError("Erreur de chargement des candidatures");
    } finally { setLoading(false); }
  }, [page, statusFilter, navigate]);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [statsRes, analyticsRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/analytics')
        ]);
        setStats(statsRes.data);
        setAnalytics(analyticsRes.data);
      } catch (err) { console.error(err); }
    };
    fetchStats();
  }, []);

  const handleStatusChange = async (appId, newStatus, feedback = null) => {
    setActionLoading(appId);
    try {
      await api.patch(`/admin/applications/${appId}/status`, { status: newStatus, admin_feedback: feedback });
      toast.success("Statut mis à jour");
      fetchApplications();
      if (viewingApp?.id === appId) {
        setViewingApp(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) { toast.error("Erreur de mise à jour"); }
    finally { setActionLoading(null); }
  };

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

  const statCards = [
    { label: 'Total Dossiers', value: stats.total, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'En Attente', value: stats.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { label: 'Approuvés', value: stats.approved, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Incomplets', value: stats.incomplete, icon: AlertCircle, color: 'text-pink-600', bg: 'bg-pink-50 dark:bg-pink-900/20' },
  ];

  const COLORS = ['#1e3a8a', '#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="container mx-auto px-6 py-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-3 mb-2">
            <LayoutDashboard size={32} className="text-blue-600" />
            Espace Administration
          </h1>
          <p className="text-slate-500">Gestion centrale des admissions et de l'internat</p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={exportToExcel} disabled={exporting} className="btn btn-outline border-slate-200 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">
            <Download size={18} className="mr-2" />
            {exporting ? 'Export...' : 'Exporter Excel'}
          </button>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit mb-10 border border-slate-200 dark:border-slate-700">
        {[
          { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
          { id: 'applications', label: 'Candidatures', icon: FileText },
          { id: 'rooms', label: 'Chambres', icon: Home },
          { id: 'sms', label: 'SMS & Notifs', icon: Smartphone },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-10 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((card, i) => (
              <div key={i} className="glass-panel p-6 flex items-center gap-5">
                <div className={`w-14 h-14 rounded-2xl ${card.bg} ${card.color} flex items-center justify-center shadow-sm`}>
                  <card.icon size={28} />
                </div>
                <div>
                  <h4 className="text-2xl font-black text-slate-800 dark:text-white leading-none mb-1">{card.value}</h4>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{card.label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             <div className="glass-panel p-8">
                <h3 className="text-lg font-bold mb-8 flex items-center gap-2">
                  <TrendingUp size={20} className="text-blue-600" />
                  Répartition par Statut
                </h3>
                <div className="h-[300px]">
                   <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                         <Pie
                            data={[
                              { name: 'Approuvés', value: stats.approved, fill: '#10b981' },
                              { name: 'En attente', value: stats.pending, fill: '#f59e0b' },
                              { name: 'Incomplets', value: stats.incomplete, fill: '#ec4899' },
                              { name: 'Rejetés', value: stats.rejected, fill: '#ef4444' }
                            ]}
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                            cornerRadius={6}
                         />
                         <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                         />
                         <Legend iconType="circle" layout="vertical" align="right" verticalAlign="middle" />
                      </PieChart>
                   </ResponsiveContainer>
                </div>
             </div>

             <div className="glass-panel p-8">
                <h3 className="text-lg font-bold mb-8 flex items-center gap-2">
                  <GraduationCap size={20} className="text-blue-600" />
                  Top Filières
                </h3>
                <div className="h-[300px]">
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.by_filiere?.slice(0, 5)}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                         <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                         <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                         <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                         <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                            {analytics.by_filiere?.map((entry, index) => (
                               <Cell key={index} fill={COLORS[index % COLORS.length]} />
                            ))}
                         </Bar>
                      </BarChart>
                   </ResponsiveContainer>
                </div>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'applications' && (
        <div className="space-y-6 animate-in fade-in duration-500">
           <div className="glass-panel p-4 flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1">
                 <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                 <input
                    className="form-input pl-12 bg-slate-50 dark:bg-slate-900 border-none h-12"
                    placeholder="Chercher par nom, email ou CIN..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                 />
              </div>
              <select
                className="form-input w-full md:w-56 h-12 bg-slate-50 dark:bg-slate-900 border-none font-semibold text-slate-600"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="approved">Approuvés</option>
                <option value="incomplete">Incomplets</option>
                <option value="rejected">Rejetés</option>
              </select>
           </div>

           <div className="glass-panel overflow-hidden border-none shadow-xl shadow-slate-200/50 dark:shadow-none">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                      <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Étudiant</th>
                      <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Filière / Type</th>
                      <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Moyenne</th>
                      <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Statut</th>
                      <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {applications.filter(app => {
                       const q = searchQuery.toLowerCase();
                       const p = app.profile || {};
                       return (p.full_name || '').toLowerCase().includes(q) || (app.student_email || '').toLowerCase().includes(q) || (p.cin || '').toLowerCase().includes(q);
                    }).map(app => (
                      <tr key={app.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center font-bold">
                                {app.profile?.full_name?.charAt(0) || 'E'}
                             </div>
                             <div>
                                <p className="font-bold text-slate-800 dark:text-slate-100 leading-none mb-1">{app.profile?.full_name || 'Inconnu'}</p>
                                <p className="text-xs text-slate-400 font-medium">{app.student_email}</p>
                             </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-sm font-medium">
                          <p className="text-slate-700 dark:text-slate-300 mb-1">{app.filière}</p>
                          <p className="text-xs text-slate-400 uppercase font-bold">{app.student_type}</p>
                        </td>
                        <td className="px-6 py-5 text-center">
                           <span className="inline-block px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg font-black">
                              {parseFloat(app.grade_average).toFixed(2)}
                           </span>
                        </td>
                        <td className="px-6 py-5">
                           <StatusBadge status={app.status} />
                        </td>
                        <td className="px-6 py-5 text-right">
                           <button onClick={() => setViewingApp(app)} className="btn btn-primary px-4 py-2 text-sm shadow-none">
                              Détails
                           </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                   <p className="text-sm font-bold text-slate-400">Page {page} sur {totalPages}</p>
                   <div className="flex gap-2">
                      <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30"><ChevronLeft size={18} /></button>
                      <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages} className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30"><ChevronRight size={18} /></button>
                   </div>
                </div>
              )}
           </div>
        </div>
      )}

      {activeTab === 'rooms' && <RoomManager />}
      {activeTab === 'sms' && <SMSPanel />}

      <AnimatePresence>
        {viewingApp && (
          <ReviewPanel
            application={viewingApp}
            onClose={() => setViewingApp(null)}
            onStatusChange={handleStatusChange}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const styles = {
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
    incomplete: 'bg-pink-100 text-pink-700 border-pink-200',
    waitlisted: 'bg-indigo-100 text-indigo-700 border-indigo-200'
  };
  const labels = {
    pending: 'En attente',
    approved: 'Approuvé',
    rejected: 'Rejeté',
    incomplete: 'Incomplet',
    waitlisted: 'Liste d\'attente'
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${styles[status] || styles.pending}`}>
      {labels[status] || status}
    </span>
  );
};

const SMSPanel = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/admin/sms/inactive-students');
        setStudents(res.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const toggleSelect = (id) => setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const handleSend = async () => {
    if (!message.trim() || selected.length === 0) return;
    setSending(true);
    try {
      const phones = students.filter(s => selected.includes(s.id)).map(s => s.phone);
      await api.post('/admin/sms/send', { phone_numbers: phones, message });
      toast.success("Messages envoyés !");
      setSelected([]);
      setMessage('');
    } catch (err) { toast.error("Erreur d'envoi"); }
    finally { setSending(false); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
      <div className="lg:col-span-2 glass-panel p-0 overflow-hidden">
         <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h3 className="font-bold">Étudiants inactifs ({students.length})</h3>
            <button onClick={() => setSelected(selected.length === students.length ? [] : students.map(s => s.id))} className="text-xs font-bold text-blue-600">
               {selected.length === students.length ? 'Tout désélectionner' : 'Tout sélectionner'}
            </button>
         </div>
         <div className="max-h-[600px] overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800">
            {students.map(s => (
              <div key={s.id} onClick={() => toggleSelect(s.id)} className={`p-4 flex items-center gap-4 cursor-pointer transition-colors ${selected.includes(s.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'}`}>
                 <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${selected.includes(s.id) ? 'bg-blue-600 border-blue-600' : 'border-slate-300 dark:border-slate-600'}`}>
                    {selected.includes(s.id) && <CheckSquare size={14} className="text-white" />}
                 </div>
                 <div className="flex-1">
                    <p className="font-bold text-sm leading-none mb-1">{s.full_name}</p>
                    <p className="text-xs text-slate-400">{s.phone} • {s.email}</p>
                 </div>
              </div>
            ))}
         </div>
      </div>
      <div className="space-y-6">
         <div className="glass-panel p-6">
            <h4 className="font-bold mb-4 flex items-center gap-2"><Smartphone size={18} /> Rédiger le SMS</h4>
            <textarea
               className="form-input h-40 resize-none text-sm"
               placeholder="Entrez votre message ici..."
               value={message}
               onChange={e => setMessage(e.target.value)}
            />
            <div className="flex justify-between items-center mt-4">
               <span className="text-xs font-bold text-slate-400">{message.length}/160</span>
               <button
                  disabled={sending || !message.trim() || selected.length === 0}
                  onClick={handleSend}
                  className="btn btn-primary px-6 group"
               >
                  {sending ? '...' : 'Envoyer'}
                  <Send size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
               </button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
