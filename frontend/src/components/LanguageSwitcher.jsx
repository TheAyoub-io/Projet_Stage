import React from 'react';
import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'fr', label: 'FR' },
  { code: 'en', label: 'EN' },
  { code: 'ar', label: 'AR' },
];

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const current = (i18n.language || 'fr').split('-')[0];

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lng;
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
      {languages.map((lang, idx) => {
        const isActive = current === lang.code;
        return (
          <button
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            style={{
              padding: '5px 11px',
              borderRadius: '20px',
              border: isActive ? '1.5px solid #059669' : '1.5px solid transparent',
              background: isActive ? '#ecfdf5' : 'transparent',
              color: isActive ? '#059669' : '#64748b',
              fontWeight: isActive ? '700' : '500',
              fontSize: '0.8rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              letterSpacing: '0.02em',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.color = '#1e293b';
                e.currentTarget.style.background = '#f1f5f9';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.color = '#64748b';
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            {lang.label}
          </button>
        );
      })}
    </div>
  );
};

export default LanguageSwitcher;
