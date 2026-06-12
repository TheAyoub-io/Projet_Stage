import React, { useState } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAdminApplications } from '../../hooks/useAdmin';
import { SkeletonTable } from '../../components/ui/Skeleton';
import ReviewPanel from '../../components/ReviewPanel';
import { AnimatePresence } from 'framer-motion';

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

const AdminApplications = () => {
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [viewingApp, setViewingApp] = useState(null);

  const { data, isLoading } = useAdminApplications({
    page,
    limit: 12,
    status: statusFilter || undefined,
  });

  const applications = data?.items || [];
  const totalPages = data?.pages || 1;

  const filteredApplications = applications.filter(app => {
    const q = searchQuery.toLowerCase();
    const p = app.profile || {};
    return (p.full_name || '').toLowerCase().includes(q) || (app.student_email || '').toLowerCase().includes(q) || (p.cin || '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="glass-panel p-4 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="form-input pl-12 bg-slate-50 dark:bg-slate-900 border-none h-12 w-full"
            placeholder="Chercher par nom, email ou CIN..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="form-input w-full md:w-56 h-12 bg-slate-50 dark:bg-slate-900 border-none font-semibold text-slate-600"
          value={statusFilter}
          onChange={e => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="approved">Approuvés</option>
          <option value="incomplete">Incomplets</option>
          <option value="rejected">Rejetés</option>
        </select>
      </div>

      {isLoading ? (
        <SkeletonTable rows={8} />
      ) : (
        <div className="glass-panel overflow-hidden border-none">
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
                {filteredApplications.map(app => (
                  <tr key={app.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center font-bold uppercase">
                          {app.profile?.full_name?.charAt(0) || 'E'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-100 leading-none mb-1">{app.profile?.full_name || 'Inconnu'}</p>
                          <p className="text-xs text-slate-400 font-medium">{app.student_email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm font-medium">
                      <p className="text-slate-700 dark:text-slate-300 mb-1">{app.filière || app.filiere}</p>
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
            {filteredApplications.length === 0 && (
              <div className="p-8 text-center text-slate-500 font-medium">Aucune candidature trouvée.</div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <p className="text-sm font-bold text-slate-400">Page {page} sur {totalPages}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30"><ChevronLeft size={18} /></button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30"><ChevronRight size={18} /></button>
              </div>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {viewingApp && (
          <ReviewPanel
            application={viewingApp}
            onClose={() => setViewingApp(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminApplications;
