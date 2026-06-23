import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, BookOpen, Upload, ChevronRight, ChevronLeft, CheckCircle, AlertCircle, FileText, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import api from '../lib/axios';
import { Button, Card, Input, Select, Alert, Badge, Spinner } from '../components/ui';
import { useForm, FormError } from '../hooks/useFormEnhanced';
import { useFileUpload } from '../hooks/useAsync';
import { PROVINCES_DATA, CITIES_BY_PROVINCE_DATA, getLabel } from '../data/citiesData';
import i18n from '../i18n';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_TYooMQauvdEDq54NiTphI7jx');

const FILIERES_CPGE = ['MPSI', 'PCSI', 'TSI', 'ECS'];
const FILIERES_LYCEE = ['Sciences Économiques', 'Sciences Mathématiques', 'Arts Appliquées', 'Électromécanique', 'Électrotechnique'];

const FileUploadField = ({ label, file, onFileChange, accept = '.pdf,.jpg,.jpeg,.png', maxSize = 5 }) => {
  const { t } = useTranslation();
  const inputRef = React.useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.size <= maxSize * 1024 * 1024) {
      onFileChange(droppedFile);
    } else {
      toast.error(`File size must not exceed ${maxSize}MB`);
    }
  };

  // Generate a unique ID to link labels and inputs
  const idPrefix = React.useId();

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onClick={() => { if (!file) document.getElementById(`${idPrefix}-upload`).click(); }}
      className={`border-2 border-dashed rounded-lg p-4 cursor-pointer transition-colors ${file ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10' : 'border-gray-300 dark:border-gray-600 hover:border-emerald-500 bg-white dark:bg-slate-800'}`}
    >
      <input
        id={`${idPrefix}-scan`}
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => onFileChange(e.target.files?.[0])}
        className="hidden"
      />
      <input
        id={`${idPrefix}-upload`}
        type="file"
        accept="image/*,.pdf"
        onChange={(e) => onFileChange(e.target.files?.[0])}
        className="hidden"
      />

      <div className="flex flex-col items-center justify-center gap-3">
        <div className="flex items-center gap-3 w-full">
          <div className={`p-2 rounded-full ${file ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
             {file ? <CheckCircle size={24} /> : <FileText size={24} />}
          </div>
          <div className="text-left flex-1">
            <p className={`font-semibold ${file ? 'text-emerald-700' : 'text-gray-900 dark:text-white'}`}>{label}</p>
            {file ? (
              <p className="text-sm text-green-600 dark:text-green-400 truncate">{file.name}</p>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400">Prendre une photo ou importer un fichier PDF/Image.</p>
            )}
          </div>
        </div>

        {!file ? (
          <div className="flex w-full gap-2 mt-2">
            <button type="button" onClick={(e) => { e.stopPropagation(); document.getElementById(`${idPrefix}-scan`).click(); }} className="flex-1 py-2 bg-slate-50 dark:bg-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-slate-600 dark:text-slate-300 hover:text-emerald-600 rounded-lg border border-slate-200 dark:border-slate-600 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors">
              <Camera size={14} /> Scanner
            </button>
            <button type="button" onClick={(e) => { e.stopPropagation(); document.getElementById(`${idPrefix}-upload`).click(); }} className="flex-1 py-2 bg-slate-50 dark:bg-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-slate-600 dark:text-slate-300 hover:text-emerald-600 rounded-lg border border-slate-200 dark:border-slate-600 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors">
              <Upload size={14} /> Importer
            </button>
          </div>
        ) : (
          <div className="w-full text-right mt-1">
            <button type="button" onClick={(e) => { e.stopPropagation(); onFileChange(null); }} className="text-[11px] text-red-500 hover:text-red-700 font-bold underline">Retirer le fichier</button>
          </div>
        )}
      </div>
    </div>
  );
};

const ApplyForm = ({ editMode }) => {
  const { t, i18n: { language } } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoadingData, setIsLoadingData] = useState(editMode);
  const [validationErrors, setValidationErrors] = useState({});

  const form = useForm(
    {
      fullName: '',
      cin: '',
      phone: '',
      dateOfBirth: '',
      address: '',
      city: '',
      province: '',
      studentType: '',
      niveau: '',
      filiere: '',
      gradeAverage: '',
      paymentMethod: 'upload',
    },
    async (values) => {
      await submitApplication(values);
    }
  );

  const cinFileUpload = useFileUpload((file) => Promise.resolve(file));
  const transcriptFileUpload = useFileUpload((file) => Promise.resolve(file));
  const feeReceiptFileUpload = useFileUpload((file) => Promise.resolve(file));
  const residencyCertFileUpload = useFileUpload((file) => Promise.resolve(file));

  // Load existing application data in edit mode
  useEffect(() => {
    if (editMode) {
      api
        .get('/applications/my-status')
        .then((res) => {
          const { profile, application } = res.data;
          if (profile) {
            form.setFieldValue('fullName', profile.full_name || '');
            form.setFieldValue('cin', profile.cin || '');
            form.setFieldValue('phone', profile.phone || '');
            form.setFieldValue('dateOfBirth', profile.date_of_birth?.split('T')[0] || '');
            form.setFieldValue('address', profile.address || '');
            form.setFieldValue('province', profile.province || '');
            form.setFieldValue('city', profile.city || '');
          }
          if (application) {
            form.setFieldValue('studentType', application.student_type || '');
            form.setFieldValue('gradeAverage', application.grade_average || '');
            const appFiliere = application.filière || application.filiere;
            if (appFiliere && appFiliere.includes(' - ')) {
              const [niv, fil] = appFiliere.split(' - ');
              form.setFieldValue('niveau', niv);
              form.setFieldValue('filiere', fil);
            }
          }
        })
        .catch((err) => {
          form.setSubmitError('Failed to load application data');
          toast.error('Failed to load your application');
        })
        .finally(() => setIsLoadingData(false));
    }
  }, [editMode]);

  const validateStep1 = () => {
    const errors = {};
    if (!form.values.fullName) errors.fullName = 'Full name is required';
    if (!form.values.cin) errors.cin = 'CIN is required';
    if (!form.values.phone) errors.phone = 'Phone is required';
    if (!form.values.dateOfBirth) errors.dateOfBirth = 'Date of birth is required';
    if (!form.values.address) errors.address = 'Address is required';
    if (!form.values.city) errors.city = 'City is required';
    if (!form.values.province) errors.province = 'Province is required';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    const errors = {};
    if (!form.values.studentType) errors.studentType = 'Student type is required';
    if (!form.values.niveau) errors.niveau = 'Level is required';
    if (!form.values.filiere) errors.filiere = 'Major is required';
    if (!form.values.gradeAverage) errors.gradeAverage = 'Grade average is required';

    const grade = parseFloat(form.values.gradeAverage);
    if (isNaN(grade) || grade < 0 || grade > 20) {
      errors.gradeAverage = 'Grade must be between 0 and 20';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep3 = () => {
    const errors = {};
    if (!editMode && !cinFileUpload.file) errors.cinFile = 'CIN copy is required';
    if (!editMode && !transcriptFileUpload.file) errors.transcriptFile = 'Transcript is required';
    if (!editMode && !residencyCertFileUpload.file) {
      errors.residencyCertFile = 'Certificat de résidence is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handlePrevious = () => {
    setStep(step - 1);
    setValidationErrors({});
  };

  const submitApplication = async (values) => {
    if (!validateStep3()) return;

    const formData = new FormData();
    formData.append('full_name', values.fullName);
    formData.append('cin', values.cin);
    formData.append('phone', values.phone);
    formData.append('date_of_birth', values.dateOfBirth);
    formData.append('address', values.address);
    formData.append('city', values.city);
    formData.append('province', values.province);
    formData.append('student_type', values.studentType);
    formData.append('filière', `${values.niveau} - ${values.filiere}`);
    formData.append('filiere', `${values.niveau} - ${values.filiere}`);
    formData.append('grade_average', values.gradeAverage);

    if (cinFileUpload.file) formData.append('cin_copy', cinFileUpload.file);
    if (transcriptFileUpload.file) formData.append('transcript', transcriptFileUpload.file);

    if (residencyCertFileUpload.file) formData.append('residency_cert', residencyCertFileUpload.file);

    try {
      const config = { headers: { 'Content-Type': 'multipart/form-data' } };
      if (editMode) {
        await api.put('/applications/update', formData, config);
      } else {
        await api.post('/applications/apply', formData, config);
      }
      toast.success(t('application_saved'));
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      let errorMessage = err.response?.data?.detail;
      if (Array.isArray(errorMessage)) errorMessage = errorMessage[0].msg;
      errorMessage = errorMessage || 'Error submitting application';
      form.setSubmitError(errorMessage);
      toast.error(errorMessage);
    }
  };

  if (isLoadingData) {
    return <Spinner fullScreen message={t('loading_data')} />;
  }

  const steps = [
    { num: 1, label: t('profile'), icon: User },
    { num: 2, label: t('student_space'), icon: BookOpen },
    { num: 3, label: t('admission_status'), icon: Upload },
  ];

  const provincesOptions = PROVINCES_DATA.map((p) => ({
    value: p.key,
    label: getLabel(p, language),
  }));

  const citiesOptions = form.values.province
    ? CITIES_BY_PROVINCE_DATA[form.values.province]
        ?.map((c) => ({ value: c.key, label: getLabel(c, language) }))
        .sort((a, b) => a.label.localeCompare(b.label)) || []
    : [];

  const filieresToShow =
    form.values.studentType === 'CPGE'
      ? FILIERES_CPGE.map((f) => ({ value: f, label: f }))
      : FILIERES_LYCEE.map((f) => ({ value: f, label: f }));

  const niveauOptions =
    form.values.studentType === 'CPGE'
      ? [
          { value: '1st_year', label: t('1st_year') },
          { value: '2nd_year', label: t('2nd_year') },
        ]
      : [
          { value: 'tronc_commun', label: t('tronc_commun') },
          { value: '1BAC', label: '1BAC' },
          { value: '2BAC', label: '2BAC' },
        ];

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        {/* Step Indicator */}
        <div className="flex justify-center items-center gap-4 mb-8">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const isActive = step === s.num;
            const isCompleted = step > s.num;

            return (
              <React.Fragment key={s.num}>
                <motion.div className="flex flex-col items-center gap-1">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                      isCompleted
                        ? 'bg-green-600 text-white'
                        : isActive
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {isCompleted ? <CheckCircle size={20} /> : <Icon size={20} />}
                  </motion.div>
                  <span className="text-xs font-semibold text-center">{s.label}</span>
                </motion.div>

                {i < steps.length - 1 && (
                  <div
                    className={`h-0.5 w-12 transition-colors ${
                      isCompleted ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Error Alert */}
        <AnimatePresence>
          {form.submitError && (
            <Alert
              type="error"
              title={t('error')}
              message={form.submitError}
              onClose={() => form.setSubmitError('')}
              className="mb-6"
            />
          )}
        </AnimatePresence>

        {/* Form Content */}
        <form onSubmit={(e) => form.handleSubmit(e, () => (step === 3 ? validateStep3() && {} : {}))}>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="text-2xl font-bold mb-6">{t('profile')}</h2>

                <div className="space-y-4">
                  <Input
                    label={t('full_name')}
                    name="fullName"
                    value={form.values.fullName}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                    error={validationErrors.fullName}
                    required
                    placeholder="John Doe"
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label={t('cin')}
                      name="cin"
                      value={form.values.cin}
                      onChange={form.handleChange}
                      onBlur={form.handleBlur}
                      error={validationErrors.cin}
                      required
                      placeholder="XX123456"
                    />

                    <Input
                      label={t('phone')}
                      name="phone"
                      type="tel"
                      value={form.values.phone}
                      onChange={form.handleChange}
                      onBlur={form.handleBlur}
                      error={validationErrors.phone}
                      required
                      placeholder="+212 6XX XXX XXX"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label={t('date_of_birth')}
                      name="dateOfBirth"
                      type="date"
                      value={form.values.dateOfBirth}
                      onChange={form.handleChange}
                      onBlur={form.handleBlur}
                      error={validationErrors.dateOfBirth}
                      required
                    />
                  </div>

                  <Input
                    label={t('address')}
                    name="address"
                    value={form.values.address}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                    error={validationErrors.address}
                    required
                    placeholder="123 Main Street"
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Select
                      label={t('province')}
                      options={provincesOptions}
                      value={form.values.province}
                      onChange={(value) => {
                        form.setFieldValue('province', value);
                        form.setFieldValue('city', '');
                      }}
                      error={validationErrors.province}
                      required
                      placeholder={t('select_province')}
                    />

                    <Select
                      label={t('city')}
                      options={citiesOptions}
                      value={form.values.city}
                      onChange={(value) => form.setFieldValue('city', value)}
                      error={validationErrors.city}
                      required
                      placeholder={form.values.province ? t('select_city') : t('select_province_first')}
                      disabled={!form.values.province}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="text-2xl font-bold mb-6">{t('academic_info')}</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      {t('student_type_label')}
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="flex gap-3">
                      {['CPGE', 'Lycée Technique'].map((type) => (
                        <Button
                          key={type}
                          type="button"
                          variant={form.values.studentType === type ? 'primary' : 'outline'}
                          className="flex-1"
                          onClick={() => {
                            form.setFieldValue('studentType', type);
                            form.setFieldValue('filiere', '');
                            form.setFieldValue('niveau', '');
                          }}
                        >
                          {type === 'Lycée Technique' ? t('technical_high_school') : type}
                        </Button>
                      ))}
                    </div>
                    {validationErrors.studentType && (
                      <FormError error={validationErrors.studentType} />
                    )}
                  </div>

                  {form.values.studentType && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <Select
                          label={t('level')}
                          options={niveauOptions}
                          value={form.values.niveau}
                          onChange={(value) => form.setFieldValue('niveau', value)}
                          error={validationErrors.niveau}
                          required
                          placeholder={t('select_level')}
                        />

                        <Select
                          label={t('major')}
                          options={filieresToShow}
                          value={form.values.filiere}
                          onChange={(value) => form.setFieldValue('filiere', value)}
                          error={validationErrors.filiere}
                          required
                          placeholder={t('select_major')}
                        />
                      </div>

                      <Input
                        label={`${t('grade_average')} (/20)`}
                        name="gradeAverage"
                        type="number"
                        step="0.01"
                        value={form.values.gradeAverage}
                        onChange={form.handleChange}
                        onBlur={form.handleBlur}
                        error={validationErrors.gradeAverage}
                        required
                        placeholder="16.50"
                        hint="Your average grade from 0 to 20"
                      />
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="text-2xl font-bold mb-6">{t('supporting_documents')}</h2>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        {t('cin_copy')}
                        {!editMode && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <FileUploadField
                        label={t('cin_copy')}
                        file={cinFileUpload.file}
                        onFileChange={cinFileUpload.handleFileChange}
                      />
                      {validationErrors.cinFile && (
                        <FormError error={validationErrors.cinFile} />
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        {t('transcript_record')}
                        {!editMode && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <FileUploadField
                        label={t('transcript_record')}
                        file={transcriptFileUpload.file}
                        onFileChange={transcriptFileUpload.handleFileChange}
                      />
                      {validationErrors.transcriptFile && (
                        <FormError error={validationErrors.transcriptFile} />
                      )}
                    </div>
                  </div>

                  {/* Residency Cert Section */}
                  <div className="border-t pt-6 mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <FileText className="text-emerald-600" /> Certificat de résidence
                      </h3>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Scan / Importation du Certificat
                        {!editMode && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <FileUploadField
                        label="Certificat de résidence"
                        file={residencyCertFileUpload.file}
                        onFileChange={residencyCertFileUpload.handleFileChange}
                      />
                      {validationErrors.residencyCertFile && (
                        <FormError error={validationErrors.residencyCertFile} />
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between gap-4 mt-8 pt-6 border-t">
            <Button
              type="button"
              variant="secondary"
              icon={ChevronLeft}
              onClick={step === 1 ? () => navigate('/dashboard') : handlePrevious}
            >
              {step === 1 ? t('cancel') : t('back')}
            </Button>

            {step < 3 ? (
              <Button
                type="button"
                variant="primary"
                icon={ChevronRight}
                onClick={handleNext}
              >
                {t('next')}
              </Button>
            ) : (
              <Button
                type="submit"
                variant="primary"
                loading={form.isSubmitting}
              >
                {editMode ? t('update') : t('submit_dossier')}
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
};

const Apply = () => {
  const location = useLocation();
  const editMode = new URLSearchParams(location.search).get('edit') === 'true';

  return (
    <Elements stripe={stripePromise}>
      <ApplyForm editMode={editMode} />
    </Elements>
  );
};

export default Apply;
