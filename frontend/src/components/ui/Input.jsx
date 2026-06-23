import React from 'react';
import { motion } from 'framer-motion';

const Input = React.forwardRef(({
  label,
  error,
  icon: Icon,
  className = '',
  wrapperClassName = '',
  ...props
}, ref) => {
  return (
    <div className={`space-y-1.5 ${wrapperClassName}`}>
      {label && (
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <div className="relative group">
        {Icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
            <Icon size={18} />
          </div>
        )}
        <motion.input
          ref={ref}
          whileFocus={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
          className={`
            w-full bg-slate-50 dark:bg-slate-900/50 
            border-2 border-slate-200 dark:border-slate-800 
            text-slate-900 dark:text-white rounded-xl
            focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 
            focus:ring-4 focus:ring-emerald-500/10 dark:focus:ring-emerald-400/10
            transition-all duration-300
            px-4 py-3 text-[0.95rem] font-medium
            placeholder:text-slate-400 dark:placeholder:text-slate-600
            ${Icon ? 'pl-11' : ''}
            ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <motion.p 
          initial={{ opacity: 0, y: -5 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="text-xs font-bold text-red-500 mt-1"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
