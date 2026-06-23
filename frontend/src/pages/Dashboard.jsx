import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, CheckCircle, XCircle, Clock, User, DoorOpen, ArrowRight, AlertCircle, Edit3, Download, MessageCircle, Phone, MapPin, GraduationCap, LayoutDashboard, MessageSquareWarning, Upload, Camera, Home } from 'lucide-react';
import { toast } from 'react-hot-toast';
import html2pdf from 'html2pdf.js';

import { useTranslation } from 'react-i18next';
import Skeleton from '../components/ui/Skeleton';
import { motion } from 'framer-motion';
import StudentReclamations from '../components/student/StudentReclamations';

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
      // Reload page or re-fetch data
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
      // Handle Vite default import potential issue
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="alert alert-danger max-w-md w-full shadow-lg">Échec du chargement.</div>
    </div>
  );

  const { application, profile, message, room } = statusData || {};

  const getStatusBadge = (status) => {
    const styles = {
      approved: { bg: 'bg-green-100', color: 'text-green-600', label: t('approved'), icon: CheckCircle },
      rejected: { bg: 'bg-red-100', color: 'text-red-600', label: t('rejected'), icon: XCircle },
      incomplete: { bg: 'bg-pink-100', color: 'text-pink-600', label: t('incomplete'), icon: AlertCircle },
      waitlisted: { bg: 'bg-indigo-100', color: 'text-indigo-600', label: t('waitlisted'), icon: Clock },
      pending: { bg: 'bg-orange-100', color: 'text-orange-600', label: t('pending'), icon: Clock },
      awaiting_receipt: { bg: 'bg-purple-100', color: 'text-purple-600', label: 'Reçu Demandé', icon: AlertCircle },
    };
    const s = styles[status] || styles.pending;
    const Icon = s.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${s.bg} ${s.color} text-xs font-bold uppercase tracking-wider`}>
        <Icon size={14} /> {s.label}
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
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <div className="bg-slate-50 min-h-screen pt-24 pb-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center text-center mb-12 relative"
        >
          {/* Decorative blur */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-400/20 blur-3xl rounded-full pointer-events-none" />
          
          <h1 className="flex items-center justify-center gap-4 text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3 relative z-10">
            <div className="p-3 bg-white rounded-2xl text-emerald-600 shadow-md border border-slate-100">
              <GraduationCap size={32} />
            </div>
            {t('dashboard_title')}
          </h1>
          <p className="text-lg text-slate-500 relative z-10">
            {t('welcome')}, <strong className="text-slate-900">{loading ? '...' : (profile?.full_name || 'Étudiant')}</strong>
          </p>


        </motion.div>

        {loading ? (
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start"
          >

            {/* Left Column (Main Content) */}
            <div className="lg:col-span-2 flex flex-col gap-6">

              {/* Progress Tracker */}
              {application && (
                <motion.div variants={itemVariants} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                    <Clock size={18} className="text-emerald-600" />
                    <h3 className="font-bold text-slate-900">{t('tracking_title')}</h3>
                  </div>
                  <div className="p-6 sm:px-8 py-8 flex justify-between items-start relative">
                    {/* Background line for timeline */}
                    <div className="absolute top-12 left-10 right-10 h-1 bg-slate-100 -z-0 rounded-full hidden sm:block" />
                    
                    {steps.map((step) => (
                      <div key={step.id} className="flex flex-col items-center text-center flex-1 z-10">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all duration-300
                          ${step.completed 
                            ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/30' 
                            : step.active 
                              ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-4 ring-emerald-50' 
                              : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                        >
                          {step.completed ? <CheckCircle size={20} /> : step.id}
                        </div>
                        <span className={`mt-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider ${step.completed || step.active ? 'text-slate-800' : 'text-slate-400'}`}>
                          {step.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Application Details */}
              <motion.div variants={itemVariants} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={18} className="text-emerald-600" />
                    <h3 className="font-bold text-slate-900">{t('application_details')}</h3>
                  </div>
                  {application && getStatusBadge(application.status)}
                </div>
                <div className="p-6 sm:p-8">
                  {!application ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText size={32} />
                      </div>
                      <p className="text-slate-500 mb-6">{message || t('no_application_submitted') || 'Aucune candidature soumise.'}</p>
                      <Link to="/apply" className="btn btn-primary px-8 py-3 rounded-xl inline-flex font-bold">
                        {t('submit_application') || 'Soumettre ma Candidature'}
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {application.status === 'incomplete' && (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-4 bg-pink-50 border border-pink-100 rounded-2xl border-l-4 border-l-pink-500">
                          <p className="font-bold text-pink-700 flex items-center gap-2 mb-1">
                            <AlertCircle size={18} /> {t('action_required') || 'Action Requise'}
                          </p>
                          <p className="text-slate-600 text-sm">"{application.admin_feedback}"</p>
                        </motion.div>
                      )}

                      {application.status === 'awaiting_receipt' && (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-6 bg-purple-50 border border-purple-100 rounded-2xl border-l-4 border-l-purple-500">
                          <p className="font-bold text-purple-700 flex items-center gap-2 mb-3 text-lg">
                            <AlertCircle size={22} /> Action Requise : Reçu d'inscription
                          </p>
                          <p className="text-slate-700 text-sm mb-4">
                            Votre demande a été analysée. Veuillez maintenant importer ou scanner votre reçu d'inscription (150 MAD) pour finaliser votre admission.
                          </p>
                          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                            <div className="relative flex-1">
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
                                <div className="flex items-center justify-between w-full py-3 px-4 border-2 border-dashed border-purple-300 rounded-xl bg-purple-50 text-purple-700 font-bold">
                                  <div className="flex items-center gap-2 truncate">
                                    <CheckCircle size={18} className="shrink-0" />
                                    <span className="truncate">{receiptFile.name}</span>
                                  </div>
                                  <button type="button" onClick={() => setReceiptFile(null)} className="ml-2 text-red-500 hover:text-red-700 transition-colors">
                                    <XCircle size={18} />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex gap-3 w-full">
                                  <label 
                                    htmlFor="receipt-scan"
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 border-2 border-dashed border-purple-300 rounded-xl bg-white text-purple-700 font-bold cursor-pointer hover:bg-purple-50 transition-colors m-0"
                                  >
                                    <Camera size={18} /> Scanner
                                  </label>
                                  <label 
                                    htmlFor="receipt-upload" 
                                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 border-2 border-dashed border-purple-300 rounded-xl bg-white text-purple-700 font-bold cursor-pointer hover:bg-purple-50 transition-colors m-0"
                                  >
                                    <Upload size={18} /> Importer
                                  </label>
                                </div>
                              )}
                            </div>
                            <button 
                              onClick={handleUploadReceipt}
                              disabled={!receiptFile || uploadingReceipt}
                              className="w-full sm:w-auto px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white rounded-xl font-bold transition-colors shadow-md flex justify-center"
                            >
                              {uploadingReceipt ? <Skeleton className="w-16 h-4 bg-white/20" /> : 'Envoyer'}
                            </button>
                          </div>
                        </motion.div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        {application.room && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="col-span-2 p-6 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                <Home size={20} />
                              </div>
                              <div>
                                <h4 className="font-black text-indigo-900 text-lg">Votre Chambre</h4>
                                <p className="text-sm font-medium text-indigo-600/80">Affectation validée</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-white/60 p-4 rounded-xl border border-white">
                                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">Numéro de chambre</p>
                                <p className="font-black text-indigo-950 text-2xl">{application.room.room_number}</p>
                              </div>
                              <div className="bg-white/60 p-4 rounded-xl border border-white">
                                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">Pavillon / Catégorie</p>
                                <p className="font-black text-indigo-950 text-xl">{application.room.category ? `Catégorie ${application.room.category}` : (application.room.gender_type === 'Male' ? 'Pavillon Hommes' : 'Pavillon Femmes')}</p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{t('student_type_label') || "Type"}</p>
                          <p className="font-bold text-lg text-slate-900">{application.student_type}</p>
                        </div>
                        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                          <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">{t('academic_average') || "Moyenne"}</p>
                          <p className="font-bold text-lg text-emerald-700">{parseFloat(application.grade_average).toFixed(2)} / 20</p>
                        </div>
                        <div className="col-span-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{t('major_specialty') || "Filière"}</p>
                          <p className="font-bold text-lg text-slate-900">{application.filière || application.filiere}</p>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-slate-100 flex flex-wrap gap-3">
                        {application.status === 'approved' && (
                          <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold transition-colors shadow-md shadow-green-500/20">
                            <Download size={18} /> {t('download_attestation') || "Télécharger l'Attestation"}
                          </button>
                        )}
                        {['pending', 'rejected', 'incomplete'].includes(application.status) && (
                          <Link to="/apply?edit=true" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors">
                            <Edit3 size={18} /> {application.status === 'rejected' ? t('reapply') : t('edit_application')}
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Decision History */}
              {application?.history?.length > 0 && (
                <motion.div variants={itemVariants} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                    <Clock size={18} className="text-indigo-600" />
                    <h3 className="font-bold text-slate-900">{t('decision_history') || 'Historique'}</h3>
                  </div>
                  <div className="p-6 sm:p-8">
                    <div className="space-y-4">
                      {application.history.map((h, i) => (
                        <div key={h.id} className={`flex gap-4 ${i !== application.history.length - 1 ? 'relative' : ''}`}>
                          {i !== application.history.length - 1 && (
                            <div className="absolute left-2.5 top-8 bottom-[-16px] w-0.5 bg-slate-100" />
                          )}
                          <div className={`w-5 h-5 rounded-full mt-1.5 flex-shrink-0 z-10 border-4 border-white shadow-sm ${i === 0 ? 'bg-emerald-500 ring-2 ring-emerald-100' : 'bg-slate-300'}`} />
                          <div className="bg-slate-50 p-4 rounded-2xl flex-1 border border-slate-100 hover:border-slate-200 transition-colors">
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-bold text-slate-900 capitalize">{h.status === 'approved' ? 'Approuvée' : h.status}</span>
                              <span className="text-xs font-semibold text-slate-400">{new Date(h.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                            </div>
                            {h.comment && <p className="text-sm text-slate-500 italic mt-2">"{h.comment}"</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Reclamations Section */}
              <motion.div variants={itemVariants}>
                <StudentReclamations />
              </motion.div>

            </div>

            {/* Right Column (Sidebar) */}
            <div className="flex flex-col gap-6">

              {/* Room Assignment */}
              {application?.status === 'approved' && (
                <motion.div variants={itemVariants} className="bg-white rounded-3xl border border-green-200 shadow-sm overflow-hidden relative">
                  {/* Decorative shine */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-green-400/10 blur-2xl rounded-full pointer-events-none" />
                  
                  <div className="px-6 py-4 border-b border-green-100 bg-green-50/50 flex items-center gap-2">
                    <DoorOpen size={18} className="text-green-600" />
                    <h3 className="font-bold text-slate-900">{t('room_assignment')}</h3>
                  </div>
                  <div className="p-6 text-center">
                    {application.room ? (
                      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring" }}>
                        <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4 ring-8 ring-green-50">
                          <CheckCircle size={32} />
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('your_room') || 'Votre Chambre'}</p>
                        <p className="text-5xl font-black text-green-500 my-2 tracking-tighter">{application.room.room_number}</p>
                        <span className="inline-block px-4 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wider">{t('assignment_validated') || 'Validée'}</span>
                      </motion.div>
                    ) : (
                      <div className="text-center py-6">
                        <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4 ring-8 ring-slate-50">
                          <Clock size={32} />
                        </div>
                        <p className="text-slate-600 font-medium">Votre chambre est en cours d'affectation par l'administration.</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Profile Card */}
              <motion.div variants={itemVariants} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User size={18} className="text-slate-500" />
                    <h3 className="font-bold text-slate-900">{t('my_profile') || 'Mon Profil'}</h3>
                  </div>
                  {!editingProfile && profile && (
                    <button onClick={() => { setProfileForm({ phone: profile.phone || '', address: profile.address || '', city: profile.city || '' }); setEditingProfile(true); }}
                      className="text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors">
                      Modifier
                    </button>
                  )}
                </div>
                <div className="p-6">
                  {editingProfile ? (
                    <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleProfileUpdate} className="space-y-4">
                      <div className="form-group"><label className="form-label">{t('phone') || 'Téléphone'}</label><input className="form-input py-2" value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} /></div>
                      <div className="form-group"><label className="form-label">Adresse</label><input className="form-input py-2" value={profileForm.address} onChange={e => setProfileForm({ ...profileForm, address: e.target.value })} /></div>
                      <div className="form-group"><label className="form-label">Ville</label><input className="form-input py-2" value={profileForm.city} onChange={e => setProfileForm({ ...profileForm, city: e.target.value })} /></div>
                      <div className="flex gap-2 pt-2">
                        <button type="button" onClick={() => setEditingProfile(false)} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50">Annuler</button>
                        <button type="submit" disabled={profileSaving} className="flex-1 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700">{profileSaving ? '...' : 'Enregistrer'}</button>
                      </div>
                    </motion.form>
                  ) : (
                    <div className="space-y-5">
                      {[
                        { icon: User, label: t('full_name') || 'Nom', value: profile?.full_name },
                        { icon: Phone, label: t('phone') || 'Téléphone', value: profile?.phone || t('not_provided') },
                        { icon: MapPin, label: t('city_province') || 'Ville', value: `${profile?.city || ''} / ${profile?.province || ''}` },
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <div className="p-2 bg-slate-50 rounded-xl text-slate-400 shrink-0 border border-slate-100">
                            <item.icon size={16} />
                          </div>
                          <div>
                            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">{item.label}</p>
                            <p className="font-bold text-slate-900 text-sm sm:text-base">{item.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>



            </div>
          </motion.div>
        )}
      </div>

      {/* PDF Template (Off-screen) */}
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
