import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../lib/axios';
import { User, BookOpen, Upload, ChevronRight, ChevronLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { PROVINCES_DATA, CITIES_BY_PROVINCE_DATA, getLabel } from '../data/citiesData';

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
  const stripe = useStripe();
  const elements = useElements();

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
    { num: 2, label: t('student_space'), icon: BookOpen },
    { num: 3, label: t('admission_status'), icon: Upload },
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
      if (!cinFile) {
        setError(t("error_cin_required") || "Veuillez charger la copie de votre CIN (Étape 3).");
        toast.error("Copie CIN manquante !");
        return;
      }
      if (!transcriptFile) {
        setError(t("error_transcript_required") || "Veuillez charger votre relevé de notes (Étape 3).");
        toast.error("Relevé de notes manquant !");
        return;
      }
      if (paymentMethod === 'upload' && !feeReceiptFile) {
        setError(t("error_receipt_required") || "Veuillez charger le reçu de virement (Étape 3).");
        toast.error("Reçu de virement manquant !");
        return;
      }
    }

    setLoading(true); setError('');
    const formData = new FormData();
    formData.append('full_name', fullName); formData.append('cin', cin);
    formData.append('phone', phone); formData.append('date_of_birth', dateOfBirth);
    formData.append('address', address); formData.append('city', city);
    formData.append('province', province); formData.append('student_type', studentType);
    formData.append('filière', `${niveau} - ${filiere}`); formData.append('filiere', `${niveau} - ${filiere}`); formData.append('grade_average', gradeAverage);
    if (cinFile) formData.append('cin_copy', cinFile);
    if (transcriptFile) formData.append('transcript', transcriptFile);
    if (paymentMethod === 'upload' && feeReceiptFile) formData.append('fee_receipt', feeReceiptFile);
    if (residencyCertFile) formData.append('residency_cert', residencyCertFile);

    try {
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      };
      if (editMode) await api.put('/applications/update', formData, config);
      else await api.post('/applications/apply', formData, config);
      setSuccess(true); toast.success(t("application_saved"));
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      const detail = err.response?.data?.detail;
      let errMsg = 'Erreur lors de la soumission.';
      if (typeof detail === 'string') {
        errMsg = detail;
      } else if (Array.isArray(detail)) {
        errMsg = detail.map(d => {
          const field = d.loc ? d.loc[d.loc.length - 1] : '';
          return `${field}: ${d.msg}`;
        }).join(', ');
      } else if (detail) {
        errMsg = JSON.stringify(detail);
      }
      setError(errMsg);
    }
    finally { setLoading(false); }
  };

  if (dataLoading) return <div className="loader-container"><div className="spinner"></div></div>;

  if (success) return (
    <div className="auth-page">
      <div className="glass-panel auth-card animate-up" style={{ textAlign: 'center' }}>
        <div className="success-icon-wrapper">
          <CheckCircle size={48} className="text-success" />
        </div>
        <h2>{t("application_sent")}</h2>
        <p>{t("redirecting_dashboard")}</p>
      </div>
    </div>
  );

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <div className="glass-panel animate-up" style={{ maxWidth: '650px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '3rem' }}>
          {steps.map((s, i) => {
            const Icon = s.icon;
            const isActive = step === s.num;
            const isCompleted = step > s.num;
            return (
              <React.Fragment key={s.num}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <div
                    style={{
                      width: '40px', height: '40px', borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isCompleted ? 'var(--success)' : isActive ? 'var(--primary)' : 'var(--bg-alt)',
                      color: isCompleted || isActive ? 'white' : 'var(--text-muted)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {isCompleted ? <CheckCircle size={20} /> : <Icon size={20} />}
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: isActive ? '700' : '500' }}>{s.label}</span>
                </div>
                {i < steps.length - 1 && <div style={{ height: '2px', width: '50px', background: 'var(--bg-alt)', margin: '0 10px 1.2rem' }} />}
              </React.Fragment>
            );
          })}
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-danger"><AlertCircle size={18} /> {error}</div>}

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2>{t("profile")}</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
                  <div style={{ gridColumn: '1 / -1' }}><label className="form-label">{t("full_name")}</label><input className="form-input" value={fullName} onChange={e => setFullName(e.target.value)} required /></div>
                  <div><label className="form-label">{t("cin")}</label><input className="form-input" value={cin} onChange={e => setCin(e.target.value)} required /></div>
                  <div><label className="form-label">{t("phone")}</label><input className="form-input" value={phone} onChange={e => setPhone(e.target.value)} required /></div>
                  <div><label className="form-label">{t("date_of_birth")}</label><input className="form-input" type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} required /></div>
                  <div><label className="form-label">{t("province")}</label>
                    <select className="form-input" value={province} onChange={e => { setProvince(e.target.value); setCity(''); }} required>
                      <option value="">{t("choose")}...</option>
                      {PROVINCES_DATA.map(p => <option key={p.key} value={p.key}>{getLabel(p, language)}</option>)}
                    </select>
                  </div>
                  <div><label className="form-label">{t("city")}</label>
                    <select className="form-input" value={city} onChange={e => setCity(e.target.value)} required disabled={!province}>
                      <option value="">{province ? t('choose_city') : t('select_province')}</option>
                      {province && CITIES_BY_PROVINCE_DATA[province]
                        ?.slice().sort((a, b) => getLabel(a, language).localeCompare(getLabel(b, language)))
                        .map(c => <option key={c.key} value={c.key}>{getLabel(c, language)}</option>)}
                    </select>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}><label className="form-label">{t("address")}</label><input className="form-input" value={address} onChange={e => setAddress(e.target.value)} required /></div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2>{t("academic_info")}</h2>
                <div className="form-group">
                  <label className="form-label">{t("student_type_label")}</label>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    {['CPGE', 'Lycée Technique'].map(type => (
                      <button type="button" key={type} onClick={() => { setStudentType(type); setFiliere(''); setNiveau(''); }} className={studentType === type ? 'btn btn-primary' : 'btn btn-outline'} style={{ flex: 1 }}>
                        {type === 'Lycée Technique' ? t("technical_high_school") : type}
                      </button>
                    ))}
                  </div>
                </div>
                {studentType && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                    <div><label className="form-label">{t("level")}</label>
                      <select className="form-input" value={niveau} onChange={e => setNiveau(e.target.value)} required>
                        <option value="">{t("choose")}...</option>
                        {studentType === 'CPGE' ? [t('1st_year'), t('2nd_year')].map(n => <option key={n} value={n}>{n}</option>) : [t('tronc_commun'), '1BAC', '2BAC'].map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                    <div><label className="form-label">{t("major")}</label>
                      <select className="form-input" value={filiere} onChange={e => setFiliere(e.target.value)} required>
                        <option value="">{t("choose")}...</option>
                        {(studentType === 'CPGE' ? FILIERES_CPGE : FILIERES_LYCEE).map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}><label className="form-label">{t("grade_average")} (/20)</label><input className="form-input" type="number" step="0.01" value={gradeAverage} onChange={e => setGradeAverage(e.target.value)} required /></div>
                  </div>
                )}
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2>{t("supporting_documents")}</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <FileUploadBox id="cin-copy" label={t("cin_copy")} file={cinFile} onFileChange={setCinFile} />
                  <FileUploadBox id="transcript" label={t("transcript_record")} file={transcriptFile} onFileChange={setTranscriptFile} />
                </div>
                <div style={{ marginTop: '2rem', borderTop: '1px solid var(--card-border)', paddingTop: '1.5rem' }}>
                  <h3>{t("registration_fees")} (150 MAD)</h3>
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    <button type="button" onClick={() => setPaymentMethod('upload')} className={paymentMethod === 'upload' ? 'btn btn-primary' : 'btn btn-outline'} style={{ flex: 1 }}>{t("transfer_receipt")}</button>
                    <button type="button" onClick={() => setPaymentMethod('online')} className={paymentMethod === 'online' ? 'btn btn-primary' : 'btn btn-outline'} style={{ flex: 1 }}>{t("online_payment")}</button>
                  </div>
                  {paymentMethod === 'upload' ? <FileUploadBox id="fee-receipt" label={t("fee_receipt_label")} file={feeReceiptFile} onFileChange={setFeeReceiptFile} /> : (
                    <div style={{ padding: '1rem', background: 'var(--bg-alt)', borderRadius: '12px' }}>
                      <CardElement options={{ style: { base: { fontSize: '16px', color: 'var(--text-main)' } } }} />
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2.5rem' }}>
            {step > 1 ? <button type="button" className="btn btn-outline" onClick={() => setStep(s => s - 1)}><ChevronLeft size={18} /> {t("back")}</button> : <button type="button" className="btn btn-outline" onClick={() => navigate('/dashboard')}>{t("cancel")}</button>}
            {step < 3 ? <button type="button" className="btn btn-primary" onClick={() => (step === 1 ? validateStep1() : validateStep2()) && setStep(s => s + 1)}>{t("next")} <ChevronRight size={18} /></button> : <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? t('sending') : (editMode ? t('update') : t('submit_dossier'))}</button>}
          </div>
        </form>
      </div>
    </div>
  );
};

const FileUploadBox = ({ id, label, file, onFileChange }) => (
  <div style={{ border: '2px dashed var(--card-border)', padding: '1.5rem', borderRadius: '15px', textAlign: 'center', cursor: 'pointer', background: file ? 'var(--success-bg)' : 'transparent' }} onClick={() => document.getElementById(id).click()}>
    <input id={id} type="file" style={{ display: 'none' }} onChange={e => onFileChange(e.target.files[0])} />
    <Upload size={24} style={{ color: file ? 'var(--success)' : 'var(--text-subtle)', marginBottom: '0.5rem' }} />
    <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600' }}>{file ? file.name : label}</span>
  </div>
);

const ApplyWithStripe = () => (<Elements stripe={stripePromise}><Apply /></Elements>);
export default ApplyWithStripe;

