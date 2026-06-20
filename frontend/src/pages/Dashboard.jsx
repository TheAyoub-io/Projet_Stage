import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../lib/axios';
import { FileText, CheckCircle, XCircle, Clock, User, Home, DoorOpen, ArrowRight, AlertCircle, Edit3, Save, Download, Loader2, MessageCircle } from 'lucide-react';
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

  const [loadingRoom, setLoadingRoom] = useState(false);
  const [roomError, setRoomError] = useState('');
  const [roomSuccess, setRoomSuccess] = useState('');

  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ phone: '', address: '', city: '' });
  const [profileSaving, setProfileSaving] = useState(false);

  // États du Chat Support
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const fetchStatus = async () => {
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
  };

  useEffect(() => {
    fetchStatus();
    const img1 = new Image(); img1.src = '/logo_lycee.jpg';
    const img2 = new Image(); img2.src = '/logo_maroc.png';
  }, [navigate]);

  const fetchMessages = async () => {
    if (!statusData?.application?.id) return;
    try {
      const res = await api.get(`/applications/${statusData.application.id}/messages`);
      setMessages(res.data);
    } catch (err) {
      console.error("Échec du chargement des messages", err);
    }
  };

  useEffect(() => {
    if (statusData?.application?.id) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 4000);
      return () => clearInterval(interval);
    }
  }, [statusData?.application?.id]);

  useEffect(() => {
    const handleNotifClick = (e) => {
      if (e.detail.type === 'message') {
        const chatContainer = document.getElementById('chat-messages-container');
        if (chatContainer) {
          chatContainer.scrollIntoView({ behavior: 'smooth' });
        }
      }
    };
    window.addEventListener('notification-click', handleNotifClick);
    return () => window.removeEventListener('notification-click', handleNotifClick);
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !statusData?.application?.id) return;
    setChatLoading(true);
    try {
      const res = await api.post(`/applications/${statusData.application.id}/messages`, { message: newMessage });
      setMessages(prev => [...prev, res.data]);
      setNewMessage('');
      const chatContainer = document.getElementById('chat-messages-container');
      if (chatContainer) {
        setTimeout(() => { chatContainer.scrollTop = chatContainer.scrollHeight; }, 100);
      }
    } catch (err) {
      toast.error("Échec de l'envoi du message.");
    } finally {
      setChatLoading(false);
    }
  };

  const handleAutoAssign = async (e) => {
    e.preventDefault();
    setLoadingRoom(true);
    setRoomError('');
    try {
      await api.post(`/rooms/auto-assign`);
      toast.success("Chambre attribuée avec succès !");
      fetchStatus();
    } catch (err) {
      const errMsg = err.response?.data?.detail || "Échec de l'attribution de la chambre.";
      setRoomError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoadingRoom(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      await api.put('/applications/profile', profileForm);
      setEditingProfile(false);
      toast.success("Profil mis à jour avec succès !");
      fetchStatus();
    } catch (err) {
      const errMsg = err.response?.data?.detail || "Échec de la mise à jour du profil.";
      toast.error(errMsg);
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
      .catch((err) => { console.error(err); toast.error("Erreur de génération PDF", { id: loadingToast }); });
  };

  if (loading) return <div className="loader-container"><div className="spinner"></div></div>;
  if (error) return <div className="container dashboard-page"><div className="alert alert-danger" style={{ maxWidth: '600px', margin: '0 auto' }}>{error}</div></div>;

  const { application, profile, message } = statusData || {};

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved': return <span className="badge badge-approved"><CheckCircle size={14} /> {t("approved")}</span>;
      case 'rejected': return <span className="badge badge-rejected"><XCircle size={14} /> {t("rejected")}</span>;
      case 'incomplete': return <span className="badge badge-incomplete"><AlertCircle size={14} /> {t("incomplete")}</span>;
      case 'waitlisted': return <span className="badge badge-waitlisted"><Clock size={14} /> {t("waitlisted")}</span>;
      case 'pending': default: return <span className="badge badge-pending"><Clock size={14} /> {t("pending")}</span>;
    }
  };

  const steps = application ? [
    { id: 1, label: 'Soumission', desc: 'Dossier déposé avec succès', active: true, completed: true },
    { id: 2, label: 'Examen académique', desc: application.status === 'incomplete' ? 'Correction requise' : 'Analyse du dossier', active: application.status === 'pending' || application.status === 'incomplete', completed: ['approved', 'rejected', 'waitlisted'].includes(application.status) },
    { id: 3, label: 'Décision finale', desc: application.status === 'approved' ? 'Approuvé !' : application.status === 'rejected' ? 'Rejeté' : application.status === 'waitlisted' ? 'Liste d\'attente' : 'En attente', active: ['approved', 'rejected', 'waitlisted'].includes(application.status) && !application.room, completed: ['approved', 'rejected'].includes(application.status) },
    { id: 4, label: 'Chambre', desc: application.room ? `Affecté (Ch. ${application.room.room_number})` : 'En attente d\'affectation', active: application.status === 'approved' && !application.room, completed: !!application.room },
    { id: 5, label: 'Admission validée', desc: application.room ? 'Processus finalisé !' : 'Rentrée d\'internat', active: !!application.room, completed: !!application.room }
  ] : [];

  return (
    <div className="container dashboard-page animate-up">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2.5rem' }}>
        <motion.div initial={{ rotate: -10, scale: 0.9 }} animate={{ rotate: 0, scale: 1 }} style={{ padding: '1.1rem', background: 'var(--gradient-main)', borderRadius: '18px', color: 'white', boxShadow: '0 8px 20px rgba(99, 102, 241, 0.3)' }}>
          <Home size={32} />
        </motion.div>
        <div>
          <h1 style={{ margin: 0, fontSize: '2.2rem', fontWeight: '900' }}>{t("dashboard_title")}</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '1.05rem' }}>{t("welcome")}, {profile?.full_name || ''}</p>
        </div>
      </div>

      {application && (
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', borderTop: '4px solid var(--primary)', borderRadius: '16px' }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600' }}>
            <Clock size={20} style={{ color: 'var(--primary)' }} /> Suivi en temps réel de votre admission
          </h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', position: 'relative' }}>
            {steps.map((step, idx) => (
              <div key={step.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '1 1 150px', textAlign: 'center', minWidth: '120px', position: 'relative', zIndex: 1 }}>
                {idx < steps.length - 1 && <div style={{ position: 'absolute', top: '20px', left: '50%', width: '100%', height: '2px', background: step.completed ? '#10b981' : 'var(--card-border)', zIndex: -1 }} />}
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: step.completed ? '#d1fae5' : step.active && !step.completed ? 'rgba(79, 70, 229, 0.1)' : 'var(--bg-alt)', border: `2px solid ${step.completed ? '#10b981' : step.active && !step.completed ? 'var(--primary)' : 'var(--text-muted)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: step.completed ? '#10b981' : step.active && !step.completed ? 'var(--primary)' : 'var(--text-muted)', fontWeight: '700', fontSize: '0.95rem', marginBottom: '0.75rem', boxShadow: step.active && !step.completed ? '0 0 0 4px rgba(79, 70, 229, 0.15)' : 'none' }}>
                  {step.completed ? '✓' : step.id}
                </div>
                <div style={{ fontWeight: '600', fontSize: '0.9rem', color: step.completed || (step.active && !step.completed) ? 'var(--text-main)' : 'var(--text-muted)', marginBottom: '0.2rem' }}>{step.label}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '140px', margin: '0 auto' }}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="dashboard-grid">
        <div className="glass-panel dash-card" style={{ borderTop: '4px solid var(--primary)', overflow: 'hidden' }}>
          <div className="dash-header" style={{ background: 'rgba(99, 102, 241, 0.03)', borderBottom: '1px solid var(--card-border)' }}>
            <FileText size={22} style={{ color: 'var(--primary)' }} /> <h3 style={{ fontWeight: '800' }}>{t("admission_status")}</h3>
          </div>
          <div className="dash-body">
            {!application ? (
              <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                <div style={{ width: '80px', height: '80px', background: 'var(--bg-alt)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--primary)' }}><FileText size={40} /></div>
                <p style={{ marginBottom: '1.5rem', fontSize: '1.1rem', color: 'var(--text-muted)' }}>{message || "Aucune candidature soumise pour le moment."}</p>
                <Link to="/apply" className="btn btn-primary" style={{ padding: '0.8rem 2rem', fontSize: '1.1rem' }}>Soumettre ma Candidature <ArrowRight size={18} /></Link>
              </div>
            ) : (
              <div>
                <div className="status-row" style={{ padding: '1rem', background: 'var(--bg-alt)', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span className="status-label" style={{ fontWeight: '600', margin: 0 }}>Statut Actuel</span>
                    {getStatusBadge(application.status)}
                  </div>
                  {application.status === 'approved' && (
                    <button onClick={handleDownloadPDF} className="btn" style={{ padding: '0.5rem 1.2rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#10b981', borderColor: '#10b981', color: '#fff', fontWeight: '600', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)' }}><Download size={16} /> Télécharger mon Attestation</button>
                  )}
                  {(['pending', 'rejected', 'incomplete'].includes(application.status)) && (
                    <Link to="/apply?edit=true" className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FileText size={16} /> {application.status === 'rejected' ? 'Ré-appliquer' : application.status === 'incomplete' ? 'Corriger mon dossier' : 'Modifier ma candidature'}
                    </Link>
                  )}
                </div>

                {application.status === 'incomplete' && (
                  <div className="alert alert-danger" style={{ display: 'block', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}><AlertCircle size={18} /> Action administrative requise</div>
                    <p style={{ margin: 0, color: 'inherit' }}>Votre dossier a été marqué comme <strong>incomplet</strong>. Veuillez corriger l'élément signalé :</p>
                    <div style={{ background: 'rgba(239, 68, 68, 0.08)', padding: '0.75rem 1rem', borderRadius: '8px', borderLeft: '4px solid var(--danger)', marginTop: '0.75rem', fontWeight: '500' }}>&ldquo;{application.admin_feedback || "Veuillez vérifier vos documents."}&rdquo;</div>
                  </div>
                )}

                <div className="status-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div><span className="status-label">Type d'étudiant</span><span className="status-value">{application.student_type}</span></div>
                  <div><span className="status-label">Moyenne</span><span className="status-value">{application.grade_average}/20</span></div>
                  <div style={{ gridColumn: '1 / -1' }}><span className="status-label">Filière</span><span className="status-value">{application.filière || application.filiere}</span></div>
                  <div style={{ gridColumn: '1 / -1' }}><span className="status-label">Soumis le</span><span className="status-value">{new Date(application.submitted_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
                </div>

                <div style={{ marginTop: '2.5rem', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '2rem' }}>
                  <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: '600' }}><Clock size={20} style={{ color: 'var(--primary)' }} /> Historique des étapes</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {application.history?.length > 0 ? (
                      application.history.map((h, idx) => (
                        <div key={h.id} style={{ display: 'flex', gap: '1.25rem', position: 'relative' }}>
                          {idx < application.history.length - 1 && <div style={{ position: 'absolute', left: '8px', top: '20px', bottom: '-20px', width: '2px', background: 'linear-gradient(to bottom, var(--primary), transparent)', opacity: 0.2 }} />}
                          <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: idx === 0 ? 'var(--primary)' : '#fff', border: `4px solid ${idx === 0 ? 'rgba(79, 70, 229, 0.2)' : 'var(--primary)'}`, flexShrink: 0, zIndex: 1, marginTop: '4px' }} />
                          <div style={{ flex: 1, background: 'rgba(255, 255, 255, 0.4)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.03)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <span style={{ fontWeight: '700', textTransform: 'capitalize', color: 'var(--text-main)', fontSize: '0.95rem' }}>
                                {h.status === 'approved' ? 'Approuvée' : h.status === 'rejected' ? 'Rejetée' : h.status === 'incomplete' ? 'Incomplet' : h.status === 'waitlisted' ? 'Liste d\'Attente' : 'Soumission'}
                              </span>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{new Date(h.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</span>
                            </div>
                            {h.comment && <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>&ldquo;{h.comment}&rdquo;</p>}
                          </div>
                        </div>
                      ))
                    ) : <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Aucun historique.</div>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {application?.status === 'approved' && (
            <div className="glass-panel dash-card delay-1" style={{ borderTop: '4px solid #10b981' }}>
              <div className="dash-header"><DoorOpen size={24} style={{ color: '#10b981' }} /> <h3>{t("room_assignment")}</h3></div>
              <div className="dash-body">
                {application.room ? (
                  <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                    <div style={{ width: '70px', height: '70px', background: '#d1fae5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: '#10b981' }}><CheckCircle size={36} /></div>
                    <h2 style={{ margin: '0 0 0.5rem 0', color: '#065f46', fontSize: '2rem' }}>{application.room.room_number}</h2>
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>Vous avez été affecté(e) à cette chambre.</p>
                  </div>
                ) : (
                  <div>
                    <div className="alert alert-success" style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>Félicitations ! Votre dossier est approuvé.</div>
                    <div className="bg-gray-50 p-4 rounded-xl mb-4 border border-gray-100">
                      <p className="text-sm font-bold text-gray-700 mb-2">Frais d'inscription requis</p>
                      <p className="text-xs text-gray-500 mb-3">Veuillez régler vos frais d'admission (500 MAD) pour finaliser votre inscription et obtenir votre chambre.</p>
                      <button
                        onClick={async () => {
                          try {
                            const res = await api.post('/payments/create-checkout-session');
                            window.location.href = res.data.checkout_url;
                          } catch (err) {
                            toast.error("Échec de l'initialisation du paiement");
                          }
                        }}
                        className="btn btn-primary w-full py-3"
                      >
                        Payer les frais via Stripe
                      </button>
                    </div>
                    {roomError && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{roomError}</div>}
                    <form onSubmit={handleAutoAssign}><button type="submit" className="btn btn-primary" style={{ width: '100%', background: '#10b981', border: 'none', opacity: 0.5 }} disabled={true}>Obtenir ma Chambre (Paiement requis)</button></form>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="glass-panel dash-card delay-2">
            <div className="dash-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><User size={24} style={{ color: 'var(--primary)' }} /> <h3>{t("profile")}</h3></div>
              {profile && !editingProfile && <button className="btn-text" onClick={() => { setProfileForm({ phone: profile.phone || '', address: profile.address || '', city: profile.city || '' }); setEditingProfile(true); }}><Edit3 size={16} /> Modifier</button>}
            </div>
            <div className="dash-body">
              {profile ? editingProfile ? (
                <form onSubmit={handleProfileUpdate} style={{ display: 'grid', gap: '1rem' }}>
                  <div><label className="form-label">Téléphone</label><input type="text" className="form-input" value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} required /></div>
                  <div><label className="form-label">Adresse</label><input type="text" className="form-input" value={profileForm.address} onChange={e => setProfileForm({ ...profileForm, address: e.target.value })} required /></div>
                  <div><label className="form-label">Ville</label><input type="text" className="form-input" value={profileForm.city} onChange={e => setProfileForm({ ...profileForm, city: e.target.value })} required /></div>
                  <div style={{ display: 'flex', gap: '1rem' }}><button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setEditingProfile(false)}>Annuler</button><button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={profileSaving}>{profileSaving ? 'Enregistrement...' : 'Enregistrer'}</button></div>
                </form>
              ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div><p className="status-label">Nom Complet</p><p className="status-value">{profile.full_name}</p></div>
                  <div><p className="status-label">Téléphone</p><p className="status-value">{profile.phone}</p></div>
                  <div><p className="status-label">Ville/Province</p><p className="status-value">{profile.city} / {profile.province}</p></div>
                </div>
              ) : <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}><p>Profil non complété.</p></div>}
            </div>
          </div>
        </div>
      </div>

      {application && (
        <div className="glass-panel dash-card" style={{ borderTop: '4px solid var(--secondary)', marginTop: '2rem', padding: 0, overflow: 'hidden' }}>
          <div className="dash-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--card-bg)', padding: '1rem 2rem', borderBottom: '1px solid var(--card-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><MessageCircle size={24} style={{ color: 'var(--secondary)' }} /> <h3 style={{ margin: 0 }}>{t("chat_support")}</h3></div>
            <span className="badge" style={{ background: 'rgba(124, 58, 237, 0.1)', color: 'var(--secondary)' }}>🛡️ Administration Directe</span>
          </div>
          <div className="dash-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '400px', padding: '1.5rem' }}>
            <div id="chat-messages-container" style={{ flex: 1, overflowY: 'auto', padding: '1rem', background: 'var(--bg-color)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.75rem', border: '1px solid var(--card-border)' }}>
              {messages.length === 0 ? <p style={{ textAlign: 'center', fontStyle: 'italic', color: 'var(--text-muted)' }}>Posez vos questions ici !</p> : messages.map(msg => (
                <div key={msg.id} style={{ alignSelf: msg.sender_role === 'admin' ? 'flex-start' : 'flex-end', maxWidth: '75%' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>{msg.sender_role === 'admin' ? '🛡️ Administration' : 'Moi'}</div>
                  <div style={{ padding: '0.75rem 1rem', borderRadius: '12px', background: msg.sender_role === 'admin' ? 'var(--card-bg)' : 'linear-gradient(135deg, var(--primary), var(--secondary))', color: msg.sender_role === 'admin' ? 'var(--text-main)' : '#fff', border: '1px solid var(--card-border)' }}>{msg.message}</div>
                </div>
              ))}
            </div>
            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.75rem' }}><input type="text" className="form-input" placeholder="Écrivez ici..." value={newMessage} onChange={e => setNewMessage(e.target.value)} style={{ marginBottom: 0, flex: 1 }} required /><button type="submit" className="btn btn-primary" style={{ padding: '0.8rem 1.5rem' }} disabled={chatLoading}>Envoyer</button></form>
          </div>
        </div>
      )}

      {/* Modèle d'Attestation PDF (Caché pour html2pdf) */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <div id="attestation-pdf-template" style={{
          width: '700px',
          padding: '50px',
          color: '#1a1a1a',
          fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          lineHeight: '1.6'
        }}>
          {/* En-tête */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #1e3a8a', paddingBottom: '20px', marginBottom: '40px' }}>
            <img src="/logo_maroc.png" alt="Royaume du Maroc" style={{ height: '90px' }} />
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ margin: '0 0 5px 0', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}>Royaume du Maroc</h2>
              <h2 style={{ margin: '0 0 5px 0', fontSize: '12px' }}>Ministère de l'Éducation Nationale du Préscolaire et des Sports</h2>
              <h2 style={{ margin: '0 0 5px 0', fontSize: '12px' }}>Académie Régionale de l'Éducation et de la Formation</h2>
              <h3 style={{ margin: '10px 0 0 0', fontSize: '15px', color: '#1e3a8a', fontWeight: '900' }}>Lycée Technique - Service Internat</h3>
            </div>
            <img src="/logo_lycee.jpg" alt="Logo Lycée" style={{ height: '90px' }} />
          </div>

          {/* Titre */}
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <h1 style={{
              fontSize: '32px',
              color: '#1e3a8a',
              textDecoration: 'underline',
              fontWeight: '900',
              letterSpacing: '1px'
            }}>ATTESTATION D'ADMISSION</h1>
            <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>Année Universitaire : 2026/2027</p>
          </div>

          {/* Corps de l'attestation */}
          <div style={{ fontSize: '18px', marginBottom: '60px' }}>
            <p style={{ marginBottom: '25px' }}>Le Directeur du Lycée Technique certifie par la présente que l'étudiant(e) :</p>

            <div style={{ background: '#f8fafc', padding: '25px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '30px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '8px 0', color: '#64748b', width: '30%' }}>Nom Complet :</td>
                    <td style={{ padding: '8px 0', fontWeight: 'bold', fontSize: '20px' }}>{profile?.full_name || '................................................'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 0', color: '#64748b' }}>C.I.N :</td>
                    <td style={{ padding: '8px 0', fontWeight: 'bold' }}>{profile?.cin || '...........................'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 0', color: '#64748b' }}>N° Téléphone :</td>
                    <td style={{ padding: '8px 0', fontWeight: 'bold' }}>{profile?.phone || '...........................'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p style={{ marginBottom: '25px' }}>Est officiellement admis(e) au service d'internat dans la filière :</p>

            <div style={{ borderLeft: '5px solid #1e3a8a', padding: '15px 25px', background: 'rgba(30, 58, 138, 0.03)', marginBottom: '30px' }}>
              <p style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, color: '#1e3a8a' }}>{application?.filière || application?.filiere}</p>
              <p style={{ fontSize: '14px', color: '#666', margin: '5px 0 0 0' }}>Type d'admission : {application?.student_type}</p>
            </div>

            {application?.room && (
              <p style={{ marginBottom: '25px' }}>
                Numéro de chambre affecté : <strong style={{ color: '#059669', fontSize: '22px' }}>{application.room.room_number}</strong>
              </p>
            )}

            <p style={{ marginTop: '40px', fontSize: '16px', fontStyle: 'italic', textAlign: 'justify' }}>
              Cette attestation est délivrée pour valoir ce que de droit, sous réserve de la validation finale des documents originaux lors de la rentrée scolaire.
            </p>
          </div>

          {/* Signature */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '80px' }}>
            <div style={{ fontSize: '15px' }}>
              <p>Fait à : <strong>Beni Mellal</strong></p>
              <p>Le : <strong>{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></p>
            </div>
            <div style={{ textAlign: 'center', minWidth: '250px' }}>
              <p style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: '60px' }}>Cachet et Signature de l'Administration</p>
              {/* Emplacement pour cachet numérique ou signature */}
              <div style={{ height: '80px', width: '200px', margin: '0 auto', border: '1px dashed #cbd5e1', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '12px' }}>
                Cachet Officiel
              </div>
            </div>
          </div>

          {/* Pied de page */}
          <div style={{
            marginTop: '100px',
            paddingTop: '15px',
            borderTop: '1px solid #e2e8f0',
            textAlign: 'center',
            fontSize: '11px',
            color: '#94a3b8'
          }}>
            Document généré automatiquement le {new Date().toLocaleString()} - Code de vérification : {Math.random().toString(36).substring(2, 10).toUpperCase()}
          </div>
        </div>
      </div>
      <ChatWindow
        applicationId={application?.id}
        isOpen={statusData?.application?.id && isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />

      {!isChatOpen && statusData?.application?.id && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 p-4 bg-primary text-white rounded-full shadow-2xl hover:scale-110 transition-all z-[100]"
        >
          <MessageCircle size={24} />
          {application?.has_new_message && (
            <span className="absolute top-0 right-0 w-4 height-4 bg-danger rounded-full border-2 border-white animate-pulse" />
          )}
        </button>
      )}
    </div>
  );
};

export default Dashboard;
