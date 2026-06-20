import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, LayoutDashboard, BarChart3, FileText, Home, Mail } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

import adminService from '../../services/admin.service';
import AdminOverview from '../../features/admin/AdminOverview';
import AdminApplications from '../../features/admin/AdminApplications';
import AdminEmails from '../../features/admin/AdminEmails';
import RoomManager from '../RoomManager';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [exporting, setExporting] = useState(false);

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

  return (
    <div className="container mx-auto px-6 pt-32 pb-10">
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

      <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit mb-10 border border-slate-200 dark:border-slate-700">
        {[
          { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
          { id: 'applications', label: 'Candidatures', icon: FileText },
          { id: 'rooms', label: 'Chambres', icon: Home },
          { id: 'email', label: 'E-mails', icon: Mail },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === tab.id
              ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && <AdminOverview />}
      {activeTab === 'applications' && <AdminApplications />}
      {activeTab === 'rooms' && <RoomManager />}
      {activeTab === 'email' && <AdminEmails />}
    </div>
  );
};

export default AdminDashboard;
