import React, { useState } from 'react';
import { Search, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { useAdminApplications, useDeleteApplication, useUpdateApplicationStatus } from '../../hooks/useAdmin';
import { SkeletonTable } from '../../components/ui/Skeleton';
import ReviewPanel from '../../components/ReviewPanel';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const StatusBadge = ({ status }) => {
  const styles = {
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
    incomplete: 'bg-pink-100 text-pink-700 border-pink-200',
    waitlisted: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    awaiting_receipt: 'bg-purple-100 text-purple-700 border-purple-200'
  };
  const labels = {
    pending: 'En attente',
    approved: 'Approuvé',
    rejected: 'Rejeté',
    incomplete: 'Incomplet',
    waitlisted: 'Liste d\'attente',
    awaiting_receipt: 'Reçu Demandé'
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${styles[status] || styles.pending}`}>
      {labels[status] || status}
    </span>
  );
};

const AdminApplications = ({ initialStatusFilter = '' }) => {
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [viewingApp, setViewingApp] = useState(null);

  const { data, isLoading } = useAdminApplications({
    page,
    limit: 12,
    status: statusFilter || undefined,
  });

  const deleteMutation = useDeleteApplication();
  const updateMutation = useUpdateApplicationStatus();

  const handleStatusChange = (id, status) => {
    updateMutation.mutate({ id, status }, {
      onSuccess: () => {
        toast.success("Statut de la candidature mis à jour !");
        setViewingApp(null);
      },
      onError: () => toast.error("Erreur lors de la mise à jour du statut.")
    });
  };

  const applications = data?.items || [];
  const totalPages = data?.pages || 1;

  const handleDelete = (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette candidature ? Cette action est irréversible.")) {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          toast.success("Candidature supprimée avec succès.");
        },
        onError: () => {
          toast.error("Erreur lors de la suppression de la candidature.");
        }
      });
    }
  };

  const filteredApplications = applications.filter(app => {
    const q = searchQuery.toLowerCase();
    const p = app.profile || {};
    return (p.full_name || '').toLowerCase().includes(q) || (app.student_email || '').toLowerCase().includes(q) || (p.cin || '').toLowerCase().includes(q);
  });

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 || 
        i === totalPages || 
        (i >= page - 1 && i <= page + 1)
      ) {
        pages.push(i);
      } else if (i === page - 2 || i === page + 2) {
        pages.push('...');
      }
    }
    
    // remove duplicate '...'
    const uniquePages = pages.filter((item, index) => {
      return item !== '...' || pages[index - 1] !== '...';
    });

    return (
      <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          Affichage de la page <span className="font-bold text-slate-700 dark:text-slate-200">{page}</span> sur <span className="font-bold text-slate-700 dark:text-slate-200">{totalPages}</span>
        </p>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))} 
            disabled={page === 1} 
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300"
          >
            <ChevronLeft size={18} />
          </button>
          
          {uniquePages.map((p, i) => (
            <button
              key={i}
              onClick={() => p !== '...' && setPage(p)}
              disabled={p === '...'}
              className={`w-10 h-10 rounded-xl font-bold transition-all ${
                p === page 
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' 
                  : p === '...' 
                    ? 'text-slate-400 cursor-default' 
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-transparent hover:border-slate-200 dark:hover:border-slate-600'
              }`}
            >
              {p}
            </button>
          ))}

          <button 
            onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
            disabled={page === totalPages} 
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    );
  };

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
          <option value="awaiting_receipt">Reçu Demandé</option>
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
                  <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Sexe</th>
                  <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Statut</th>
                  <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {filteredApplications.map(app => {
                  const isNew = app.status === 'pending';
                  return (
                    <tr key={app.id} className={`transition-colors ${isNew ? 'bg-blue-50/50 hover:bg-blue-100/50 dark:bg-blue-900/10 dark:hover:bg-blue-900/20 shadow-sm border-l-4 border-l-blue-500' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'}`}>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold uppercase ${isNew ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'}`}>
                            {app.profile?.full_name?.charAt(0) || 'E'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-100 leading-none mb-1 flex items-center gap-2">
                              {app.profile?.full_name || 'Inconnu'}
                              {isNew && <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400 uppercase tracking-widest">Nouveau</span>}
                            </p>
                            <p className="text-xs text-slate-400 font-medium">{app.student_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm font-medium">
                        <p className="text-slate-700 dark:text-slate-300 mb-1">{app.filière || app.filiere}</p>
                        <p className="text-xs text-slate-400 uppercase font-bold">{app.student_type}</p>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className={`inline-block px-3 py-1 rounded-lg font-black ${
                          app.profile?.gender === 'Male' 
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' 
                            : app.profile?.gender === 'Female'
                              ? 'bg-pink-50 text-pink-700 dark:bg-pink-900/20 dark:text-pink-400'
                              : 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {app.profile?.gender === 'Male' ? 'Homme' : app.profile?.gender === 'Female' ? 'Femme' : 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <StatusBadge status={app.status} />
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setViewingApp(app)} className="btn btn-primary px-4 py-2 text-sm shadow-none bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900">
                            Détails
                          </button>
                          <button onClick={() => handleDelete(app.id)} disabled={deleteMutation.isPending} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredApplications.length === 0 && (
              <div className="p-8 text-center text-slate-500 font-medium">Aucune candidature trouvée.</div>
            )}
          </div>

          {renderPagination()}
        </div>
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
    </div>
  );
};

export default AdminApplications;
