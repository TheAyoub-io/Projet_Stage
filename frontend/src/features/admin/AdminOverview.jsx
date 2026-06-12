import React from 'react';
import { Users, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, PieChart, Pie, Legend } from 'recharts';
import { useAdminStats, useAdminAnalytics } from '../../hooks/useAdmin';
import Skeleton from '../../components/ui/Skeleton';

const AdminOverview = () => {
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: analytics, isLoading: analyticsLoading } = useAdminAnalytics();

  if (statsLoading || analyticsLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
      </div>
    );
  }

  const statCards = [
    { label: 'Total Dossiers', value: stats?.total || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'En Attente', value: stats?.pending || 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { label: 'Approuvés', value: stats?.approved || 0, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Incomplets', value: stats?.incomplete || 0, icon: AlertCircle, color: 'text-pink-600', bg: 'bg-pink-50 dark:bg-pink-900/20' },
  ];

  const COLORS = ['#1e3a8a', '#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, i) => (
          <div key={i} className="glass-panel p-6 flex items-center gap-5">
            <div className={`w-14 h-14 rounded-2xl ${card.bg} ${card.color} flex items-center justify-center shadow-sm`}>
              <card.icon size={28} />
            </div>
            <div>
              <h4 className="text-2xl font-black text-slate-800 dark:text-white leading-none mb-1">{card.value}</h4>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel p-8">
          <h3 className="text-lg font-bold mb-8">Répartition par Statut</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Approuvés', value: stats?.approved || 0, fill: '#10b981' },
                    { name: 'En attente', value: stats?.pending || 0, fill: '#f59e0b' },
                    { name: 'Incomplets', value: stats?.incomplete || 0, fill: '#ec4899' },
                    { name: 'Rejetés', value: stats?.rejected || 0, fill: '#ef4444' }
                  ]}
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  cornerRadius={6}
                />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glass-panel p-8">
          <h3 className="text-lg font-bold mb-8">Distribution par Filière</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.by_filiere?.slice(0, 5) || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                  {(analytics?.by_filiere || []).map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
