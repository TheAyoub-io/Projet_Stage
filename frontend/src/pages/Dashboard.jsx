import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../lib/axios';
import { FileText, CheckCircle, XCircle, Clock, User, DoorOpen, ArrowRight, AlertCircle, Edit3, Download, MessageCircle, Phone, MapPin, GraduationCap } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import html2pdf from 'html2pdf.js';
import ChatWindow from '../components/ChatWindow';
import { useTranslation } from 'react-i18next';

const Dashboard = () => {
  const { t } = useTranslation();
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ phone: '', address: '', city: '' });
  const [profileSaving, setProfileSaving] = useState(false);

  const [isChatOpen, setIsChatOpen] = useState(false);

  const fetchStatus = React.useCallback(async () => {
    try {
      const response = await api.get('/applications/my-status');
      setStatusData(response.data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError('Échec du chargement des données du tableau de bord.');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);



  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      await api.put('/applications/profile', profileForm);
      setEditingProfile(false);
      toast.success("Profil mis à jour avec succès !");
      fetchStatus();
    } catch {
      toast.error("Échec de la mise à jour du profil.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleDownloadPDF = () => {
    const loadingToast = toast.loading("Génération de votre attestation...");
    const element = document.getElementById('attestation-pdf-template');
    if (!element) {
      toast.error("Erreur de modèle d'attestation", { id: loadingToast });
      return;
    }
    const opt = {
      margin: 10,
      filename: `Attestation_Admission_${profile?.full_name?.replace(/\s+/g, '_') || 'Etudiant'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2.5, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save()
      .then(() => toast.success("Attestation téléchargée avec succès !", { id: loadingToast }))
      .catch(() => { toast.error("Erreur de génération PDF", { id: loadingToast }); });
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div></div>;
  if (error) return <div className="container mx-auto px-6 py-12 text-center"><div className="alert alert-danger max-w-md mx-auto">{error}</div></div>;

  const { application, profile, message } = statusData || {};

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved': return <span className="badge bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"><CheckCircle size={14} className="mr-1" /> {t("approved")}</span>;
      case 'rejected': return <span className="badge bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800"><XCircle size={14} className="mr-1" /> {t("rejected")}</span>;
      case 'incomplete': return <span className="badge bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400 border border-pink-200 dark:border-pink-800"><AlertCircle size={14} className="mr-1" /> {t("incomplete")}</span>;
      case 'waitlisted': return <span className="badge bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800"><Clock size={14} className="mr-1" /> {t("waitlisted")}</span>;
      case 'pending': default: return <span className="badge bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800"><Clock size={14} className="mr-1" /> {t("pending")}</span>;
    }
  };

  const steps = application ? [
    { id: 1, label: 'Soumission', completed: true },
    { id: 2, label: 'Examen', completed: ['approved', 'rejected', 'waitlisted'].includes(application.status), active: application.status === 'pending' || application.status === 'incomplete' },
    { id: 3, label: 'Décision', completed: ['approved', 'rejected'].includes(application.status), active: ['approved', 'rejected', 'waitlisted'].includes(application.status) },
    { id: 4, label: 'Chambre', completed: !!application.room, active: application.status === 'approved' && !application.room },
    { id: 5, label: 'Finalisé', completed: !!application.room, active: !!application.room }
  ] : [];

  return (
    <div className="container mx-auto px-6 py-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-gradient-main rounded-2xl text-white shadow-xl shadow-blue-500/20">
            <GraduationCap size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold">{t("dashboard_title")}</h1>
            <p className="text-slate-500 dark:text-slate-400">{t("welcome")}, {profile?.full_name || 'Étudiant'}</p>
          </div>
        </div>

        {!application && (
             <Link to="/apply" className="btn btn-primary px-8 group">
                {t("start_application") || "Commencer ma candidature"}
                <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
             </Link>
        )}
      </div>

      {application && (
        <div className="glass-panel p-8 mb-10 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600"></div>
          <h3 className="text-lg font-bold mb-8 flex items-center gap-2">
            <Clock size={20} className="text-blue-600" />
            {t("tracking_title") || "Suivi de votre dossier"}
          </h3>

          <div className="relative flex justify-between items-start max-w-4xl mx-auto">
            {/* Connection Line */}
            <div className="absolute top-5 left-0 w-full h-0.5 bg-slate-200 dark:bg-slate-700 -z-10"></div>

            {steps.map((step) => (
              <div key={step.id} className="flex flex-col items-center text-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-500 border-2 ${
                  step.completed
                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : step.active
                      ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20'
                      : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-400'
                }`}>
                  {step.completed ? <CheckCircle size={20} /> : step.id}
                </div>
                <span className={`mt-3 text-sm font-bold ${step.completed || step.active ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Status */}
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-panel overflow-hidden">
            <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
                <FileText size={20} className="text-blue-600" />
                {t("application_details") || "Détails de la Candidature"}
              </h3>
              {application && getStatusBadge(application.status)}
            </div>

            <div className="p-8">
              {!application ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FileText size={40} />
                  </div>
                  <p className="text-lg text-slate-500 mb-8">{message || "Aucune candidature soumise pour le moment."}</p>
                  <Link to="/apply" className="btn btn-primary px-10 py-3 font-bold">
                    Soumettre ma Candidature
                  </Link>
                </div>
              ) : (
                <div className="space-y-8">
                   {application.status === 'incomplete' && (
                    <div className="p-5 bg-pink-50 dark:bg-pink-900/20 border border-pink-100 dark:border-pink-800 rounded-xl">
                      <div className="flex items-center gap-3 text-pink-700 dark:text-pink-400 font-bold mb-2">
                        <AlertCircle size={20} /> Action Requise
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 text-sm italic">&ldquo;{application.admin_feedback}&rdquo;</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Type d'Étudiant</p>
                      <p className="text-lg font-bold">{application.student_type}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Moyenne Académique</p>
                      <p className="text-lg font-bold text-blue-600">{parseFloat(application.grade_average).toFixed(2)} / 20</p>
                    </div>
                    <div className="md:col-span-2 space-y-1">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Filière / Spécialité</p>
                      <p className="text-lg font-bold">{application.filière || application.filiere}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                    {application.status === 'approved' && (
                       <button onClick={handleDownloadPDF} className="btn bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20">
                          <Download size={18} className="mr-2" /> Télécharger l'Attestation
                       </button>
                    )}
                    {['pending', 'rejected', 'incomplete'].includes(application.status) && (
                      <Link to="/apply?edit=true" className="btn btn-outline border-blue-200 hover:border-blue-600 group">
                        <Edit3 size={18} className="mr-2" />
                        {application.status === 'rejected' ? 'Ré-appliquer' : 'Modifier mon dossier'}
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Timeline / History */}
          {application?.history?.length > 0 && (
            <div className="glass-panel p-8">
               <h3 className="font-bold mb-6 flex items-center gap-2">
                 <Clock size={20} className="text-blue-600" /> Historique des Décisions
               </h3>
               <div className="space-y-6 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
                  {application.history.map((h, i) => (
                    <div key={h.id} className="relative pl-8">
                       <div className={`absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${i === 0 ? 'bg-blue-600 scale-125' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                       <div className="flex justify-between items-start mb-1">
                          <span className="font-bold capitalize">{h.status === 'approved' ? 'Approuvée' : h.status}</span>
                          <span className="text-xs text-slate-400">{new Date(h.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                       </div>
                       {h.comment && <p className="text-sm text-slate-500 italic">&ldquo;{h.comment}&rdquo;</p>}
                    </div>
                  ))}
               </div>
            </div>
          )}
        </div>

        {/* Right Column - Profile & Room */}
        <div className="space-y-8">
          {/* Room Assignment Card */}
          {application?.status === 'approved' && (
            <div className="glass-panel overflow-hidden border-t-4 border-emerald-500">
               <div className="p-6 bg-emerald-50/50 dark:bg-emerald-900/10 flex items-center gap-3">
                  <DoorOpen className="text-emerald-600" />
                  <h3 className="font-bold">{t("room_assignment")}</h3>
               </div>
               <div className="p-8 text-center">
                  {application.room ? (
                    <>
                      <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle size={40} />
                      </div>
                      <p className="text-sm text-slate-500 mb-1">Votre Numéro de Chambre</p>
                      <h2 className="text-5xl font-black text-emerald-600 mb-2">{application.room.room_number}</h2>
                      <p className="text-xs font-bold text-slate-400 uppercase">Affectation Validée</p>
                    </>
                  ) : (
                    <div className="space-y-4">
                       <div className="alert bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800 text-amber-700 dark:text-amber-400">
                          Paiement des frais requis pour obtenir une chambre.
                       </div>
                       <button
                         onClick={async () => {
                           try {
                             const res = await api.post('/payments/create-checkout-session');
                             window.location.href = res.data.checkout_url;
                           } catch (err) { toast.error("Échec de l'initialisation du paiement"); }
                         }}
                         className="btn btn-primary w-full py-3"
                       >
                         Payer 500 MAD (Stripe)
                       </button>
                    </div>
                  )}
               </div>
            </div>
          )}

          {/* Profile Card */}
          <div className="glass-panel overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2">
                <User size={20} className="text-blue-600" /> Profil
              </h3>
              {!editingProfile && profile && (
                <button onClick={() => { setProfileForm({ phone: profile.phone || '', address: profile.address || '', city: profile.city || '' }); setEditingProfile(true); }} className="text-xs font-bold text-blue-600 hover:underline">
                  Modifier
                </button>
              )}
            </div>

            <div className="p-6">
              {editingProfile ? (
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                   <div>
                     <label className="form-label">Téléphone</label>
                     <input type="text" className="form-input" value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} />
                   </div>
                   <div>
                     <label className="form-label">Adresse</label>
                     <input type="text" className="form-input" value={profileForm.address} onChange={e => setProfileForm({...profileForm, address: e.target.value})} />
                   </div>
                   <div className="flex gap-3 pt-2">
                      <button type="button" onClick={() => setEditingProfile(false)} className="btn btn-outline flex-1 py-2 text-sm">Annuler</button>
                      <button type="submit" disabled={profileSaving} className="btn btn-primary flex-1 py-2 text-sm">
                        {profileSaving ? '...' : 'Enregistrer'}
                      </button>
                   </div>
                </form>
              ) : (
                <div className="space-y-5">
                  <div className="flex items-start gap-3">
                    <User className="text-slate-400 mt-0.5" size={18} />
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">Nom Complet</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{profile?.full_name}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="text-slate-400 mt-0.5" size={18} />
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">Téléphone</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{profile?.phone || 'Non renseigné'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="text-slate-400 mt-0.5" size={18} />
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">Ville / Province</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{profile?.city} / {profile?.province}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Help Card */}
          <div className="glass-panel p-6 bg-blue-600 text-white">
             <h4 className="font-bold mb-2 flex items-center gap-2">
                <MessageCircle size={20} /> Besoin d'aide ?
             </h4>
             <p className="text-sm text-blue-100 mb-4 leading-relaxed">
                Notre équipe administrative est disponible pour répondre à toutes vos questions concernant votre admission.
             </p>
             <button onClick={() => setIsChatOpen(true)} className="w-full btn bg-white text-blue-600 hover:bg-blue-50 py-2.5 font-bold">
                Ouvrir le Support
             </button>
          </div>
        </div>
      </div>

      {/* PDF Template (Hidden) */}
      <div className="hidden">
          <div id="attestation-pdf-template" className="p-16 text-slate-900 bg-white" style={{ width: '800px' }}>
              <div className="flex justify-between items-center border-b-4 border-blue-900 pb-8 mb-12">
                  <img src="/logo_maroc.png" alt="Logo" className="h-24" />
                  <div className="text-center">
                      <h2 className="font-bold text-sm uppercase">Royaume du Maroc</h2>
                      <h2 className="text-xs">Ministère de l'Éducation Nationale</h2>
                      <h1 className="text-xl font-black text-blue-900 mt-4">LYCÉE TECHNIQUE MOHAMED V</h1>
                  </div>
                  <img src="/logo_lycee.jpg" alt="Logo" className="h-24" />
              </div>
              <div className="text-center mb-12">
                  <h1 className="text-3xl font-black underline decoration-blue-600 underline-offset-8">ATTESTATION D'ADMISSION</h1>
                  <p className="mt-4 text-slate-500 font-bold">Session Académique 2026/2027</p>
              </div>
              <div className="space-y-8 text-lg mb-20">
                  <p>Le Directeur du Lycée Technique certifie que l'étudiant(e) :</p>
                  <div className="p-8 bg-slate-50 border border-slate-200 rounded-2xl">
                      <table className="w-full">
                          <tbody>
                              <tr><td className="py-2 text-slate-500">Nom Complet :</td><td className="py-2 font-black text-xl">{profile?.full_name}</td></tr>
                              <tr><td className="py-2 text-slate-500">CIN :</td><td className="py-2 font-black">{profile?.cin}</td></tr>
                              <tr><td className="py-2 text-slate-500">Filière :</td><td className="py-2 font-black text-blue-700">{application?.filière || application?.filiere}</td></tr>
                          </tbody>
                      </table>
                  </div>
                  <p>Est officiellement admis(e) au service d'internat pour l'année scolaire en cours.</p>
                  {application?.room && (
                      <p className="font-bold">Numéro de chambre attribué : <span className="text-emerald-600 text-2xl ml-2">{application.room.room_number}</span></p>
                  )}
              </div>
              <div className="flex justify-between items-end mt-24">
                  <div className="text-sm">
                      <p>Fait à Beni Mellal, le</p>
                      <p className="font-bold">{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                  <div className="text-center border-2 border-dashed border-slate-300 p-8 rounded-xl w-64 h-32 flex items-center justify-center text-slate-300 font-bold uppercase text-xs">
                      Cachet de l'Établissement
                  </div>
              </div>
          </div>
      </div>

      <ChatWindow
        applicationId={application?.id}
        isOpen={statusData?.application?.id && isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />

      {/* Floating Chat Button */}
      {!isChatOpen && application && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-8 right-8 w-16 h-16 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-50 group"
        >
          <MessageCircle size={28} />
          {application.has_new_message && (
            <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 border-4 border-white dark:border-slate-900 rounded-full animate-pulse"></span>
          )}
          <span className="absolute right-full mr-4 px-3 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Besoin d'aide ? Chattez avec nous
          </span>
        </button>
      )}
    </div>
  );
};

export default Dashboard;
