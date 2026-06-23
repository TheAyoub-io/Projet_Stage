import React from 'react';
import { Moon, Sun, Monitor, Type, Contrast, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEnhancedTheme } from './EnhancedThemeProvider';
import { Button } from './ui';
import { useTranslation } from 'react-i18next';

const EnhancedThemeSettings = () => {
  const { t } = useTranslation();
  const {
    colorScheme,
    setColorScheme,
    highContrast,
    toggleHighContrast,
    fontSize,
    setFontSize,
    reduceMotion,
    setReduceMotion,
  } = useEnhancedTheme();

  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative">
      {/* Settings Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ rotate: 20 }}
        whileTap={{ scale: 0.95 }}
        className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        aria-label="Theme settings"
      >
        <Sun className="w-5 h-5" />
      </motion.button>

      {/* Settings Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 p-4 space-y-4"
          >
            {/* Color Scheme */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                {t('color_scheme')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'light', icon: Sun, label: t('light') },
                  { value: 'auto', icon: Monitor, label: t('auto') },
                  { value: 'dark', icon: Moon, label: t('dark') },
                ].map(({ value, icon: Icon, label }) => (
                  <motion.button
                    key={value}
                    onClick={() => setColorScheme(value)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`p-3 rounded-lg transition-all ${
                      colorScheme === value
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                    title={label}
                  >
                    <Icon size={20} className="mx-auto" />
                    <span className="text-xs mt-1 block">{label}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Font Size */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                {t('font_size')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'small', label: t('small') },
                  { value: 'normal', label: t('normal') },
                  { value: 'large', label: t('large') },
                ].map(({ value, label }) => (
                  <motion.button
                    key={value}
                    onClick={() => setFontSize(value)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`p-3 rounded-lg transition-all text-${value === 'small' ? 'sm' : value === 'large' ? 'lg' : 'base'} font-medium ${
                      fontSize === value
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {label}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Accessibility Options */}
            <div className="space-y-2 border-t border-gray-200 dark:border-gray-700 pt-4">
              {/* High Contrast */}
              <motion.button
                onClick={toggleHighContrast}
                whileHover={{ x: 2 }}
                className={`w-full px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                  highContrast
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Contrast size={18} />
                <span className="text-sm font-medium">{t('high_contrast')}</span>
              </motion.button>

              {/* Reduce Motion */}
              {reduceMotion && (
                <div className="px-4 py-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-sm">
                  {t('reduce_motion_enabled')}
                </div>
              )}
            </div>

            {/* Reset Button */}
            <motion.button
              onClick={() => {
                setColorScheme('auto');
                setFontSize('normal');
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-2 justify-center"
            >
              <RotateCcw size={16} />
              {t('reset_defaults')}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedThemeSettings;
