import React, { useState } from 'react';
import { MessageSquareWarning, Plus, X, Send, Clock, CheckCircle, AlertCircle, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTickets, useCreateTicket, useTicketDetails, useAddTicketMessage } from '../../hooks/useTickets';
import Skeleton from '../ui/Skeleton';
import toast from 'react-hot-toast';

const StatusBadge = ({ status }) => {
  const styles = {
    open: 'bg-amber-100 text-amber-700 border-amber-200',
    in_progress: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    resolved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    closed: 'bg-slate-100 text-slate-700 border-slate-200'
  };
  const labels = {
    open: 'Ouvert',
    in_progress: 'En cours',
    resolved: 'Résolu',
    closed: 'Fermé'
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${styles[status] || styles.open}`}>
      {labels[status] || status}
    </span>
  );
};

const StudentReclamations = () => {
  const { data: tickets, isLoading } = useTickets();
  const [isCreating, setIsCreating] = useState(false);
  const [viewingTicketId, setViewingTicketId] = useState(null);

  const { mutate: createTicket, isPending: creating } = useCreateTicket();
  
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    createTicket({ subject, description }, {
      onSuccess: () => {
        toast.success('Réclamation envoyée avec succès');
        setIsCreating(false);
        setSubject('');
        setDescription('');
      },
      onError: () => {
        toast.error('Erreur lors de l\'envoi');
      }
    });
  };

  if (viewingTicketId) {
    return <TicketDetails ticketId={viewingTicketId} onBack={() => setViewingTicketId(null)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white/50 backdrop-blur-xl p-4 rounded-2xl border border-white/40 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Mes Réclamations</h2>
          <p className="text-sm text-slate-500">Gérez vos demandes d'assistance et réclamations.</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="btn btn-primary shadow-sm hover:shadow-md transition-all flex items-center gap-2"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Nouvelle réclamation</span>
        </button>
      </div>

      {isCreating && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-6"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <MessageSquareWarning className="text-emerald-500" /> Soumettre une réclamation
            </h3>
            <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="form-group">
              <label className="form-label">Sujet</label>
              <input 
                type="text" 
                className="form-input bg-slate-50 border-none" 
                placeholder="Ex: Problème avec mon affectation"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                maxLength={100}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Description détaillée</label>
              <textarea 
                className="form-input bg-slate-50 border-none min-h-[120px] resize-y" 
                placeholder="Décrivez votre problème en détail..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
              ></textarea>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setIsCreating(false)} className="btn bg-slate-200 text-slate-700 hover:bg-slate-300 shadow-none">Annuler</button>
              <button type="submit" disabled={creating} className="btn btn-primary flex items-center gap-2">
                {creating ? <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span> : <Send size={18} />}
                Envoyer
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
        </div>
      ) : tickets?.length === 0 ? (
        <div className="glass-panel p-10 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-300 mb-4">
            <MessageSquareWarning size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">Aucune réclamation</h3>
          <p className="text-slate-500">Vous n'avez soumis aucune réclamation pour le moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tickets?.map(ticket => (
            <div 
              key={ticket.id} 
              onClick={() => setViewingTicketId(ticket.id)}
              className="glass-panel p-5 cursor-pointer hover:shadow-md hover:border-emerald-200 transition-all group"
            >
              <div className="flex justify-between items-start mb-3">
                <StatusBadge status={ticket.status} />
                <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                  {new Date(ticket.created_at).toLocaleDateString()}
                </span>
              </div>
              <h4 className="text-base font-extrabold text-slate-800 mb-1 line-clamp-1 group-hover:text-emerald-600 transition-colors">
                {ticket.subject}
              </h4>
              <p className="text-sm text-slate-500 flex items-center gap-1 mt-4">
                Cliquez pour voir les détails <ChevronRightIcon className="w-4 h-4 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all text-emerald-500" />
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ChevronRightIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m9 18 6-6-6-6"/></svg>
);

const TicketDetails = ({ ticketId, onBack }) => {
  const { data: ticket, isLoading } = useTicketDetails(ticketId);
  const { mutate: addMessage, isPending: sending } = useAddTicketMessage();
  const [message, setMessage] = useState('');

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    addMessage({ ticketId, message }, {
      onSuccess: () => {
        setMessage('');
      }
    });
  };

  if (isLoading) return <div className="p-8 text-center"><Skeleton className="h-40 w-full" /></div>;
  if (!ticket) return null;

  return (
    <div className="glass-panel overflow-hidden flex flex-col h-[600px]">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h3 className="font-extrabold text-lg text-slate-800">{ticket.subject}</h3>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mt-1">
              <span>Le {new Date(ticket.created_at).toLocaleString()}</span>
              <span>•</span>
              <StatusBadge status={ticket.status} />
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/50 space-y-6">
        {/* Original Description */}
        <div className="flex justify-end">
          <div className="bg-emerald-600 text-white p-4 rounded-2xl rounded-tr-sm max-w-[85%] shadow-sm">
            <p className="whitespace-pre-wrap text-sm">{ticket.description}</p>
            <span className="text-[10px] text-emerald-200 mt-2 block text-right font-medium uppercase tracking-wider">
              Vous - Création
            </span>
          </div>
        </div>

        {/* Replies */}
        {ticket.messages?.map(msg => {
          const isStudent = msg.sender_role === 'student';
          return (
            <div key={msg.id} className={`flex ${isStudent ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-4 rounded-2xl max-w-[85%] shadow-sm ${
                isStudent 
                  ? 'bg-emerald-600 text-white rounded-tr-sm' 
                  : 'bg-white border border-slate-100 text-slate-800 rounded-tl-sm'
              }`}>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.message}</p>
                <span className={`text-[10px] mt-2 block font-medium uppercase tracking-wider ${
                  isStudent ? 'text-emerald-200 text-right' : 'text-slate-400 text-left'
                }`}>
                  {isStudent ? 'Vous' : 'Administration'} - {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reply Box */}
      {ticket.status !== 'closed' && ticket.status !== 'resolved' ? (
        <div className="p-4 bg-white border-t border-slate-100 shrink-0">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input 
              type="text" 
              className="form-input flex-1 bg-slate-50 border-none"
              placeholder="Écrivez votre message..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              disabled={sending}
            />
            <button 
              type="submit" 
              disabled={sending || !message.trim()} 
              className="btn btn-primary px-4 shadow-none flex items-center justify-center"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      ) : (
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center shrink-0">
          <p className="text-sm font-semibold text-slate-500 flex items-center justify-center gap-2">
            <CheckCircle size={16} className="text-emerald-500" /> Ce ticket est fermé. Vous ne pouvez plus y répondre.
          </p>
        </div>
      )}
    </div>
  );
};

export default StudentReclamations;
