import React from 'react';
import { motion } from 'framer-motion';

export const Card = ({ children, className = '', hoverable = false, glass = false, delay = 0, ...props }) => {
  const baseClasses = `
    rounded-3xl border relative overflow-hidden transition-all duration-300
    ${glass 
      ? 'bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-white/40 dark:border-slate-700/50 shadow-2xl' 
      : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none'
    }
    ${hoverable ? 'hover:-translate-y-1 hover:shadow-2xl hover:border-emerald-500/30 dark:hover:border-emerald-500/30 cursor-pointer' : ''}
    ${className}
  `;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className={baseClasses}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const CardHeader = ({ children, className = '' }) => (
  <div className={`p-6 border-b border-slate-100 dark:border-slate-800/50 flex flex-col gap-1.5 ${className}`}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-xl font-bold text-slate-900 dark:text-white ${className}`}>
    {children}
  </h3>
);

export const CardDescription = ({ children, className = '' }) => (
  <p className={`text-sm font-medium text-slate-500 dark:text-slate-400 ${className}`}>
    {children}
  </p>
);

export const CardContent = ({ children, className = '' }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = '' }) => (
  <div className={`p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800/50 flex items-center ${className}`}>
    {children}
  </div>
);
