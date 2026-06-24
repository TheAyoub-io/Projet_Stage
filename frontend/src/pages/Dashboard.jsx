import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, CheckCircle, XCircle, Clock, User, DoorOpen, ArrowRight, AlertCircle, Edit3, Download, MessageCircle, Phone, MapPin, GraduationCap, LayoutDashboard, MessageSquareWarning, Upload, Camera, Home, Sparkles, Receipt, Contact } from 'lucide-react';
import { toast } from 'react-hot-toast';
import html2pdf from 'html2pdf.js';

import { useTranslation } from 'react-i18next';
import Skeleton from '../components/ui/Skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import StudentReclamations from '../components/student/StudentReclamations';
import VisualRoomMap from '../components/student/VisualRoomMap';

import { useMyStatus, useUpdateProfile } from '../hooks/useApplications';
import { useCreateCheckoutSession } from '../hooks/usePayment';
import api from '../lib/axios';

const Dashboard = () => {
  const { t } = useTranslation();
  const { data: statusData, isLoading: loading, error } = useMyStatus();
  const { mutate: updateProfile, isPending: profileSaving } = useUpdateProfile();
  const { mutateAsync: createCheckoutSession } = useCreateCheckoutSession();

  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ phone: '', address: '', city: '' });
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [receiptFile, setReceiptFile] = useState(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  const handleUploadReceipt = async () => {
    if (!receiptFile) return;
    setUploadingReceipt(true);
    const formData = new FormData();
    formData.append('file', receiptFile);
    try {
      await api.post('/applications/upload-receipt', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success("Reçu soumis avec succès !");
      setReceiptFile(null);
      window.location.reload();
    } catch (err) {
      toast.error("Erreur lors de l'envoi du reçu");
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    updateProfile(profileForm, {
      onSuccess: () => { setEditingProfile(false); toast.success(t('profile_updated') || 'Profil mis à jour !'); },
      onError: () => { toast.error(t('profile_update_failed') || 'Échec de la mise à jour.'); }
    });
  };

  const handleDownloadPDF = () => {
    const loadingToast = toast.loading(t('generating_attestation') || 'Génération...');
    const element = document.getElementById('attestation-pdf-template');
    if (!element) { toast.error('Erreur template', { id: loadingToast }); return; }

    const opt = {
      margin: 10,
      filename: `Attestation_${profile?.full_name?.replace(/\s+/g, '_') || 'Etudiant'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: true, windowWidth: 800 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      const generatePdf = typeof html2pdf === 'function' ? html2pdf : html2pdf.default;
      
      generatePdf().set(opt).from(element).save()
        .then(() => {
          toast.success(t('attestation_downloaded') || 'Téléchargée !', { id: loadingToast });
        })
        .catch((err) => {
          console.error("PDF generation error:", err);
          toast.error('Erreur de génération PDF', { id: loadingToast });
        });
    } catch (err) {
      console.error("PDF Init error:", err);
      toast.error('Erreur technique PDF', { id: loadingToast });
    }
  };

  if (error) return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <div className="alert alert-danger max-w-md w-full shadow-lg">Échec du chargement.</div>
    </div>
  );

  const { application, profile, message, room } = statusData || {};

  const getStatusBadge = (status) => {
    const styles = {
      approved: { bg: 'badge-success', label: t('approved'), icon: CheckCircle },
      rejected: { bg: 'badge-danger', label: t('rejected'), icon: XCircle },
      incomplete: { bg: 'badge-pink', label: t('incomplete'), icon: AlertCircle },
      waitlisted: { bg: 'badge-warning', label: t('waitlisted'), icon: Clock },
      pending: { bg: 'badge-warning', label: t('pending'), icon: Clock },
      awaiting_receipt: { bg: 'badge-info', label: 'Reçu Demandé', icon: AlertCircle },
    };
    const s = styles[status] || styles.pending;
    const Icon = s.icon;
    return (
      <span className={`badge ${s.bg}`}>
        <Icon size={12} className="shrink-0" /> {s.label}
      </span>
    );
  };

  const steps = application ? [
    { id: 1, label: 'Soumission', completed: true },
    { id: 2, label: 'Décision', completed: ['approved', 'rejected'].includes(application.status), active: ['pending', 'incomplete', 'waitlisted', 'approved', 'rejected'].includes(application.status) },
    { id: 3, label: 'Chambre', completed: !!application.room, active: application.status === 'approved' && !application.room },
    { id: 4, label: 'Finalisé', completed: !!application.room, active: !!application.room }
  ] : [];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300">
      {/* Dynamic ambient blurs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[40%] rounded-full bg-emerald-400/10 dark:bg-emerald-400/5 mix-blend-multiply filter blur-[100px] opacity-75 animate-blob"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[40%] rounded-full bg-indigo-400/10 dark:bg-indigo-400/5 mix-blend-multiply filter blur-[100px] opacity-75 animate-blob animation-delay-2000"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Banner Welcome Block */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-900 to-slate-950 p-8 md:p-12 mb-8 shadow-2xl border border-white/5"
        >
          {/* Animated color mesh background */}
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-emerald-500/25 to-teal-500/0 rounded-full blur-3xl pointer-events-none animate-pulse" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                <Sparkles size={12} className="animate-spin" style={{ animationDuration: '4s' }} /> {t('session_open') || "Session Ouverte"}
              </span>
              <h1 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tight">
                {t('dashboard_title') || "Tableau de Bord"}
              </h1>
              <p className="text-sm md:text-base text-slate-350 max-w-xl leading-relaxed">
                {t('welcome') || "Bienvenue"}, <strong className="text-white font-extrabold">{loading ? '...' : (profile?.full_name || 'Étudiant')}</strong>. {t('dashboard_subtitle') || "Consultez l'évolution de votre dossier et accédez aux services de l'internat."}
              </p>
            </div>
            
            {application && (
              <div className="flex-shrink-0 bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 text-center min-w-[200px]">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Statut actuel</p>
                <div className="mt-2">{getStatusBadge(application.status)}</div>
              </div>
            )}
          </div>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-32 w-full rounded-3xl" />
              <Skeleton className="h-96 w-full rounded-3xl" />
            </div>
            <Skeleton className="h-96 w-full rounded-3xl" />
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start"
          >
            {/* Left Column (Main Content Bento Grid) */}
            <div className="lg:col-span-2 flex flex-col gap-6">

              {/* Progress Tracker Card */}
              {application && (
                <motion.div variants={itemVariants} className="card glow-card">
                  <div className="flex items-center gap-2 mb-6">
                    <Clock size={18} className="text-emerald-500" />
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Suivi de Candidature</h3>
                  </div>
                  <div className="flex justify-between items-start relative px-2 sm:px-6">
                    {/* Background line for timeline */}
                    <div className="absolute top-5 left-10 right-10 h-1 bg-slate-100 dark:bg-slate-800 -z-0 rounded-full hidden sm:block" />
                    
                    {steps.map((step) => (
                      <div key={step.id} className="flex flex-col items-center text-center flex-1 z-10">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all duration-500
                          ${step.completed 
                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                            : step.active 
                              ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-4 ring-emerald-500/10' 
                              : 'bg-slate-100 dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600'}`}
                        >
                          {step.completed ? <CheckCircle size={18} /> : step.id}
                        </div>
                        <span className={`mt-3 text-[9px] font-black uppercase tracking-wider ${step.completed || step.active ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-600'}`}>
                          {step.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Application Details Card */}
              <motion.div variants={itemVariants} className="card glow-card">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-4 mb-6">
                  <div className="flex items-center gap-2">
                    <FileText size={18} className="text-emerald-500" />
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">{t('application_details') || "Dossier de Candidature"}</h3>
                  </div>
                  {application && getStatusBadge(application.status)}
                </div>
                
                {!application ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-float">
                      <FileText size={32} />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 mb-6 font-medium">{message || t('no_application_submitted') || 'Aucune candidature soumise.'}</p>
                    <Link to="/apply" className="btn btn-primary px-8 py-3 rounded-xl inline-flex font-bold">
                      {t('submit_application') || 'Soumettre ma Candidature'}
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {application.status === 'incomplete' && (
                      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="alert alert-warning">
                        <AlertCircle size={18} className="shrink-0 mt-0.5" />
                        <div>
                          <p className="font-black mb-0.5">{t('action_required') || 'Action Requise'}</p>
                          <p className="opacity-90 font-medium">"{application.admin_feedback}"</p>
                        </div>
                      </motion.div>
                    )}

                    {application.status === 'awaiting_receipt' && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }} 
                        animate={{ opacity: 1, scale: 1 }} 
                        className="p-6 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-900/30 flex flex-col md:flex-row gap-5 items-start md:items-center justify-between"
                      >
                        <div className="space-y-1.5 flex-1">
                          <p className="font-black text-indigo-900 dark:text-indigo-400 flex items-center gap-2 text-base">
                            <Receipt size={20} /> Reçu d'inscription exigé
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                            Votre demande a été approuvée sous réserve d'inscription. Veuillez scanner ou importer votre reçu de paiement des frais d'internat (150 MAD) pour valider votre affectation définitive.
                          </p>
                        </div>
                        
                        <div className="w-full md:w-auto flex flex-col gap-3 flex-shrink-0">
                          <input 
                            type="file" 
                            accept="image/*"
                            capture="environment"
                            onChange={(e) => setReceiptFile(e.target.files[0])}
                            className="hidden" 
                            id="receipt-scan" 
                          />
                          <input 
                            type="file" 
                            accept="image/*,.pdf" 
                            onChange={(e) => setReceiptFile(e.target.files[0])}
                            className="hidden" 
                            id="receipt-upload" 
                          />
                          
                          {receiptFile ? (
                            <div className="flex items-center justify-between gap-3 py-2.5 px-4 border border-indigo-200 dark:border-indigo-850 rounded-xl bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 text-xs font-bold w-full md:w-56">
                              <span className="truncate max-w-[130px]">{receiptFile.name}</span>
                              <button type="button" onClick={() => setReceiptFile(null)} className="text-red-500 hover:text-red-700 cursor-pointer">
                                <XCircle size={16} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <label htmlFor="receipt-scan" className="px-4 py-2.5 border border-indigo-200 dark:border-indigo-900/40 bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-slate-800 text-indigo-750 dark:text-indigo-300 text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 shadow-sm m-0">
                                <Camera size={14} /> Scanner
                              </label>
                              <label htmlFor="receipt-upload" className="px-4 py-2.5 border border-indigo-200 dark:border-indigo-900/40 bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-slate-800 text-indigo-750 dark:text-indigo-300 text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 shadow-sm m-0">
                                <Upload size={14} /> Importer
                              </label>
                            </div>
                          )}
                          
                          <button 
                            onClick={handleUploadReceipt}
                            disabled={!receiptFile || uploadingReceipt}
                            className="btn btn-primary btn-sm rounded-xl py-2.5 w-full font-bold shadow-md"
                          >
                            {uploadingReceipt ? 'Envoi...' : 'Valider mon Reçu'}
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* Academic info grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-900/60">
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{t('student_type_label') || "Type"}</p>
                        <p className="font-extrabold text-sm text-slate-900 dark:text-white">{application.student_type}</p>
                      </div>
                      <div className="p-4 bg-emerald-500/5 dark:bg-emerald-950/10 rounded-2xl border border-emerald-100/50 dark:border-emerald-900/20">
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">{t('academic_average') || "Moyenne"}</p>
                        <p className="font-extrabold text-sm text-emerald-700 dark:text-emerald-400">{parseFloat(application.grade_average).toFixed(2)} / 20</p>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-900/60">
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{t('major_specialty') || "Filière"}</p>
                        <p className="font-extrabold text-sm text-slate-900 dark:text-white truncate" title={application.filière || application.filiere}>{application.filière || application.filiere}</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-150 dark:border-slate-800 flex flex-wrap gap-3">
                      {application.status === 'approved' && (
                        <button onClick={handleDownloadPDF} className="btn btn-primary shadow-lg flex items-center gap-2">
                          <Download size={16} /> {t('download_attestation') || "Télécharger l'Attestation"}
                        </button>
                      )}
                      {['pending', 'rejected', 'incomplete'].includes(application.status) && (
                        <Link to="/apply?edit=true" className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors text-sm">
                          <Edit3 size={16} /> {application.status === 'rejected' ? t('reapply') : t('edit_application')}
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Room Assignment Widget with Roommate Visualizer */}
              {application?.status === 'approved' && (
                <motion.div variants={itemVariants} className="card glow-card">
                  {application.room ? (
                    <VisualRoomMap 
                      room={application.room} 
                      profile={profile} 
                      application={application} 
                    />
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <DoorOpen size={32} />
                      </div>
                      <h4 className="font-black text-slate-900 dark:text-white text-base mb-1">Affectation en cours</h4>
                      <p className="text-slate-500 dark:text-slate-400 text-xs max-w-sm mx-auto leading-relaxed">
                        Votre dossier est approuvé ! L'administration est en train de configurer et d'affecter votre chambre définitive. Revenez très bientôt.
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Support Reclamations Section */}
              <motion.div variants={itemVariants} className="card glow-card p-0 overflow-visible border-none bg-transparent shadow-none">
                <StudentReclamations />
              </motion.div>

            </div>

            {/* Right Column (Sidebar Bento Grid) */}
            <div className="flex flex-col gap-6">

              {/* Profile Passport Card */}
              <motion.div variants={itemVariants} className="relative overflow-hidden rounded-3xl bg-slate-900 text-white shadow-xl border border-white/10 p-6 glow-card">
                {/* Decorative overlay mesh */}
                <div className="absolute top-[-50%] right-[-50%] w-[250px] h-[250px] bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
                
                {/* Passport Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="text-emerald-400" size={20} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Student Passport</span>
                  </div>
                  {!editingProfile && profile && (
                    <button 
                      onClick={() => { setProfileForm({ phone: profile.phone || '', address: profile.address || '', city: profile.city || '' }); setEditingProfile(true); }}
                      className="text-[10px] font-black text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20 border border-emerald-400/20 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      Modifier
                    </button>
                  )}
                </div>

                {editingProfile ? (
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Téléphone</label>
                      <input className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500" value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Adresse</label>
                      <input className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500" value={profileForm.address} onChange={e => setProfileForm({ ...profileForm, address: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Ville</label>
                      <input className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500" value={profileForm.city} onChange={e => setProfileForm({ ...profileForm, city: e.target.value })} />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button type="button" onClick={() => setEditingProfile(false)} className="flex-1 py-1.5 rounded-lg border border-white/10 text-slate-350 hover:bg-white/5 font-bold text-[10px]">Annuler</button>
                      <button type="submit" disabled={profileSaving} className="flex-1 py-1.5 rounded-lg bg-emerald-500 text-white font-bold text-[10px] hover:bg-emerald-600">{profileSaving ? 'Envoi...' : 'Enregistrer'}</button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6">
                    {/* User profile layout */}
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white font-black text-lg">
                        {profile?.full_name ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'ET'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Nom Complet</p>
                        <h4 className="text-white font-black text-base truncate m-0">{profile?.full_name || 'Chargement...'}</h4>
                        <p className="text-slate-500 text-[10px] mt-0.5 truncate">{profile?.cin || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="space-y-4 border-t border-white/5 pt-4">
                      {[
                        { icon: Phone, label: t('phone') || 'Téléphone', value: profile?.phone },
                        { icon: MapPin, label: t('city_province') || 'Ville', value: profile?.city ? `${profile.city} / ${profile.province || ''}` : 'N/A' }
                      ].map((item, idx) => (
                        <div key={idx} className="flex gap-3 items-start">
                          <item.icon size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block">{item.label}</span>
                            <span className="text-slate-200 text-xs font-bold block truncate mt-0.5">{item.value || t('not_provided')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Decision / Status History Card */}
              {application?.history?.length > 0 && (
                <motion.div variants={itemVariants} className="card glow-card">
                  <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-3 mb-4">
                    <Clock size={16} className="text-indigo-500" />
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Historique de Décision</h3>
                  </div>
                  <div className="space-y-4">
                    {application.history.map((h, i) => (
                      <div key={h.id} className="relative flex gap-3">
                        {i !== application.history.length - 1 && (
                          <div className="absolute left-1.5 top-6 bottom-[-16px] w-0.5 bg-slate-100 dark:bg-slate-800" />
                        )}
                        <div className={`w-3.5 h-3.5 rounded-full mt-1 flex-shrink-0 z-10 border-2 border-white dark:border-slate-900 shadow-sm ${i === 0 ? 'bg-emerald-500 ring-2 ring-emerald-500/10' : 'bg-slate-350 dark:bg-slate-700'}`} />
                        <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl flex-1 border border-slate-100 dark:border-slate-900/60">
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="font-extrabold text-slate-900 dark:text-white text-xs capitalize">{h.status === 'approved' ? 'Approuvé' : h.status}</span>
                            <span className="text-[9px] font-bold text-slate-400 dark:text-gray-500">{new Date(h.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                          </div>
                          {h.comment && <p className="text-[10px] text-slate-500 dark:text-slate-450 italic mt-1.5">"{h.comment}"</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Fast Help Card */}
              <motion.div variants={itemVariants} className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30">
                <div className="flex gap-3">
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
                    <Contact size={18} />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-slate-900 dark:text-white text-sm mb-1">Assistance Technique</h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-450 leading-relaxed mb-3">Besoin d'aide pour votre dossier ou l'internat ? Soumettez une réclamation dans la section dédiée pour discuter avec l'administration.</p>
                  </div>
                </div>
              </motion.div>

            </div>
          </motion.div>
        )}
      </div>

      {/* PDF Template (Off-screen, kept intact for download function) */}
      <div style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', zIndex: -9999 }}>
        <div id="attestation-pdf-template" className="p-16 w-[800px]" style={{ color: '#0f172a', backgroundColor: '#ffffff' }}>
          <div className="flex justify-between items-center border-b-4 pb-8 mb-12" style={{ borderColor: '#1e293b' }}>
            <img src="/logo_maroc.png" alt="Logo" className="h-24" />
            <div className="text-center">
              <h2 className="font-bold text-sm uppercase tracking-widest">Royaume du Maroc</h2>
              <h2 className="text-xs">Ministère de l'Éducation Nationale</h2>
              <h1 className="text-xl font-black mt-4 tracking-tight" style={{ color: '#1e293b' }}>LYCÉE TECHNIQUE MOHAMED V</h1>
            </div>
            <img src="/logo_lycee.jpg" alt="Logo" className="h-24" />
          </div>
          <div className="text-center mb-12">
            <h1 className="text-3xl font-black underline decoration-4 underline-offset-8" style={{ textDecorationColor: '#059669' }}>ATTESTATION D'ADMISSION</h1>
            <p className="mt-4 font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>Session Académique 2026/2027</p>
          </div>
          <div className="mb-20 text-lg">
            <p className="mb-4">Le Directeur du Lycée Technique certifie que l'étudiant(e) :</p>
            <div className="p-8 border rounded-2xl mb-6" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>
              <table className="w-full">
                <tbody>
                  <tr><td className="py-2 w-1/3" style={{ color: '#64748b' }}>{t('full_name') || 'Nom'} :</td><td className="py-2 font-black text-2xl">{profile?.full_name}</td></tr>
                  <tr><td className="py-2" style={{ color: '#64748b' }}>CIN :</td><td className="py-2 font-bold">{profile?.cin}</td></tr>
                  <tr><td className="py-2" style={{ color: '#64748b' }}>Filière :</td><td className="py-2 font-bold" style={{ color: '#1e293b' }}>{application?.filière || application?.filiere}</td></tr>
                </tbody>
              </table>
            </div>
            <p className="mt-6">Est officiellement admis(e) au service d'internat pour l'année scolaire en cours.</p>
            {application?.room && (
              <p className="font-bold mt-4">Numéro de chambre : <span className="text-2xl ml-2" style={{ color: '#16a34a' }}>{application.room.room_number}</span></p>
            )}
          </div>
          <div className="flex justify-between items-end mt-24">
            <div className="text-sm">
              <p>Fait à Beni Mellal, le</p>
              <p className="font-bold mt-1">{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <div className="text-center border-2 border-dashed p-8 rounded-2xl w-64 h-32 flex items-center justify-center font-bold uppercase text-xs tracking-widest" style={{ borderColor: '#cbd5e1', color: '#94a3b8' }}>
              Cachet de l'Établissement
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
