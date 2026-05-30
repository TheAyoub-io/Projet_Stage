import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../lib/axios';
import { User, Upload, ChevronRight, ChevronLeft, CheckCircle, Phone, MapPin, GraduationCap, FileText, Landmark } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement } from '@stripe/react-stripe-js';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { PROVINCES_DATA, CITIES_BY_PROVINCE_DATA, getLabel } from '../data/citiesData';
import FormError from '../components/FormError';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_TYooMQauvdEDq54NiTphI7jx');

const FILIERES_CPGE = ['MPSI', 'PCSI', 'TSI', 'ECT', 'ECS', 'BCPST'];
const FILIERES_LYCEE = ['Sciences Mathématiques', 'Sciences Physiques', 'SVT', 'Sciences Économiques', 'Techniques de Gestion', 'Électromécanique', 'Électrotechnique'];

const Apply = () => {
  const { t, i18n: { language } } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const editMode = new URLSearchParams(location.search).get('edit') === 'true';

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(editMode);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [fullName, setFullName] = useState('');
  const [cin, setCin] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');

  const [studentType, setStudentType] = useState('');
  const [niveau, setNiveau] = useState('');
  const [filiere, setFiliere] = useState('');
  const [gradeAverage, setGradeAverage] = useState('');

  const [cinFile, setCinFile] = useState(null);
  const [transcriptFile, setTranscriptFile] = useState(null);
  const [feeReceiptFile, setFeeReceiptFile] = useState(null);
  const [residencyCertFile, setResidencyCertFile] = useState(null);

  const [paymentMethod, setPaymentMethod] = useState('upload');

  const submitApplication = useCallback(async (formData) => {
    try {
      if (editMode) await api.put('/applications/update', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      else await api.post('/applications/apply', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSuccess(true); toast.success(t("application_saved"));
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de la soumission.');
    } finally { setLoading(false); }
  }, [editMode, navigate, t]);

  useEffect(() => {
    if (editMode) {
      api.get('/applications/my-status').then(res => {
        const { profile, application } = res.data;
        if (profile) {
          setFullName(profile.full_name || '');
          setCin(profile.cin || '');
          setPhone(profile.phone || '');
          setDateOfBirth(profile.date_of_birth ? profile.date_of_birth.split('T')[0] : '');
          setAddress(profile.address || '');
          setProvince(profile.province || '');
          setCity(profile.city || '');
        }
        if (application) {
          setStudentType(application.student_type || '');
          setGradeAverage(application.grade_average || '');
          const appFiliere = application.filière || application.filiere;
          if (appFiliere && appFiliere.includes(' - ')) {
            const [niv, fil] = appFiliere.split(' - ');
            setNiveau(niv); setFiliere(fil);
          }
        }
      }).catch(() => setError("Impossible de charger vos données.")).finally(() => setDataLoading(false));
    }
  }, [editMode]);

  const steps = [
    { num: 1, label: t('profile'), icon: User },
    { num: 2, label: t('academic_info'), icon: GraduationCap },
    { num: 3, label: t('supporting_documents'), icon: Upload },
  ];

  const validateStep1 = () => {
    if (!fullName || !cin || !phone || !dateOfBirth || !address || !city || !province) {
      setError(t('error_personal_fields')); return false;
    }
    setError(''); return true;
  };

  const validateStep2 = () => {
    if (!studentType || !niveau || !filiere || !gradeAverage) {
      setError(t('error_academic_fields')); return false;
    }
    const avg = parseFloat(gradeAverage);
    if (isNaN(avg) || avg < 0 || avg > 20) {
      setError(t('error_grade_range')); return false;
    }
    setError(''); return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step < 3) return;

    if (!editMode) {
      if (!cinFile) { setError(t("error_cin_required") || "Copie CIN requise"); return; }
      if (!transcriptFile) { setError(t("error_transcript_required") || "Relevé de notes requis"); return; }
      if (paymentMethod === 'upload' && !feeReceiptFile) { setError(t("error_receipt_required") || "Reçu requis"); return; }
    }

    setLoading(true); setError('');
    const formData = new FormData();
    formData.append('full_name', fullName); formData.append('cin', cin);
    formData.append('phone', phone); formData.append('date_of_birth', dateOfBirth);
    formData.append('address', address); formData.append('city', city);
    formData.append('province', province); formData.append('student_type', studentType);
    formData.append('filière', `${niveau} - ${filiere}`); formData.append('grade_average', gradeAverage);
    if (cinFile) formData.append('cin_copy', cinFile);
    if (transcriptFile) formData.append('transcript', transcriptFile);
    if (paymentMethod === 'upload' && feeReceiptFile) formData.append('fee_receipt', feeReceiptFile);
    if (residencyCertFile) formData.append('residency_cert', residencyCertFile);

    await submitApplication(formData);
  };

  if (dataLoading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div></div>;

  if (success) return (
    <div className="container mx-auto px-6 py-20 flex justify-center">
      <div className="glass-panel p-12 text-center max-w-md">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={48} />
        </div>
        <h2 className="text-3xl font-black mb-4">{t("application_sent")}</h2>
        <p className="text-slate-500">{t("redirecting_dashboard")}</p>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-black mb-2">{editMode ? t("update") : t("apply_now")}</h1>
          <p className="text-slate-500">Veuillez remplir soigneusement tous les champs requis.</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-12 relative px-4">
          <div className="absolute top-5 left-0 w-full h-0.5 bg-slate-200 dark:bg-slate-800 -z-10"></div>
          {steps.map((s) => (
            <div key={s.num} className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 font-bold border-2 ${
                step >= s.num ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-400'
              }`}>
                {step > s.num ? <CheckCircle size={20} /> : <s.icon size={18} />}
              </div>
              <span className={`text-[10px] uppercase tracking-tighter font-black mt-3 ${step >= s.num ? 'text-blue-600' : 'text-slate-400'}`}>{s.label}</span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="glass-panel p-8 md:p-10 space-y-8">
          <FormError error={error} />

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <h3 className="text-xl font-bold flex items-center gap-2"><User className="text-blue-600" /> {t("profile")}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2 space-y-1">
                    <label className="form-label">{t("full_name")}</label>
                    <input className="form-input" value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="Prénom Nom" />
                  </div>
                  <div className="space-y-1">
                    <label className="form-label">{t("cin")}</label>
                    <input className="form-input uppercase" value={cin} onChange={e => setCin(e.target.value)} required placeholder="AB123456" />
                  </div>
                  <div className="space-y-1">
                    <label className="form-label">{t("phone")}</label>
                    <div className="relative">
                       <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                       <input className="form-input pl-10" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="0612345678" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="form-label">{t("date_of_birth")}</label>
                    <input className="form-input" type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} required />
                  </div>
                  <div className="space-y-1">
                    <label className="form-label">{t("province")}</label>
                    <select className="form-input bg-white dark:bg-slate-900" value={province} onChange={e => { setProvince(e.target.value); setCity(''); }} required>
                      <option value="">{t("choose")}...</option>
                      {PROVINCES_DATA.map(p => <option key={p.key} value={p.key}>{getLabel(p, language)}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="form-label">{t("city")}</label>
                    <select className="form-input bg-white dark:bg-slate-900" value={city} onChange={e => setCity(e.target.value)} required disabled={!province}>
                      <option value="">{province ? t('choose_city') : t('select_province')}</option>
                      {province && CITIES_BY_PROVINCE_DATA[province]?.map(c => <option key={c.key} value={c.key}>{getLabel(c, language)}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <label className="form-label">{t("address")}</label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-3 text-slate-400" size={16} />
                        <textarea className="form-input pl-10 h-24 pt-2" value={address} onChange={e => setAddress(e.target.value)} required placeholder={t("current_address")} />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <h3 className="text-xl font-bold flex items-center gap-2"><GraduationCap className="text-blue-600" /> {t("academic_info")}</h3>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="form-label">{t("student_type_label")}</label>
                    <div className="grid grid-cols-2 gap-4">
                      {['CPGE', 'Lycée Technique'].map(type => (
                        <button type="button" key={type} onClick={() => { setStudentType(type); setFiliere(''); setNiveau(''); }}
                          className={`py-3 px-4 rounded-xl border-2 transition-all font-bold ${studentType === type ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-100 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                          {type === 'Lycée Technique' ? t("technical_high_school") : type}
                        </button>
                      ))}
                    </div>
                  </div>
                  {studentType && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 animate-in fade-in duration-300">
                      <div className="space-y-1"><label className="form-label">{t("level")}</label>
                        <select className="form-input bg-white dark:bg-slate-900" value={niveau} onChange={e => setNiveau(e.target.value)} required>
                          <option value="">{t("choose")}...</option>
                          {studentType === 'CPGE' ? [t('1st_year'), t('2nd_year')].map(n => <option key={n} value={n}>{n}</option>) : [t('tronc_commun'), '1BAC', '2BAC'].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1"><label className="form-label">{t("major")}</label>
                        <select className="form-input bg-white dark:bg-slate-900" value={filiere} onChange={e => setFiliere(e.target.value)} required>
                          <option value="">{t("choose")}...</option>
                          {(studentType === 'CPGE' ? FILIERES_CPGE : FILIERES_LYCEE).map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                      </div>
                      <div className="md:col-span-2 space-y-1">
                        <label className="form-label">{t("grade_average")} (/20)</label>
                        <input className="form-input h-14 text-lg font-black text-blue-600 text-center" type="number" step="0.01" value={gradeAverage} onChange={e => setGradeAverage(e.target.value)} required />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                <h3 className="text-xl font-bold flex items-center gap-2"><Upload className="text-blue-600" /> {t("supporting_documents")}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FileUploadBox id="cin-copy" label={t("cin_copy")} file={cinFile} onFileChange={setCinFile} icon={FileText} />
                  <FileUploadBox id="transcript" label={t("transcript_record")} file={transcriptFile} onFileChange={setTranscriptFile} icon={FileText} />
                </div>

                <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><Landmark className="text-blue-600" /> {t("registration_fees")} (150 MAD)</h3>
                  <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-xl mb-6">
                    <button type="button" onClick={() => setPaymentMethod('upload')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${paymentMethod === 'upload' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500'}`}>{t("transfer_receipt")}</button>
                    <button type="button" onClick={() => setPaymentMethod('online')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${paymentMethod === 'online' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500'}`}>{t("online_payment")}</button>
                  </div>
                  {paymentMethod === 'upload' ? <FileUploadBox id="fee-receipt" label={t("fee_receipt_label")} file={feeReceiptFile} onFileChange={setFeeReceiptFile} icon={Upload} /> : (
                    <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl border-2 border-slate-100 dark:border-slate-800">
                      <CardElement options={{ style: { base: { fontSize: '16px', color: language === 'ar' ? '#fff' : '#1e293b' } } }} />
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-between items-center pt-10 border-t border-slate-50 dark:border-slate-800">
            {step > 1 ? (
              <button type="button" className="btn btn-outline px-8" onClick={() => setStep(s => s - 1)}>
                 <ChevronLeft size={18} className="mr-2" /> {t("back")}
              </button>
            ) : (
              <button type="button" className="text-slate-400 font-bold hover:text-slate-600" onClick={() => navigate('/dashboard')}>
                 {t("cancel")}
              </button>
            )}

            {step < 3 ? (
              <button type="button" className="btn btn-primary px-10 group" onClick={() => (step === 1 ? validateStep1() : validateStep2()) && setStep(s => s + 1)}>
                {t("next")} <ChevronRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <button type="submit" className="btn btn-primary px-12 py-3.5 text-lg" disabled={loading}>
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" /> : null}
                {editMode ? t('update') : t('submit_dossier')}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

const FileUploadBox = ({ id, label, file, onFileChange, icon: Icon }) => (
  <div
    className={`relative border-2 border-dashed p-6 rounded-2xl text-center cursor-pointer transition-all hover:border-blue-400 group ${file ? 'bg-emerald-50 border-emerald-300 dark:bg-emerald-900/10 dark:border-emerald-800' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}
    onClick={() => document.getElementById(id).click()}
  >
    <input id={id} type="file" className="hidden" onChange={e => onFileChange(e.target.files[0])} />
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 transition-colors ${file ? 'bg-emerald-100 text-emerald-600' : 'bg-white dark:bg-slate-800 text-slate-400 group-hover:text-blue-500 shadow-sm'}`}>
      {file ? <CheckCircle size={24} /> : <Icon size={24} />}
    </div>
    <p className={`text-xs font-bold uppercase tracking-widest ${file ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400 group-hover:text-blue-600'}`}>
       {file ? 'Fichier sélectionné' : label}
    </p>
    {file && <p className="text-[10px] text-emerald-600 truncate mt-1 font-medium">{file.name}</p>}
  </div>
);

const ApplyWithStripe = () => (<Elements stripe={stripePromise}><Apply /></Elements>);
export default ApplyWithStripe;
