import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, LayoutDashboard, BarChart3, FileText, Home, Mail, User, ChevronRight, Menu, X, LogOut, MessageSquareWarning } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import adminService from '../services/admin.service';
import AdminOverview from '../features/admin/AdminOverview';
import AdminApplications from '../features/admin/AdminApplications';
import RoomManager from '../components/RoomManager';
import AdminReclamations from '../features/admin/AdminReclamations';
import logoImg from '../assets/official_logo.png';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');
  const [applicationsFilter, setApplicationsFilter] = useState('');
  const [exporting, setExporting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigateToApplications = (filter = '') => {
    setApplicationsFilter(filter);
    setActiveTab('applications');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const exportToExcel = async () => {
    setExporting(true);
    try {
      const res = await adminService.getApplications({ limit: 1000 });
      const flatData = res.items.map(app => ({
        "ID": app.id,
        "Nom complet": app.profile?.full_name || 'N/A',
        "Email": app.student_email || 'N/A',
        "Téléphone": app.profile?.phone || 'N/A',
        "CIN": app.profile?.cin || 'N/A',
        "Sexe": app.profile?.gender || 'N/A',
        "Ville": app.profile?.city || 'N/A',
        "Type": app.student_type || 'N/A',
        "Filière": app.filière || app.filiere || 'N/A',
        "Moyenne": app.grade_average || 'N/A',
        "Statut": app.status || 'N/A',
        "Chambre": app.room?.room_number || 'Non affectée',
        "Date de candidature": app.created_at ? new Date(app.created_at).toLocaleDateString() : 'N/A'
      }));
      const worksheet = XLSX.utils.json_to_sheet(flatData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Candidatures");
      XLSX.writeFile(workbook, "Candidatures_Internat.xlsx");
    } catch (err) {
      console.error("Excel Export Error:", err);
      toast.error("Erreur d'exportation Excel. Veuillez réessayer.");
    } finally { setExporting(false); }
  };

  useEffect(() => {
    const handleToggle = () => setSidebarOpen(prev => !prev);
    window.addEventListener('toggleAdminSidebar', handleToggle);
    return () => window.removeEventListener('toggleAdminSidebar', handleToggle);
  }, []);

  const tabConfig = [
    { id: 'overview', label: t('overview') || 'Vue d\'ensemble', icon: BarChart3, bg: 'bg-emerald-100', color: 'text-emerald-600' },
    { id: 'applications', label: t('applications') || 'Candidatures', icon: FileText, bg: 'bg-purple-100', color: 'text-purple-600' },
    { id: 'rooms', label: t('rooms') || 'Chambres', icon: Home, bg: 'bg-teal-100', color: 'text-teal-600' },
    { id: 'reclamations', label: t('reclamations') || 'Réclamations', icon: MessageSquareWarning, bg: 'bg-pink-100', color: 'text-pink-600' },
  ];

  return (
    <div className="flex flex-1 w-full bg-slate-50 relative overflow-hidden min-h-screen">
      {/* Decorative background blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-400/20 mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-400/20 mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
      </div>
      
      {/* Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      <div className={`fixed inset-y-0 left-0 w-72 bg-white/80 backdrop-blur-xl border-r border-white/40 shadow-2xl z-50 transform transition-transform duration-300 flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Sidebar Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-5 flex items-center justify-between shrink-0 rounded-tr-3xl md:rounded-none">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white shrink-0 overflow-hidden p-1 shadow-sm">
              <img src={logoImg} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <div className="font-extrabold text-xl text-white tracking-wider truncate">e - Internat</div>
            </div>
          </div>
          <button className="p-1.5 bg-white/20 rounded-full text-white hover:bg-white/30 backdrop-blur-sm transition-colors shrink-0" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Sidebar Links */}
        <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-3">
          {tabConfig.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
                className={`group flex items-center justify-between w-full p-4 rounded-2xl transition-all duration-300 ${
                  isActive 
                    ? 'border border-emerald-200 bg-white shadow-lg shadow-emerald-500/10 scale-[1.02]' 
                    : 'border border-transparent hover:bg-white/50 hover:shadow-sm hover:scale-[1.02]'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${tab.bg} ${tab.color} ${isActive ? 'shadow-inner' : ''}`}>
                    <tab.icon size={24} />
                  </div>
                  <span className={`font-extrabold text-base transition-colors duration-300 ${isActive ? 'text-emerald-700' : 'text-slate-600 group-hover:text-slate-900'}`}>
                    {tab.label}
                  </span>
                </div>
                <ChevronRight size={18} className={`transition-transform duration-300 ${isActive ? 'text-emerald-500' : 'text-slate-300 group-hover:translate-x-1 group-hover:text-slate-400'}`} />
              </button>
            )
          })}
        </div>

        {/* Logout Section */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="group flex items-center justify-between w-full p-4 rounded-2xl transition-all duration-300 border border-transparent hover:bg-red-50 hover:border-red-100 hover:shadow-sm hover:scale-[1.02]"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-100 text-slate-500 transition-all duration-300 group-hover:scale-110 group-hover:bg-red-100 group-hover:text-red-600">
                <LogOut size={24} />
              </div>
              <span className="font-extrabold text-base text-slate-600 transition-colors duration-300 group-hover:text-red-700">
                {t('logout') || 'Déconnexion'}
              </span>
            </div>
            <ChevronRight size={18} className="text-slate-300 transition-transform duration-300 group-hover:text-red-400 group-hover:translate-x-1" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 md:p-8 w-full relative">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-10 relative">
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-br from-emerald-600 to-indigo-600 bg-clip-text text-transparent flex flex-col sm:flex-row items-center gap-3 md:gap-4 m-0 drop-shadow-sm pb-2">
              <div className="w-16 h-16 bg-white border border-white/40 shadow-xl shadow-emerald-500/10 rounded-[1.25rem] flex items-center justify-center text-emerald-600 backdrop-blur-md">
                {activeTab === 'overview' && <BarChart3 size={32} strokeWidth={2.5} />}
                {activeTab === 'applications' && <FileText size={32} strokeWidth={2.5} />}
                {activeTab === 'rooms' && <Home size={32} strokeWidth={2.5} />}
                {activeTab === 'reclamations' && <MessageSquareWarning size={32} strokeWidth={2.5} />}
              </div>
              {activeTab === 'overview' ? t('overview') || 'Vue d\'ensemble' :
               activeTab === 'applications' ? t('applications') || 'Candidatures' :
               activeTab === 'rooms' ? t('rooms_management') || 'Gestion des Chambres' : 
               activeTab === 'reclamations' ? t('reclamations') || 'Réclamations' : t('admin_dashboard_title') || 'Tableau de bord'}
            </h1>
            <p className="text-base text-gray-500 mt-3 max-w-lg m-0">
              {activeTab === 'overview' ? t('admin_overview_desc') || 'Aperçu global des admissions et statistiques de l\'internat.' :
               activeTab === 'applications' ? t('admin_applications_desc') || 'Gérez, examinez et traitez les demandes d\'admission des étudiants.' :
               activeTab === 'rooms' ? t('admin_rooms_desc') || 'Gérez l\'affectation et la disponibilité des chambres.' : 
               activeTab === 'reclamations' ? t('admin_reclamations_desc') || 'Gérez les réclamations et demandes d\'assistance des étudiants.' : ''}
            </p>
            
            {activeTab === 'overview' && (
              <div className="mt-6 md:absolute md:right-0 md:top-2 md:mt-0">
                <button
                  onClick={exportToExcel}
                  disabled={exporting}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-1 px-5 py-3 rounded-2xl font-bold flex items-center gap-3 transition-all duration-300 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  <Download size={20} className={`relative z-10 ${exporting ? 'animate-bounce' : ''}`} strokeWidth={2.5} />
                  <span className="hidden sm:inline relative z-10 tracking-wide">{exporting ? 'Export...' : (t('export_excel') || 'Export Excel')}</span>
                </button>
              </div>
            )}
          </div>

          {/* Tab Content */}
          <div className="w-full">
            {activeTab === 'overview' && <AdminOverview onCardClick={navigateToApplications} />}
            {activeTab === 'applications' && <AdminApplications initialStatusFilter={applicationsFilter} />}
            {activeTab === 'rooms' && <RoomManager />}
            {activeTab === 'reclamations' && <AdminReclamations />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
