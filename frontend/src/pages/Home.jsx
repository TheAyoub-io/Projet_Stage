import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, ArrowRight, ShieldCheck, Zap, Building2, Users, Award, MapPin, CheckCircle2, Play, Sparkles } from 'lucide-react';
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
      className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-6 text-center shadow-xl border border-slate-100 dark:border-slate-800 hover:-translate-y-2 hover:shadow-2xl hover:border-emerald-500/30 transition-all duration-300"
    >
      <div className="w-14 h-14 mx-auto mb-4 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm">
        <Icon size={28} />
      </div>
      <div className="text-4xl font-extrabold text-slate-900 dark:text-white mb-1 tracking-tight">
        {count}{suffix}
      </div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
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
    { icon: Zap, titleKey: 'feature_1_title', descKey: 'feature_1_desc', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { icon: ShieldCheck, titleKey: 'feature_2_title', descKey: 'feature_2_desc', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { icon: MapPin, titleKey: 'feature_3_title', descKey: 'feature_3_desc', color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-100' },
  ];

  const steps = [
    { step: '1', titleKey: 'step_1_title', descKey: 'step_1_desc' },
    { step: '2', titleKey: 'step_2_title', descKey: 'step_2_desc' },
    { step: '3', titleKey: 'step_3_title', descKey: 'step_3_desc' },
    { step: '4', titleKey: 'step_4_title', descKey: 'step_4_desc' },
  ];

  const itemVariants = fadeUp;

  return (
    <div className="bg-slate-50 min-h-screen pt-16 overflow-hidden">

      {/* ── HERO ── */}
      <section className="relative px-4 pt-24 pb-20 text-center z-10">
        {/* Animated gradient background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[500px] bg-gradient-to-b from-emerald-100/50 to-transparent rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDuration: '4s' }} />
        
        <motion.div 
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto"
        >
          {/* Session badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-bold text-emerald-600 uppercase tracking-widest mb-8 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            {t('session_open')}
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 leading-[1.1] mb-6 tracking-tight">
            {t('excellence_starts')} <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-indigo-600">
              {t('starts_here')}
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            {t('home_subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center items-center">
            <Link to="/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto gap-2 group rounded-2xl">
                {t('create_dossier')} 
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/login" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2 rounded-2xl bg-white dark:bg-slate-900">
                <Play size={20} className="fill-current" /> {t('student_space_2')}
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── STATS ── */}
      <section className="px-4 pb-20 relative z-20">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <AnimatedStat end={2500} suffix="+" label={t('stat_students')} icon={Users} delay={0} />
          <AnimatedStat end={850} suffix="" label={t('stat_rooms')} icon={Building2} delay={0.1} />
          <AnimatedStat end={98} suffix="%" label={t('stat_admission_rate')} icon={Award} delay={0.2} />
          <AnimatedStat end={4} suffix="h" label={t('stat_response_time')} icon={Clock} delay={0.3} />
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="px-4 py-24 bg-white border-y border-slate-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-extrabold text-emerald-600 uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
              <Sparkles size={16} /> {t('experience_internat')}
            </p>
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">{t('home_title_2')}</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">{t('home_desc_2')}</p>
          </div>

          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {features.map((f, i) => (
              <motion.div key={i} variants={itemVariants} className="bg-white border border-slate-100 rounded-3xl p-8 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 group">
                <div className={`w-16 h-16 rounded-2xl ${f.bg} ${f.color} ${f.border} border flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <f.icon size={32} />
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-3">{t(f.titleKey)}</h4>
                <p className="text-slate-500 leading-relaxed">{t(f.descKey)}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── PROCESS / TIMELINE ── */}
      <section className="px-4 py-24">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <motion.div 
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-[1.1] mb-6 tracking-tight">
              {t('timeline_title_part1')} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-indigo-600">
                {t('timeline_title_part2')}
              </span>
            </h2>
            <p className="text-lg text-slate-500 leading-relaxed mb-8">
              {t('timeline_desc')}
            </p>
            <Link to="/register" className="btn btn-primary px-8 py-3 text-lg rounded-2xl">
              {t('start_now')}
            </Link>
          </motion.div>

          <div className="relative pl-8 md:pl-12">
            {/* Vertical line */}
            <div className="absolute left-4 md:left-6 top-4 bottom-4 w-1 bg-gradient-to-b from-emerald-600 to-slate-200 rounded-full opacity-30" />

            <div className="flex flex-col gap-10">
              {steps.map((item, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                  className="flex gap-6 relative group"
                >
                  <div className="w-12 h-12 rounded-full bg-white border-4 border-slate-50 text-emerald-600 shadow-xl font-extrabold text-lg flex items-center justify-center shrink-0 z-10 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 absolute -left-10 md:-left-12 top-0">
                    {item.step}
                  </div>
                  <div className="pt-2">
                    <h4 className="text-xl font-bold text-slate-900 mb-2">{t(item.titleKey)}</h4>
                    <p className="text-slate-500 leading-relaxed">{t(item.descKey)}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-4 py-20 pb-32">
        <motion.div 
          variants={scaleUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-4xl mx-auto bg-slate-900 rounded-[2.5rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-full bg-gradient-to-b from-emerald-600/30 to-transparent rounded-t-[100%] pointer-events-none" />
          
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">{t('miss_opportunity')}</h2>
            <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl mx-auto">{t('opportunity_desc')}</p>
            <Link to="/register" className="inline-flex items-center gap-2 bg-white text-slate-900 px-10 py-4 rounded-2xl font-bold text-lg hover:bg-slate-100 hover:scale-105 transition-all shadow-xl">
              {t('create_account_btn')}
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default Home;
