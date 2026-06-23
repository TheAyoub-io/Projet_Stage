import React from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';
import { motion } from 'framer-motion';

const Alert = ({
  type = 'info',
  title,
  message,
  onClose,
  dismissible = true,
  icon: CustomIcon,
  className = '',
}) => {
  const types = {
    success: {
      icon: CheckCircle,
      colors: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
      accentColor: 'text-green-600 dark:text-green-400',
    },
    error: {
      icon: AlertCircle,
      colors: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
      accentColor: 'text-red-600 dark:text-red-400',
    },
    warning: {
      icon: AlertTriangle,
      colors: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200',
      accentColor: 'text-yellow-600 dark:text-yellow-400',
    },
    info: {
      icon: Info,
      colors: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200',
      accentColor: 'text-emerald-600 dark:text-emerald-400',
    },
  };

  const config = types[type];
  const Icon = CustomIcon || config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`border rounded-lg p-4 flex items-start gap-3 ${config.colors} ${className}`}
    >
      <Icon className={`flex-shrink-0 mt-0.5 ${config.accentColor}`} size={20} />
      
      <div className="flex-1">
        {title && <h4 className="font-semibold mb-1">{title}</h4>}
        {message && <p className="text-sm">{message}</p>}
      </div>

      {dismissible && onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 ml-2 hover:opacity-70 transition-opacity"
        >
          <X size={18} />
        </button>
      )}
    </motion.div>
  );
};

export default Alert;
