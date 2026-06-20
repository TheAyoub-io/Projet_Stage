import React from 'react';

const Footer = () => {
  return (
    <footer className="py-12 mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
      <div className="container mx-auto px-6 text-center">
        <p className="text-slate-600 dark:text-slate-400 font-medium mb-2">
          &copy; {new Date().getFullYear()} Système d'Admission Internat - Lycée Mohamed V. Tous droits réservés.
        </p>
        <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">
          Plateforme d'Excellence Académique
        </p>
      </div>
    </footer>
  );
};

export default Footer;
