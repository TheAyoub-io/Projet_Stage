import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, CheckCircle2, Clock, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const Home = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Decode simple role check
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.role === 'admin') navigate('/admin');
        else navigate('/dashboard');
      } catch (e) {
        localStorage.removeItem('token');
      }
    }
  }, [navigate]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div style={{ overflowX: 'hidden' }}>
      {/* Hero Section */}
      <section className="hero container" style={{ position: 'relative' }}>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          style={{ maxWidth: '800px', textAlign: 'center' }}
        >
          <motion.div variants={itemVariants} style={{
            display: 'inline-block', padding: '0.5rem 1rem', background: 'rgba(99, 102, 241, 0.1)',
            borderRadius: '99px', color: 'var(--primary)', fontWeight: '700', fontSize: '0.85rem', marginBottom: '1.5rem',
            border: '1px solid rgba(99, 102, 241, 0.2)'
          }}>
            ✨ Admissions Ouvertes - Session 2026
          </motion.div>

          <motion.h1 variants={itemVariants} style={{ fontSize: 'clamp(3rem, 8vw, 5rem)', fontWeight: '900', lineHeight: '0.95', marginBottom: '2rem' }}>
            L'excellence commence <span style={{ color: 'var(--primary)', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ici.</span>
          </motion.h1>

          <motion.p variants={itemVariants} className="hero-subtitle" style={{ fontSize: '1.25rem', lineHeight: '1.6' }}>
            Une plateforme moderne et simplifiée pour gérer votre demande de résidence académique au Lycée Mohamed V.
          </motion.p>

          <motion.div variants={itemVariants} className="hero-actions" style={{ marginTop: '2.5rem' }}>
            <Link to="/register" className="btn btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}>
              Commencer l'inscription <ArrowRight size={20} />
            </Link>
            <Link to="/login" className="btn btn-outline" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}>
              Se connecter
            </Link>
          </motion.div>
        </motion.div>

        {/* Abstract shapes for visual flair */}
        <div style={{
          position: 'absolute', top: '10%', right: '-10%', width: '400px', height: '400px',
          background: 'radial-gradient(circle, var(--glow-primary) 0%, transparent 70%)',
          filter: 'blur(60px)', zIndex: -1, opacity: 0.5
        }}></div>
      </section>

      {/* Features Section */}
      <section className="features-section container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="section-title">Pourquoi nous choisir ?</h2>
        </motion.div>

        <div className="features-grid" style={{ marginTop: '2rem' }}>
          {[
            {
              icon: Zap,
              title: "Rapidité",
              desc: "Soumettez votre dossier complet en moins de 10 minutes grâce à notre interface intuitive.",
              color: "#6366f1"
            },
            {
              icon: ShieldCheck,
              title: "Sécurité",
              desc: "Vos documents sont cryptés et stockés en toute sécurité conformément aux normes de protection.",
              color: "#10b981"
            },
            {
              icon: Clock,
              title: "Temps Réel",
              desc: "Suivez chaque étape de l'examen de votre demande via des notifications instantanées.",
              color: "#f59e0b"
            }
          ].map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="glass-panel feature-card"
              style={{ borderTop: `4px solid ${f.color}` }}
            >
              <div className="feature-icon-wrapper" style={{ background: `${f.color}15`, color: f.color }}>
                <f.icon size={32} />
              </div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: '800' }}>{f.title}</h3>
              <p style={{ color: 'var(--text-muted)' }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
