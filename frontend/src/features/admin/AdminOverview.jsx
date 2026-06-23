import React from 'react';
import { Users, Clock, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, PieChart, Pie, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { useAdminStats, useAdminAnalytics } from '../../hooks/useAdmin';
import Skeleton from '../../components/ui/Skeleton';

const AdminOverview = ({ onCardClick }) => {
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: analytics, isLoading: analyticsLoading } = useAdminAnalytics();

  if (statsLoading || analyticsLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
      </div>
    );
  }

  const statCards = [
    { label: 'Total Dossiers', value: stats?.total || 0, filter: '', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-100 dark:bg-indigo-900/30', border: 'border-indigo-100', shadow: 'shadow-indigo-500/20' },
    { label: 'En Attente', value: stats?.pending || 0, filter: 'pending', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30', border: 'border-amber-100', shadow: 'shadow-amber-500/20' },
    { label: 'Approuvés', value: stats?.approved || 0, filter: 'approved', icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30', border: 'border-emerald-100', shadow: 'shadow-emerald-500/20' },
    { label: 'Incomplets', value: stats?.incomplete || 0, filter: 'incomplete', icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-100 dark:bg-rose-900/30', border: 'border-rose-100', shadow: 'shadow-rose-500/20' },
  ];

  const COLORS = ['#6366f1', '#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444'];
  const PIE_COLORS = { 'Approuvés': '#10b981', 'En attente': '#f59e0b', 'Incomplets': '#ec4899', 'Rejetés': '#ef4444' };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/90 backdrop-blur-md border border-slate-100 shadow-xl rounded-xl p-4">
          <p className="text-slate-500 text-xs font-bold uppercase mb-1">{label || payload[0].name}</p>
          <p className="text-2xl font-black text-slate-800">{payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, i) => (
          <motion.div 
            variants={itemVariants}
            key={i} 
            whileHover={{ y: -5, scale: 1.02 }}
            onClick={() => onCardClick && onCardClick(card.filter)}
            className={`relative overflow-hidden bg-white/80 backdrop-blur-xl border border-white/40 p-6 rounded-[2rem] shadow-xl ${card.shadow} transition-all duration-300 cursor-pointer`}
          >
            {/* Subtle Gradient Glow inside the card */}
            <div className={`absolute -top-10 -right-10 w-32 h-32 ${card.bg} rounded-full blur-3xl opacity-50 pointer-events-none`}></div>
            
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">{card.label}</p>
                <h4 className="text-4xl font-black text-slate-800 dark:text-white leading-none">{card.value}</h4>
              </div>
              <div className={`w-16 h-16 rounded-2xl ${card.bg} ${card.color} flex items-center justify-center shadow-inner`}>
                <card.icon size={32} strokeWidth={2.5} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div variants={itemVariants} className="bg-white/80 backdrop-blur-xl border border-white/40 p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100/30 rounded-full blur-3xl opacity-50 pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
          <h3 className="text-xl font-extrabold text-slate-800 mb-8 flex items-center gap-2 relative z-10">
            <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center"><CheckCircle size={18} /></span>
            Répartition par Statut
          </h3>
          <div className="h-[320px] relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Approuvés', value: stats?.approved || 0 },
                    { name: 'En attente', value: stats?.pending || 0 },
                    { name: 'Incomplets', value: stats?.incomplete || 0 },
                    { name: 'Rejetés', value: stats?.rejected || 0 }
                  ]}
                  innerRadius={75}
                  outerRadius={110}
                  paddingAngle={8}
                  dataKey="value"
                  cornerRadius={12}
                  stroke="none"
                >
                  {[
                    { name: 'Approuvés' },
                    { name: 'En attente' },
                    { name: 'Incomplets' },
                    { name: 'Rejetés' }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[entry.name]} className="drop-shadow-sm hover:opacity-80 transition-opacity outline-none" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  iconType="circle" 
                  wrapperStyle={{ paddingTop: '20px' }} 
                  formatter={(value) => <span className="text-sm font-bold text-slate-600">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white/80 backdrop-blur-xl border border-white/40 p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 relative overflow-hidden">
           <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-100/30 rounded-full blur-3xl opacity-50 pointer-events-none translate-y-1/3 -translate-x-1/3"></div>
          <h3 className="text-xl font-extrabold text-slate-800 mb-8 flex items-center gap-2 relative z-10">
            <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center"><TrendingUp size={18} /></span>
            Distribution par Filière
          </h3>
          <div className="h-[320px] relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.by_filiere?.slice(0, 5) || []} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc', rx: 12 }} />
                <Bar dataKey="value" radius={[8, 8, 8, 8]} barSize={48}>
                  {(analytics?.by_filiere || []).map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AdminOverview;
