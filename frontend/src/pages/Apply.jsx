import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../lib/axios';
import { User, Upload, ChevronRight, ChevronLeft, CheckCircle, Phone, MapPin, GraduationCap, FileText, Landmark, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement } from '@stripe/react-stripe-js';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { PROVINCES_DATA, CITIES_BY_PROVINCE_DATA, getLabel } from '../data/citiesData';
import FormError from '../components/FormError';
import { useSubmitApplication, useMyStatus } from '../hooks/useApplications';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_TYooMQauvdEDq54NiTphI7jx');

const FILIERES_CPGE = ['MPSI', 'PCSI', 'TSI', 'ECS'];
const FILIERES_LYCEE = ['Sciences Économiques', 'Sciences Mathématiques', 'Arts Appliquées', 'Électromécanique', 'Électrotechnique'];

const Apply = () => {
  const { t, i18n: { language } } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const editMode = new URLSearchParams(location.search).get('edit') === 'true';

  const [step, setStep] = useState(() => parseInt(sessionStorage.getItem('apply_step')) || 1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { data: statusData, isLoading: dataLoading } = useMyStatus();
  const { mutate: submitApplication, isPending: loading } = useSubmitApplication();

  const [fullName, setFullName] = useState(() => sessionStorage.getItem('apply_fullName') || '');
  const [cin, setCin] = useState(() => sessionStorage.getItem('apply_cin') || '');
  const [phone, setPhone] = useState(() => sessionStorage.getItem('apply_phone') || '');
  const [dateOfBirth, setDateOfBirth] = useState(() => sessionStorage.getItem('apply_dateOfBirth') || '');
  const [address, setAddress] = useState(() => sessionStorage.getItem('apply_address') || '');
  const [city, setCity] = useState(() => sessionStorage.getItem('apply_city') || '');
  const [province, setProvince] = useState(() => sessionStorage.getItem('apply_province') || '');
  const [gender, setGender] = useState(() => sessionStorage.getItem('apply_gender') || '');

  const [studentType, setStudentType] = useState(() => sessionStorage.getItem('apply_studentType') || '');
  const [niveau, setNiveau] = useState(() => sessionStorage.getItem('apply_niveau') || '');
  const [filiere, setFiliere] = useState(() => sessionStorage.getItem('apply_filiere') || '');
  const [gradeAverage, setGradeAverage] = useState(() => sessionStorage.getItem('apply_gradeAverage') || '');

  useEffect(() => {
    sessionStorage.setItem('apply_step', step);
    sessionStorage.setItem('apply_fullName', fullName);
    sessionStorage.setItem('apply_cin', cin);
    sessionStorage.setItem('apply_phone', phone);
    sessionStorage.setItem('apply_dateOfBirth', dateOfBirth);
    sessionStorage.setItem('apply_address', address);
    sessionStorage.setItem('apply_city', city);
    sessionStorage.setItem('apply_province', province);
    sessionStorage.setItem('apply_gender', gender);
    sessionStorage.setItem('apply_studentType', studentType);
    sessionStorage.setItem('apply_niveau', niveau);
    sessionStorage.setItem('apply_filiere', filiere);
    sessionStorage.setItem('apply_gradeAverage', gradeAverage);
  }, [step, fullName, cin, phone, dateOfBirth, address, city, province, gender, studentType, niveau, filiere, gradeAverage]);

  const [cinFile, setCinFile] = useState(null);
  const [transcriptFile, setTranscriptFile] = useState(null);
  const [feeReceiptFile, setFeeReceiptFile] = useState(null);
  const [residencyCertFile, setResidencyCertFile] = useState(null);

  const [paymentMethod, setPaymentMethod] = useState('upload');


  useEffect(() => {
    if (editMode && statusData) {
      const { profile, application } = statusData;
      if (profile) {
        setFullName(profile.full_name || '');
        setCin(profile.cin || '');
        setPhone(profile.phone || '');
        setDateOfBirth(profile.date_of_birth ? profile.date_of_birth.split('T')[0] : '');
        setAddress(profile.address || '');
        setProvince(profile.province || '');
        setCity(profile.city || '');
        setGender(profile.gender || '');
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
    }
  }, [editMode, statusData]);

  const steps = [
    { num: 1, label: t('academic_info'), icon: GraduationCap },
    { num: 2, label: t('profile'), icon: User },
    { num: 3, label: t('supporting_documents'), icon: Upload },
  ];

  const isGuardianCin = niveau === 'Tronc Commun' || niveau === '1BAC';
  const cinLabel = isGuardianCin ? "CIN du tuteur (Père ou Mère)" : t("cin");
  const cinPlaceholder = isGuardianCin ? "CIN du tuteur" : "AB123456";

  const validateStep1 = () => {
    if (!studentType || !niveau || !filiere || !gradeAverage) {
      setError(t('error_academic_fields')); return false;
    }
    const avg = parseFloat(gradeAverage);
    if (isNaN(avg) || avg < 0 || avg > 20) {
      setError(t('error_grade_range')); return false;
    }
    setError(''); return true;
  };

  const validateStep2 = () => {
    if (!fullName || !cin || !phone || !dateOfBirth || !address || !city || !province || !gender) {
      setError(t('error_personal_fields')); return false;
    }
    setError(''); return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step < 3) return;

    if (!editMode) {
      if (!cinFile) { 
        setError(t("error_cin_required") || "Copie CIN requise"); 
        toast.error(t("error_cin_required") || "Veuillez importer ou scanner votre CIN");
        return; 
      }
      if (!transcriptFile) { 
        setError(t("error_transcript_required") || "Relevé de notes requis"); 
        toast.error(t("error_transcript_required") || "Veuillez importer ou scanner votre relevé de notes");
        return; 
      }
      if (!residencyCertFile) { 
        setError("Certificat de résidence requis"); 
        toast.error("Veuillez importer ou scanner votre Certificat de résidence");
        return; 
      }
    }

    setError('');
    const formData = new FormData();
    formData.append('full_name', fullName); formData.append('cin', cin);
    formData.append('phone', phone); formData.append('date_of_birth', dateOfBirth);
    formData.append('address', address); formData.append('city', city);
    formData.append('province', province); formData.append('gender', gender);
    formData.append('student_type', studentType);
    formData.append('filière', `${niveau} - ${filiere}`); formData.append('grade_average', gradeAverage);
    formData.append('signature', fullName);
    if (cinFile) formData.append('cin_copy', cinFile);
    if (transcriptFile) formData.append('transcript', transcriptFile);

    if (residencyCertFile) formData.append('residency_cert', residencyCertFile);

    submitApplication({ data: formData, editMode }, {
      onSuccess: () => {
        ['apply_step', 'apply_fullName', 'apply_cin', 'apply_phone', 'apply_dateOfBirth', 'apply_address', 'apply_city', 'apply_province', 'apply_studentType', 'apply_niveau', 'apply_filiere', 'apply_gradeAverage'].forEach(key => sessionStorage.removeItem(key));
        setSuccess(true);
        toast.success(t("application_saved"));
        setTimeout(() => navigate('/dashboard'), 2000);
      },
      onError: (err) => {
        let detail = err.response?.data?.detail;
        if (Array.isArray(detail)) {
          detail = detail.map(d => `${d.loc.slice(-1)[0]}: ${d.msg}`).join(', ');
        }
        setError(detail || 'Erreur lors de la soumission.');
      }
    });
  };

  if (dataLoading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div></div>;

  if (success) return (
    <div className="container mx-auto px-6 pt-32 pb-20 flex justify-center">
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
    <div className="flex-1 flex w-full relative overflow-hidden bg-slate-50 min-h-[calc(100vh-64px)] items-center justify-center py-12 px-4 sm:px-6">
      {/* Decorative background blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-400/20 mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-400/20 mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
      </div>

      <div className="w-full max-w-3xl z-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">{editMode ? t("update") : t("apply_now")}</h1>
          <p className="text-slate-500 font-medium">Veuillez remplir soigneusement tous les champs requis.</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-12 relative px-8">
          {/* Background line */}
          <div className="absolute top-5 left-10 right-10 h-1 bg-slate-200/60 rounded-full -z-10"></div>
          {/* Progress line */}
          <div 
            className="absolute top-5 left-10 h-1 bg-emerald-600 rounded-full -z-10 transition-all duration-500 ease-out"
            style={{ width: `calc(${(step - 1) / (steps.length - 1) * 100}% - ${(step - 1) / (steps.length - 1) * 40}px)` }}
          ></div>
          
          {steps.map((s) => (
            <div key={s.num} className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 font-bold border-2 
                ${step > s.num 
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-600/30' 
                  : step === s.num 
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-4 ring-emerald-100'
                    : 'bg-white border-slate-200 text-slate-300'
                }`}>
                {step > s.num ? <CheckCircle size={20} /> : <s.icon size={18} />}
              </div>
              <span className={`text-[10px] uppercase tracking-widest font-bold mt-3 transition-colors duration-300 ${step >= s.num ? 'text-slate-800' : 'text-slate-400'}`}>{s.label}</span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl p-8 md:p-10 space-y-8 relative overflow-hidden">
          {/* Inner decorative shine */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-100/50 to-transparent rounded-bl-full pointer-events-none" />
          <FormError error={error} />

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <h3 className="text-xl font-bold flex items-center gap-2"><GraduationCap className="text-emerald-600" /> {t("academic_info")}</h3>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="form-label">{t("student_type_label")}</label>
                    <div className="grid grid-cols-2 gap-4">
                      {['CPGE', 'Lycée Technique'].map(type => (
                        <button type="button" key={type} onClick={() => { setStudentType(type); setFiliere(''); setNiveau(''); }}
                          className={`py-3 px-4 rounded-xl border-2 transition-all font-bold ${studentType === type ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-100 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
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
                        <input className="form-input h-14 text-lg font-black text-emerald-600 text-center" type="number" step="0.01" value={gradeAverage} onChange={e => setGradeAverage(e.target.value)} required />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <h3 className="text-xl font-bold flex items-center gap-2"><User className="text-emerald-600" /> {t("profile")}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2 space-y-1">
                    <label className="form-label">{t("full_name")}</label>
                    <input className="form-input" value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="Prénom Nom" />
                  </div>
                  <div className="space-y-1">
                    <label className="form-label text-emerald-600 font-bold">{cinLabel}</label>
                    <input className="form-input uppercase border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500/20" value={cin} onChange={e => setCin(e.target.value)} required placeholder={cinPlaceholder} />
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
                    <label className="form-label">Sexe</label>
                    <select className="form-input bg-white dark:bg-slate-900" value={gender} onChange={e => setGender(e.target.value)} required>
                      <option value="">Sélectionnez le sexe...</option>
                      <option value="Male">Homme</option>
                      <option value="Female">Femme</option>
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

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                <h3 className="text-xl font-bold flex items-center gap-2"><Upload className="text-emerald-600" /> {t("supporting_documents")}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FileUploadBox id="cin-copy" label={isGuardianCin ? "Scan de la CIN du tuteur" : t("cin_copy")} file={cinFile} onFileChange={setCinFile} icon={FileText} />
                  <FileUploadBox id="transcript" label={t("transcript_record")} file={transcriptFile} onFileChange={setTranscriptFile} icon={FileText} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><MapPin size={18} className="text-emerald-500" /> Résidence & Reçu</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FileUploadBox id="residency-cert" label="Scan / Importation du Certificat" file={residencyCertFile} onFileChange={setResidencyCertFile} icon={Upload} />
                    <FileUploadBox id="fee-receipt" label="Scan / Importation du Reçu (150 MAD)" file={feeReceiptFile} onFileChange={setFeeReceiptFile} icon={Upload} />
                  </div>
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
    onClick={() => { if (!file) document.getElementById(`${id}-upload`).click(); }}
    className={`relative border-2 border-dashed p-6 rounded-2xl text-center cursor-pointer transition-all hover:border-emerald-400 group ${file ? 'bg-emerald-50 border-emerald-300 dark:bg-emerald-900/10 dark:border-emerald-800' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}
  >
    <input id={`${id}-scan`} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => onFileChange(e.target.files[0])} />
    <input id={`${id}-upload`} type="file" accept="image/*,.pdf" className="hidden" onChange={e => onFileChange(e.target.files[0])} />
    
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 transition-colors ${file ? 'bg-emerald-100 text-emerald-600' : 'bg-white dark:bg-slate-800 text-slate-400 group-hover:text-emerald-500 shadow-sm'}`}>
      {file ? <CheckCircle size={24} /> : <Icon size={24} />}
    </div>
    
    <p className={`text-xs font-bold uppercase tracking-widest ${file ? 'text-emerald-700 dark:text-emerald-400 mb-1' : 'text-slate-500 group-hover:text-emerald-600 mb-3'}`}>
      {file ? 'Fichier sélectionné' : label}
    </p>

    {!file ? (
      <div className="flex items-center justify-center gap-2 mt-3">
         <label htmlFor={`${id}-scan`} onClick={(e) => e.stopPropagation()} className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-emerald-600 flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer m-0">
            <Camera size={14} /> Scanner
         </label>
         <label htmlFor={`${id}-upload`} onClick={(e) => e.stopPropagation()} className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-emerald-600 flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer m-0">
            <Upload size={14} /> Importer
         </label>
      </div>
    ) : (
      <>
        <p className="text-[10px] text-emerald-600 truncate mt-1 font-medium">{file.name}</p>
        <button type="button" onClick={(e) => { e.stopPropagation(); onFileChange(null); }} className="mt-2 px-3 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded text-[10px] font-bold transition-colors">Retirer</button>
      </>
    )}
  </div>
);

const ApplyWithStripe = () => (<Elements stripe={stripePromise}><Apply /></Elements>);
export default ApplyWithStripe;
