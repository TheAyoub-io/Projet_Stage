import React from 'react';

const Footer = () => {
  return (
    <footer className="footer animate-up delay-3">
      <div className="container">
        <p>&copy; {new Date().getFullYear()} Système d'Admission Internat - Lycée Mohamed V. Tous droits réservés.</p>
        <p className="text-small">Conçu pour l'excellence et les standards académiques professionnels.</p>
      </div>
    </footer>
  );
};

export default Footer;
