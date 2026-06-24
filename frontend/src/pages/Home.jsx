import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, ArrowRight, ShieldCheck, Zap, Building2, Users, Award, MapPin, Play, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { fadeUp, staggerContainer, scaleUp } from '../lib/animations';
import Button from '../components/ui/Button';

// --- Stat Counter ---
const useCountUp = (end, duration = 2000, start = 0) => {
  const [count, setCount] = useState(start);
  useEffect(() => {
    let startTime = null;
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(easeProgress * (end - start) + start));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [end, duration, start]);
  return count;
};

const AnimatedStat = ({ end, suffix = '', label, icon: Icon, delay }) => {
  const count = useCountUp(end, 2500);
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay }}
      className="card glow-card hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center p-6 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md"
    >
      <div className="w-12 h-12 mb-4 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center shadow-inner">
        <Icon size={24} />
      </div>
      <div className="text-4xl font-black text-slate-900 dark:text-white mb-1 tracking-tight">
        {count}{suffix}
      </div>
      <p className="text-[10px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-widest">{label}</p>
    </motion.div>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) return;
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')));
      if (payload.exp && payload.exp * 1000 < Date.now()) { localStorage.removeItem('token'); return; }
      if (payload.role === 'admin') navigate('/admin');
      else navigate('/dashboard');
    } catch { localStorage.removeItem('token'); }
  }, [navigate]);

  const features = [
    { icon: Zap, titleKey: 'feature_1_title', descKey: 'feature_1_desc', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-emerald-100 dark:border-emerald-900/20' },
    { icon: ShieldCheck, titleKey: 'feature_2_title', descKey: 'feature_2_desc', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-emerald-100 dark:border-emerald-900/20' },
    { icon: MapPin, titleKey: 'feature_3_title', descKey: 'feature_3_desc', color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/20', border: 'border-indigo-100 dark:border-indigo-900/20' },
  ];

  const steps = [
    { step: '1', titleKey: 'step_1_title', descKey: 'step_1_desc' },
    { step: '2', titleKey: 'step_2_title', descKey: 'step_2_desc' },
    { step: '3', titleKey: 'step_3_title', descKey: 'step_3_desc' },
    { step: '4', titleKey: 'step_4_title', descKey: 'step_4_desc' },
  ];

  const itemVariants = fadeUp;

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen pt-16 overflow-hidden relative transition-colors duration-300">
      
      {/* Background Glowing Blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-15%] w-[60%] h-[50%] rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 mix-blend-multiply filter blur-[120px] opacity-80 animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 mix-blend-multiply filter blur-[120px] opacity-80 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[10%] left-[10%] w-[45%] h-[45%] rounded-full bg-teal-500/5 dark:bg-teal-500/3 mix-blend-multiply filter blur-[100px] opacity-75 animate-blob animation-delay-4000"></div>
      </div>

      {/* ── HERO ── */}
      <section className="relative px-4 pt-28 pb-20 text-center z-10 max-w-7xl mx-auto">
        <motion.div 
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto"
        >
          {/* Active Session badge */}
          <div className="inline-flex items-center gap-2 px-4.5 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-10 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse" />
            {t('session_open')}
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black text-slate-900 dark:text-white leading-[1.05] mb-8 tracking-tighter">
            {t('excellence_starts')} <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-indigo-650 dark:from-emerald-450 dark:to-indigo-400">
              {t('starts_here')}
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
            {t('home_subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center items-center">
            <Link to="/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto gap-2 group rounded-full py-4 px-8 font-black text-base shadow-lg shadow-emerald-500/25">
                {t('create_dossier')} 
                <ArrowRight size={18} className="group-hover:translate-x-1.5 transition-transform" />
              </Button>
            </Link>
            <Link to="/login" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2 rounded-full py-4 px-8 font-black text-base bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800">
                <Play size={18} className="fill-current" /> {t('student_space_2')}
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── STATS BENTO GRID ── */}
      <section className="px-4 pb-24 relative z-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <AnimatedStat end={2500} suffix="+" label={t('stat_students')} icon={Users} delay={0} />
          <AnimatedStat end={850} suffix="" label={t('stat_rooms')} icon={Building2} delay={0.08} />
          <AnimatedStat end={98} suffix="%" label={t('stat_admission_rate')} icon={Award} delay={0.16} />
          <AnimatedStat end={4} suffix="h" label={t('stat_response_time')} icon={Clock} delay={0.24} />
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="px-4 py-28 bg-white/40 dark:bg-slate-900/20 border-y border-slate-200/50 dark:border-slate-850/50 relative z-10 transition-colors duration-300">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-3.5 flex items-center justify-center gap-2">
              <Sparkles size={14} className="animate-pulse" /> {t('experience_internat')}
            </p>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">{t('home_title_2')}</h2>
            <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium">{t('home_desc_2')}</p>
          </div>

          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {features.map((f, i) => (
              <motion.div 
                key={i} 
                variants={itemVariants} 
                className="card glow-card hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 bg-white dark:bg-slate-900/60 p-8 flex flex-col items-start text-left border border-slate-100 dark:border-slate-800/80"
              >
                <div className={`w-14 h-14 rounded-2xl ${f.bg} ${f.color} ${f.border} border flex items-center justify-center mb-6 shadow-sm transition-transform duration-300 group-hover:scale-110`}>
                  <f.icon size={26} />
                </div>
                <h4 className="text-xl font-extrabold text-slate-900 dark:text-white mb-3.5">{t(f.titleKey)}</h4>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-medium">{t(f.descKey)}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── PROCESS TIMELINE ── */}
      <section className="px-4 py-28 relative z-10 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <motion.div 
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white leading-[1.05] tracking-tight">
              {t('timeline_title_part1')} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-indigo-650 dark:from-emerald-400 dark:to-indigo-400">
                {t('timeline_title_part2')}
              </span>
            </h2>
            <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              {t('timeline_desc')}
            </p>
            <div className="pt-2">
              <Link to="/register" className="btn btn-primary px-8 py-3.5 text-base rounded-full shadow-lg shadow-emerald-500/20">
                {t('start_now')}
              </Link>
            </div>
          </motion.div>

          <div className="relative pl-8 md:pl-12">
            {/* Vertical timeline line */}
            <div className="absolute left-4 md:left-6 top-6 bottom-6 w-0.5 bg-gradient-to-b from-emerald-500 via-teal-400 to-slate-200 dark:to-slate-800 rounded-full opacity-35" />

            <div className="flex flex-col gap-12">
              {steps.map((item, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, x: 25 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.12 }}
                  className="flex gap-6 relative group"
                >
                  <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border-4 border-slate-50 dark:border-slate-950 text-emerald-600 dark:text-emerald-400 shadow-xl font-black text-sm flex items-center justify-center shrink-0 z-10 group-hover:scale-110 group-hover:bg-emerald-500 dark:group-hover:bg-emerald-400 group-hover:text-white dark:group-hover:text-slate-950 transition-all duration-300 absolute -left-[28px] md:-left-[36px] top-0">
                    {item.step}
                  </div>
                  <div className="pt-0.5">
                    <h4 className="text-lg font-extrabold text-slate-900 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{t(item.titleKey)}</h4>
                    <p className="text-slate-550 dark:text-slate-400 text-sm leading-relaxed font-medium">{t(item.descKey)}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA IMMERSIVE SECTION ── */}
      <section className="px-4 py-24 pb-36 relative z-10 max-w-7xl mx-auto">
        <motion.div 
          variants={scaleUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-4xl mx-auto bg-slate-900 dark:bg-slate-900/60 rounded-[3rem] p-12 md:p-24 text-center relative overflow-hidden shadow-2xl border border-white/5"
        >
          {/* Radial overlay gradient */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.2),transparent_80%)] pointer-events-none" />
          
          <div className="relative z-10 space-y-8">
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">{t('miss_opportunity')}</h2>
            <p className="text-base md:text-lg text-slate-350 max-w-xl mx-auto leading-relaxed font-medium">{t('opportunity_desc')}</p>
            <div className="pt-2">
              <Link to="/register" className="inline-flex items-center gap-2 bg-white text-slate-950 px-10 py-4.5 rounded-full font-black text-base hover:bg-slate-100 hover:scale-105 transition-all shadow-xl shadow-slate-950/20">
                {t('create_account_btn')}
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default Home;
