import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, ArrowRight, ShieldCheck, Zap, Building2, Users, Award, MapPin, CheckCircle2, ChevronRight, Play } from 'lucide-react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

// --- Custom Hook for counting up stats ---
const useCountUp = (end, duration = 2000, start = 0) => {
  const [count, setCount] = useState(start);
  useEffect(() => {
    let startTime = null;
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      // easeOutExpo
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(easeProgress * (end - start) + start));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [end, duration, start]);
  return count;
};

// --- Stat Component ---
const AnimatedStat = ({ end, suffix = "", label, icon: Icon, delay }) => {
  const count = useCountUp(end, 2500);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay }}
      className="relative p-6 rounded-3xl card text-center group overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative z-10">
        <div className="w-14 h-14 mx-auto bg-blue-100 dark:bg-blue-900/40 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
          <Icon size={28} className="stroke-[1.5]" />
        </div>
        <div className="text-4xl font-black text-slate-900 dark:text-white mb-1">
          {count}{suffix}
        </div>
        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{label}</p>
      </div>
    </motion.div>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { scrollY } = useScroll();
  const yHero = useTransform(scrollY, [0, 500], [0, 150]);
  const opacityHero = useTransform(scrollY, [0, 300], [1, 0]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) return;
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(
        decodeURIComponent(
          atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
        )
      );
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        localStorage.removeItem('token');
        return;
      }
      if (payload.role === 'admin') navigate('/admin');
      else navigate('/dashboard');
    } catch {
      localStorage.removeItem('token');
    }
  }, [navigate]);

  return (
    <div className="overflow-x-hidden bg-slate-50 dark:bg-slate-950 font-sans selection:bg-blue-200 dark:selection:bg-blue-900">

      {/* ── HERO SECTION ── */}
      <section className="relative min-h-[90vh] flex flex-col justify-center pt-24 pb-20 md:pt-32 overflow-hidden">
        {/* Background Gradients & Blurs */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <motion.div
            style={{ y: yHero }}
            className="absolute -top-[10%] -left-[10%] w-[50%] h-[60%] rounded-full bg-blue-400/20 dark:bg-blue-600/10 blur-[120px] mix-blend-multiply dark:mix-blend-lighten"
          />
          <motion.div
            style={{ y: yHero }}
            className="absolute top-[20%] -right-[10%] w-[40%] h-[70%] rounded-full bg-indigo-400/20 dark:bg-indigo-600/10 blur-[120px] mix-blend-multiply dark:mix-blend-lighten"
          />
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] dark:opacity-[0.05]" />
        </div>

        <div className="container mx-auto px-6 relative z-10 flex-1 flex flex-col justify-center">
          <motion.div
            style={{ opacity: opacityHero }}
            className="max-w-5xl mx-auto text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: "easeOut" }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white shadow-sm text-blue-700 dark:text-blue-300 font-bold text-xs uppercase tracking-widest mb-10 border border-white dark:border-slate-700 shadow-sm"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
              </span>
              {t("session_open")}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
              className="text-5xl md:text-7xl lg:text-[5.5rem] font-black mb-8 leading-[1.1] tracking-tight text-slate-900 dark:text-white"
            >
              {t("excellence_starts")} <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                {t("starts_here")}
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
              className="text-lg md:text-2xl text-slate-600 dark:text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed font-medium"
            >
              {t("home_subtitle")}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
              className="flex flex-col sm:flex-row gap-5 justify-center items-center"
            >
              <Link to="/register" className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-500"></div>
                <div className="relative flex items-center gap-3 bg-blue-600 text-white px-10 py-5 rounded-2xl font-black text-lg shadow-2xl overflow-hidden">
                  <span className="relative z-10">{t("create_dossier")}</span>
                  <ArrowRight className="relative z-10 group-hover:translate-x-1.5 transition-transform" strokeWidth={3} />
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
                </div>
              </Link>

              <Link to="/login" className="flex items-center gap-3 px-10 py-5 rounded-2xl font-black text-lg text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <Play size={20} className="fill-slate-700 dark:fill-slate-200" /> {t("student_space_2")}
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Floating Cards Demo (Decorative) */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 1 }}
          className="absolute right-[-10%] top-[30%] lg:right-[5%] lg:top-[20%] hidden lg:block z-0 pointer-events-none"
        >
          <div className="relative w-72 h-80">
            <motion.div animate={{ y: [0, -15, 0], rotate: [0, 2, 0] }} transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }} className="absolute -top-10 -left-10 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center"><CheckCircle2 size={20} /></div>
              <div><p className="text-xs font-bold text-slate-400">Statut</p><p className="text-sm font-black text-slate-800 dark:text-white">Approuvé</p></div>
            </motion.div>
            <motion.div animate={{ y: [0, 20, 0], rotate: [0, -2, 0] }} transition={{ repeat: Infinity, duration: 7, ease: "easeInOut", delay: 1 }} className="absolute bottom-10 right-0 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><Building2 size={20} /></div>
              <div><p className="text-xs font-bold text-slate-400">Chambre</p><p className="text-sm font-black text-slate-800 dark:text-white">A-204</p></div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ── STATS SECTION ── */}
      <section className="relative z-20 -mt-10 pb-24">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <AnimatedStat end={2500} suffix="+" label={t("stat_students")} icon={Users} delay={0} />
            <AnimatedStat end={850} suffix="" label={t("stat_rooms")} icon={Building2} delay={0.1} />
            <AnimatedStat end={98} suffix="%" label={t("stat_admission_rate")} icon={Award} delay={0.2} />
            <AnimatedStat end={4} suffix="h" label={t("stat_response_time")} icon={Clock} delay={0.3} />
          </div>
        </div>
      </section>

      {/* ── FEATURES SECTION ── */}
      <section className="py-32 bg-white dark:bg-slate-900 border-y border-slate-200/50 dark:border-slate-800">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-20">
            <h2 className="text-sm font-black text-blue-600 uppercase tracking-widest mb-3">{t("experience_internat")}</h2>
            <h3 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6">{t("home_title_2")}</h3>
            <p className="text-lg text-slate-500">{t("home_desc_2")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { icon: Zap, titleKey: 'feature_1_title', descKey: 'feature_1_desc', color: 'text-blue-600', bg: 'bg-blue-50' },
              { icon: ShieldCheck, titleKey: 'feature_2_title', descKey: 'feature_2_desc', color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { icon: MapPin, titleKey: 'feature_3_title', descKey: 'feature_3_desc', color: 'text-pink-600', bg: 'bg-pink-50' }
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                className="group relative p-10 rounded-3xl card card-hover"
              >
                <div className={`w-16 h-16 rounded-2xl ${f.bg} dark:bg-slate-800 ${f.color} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500`}>
                  <f.icon size={32} className="stroke-[1.5]" />
                </div>
                <h4 className="text-2xl font-black text-slate-900 dark:text-white mb-4">{t(f.titleKey)}</h4>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{t(f.descKey)}</p>
                <div className="mt-8 flex items-center gap-2 text-sm font-bold text-blue-600 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                  {t('discover')} <ArrowRight size={16} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TIMELINE / PROCESS SECTION ── */}
      <section className="py-32 bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 leading-tight">
                  {t('timeline_title_part1')} <br /><span className="text-blue-600">{t('timeline_title_part2')}</span>
                </h2>
                <p className="text-lg text-slate-600 dark:text-slate-400 mb-10">
                  {t("timeline_desc")}
                </p>

                <Link to="/register" className="btn btn-primary px-8 py-4 font-black">
                  {t("start_now")}
                </Link>
              </motion.div>
            </div>

            <div className="relative">
              {/* Vertical Line */}
              <div className="absolute left-8 top-8 bottom-8 w-1 bg-blue-100 dark:bg-slate-800 rounded-full" />

              <div className="space-y-12 relative">
                {[
                  { step: '1', titleKey: 'step_1_title', descKey: 'step_1_desc' },
                  { step: '2', titleKey: 'step_2_title', descKey: 'step_2_desc' },
                  { step: '3', titleKey: 'step_3_title', descKey: 'step_3_desc' },
                  { step: '4', titleKey: 'step_4_title', descKey: 'step_4_desc' }
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15, duration: 0.5 }}
                    className="flex gap-6 relative"
                  >
                    <div className="w-16 h-16 rounded-full bg-blue-600 text-white font-black text-xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/30 z-10 border-4 border-slate-50 dark:border-slate-950">
                      {item.step}
                    </div>
                    <div className="pt-3">
                      <h4 className="text-2xl font-black text-slate-900 dark:text-white mb-2">{t(item.titleKey)}</h4>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">{t(item.descKey)}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ── */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="relative rounded-3xl overflow-hidden bg-slate-900 p-12 md:p-24 text-center border border-slate-800">
            <div className="absolute inset-0 z-0">
              <div className="absolute inset-0 bg-blue-600/20 mix-blend-screen" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-500/30 via-slate-900 to-slate-900" />
            </div>

            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-6xl font-black text-white mb-6">{t("miss_opportunity")}</h2>
              <p className="text-xl text-blue-100/70 mb-10 font-medium">{t("opportunity_desc")}</p>

              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link to="/register" className="btn bg-white text-slate-900 hover:bg-blue-50 px-10 py-5 text-lg font-black shadow-xl shadow-white/10 transition-transform hover:scale-105 active:scale-95 border-none">
                  {t("create_account_btn")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
