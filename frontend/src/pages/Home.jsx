import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, ArrowRight, ShieldCheck, Zap, Building2, Users, Award, GraduationCap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const Home = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.role === 'admin') navigate('/admin');
        else navigate('/dashboard');
      } catch {
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
    <div className="overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 md:pt-32 md:pb-48 bg-slate-50 dark:bg-slate-900/50">
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="max-w-4xl mx-auto text-center"
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold text-sm mb-8 border border-blue-100 dark:border-blue-800">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              {t('admissions_open') || "Admissions Ouvertes - Session 2026"}
            </motion.div>

            <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-extrabold mb-8 leading-tight">
              L'excellence commence <span className="text-gradient">ici.</span>
            </motion.h1>

            <motion.p variants={itemVariants} className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
              Une plateforme moderne et simplifiée pour gérer votre demande de résidence académique au Lycée Mohamed V.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="btn btn-primary px-8 py-4 text-lg group">
                Commencer l'inscription
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
              </Link>
              <Link to="/login" className="btn btn-outline px-8 py-4 text-lg">
                Se connecter
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Background Decorations */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-full -z-10 opacity-20 pointer-events-none">
            <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-400 rounded-full blur-[120px]"></div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white dark:bg-slate-800 border-y border-slate-100 dark:border-slate-700">
        <div className="container mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {[
                    { icon: Users, label: "Étudiants", value: "2500+" },
                    { icon: Building2, label: "Chambres", value: "850" },
                    { icon: Award, label: "Taux d'admission", value: "98%" },
                    { icon: Clock, label: "Support", value: "24/7" },
                ].map((stat, i) => (
                    <div key={i} className="text-center">
                        <div className="flex justify-center mb-2 text-blue-600">
                            <stat.icon size={24} />
                        </div>
                        <div className="text-3xl font-bold mb-1">{stat.value}</div>
                        <div className="text-sm text-slate-500 uppercase tracking-wider font-semibold">{stat.label}</div>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900/50">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">Pourquoi nous choisir ?</h2>
            <div className="w-20 h-1.5 bg-blue-600 mx-auto rounded-full"></div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: "Rapidité",
                desc: "Soumettez votre dossier complet en moins de 10 minutes grâce à notre interface intuitive.",
                color: "text-blue-600",
                bg: "bg-blue-50 dark:bg-blue-900/20"
              },
              {
                icon: ShieldCheck,
                title: "Sécurité",
                desc: "Vos documents sont cryptés et stockés en toute sécurité conformément aux normes de protection.",
                color: "text-emerald-600",
                bg: "bg-emerald-50 dark:bg-emerald-900/20"
              },
              {
                icon: Clock,
                title: "Temps Réel",
                desc: "Suivez chaque étape de l'examen de votre demande via des notifications instantanées.",
                color: "text-amber-600",
                bg: "bg-amber-50 dark:bg-amber-900/20"
              }
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="glass-panel p-8 group hover:border-blue-500/50"
              >
                <div className={`w-16 h-16 rounded-2xl ${f.bg} ${f.color} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-sm`}>
                  <f.icon size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-4">{f.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
          <div className="container mx-auto px-6">
              <div className="glass-panel p-12 bg-gradient-main text-white text-center relative overflow-hidden">
                  <div className="relative z-10">
                      <h2 className="text-4xl font-bold mb-6 text-white">Prêt à rejoindre l'excellence ?</h2>
                      <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
                          Rejoignez des milliers d'étudiants et profitez d'un cadre de vie exceptionnel pour vos études.
                      </p>
                      <Link to="/register" className="btn bg-white text-blue-900 hover:bg-blue-50 px-10 py-4 text-lg font-bold">
                          Créer mon compte maintenant
                      </Link>
                  </div>
                  {/* Decorative Orbs */}
                  <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                  <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl"></div>
              </div>
          </div>
      </section>
    </div>
  );
};

export default Home;
