import React, { useState, useEffect } from 'react';
import { Mail, CheckSquare, Users, Send } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAdminInactiveStudents, useAdminApplications, useSendAdminEmails } from '../../hooks/useAdmin';
import Skeleton from '../../components/ui/Skeleton';

const AdminEmails = () => {
  const [targetGroup, setTargetGroup] = useState('inactive');
  const [selected, setSelected] = useState([]);
  const [message, setMessage] = useState('');

  // Fetch inactive students
  const { data: inactiveStudents, isLoading: inactiveLoading } = useAdminInactiveStudents();
  
  // Fetch applications for other groups (with high limit)
  const { data: applicationsData, isLoading: appsLoading } = useAdminApplications({
    status: targetGroup !== 'inactive' ? targetGroup : undefined,
    limit: 1000
  });

  const { mutate: sendEmails, isPending: sending } = useSendAdminEmails();

  // Determine which list to show
  let students = [];
  let isLoading = false;

  if (targetGroup === 'inactive') {
    students = inactiveStudents || [];
    isLoading = inactiveLoading;
  } else {
    isLoading = appsLoading;
    if (applicationsData?.items) {
      const mapped = applicationsData.items
        .filter(app => app.student_email)
        .map(app => ({
          id: app.user_id,
          email: app.student_email,
          full_name: app.profile?.full_name || 'Inconnu',
          phone: app.profile?.phone
        }));
      // Remove duplicates
      students = Array.from(new Map(mapped.map(item => [item.id, item])).values());
    }
  }

  // Clear selection when group changes
  useEffect(() => {
    setSelected([]);
  }, [targetGroup]);

  const toggleSelect = (id) => setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const handleSend = () => {
    if (!message.trim() || selected.length === 0) return;
    
    const targetEmails = students.filter(s => selected.includes(s.id)).map(s => s.email);
    
    sendEmails({ emails: targetEmails, message }, {
      onSuccess: () => {
        toast.success("E-mails envoyés avec succès !");
        setSelected([]);
        setMessage('');
      },
      onError: () => {
        toast.error("Erreur lors de l'envoi");
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 glass-panel p-0 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <h3 className="font-bold whitespace-nowrap">Destinataires ({students.length})</h3>
            <select
              className="form-input py-1.5 px-3 text-sm h-auto bg-slate-50 dark:bg-slate-900 border-none font-semibold text-slate-600 cursor-pointer"
              value={targetGroup}
              onChange={e => setTargetGroup(e.target.value)}
            >
              <option value="inactive">Étudiants inactifs</option>
              <option value="pending">En attente</option>
              <option value="approved">Approuvés</option>
              <option value="rejected">Rejetés</option>
              <option value="incomplete">Incomplets</option>
            </select>
          </div>
          {students.length > 0 && (
            <button onClick={() => setSelected(selected.length === students.length ? [] : students.map(s => s.id))} className="text-xs font-bold text-blue-600 shrink-0">
              {selected.length === students.length ? 'Tout désélectionner' : 'Tout sélectionner'}
            </button>
          )}
        </div>
        <div className="max-h-[600px] overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800">
          {isLoading ? (
            <div className="p-10"><Skeleton className="h-40 w-full" /></div>
          ) : students.length === 0 ? (
            <div className="p-10 text-center flex flex-col items-center justify-center text-slate-400">
              <Users size={48} className="mb-4 opacity-20" />
              <p>Aucun étudiant trouvé pour ce groupe.</p>
            </div>
          ) : (
            students.map(s => (
              <div key={s.id} onClick={() => toggleSelect(s.id)} className={`p-4 flex items-center gap-4 cursor-pointer transition-colors ${selected.includes(s.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'}`}>
                <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${selected.includes(s.id) ? 'bg-blue-600 border-blue-600' : 'border-slate-300 dark:border-slate-600'}`}>
                  {selected.includes(s.id) && <CheckSquare size={14} className="text-white" />}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm leading-none mb-1">{s.full_name}</p>
                  <p className="text-xs text-slate-400">{s.phone} • {s.email}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <div className="space-y-6">
        <div className="glass-panel p-6">
          <h4 className="font-bold mb-4 flex items-center gap-2"><Mail size={18} /> Rédiger l'e-mail</h4>
          <textarea
            className="form-input h-48 resize-none text-sm w-full"
            placeholder="Entrez votre message ici..."
            value={message}
            onChange={e => setMessage(e.target.value)}
          />
          <div className="flex justify-end items-center mt-4">
            <button
              disabled={sending || !message.trim() || selected.length === 0}
              onClick={handleSend}
              className="btn btn-primary px-6 group"
            >
              {sending ? 'Envoi...' : 'Envoyer par E-mail'}
              <Send size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminEmails;
