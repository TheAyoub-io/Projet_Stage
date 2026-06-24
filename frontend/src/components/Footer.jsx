import React from 'react';

const Footer = () => {
  return (
    <footer className="py-12 mt-auto border-t border-slate-200/50 dark:border-slate-800/50 bg-white/70 dark:bg-slate-950/40 backdrop-blur-md transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-slate-600 dark:text-slate-400 font-medium mb-3">
          &copy; {new Date().getFullYear()} Système d'Admission Internat - Lycée Mohamed V. Tous droits réservés.
        </p>
        <p className="text-[10px] text-emerald-650 dark:text-emerald-500 uppercase tracking-widest font-black bg-emerald-50 dark:bg-emerald-950/20 inline-block px-3 py-1 rounded-full border border-emerald-100 dark:border-emerald-900/30">
          Plateforme d'Excellence Académique
        </p>
      </div>
    </footer>
  );
};

export default Footer;
