import React, { useState } from 'react';
import { useTickets, useTicketDetails, useUpdateTicketStatus, useAddTicketMessage } from '../../hooks/useTickets';
import { Search, Filter, MessageSquareWarning, ChevronLeft, Send, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import Skeleton from '../../components/ui/Skeleton';
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
    <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${styles[status] || styles.open}`}>
      {labels[status] || status}
    </span>
  );
};

const AdminReclamations = () => {
  const { data: tickets, isLoading } = useTickets();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewingTicketId, setViewingTicketId] = useState(null);

  const filteredTickets = tickets?.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          ticket.user_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (viewingTicketId) {
    return <AdminTicketDetails ticketId={viewingTicketId} onBack={() => setViewingTicketId(null)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Rechercher (sujet, étudiant)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
          <Filter size={18} className="text-slate-400 shrink-0" />
          {['all', 'open', 'in_progress', 'resolved', 'closed'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${
                filterStatus === status 
                  ? 'bg-slate-800 text-white shadow-sm' 
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {status === 'all' ? 'Tous' : status === 'open' ? 'Ouverts' : status === 'in_progress' ? 'En cours' : status === 'resolved' ? 'Résolus' : 'Fermés'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs font-black text-slate-500 uppercase tracking-wider">
                <th className="p-4 pl-6">ID</th>
                <th className="p-4">Étudiant</th>
                <th className="p-4">Sujet</th>
                <th className="p-4">Date</th>
                <th className="p-4 text-center">Statut</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i}>
                    <td colSpan="6" className="p-4"><Skeleton className="h-12 w-full" /></td>
                  </tr>
                ))
              ) : filteredTickets?.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-slate-500">
                    <MessageSquareWarning size={32} className="mx-auto mb-3 text-slate-300" />
                    <p className="font-semibold text-lg">Aucune réclamation trouvée</p>
                  </td>
                </tr>
              ) : (
                filteredTickets?.map(ticket => (
                  <tr key={ticket.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-4 pl-6 text-sm font-bold text-slate-400">#{ticket.id}</td>
                    <td className="p-4">
                      <p className="font-bold text-slate-800">{ticket.user_name}</p>
                    </td>
                    <td className="p-4 max-w-[200px] truncate text-sm font-semibold text-slate-700">
                      {ticket.subject}
                    </td>
                    <td className="p-4 text-sm text-slate-500 font-medium">
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-center">
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <button 
                        onClick={() => setViewingTicketId(ticket.id)}
                        className="btn bg-white border border-slate-200 text-slate-700 hover:border-emerald-500 hover:text-emerald-600 px-4 py-1.5 text-xs shadow-sm"
                      >
                        Gérer
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const AdminTicketDetails = ({ ticketId, onBack }) => {
  const { data: ticket, isLoading } = useTicketDetails(ticketId);
  const { mutate: updateStatus, isPending: updating } = useUpdateTicketStatus();
  const { mutate: addMessage, isPending: sending } = useAddTicketMessage();
  const [message, setMessage] = useState('');

  const handleStatusChange = (newStatus) => {
    updateStatus({ ticketId, status: newStatus }, {
      onSuccess: () => toast.success('Statut mis à jour !')
    });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    addMessage({ ticketId, message }, {
      onSuccess: () => setMessage('')
    });
  };

  if (isLoading) return <div className="p-8 text-center"><Skeleton className="h-40 w-full" /></div>;
  if (!ticket) return null;

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[700px]">
      {/* Header */}
      <div className="bg-slate-50 p-6 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors shadow-sm">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">{ticket.subject}</h2>
            <p className="text-sm text-slate-500 font-medium">De: <span className="font-bold text-slate-700">{ticket.user_name}</span> • Le {new Date(ticket.created_at).toLocaleString()}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          {['open', 'in_progress', 'resolved', 'closed'].map(status => (
            <button
              key={status}
              onClick={() => handleStatusChange(status)}
              disabled={updating}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                ticket.status === status 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {status === 'open' ? 'Ouvert' : status === 'in_progress' ? 'En cours' : status === 'resolved' ? 'Résolu' : 'Fermé'}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 space-y-6">
        {/* Original Ticket Description */}
        <div className="flex justify-start">
          <div className="bg-white border border-slate-200 text-slate-800 p-5 rounded-2xl rounded-tl-sm max-w-[85%] shadow-sm">
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{ticket.description}</p>
            <span className="text-[10px] text-slate-400 mt-3 block font-bold uppercase tracking-wider">
              {ticket.user_name} - Création
            </span>
          </div>
        </div>

        {/* Replies */}
        {ticket.messages?.map(msg => {
          const isAdmin = msg.sender_role === 'admin';
          return (
            <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-4 rounded-2xl max-w-[85%] shadow-sm ${
                isAdmin 
                  ? 'bg-slate-800 text-white rounded-tr-sm' 
                  : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'
              }`}>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.message}</p>
                <span className={`text-[10px] mt-2 block font-bold uppercase tracking-wider ${
                  isAdmin ? 'text-slate-400 text-right' : 'text-slate-400 text-left'
                }`}>
                  {isAdmin ? msg.sender_name : ticket.user_name} - {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reply Area */}
      <div className="p-4 bg-white border-t border-slate-100 shrink-0">
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <input 
            type="text" 
            className="form-input flex-1 bg-slate-50 border-slate-200 py-3"
            placeholder="Répondre à l'étudiant..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            disabled={sending}
          />
          <button 
            type="submit" 
            disabled={sending || !message.trim()} 
            className="btn btn-primary px-6 shadow-sm flex items-center justify-center gap-2"
          >
            <Send size={18} />
            <span className="hidden sm:inline">Envoyer</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminReclamations;
