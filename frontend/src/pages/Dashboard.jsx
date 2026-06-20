import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, CheckCircle, XCircle, Clock, User, DoorOpen, ArrowRight, AlertCircle, Edit3, Download, MessageCircle, Phone, MapPin, GraduationCap } from 'lucide-react';
import { toast } from 'react-hot-toast';
import html2pdf from 'html2pdf.js';
import ChatWindow from '../components/ChatWindow';
import { useTranslation } from 'react-i18next';
import Skeleton, { SkeletonCard } from '../components/ui/Skeleton';
import { motion, AnimatePresence } from 'framer-motion';

import { useMyStatus, useUpdateProfile } from '../hooks/useApplications';
import { useCreateCheckoutSession } from '../hooks/usePayment';

const Dashboard = () => {
  const { t } = useTranslation();
  const { data: statusData, isLoading: loading, error } = useMyStatus();
  const { mutate: updateProfile, isPending: profileSaving } = useUpdateProfile();
  const { mutateAsync: createCheckoutSession } = useCreateCheckoutSession();

  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ phone: '', address: '', city: '' });
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    updateProfile(profileForm, {
      onSuccess: () => {
        setEditingProfile(false);
        toast.success(t("profile_updated") || "Profil mis à jour avec succès !");
      },
      onError: () => {
        toast.error(t("profile_update_failed") || "Échec de la mise à jour du profil.");
      }
    });
  };

  const handleDownloadPDF = () => {
    const loadingToast = toast.loading(t("generating_attestation") || "Génération de votre attestation...");
    const element = document.getElementById('attestation-pdf-template');
    if (!element) {
      toast.error(t("error_attestation_template") || "Erreur de modèle d'attestation", { id: loadingToast });
      return;
    }
    const opt = {
      margin: 10,
      filename: `Attestation_Admission_${profile?.full_name?.replace(/\\s+/g, '_') || 'Etudiant'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2.5, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save()
      .then(() => toast.success(t("attestation_downloaded") || "Attestation téléchargée avec succès !", { id: loadingToast }))
      .catch(() => { toast.error(t("error_pdf_generation") || "Erreur de génération PDF", { id: loadingToast }); });
  };

  if (error) return <div className="container mx-auto px-4 py-12 text-center"><div className="alert alert-danger max-w-md mx-auto">Échec du chargement des données du tableau de bord.</div></div>;

  const { application, profile, message } = statusData || {};

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved': return <span className="badge bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3 py-1.5"><CheckCircle size={14} className="mr-1" /> {t("approved")}</span>;
      case 'rejected': return <span className="badge bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 px-3 py-1.5"><XCircle size={14} className="mr-1" /> {t("rejected")}</span>;
      case 'incomplete': return <span className="badge bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20 px-3 py-1.5"><AlertCircle size={14} className="mr-1" /> {t("incomplete")}</span>;
      case 'waitlisted': return <span className="badge bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 px-3 py-1.5"><Clock size={14} className="mr-1" /> {t("waitlisted")}</span>;
      case 'pending': default: return <span className="badge bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-3 py-1.5"><Clock size={14} className="mr-1" /> {t("pending")}</span>;
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
    <div className="container mx-auto px-4 sm:px-6 pt-32 pb-8 md:pb-12 max-w-7xl">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6"
      >
        <div className="flex items-center gap-5">
          <div className="p-4 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl text-white shadow-xl shadow-blue-500/20 ring-4 ring-blue-50 dark:ring-slate-800">
            <GraduationCap size={32} />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{t("dashboard_title")}</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-lg mt-1">{t("welcome")}, <span className="text-slate-900 dark:text-white font-bold">{loading ? <Skeleton className="h-5 w-32 inline-block ml-1" /> : (profile?.full_name || 'Étudiant')}</span></p>
          </div>
        </div>

        {!loading && !application && (
          <Link to="/apply" className="btn btn-primary px-8 group">
            {t("apply_now")}
            <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        )}
      </motion.div>

      {loading ? (
        <div className="space-y-6 md:space-y-8">
          <div className="bento-card"><Skeleton className="h-24 w-full" /></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 bg">
            <div className="lg:col-span-2 space-y-8">
              <div className="bento-card"><Skeleton className="h-64 w-full" /></div>
            </div>
            <div className="space-y-8">
              <SkeletonCard />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">

          {/* Top Span Tracker */}
          {application && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-12 bento-card mb-2 overflow-hidden relative"
            >
              <div className="absolute top-0 left-0 w-2 h-full bg-blue-600"></div>
              <h3 className="text-xl font-extrabold mb-8 flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600">
                  <Clock size={24} />
                </div>
                {t("tracking_title")}
              </h3>

              <div className="relative flex justify-between items-start max-w-5xl mx-auto px-4 md:px-12 py-4">
                {/* Progress bar line */}
                <div className="absolute top-[28px] left-[10%] right-[10%] h-1 bg-slate-200 dark:bg-slate-700/50 rounded-full z-0 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-1000 ease-out"
                    style={{ width: `${(steps.findIndex(s => !s.completed && !s.active) === -1 ? steps.length : Math.max(0, steps.findIndex(s => !s.completed && !s.active) - 1)) / (steps.length - 1) * 100}%` }}
                  />
                </div>

                {steps.map((step) => (
                  <div key={step.id} className="flex flex-col items-center text-center relative z-10 w-20">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold transition-all duration-500 border-[3px] ring-4 ring-white dark:ring-slate-900 ${step.completed
                        ? 'bg-emerald-500 border-emerald-400 text-white shadow-xl shadow-emerald-500/30'
                        : step.active
                          ? 'bg-blue-600 border-blue-400 text-white shadow-xl shadow-blue-500/30'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                        }`}>
                      {step.completed ? <CheckCircle size={24} /> : <span className="text-lg">{step.id}</span>}
                    </motion.div>
                    <span className={`mt-4 text-[13px] font-bold uppercase tracking-wider ${step.completed || step.active ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Left Column (Main Specs) */}
          <div className="lg:col-span-8 flex flex-col gap-6 md:gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bento-card !p-0 overflow-hidden flex flex-col h-full"
            >
              <div className="px-8 py-6 border-b border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 className="font-extrabold text-xl flex items-center gap-3 text-slate-800 dark:text-slate-100">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600">
                    <FileText size={24} />
                  </div>
                  {t("application_details")}
                </h3>
                {application && getStatusBadge(application.status)}
              </div>

              <div className="p-8 flex-1">
                {!application ? (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-8 ring-blue-50 dark:ring-blue-900/10">
                      <FileText size={48} strokeWidth={1.5} />
                    </div>
                    <p className="text-xl text-slate-500 mb-8 max-w-sm mx-auto">{message || t("no_application_submitted") || "Aucune candidature soumise pour le moment."}</p>
                    <Link to="/apply" className="btn btn-primary px-10 py-4 font-extrabold text-lg shadow-xl shadow-blue-500/20 hover:scale-105">
                      {t("submit_application") || "Soumettre ma Candidature"}
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {application.status === 'incomplete' && (
                      <div className="p-6 bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800/50 rounded-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-2 h-full bg-pink-500"></div>
                        <div className="flex items-center gap-3 text-pink-700 dark:text-pink-400 font-extrabold mb-3 text-lg">
                          <AlertCircle size={24} /> {t("action_required") || "Action Requise"}
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 font-medium text-base">&ldquo;{application.admin_feedback}&rdquo;</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{t("student_type_label") || "Type d'Étudiant"}</p>
                        <p className="font-extrabold text-2xl">{application.student_type}</p>
                      </div>
                      <div className="bg-blue-50/50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-800/30">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{t("academic_average") || "Moyenne Académique"}</p>
                        <p className="font-extrabold text-2xl text-blue-600">{parseFloat(application.grade_average).toFixed(2)} / 20</p>
                      </div>
                      <div className="md:col-span-2 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{t("major_specialty") || "Filière / Spécialité"}</p>
                        <p className="font-extrabold text-2xl">{application.filière || application.filiere}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 pt-8 border-t border-slate-200/50 dark:border-slate-700/50">
                      {application.status === 'approved' && (
                        <button onClick={handleDownloadPDF} className="btn bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-500/20 font-bold border-none transition-transform hover:scale-105 py-3">
                          <Download size={20} className="mr-2" /> {t("download_attestation") || "Télécharger l'Attestation"}
                        </button>
                      )}
                      {['pending', 'rejected', 'incomplete'].includes(application.status) && (
                        <Link to="/apply?edit=true" className="btn btn-outline border-blue-200 hover:border-blue-600 bg-white dark:bg-transparent font-bold py-3 text-slate-700 dark:text-slate-200">
                          <Edit3 size={20} className="mr-2" />
                          {application.status === 'rejected' ? t('reapply') : t('edit_application')}
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {application?.history?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="bento-card"
              >
                <h3 className="font-extrabold text-xl mb-8 flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600">
                    <Clock size={24} />
                  </div> {t("decision_history") || "Historique des Décisions"}
                </h3>
                <div className="space-y-8 relative before:absolute before:left-3 before:top-3 before:bottom-3 before:w-1 before:bg-slate-100 dark:before:bg-slate-800">
                  {application.history.map((h, i) => (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} key={h.id} className="relative pl-10">
                      <div className={`absolute left-[3px] top-1.5 w-6 h-6 rounded-full border-[4px] border-white dark:border-[#0f172a] ${i === 0 ? 'bg-blue-600 shadow-lg shadow-blue-500/40 z-10' : 'bg-slate-400 z-0'}`}></div>
                      <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-black text-lg capitalize text-slate-800 dark:text-slate-100">{h.status === 'approved' ? 'Approuvée' : h.status}</span>
                          <span className="text-sm font-bold text-slate-400 bg-white dark:bg-slate-900 px-3 py-1 rounded-full">{new Date(h.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                        </div>
                        {h.comment && <p className="text-base text-slate-600 dark:text-slate-400 italic">"{h.comment}"</p>}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Column (Side Widgets) */}
          <div className="lg:col-span-4 flex flex-col gap-6 md:gap-8">
            {application?.status === 'approved' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
                className="bento-card overflow-hidden !p-0 border-emerald-500/30 ring-1 ring-emerald-500/20"
              >
                <div className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/10 flex items-center gap-3 border-b border-emerald-100 dark:border-emerald-800/30">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-800/50 rounded-xl text-emerald-600 dark:text-emerald-400">
                    <DoorOpen size={24} />
                  </div>
                  <h3 className="font-extrabold text-xl">{t("room_assignment")}</h3>
                </div>
                <div className="p-8 text-center relative overflow-hidden">
                  <div className="absolute -right-8 -bottom-8 opacity-5">
                    <DoorOpen size={150} />
                  </div>
                  {application.room ? (
                    <div className="relative z-10">
                      <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/20 ring-8 ring-emerald-50 dark:ring-emerald-900/10">
                        <CheckCircle size={48} strokeWidth={1.5} />
                      </div>
                      <p className="font-bold text-slate-500 mb-2 uppercase tracking-widest text-xs">{t("your_room") || "Votre Chambre"}</p>
                      <h2 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-emerald-500 to-teal-600 mb-4">{application.room.room_number}</h2>
                      <span className="badge bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 px-4 py-2 text-sm border-none shadow-sm">{t("assignment_validated") || "Affectation Validée"}</span>
                    </div>
                  ) : (
                    <div className="space-y-6 relative z-10">
                      <div className="alert bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-400 font-medium">
                        {t("payment_required_room") || "Paiement des frais de dossier de 500 MAD requis pour révéler votre chambre."}
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            const res = await createCheckoutSession();
                            window.location.href = res.checkout_url;
                          } catch { toast.error("Échec de l'initialisation du paiement"); }
                        }}
                        className="btn bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 w-full py-4 text-base font-black shadow-xl transition-transform hover:scale-105"
                      >
                        {t("pay_now_stripe") || "Payer maintenant (Stripe)"}
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
              className="bento-card !p-0 overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                <h3 className="font-extrabold text-xl flex items-center gap-3">
                  <div className="p-2 bg-slate-200 dark:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-300">
                    <User size={20} />
                  </div> {t("my_profile") || "Mon Profil"}
                </h3>
                <AnimatePresence mode="wait">
                  {!editingProfile && profile && (
                    <motion.button
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      onClick={() => { setProfileForm({ phone: profile.phone || '', address: profile.address || '', city: profile.city || '' }); setEditingProfile(true); }}
                      className="text-sm font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      Modifier
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              <div className="p-6">
                <AnimatePresence mode="wait">
                  {editingProfile ? (
                    <motion.form
                      key="form" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      onSubmit={handleProfileUpdate} className="space-y-5"
                    >
                      <div className="form-group mb-0">
                        <label className="form-label">{t("phone") || "Téléphone"}</label>
                        <input type="text" className="form-input shadow-inner" value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} />
                      </div>
                      <div className="form-group mb-0">
                        <label className="form-label">Adresse</label>
                        <input type="text" className="form-input shadow-inner" value={profileForm.address} onChange={e => setProfileForm({ ...profileForm, address: e.target.value })} />
                      </div>
                      <div className="form-group mb-0">
                        <label className="form-label">Ville</label>
                        <input type="text" className="form-input shadow-inner" value={profileForm.city} onChange={e => setProfileForm({ ...profileForm, city: e.target.value })} />
                      </div>
                      <div className="flex gap-4 pt-4">
                        <button type="button" onClick={() => setEditingProfile(false)} className="btn btn-outline flex-1">Annuler</button>
                        <button type="submit" disabled={profileSaving} className="btn btn-primary flex-1 shadow-lg shadow-blue-500/20">
                          {profileSaving ? '...' : 'Enregistrer'}
                        </button>
                      </div>
                    </motion.form>
                  ) : (
                    <motion.div key="display" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
                          <User className="text-slate-500 dark:text-slate-400" size={20} />
                        </div>
                        <div>
                          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">{t("full_name") || "Nom Complet"}</p>
                          <p className="font-extrabold text-slate-800 dark:text-slate-100 text-lg">{profile?.full_name}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
                          <Phone className="text-slate-500 dark:text-slate-400" size={20} />
                        </div>
                        <div>
                          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">{t("phone") || "Téléphone"}</p>
                          <p className="font-extrabold text-slate-800 dark:text-slate-100">{profile?.phone || t('not_provided')}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
                          <MapPin className="text-slate-500 dark:text-slate-400" size={20} />
                        </div>
                        <div>
                          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">{t("city_province") || "Ville / Province"}</p>
                          <p className="font-extrabold text-slate-800 dark:text-slate-100">{profile?.city} / {profile?.province}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
              className="bento-card bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-none shadow-2xl shadow-blue-500/30 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              <h4 className="font-black text-xl mb-3 flex items-center gap-3 relative z-10">
                <MessageCircle size={24} /> {t('need_help')}
              </h4>
              <p className="text-blue-100 mb-6 leading-relaxed font-medium text-base relative z-10">
                {t("support_description")}
              </p>
              <button onClick={() => setIsChatOpen(true)} className="w-full btn bg-white text-blue-700 hover:bg-slate-50 py-3.5 font-black text-base shadow-lg hover:scale-105 relative z-10">
                {t("open_support")}
              </button>
            </motion.div>
          </div>
        </div>
      )}

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
                  <tr><td className="py-2 text-slate-500">{t("full_name") || "Nom Complet"} :</td><td className="py-2 font-black text-xl">{profile?.full_name}</td></tr>
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

      {!isChatOpen && application && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-50 group border border-white/20"
        >
          <MessageCircle size={28} />
          {application.has_new_message && (
            <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 border-2 border-white dark:border-slate-900 rounded-full animate-[ping_1.5s_ease-in-out_infinite]"></span>
          )}
          <span className="absolute right-full mr-4 px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl shadow-slate-900/20">
            {t('need_help')} Chattez avec nous
          </span>
        </button>
      )}
    </div>
  );
};

export default Dashboard;
