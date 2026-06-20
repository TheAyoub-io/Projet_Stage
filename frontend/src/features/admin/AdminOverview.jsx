import React from 'react';
import { Users, Clock, CheckCircle, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, PieChart, Pie, Legend } from 'recharts';
import { useAdminStats, useAdminAnalytics } from '../../hooks/useAdmin';
import Skeleton from '../../components/ui/Skeleton';

const AdminOverview = () => {
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: analytics, isLoading: analyticsLoading } = useAdminAnalytics();

  if (statsLoading || analyticsLoading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
      </div>
    );
  }

  // Calculate percentages
  const total = stats?.total || 0;
  const approved = stats?.approved || 0;
  const approvedPercent = total > 0 ? Math.round((approved / total) * 100) : 0;

  // Assuming 1500 DH per application, or just fixed logic for Revenus Est.
  const revenus = approved * 1500;

  const statCards = [
    { 
      label: 'TOTAL DOSSIERS', 
      value: total, 
      icon: Users, 
      color: '#3b82f6', 
      bg: '#eff6ff', // blue-50
      percent: '100%',
      percentColor: '#3b82f6',
      percentBg: '#dbeafe'
    },
    { 
      label: 'EN ATTENTE', 
      value: stats?.pending || 0, 
      icon: Clock, 
      color: '#f97316', 
      bg: '#fff7ed', // orange-50
      percent: null
    },
    { 
      label: 'APPROUVÉS', 
      value: approved, 
      icon: CheckCircle, 
      color: '#22c55e', 
      bg: '#f0fdf4', // green-50
      percent: `${approvedPercent}%`,
      percentColor: '#22c55e',
      percentBg: '#dcfce7'
    },
    { 
      label: 'REVENUS EST.', 
      value: `${revenus} DH`, 
      icon: DollarSign, 
      color: '#ec4899', 
      bg: '#fdf2f8', // pink-50
      percent: null
    },
  ];

  const COLORS = ['#1e3a8a', '#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* 4 Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        {statCards.map((card, i) => (
          <div key={i} style={{ 
            backgroundColor: '#fff', 
            borderRadius: '12px', 
            padding: '1.5rem', 
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            position: 'relative'
          }}>
            {/* Top Row: Icon + Percentage Circle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ 
                width: '48px', height: '48px', 
                borderRadius: '12px', 
                backgroundColor: card.bg, 
                color: card.color, 
                display: 'flex', alignItems: 'center', justifyContent: 'center' 
              }}>
                <card.icon size={24} />
              </div>
              {card.percent && (
                <div style={{
                  width: '36px', height: '36px',
                  borderRadius: '50%',
                  backgroundColor: card.percentBg,
                  color: card.percentColor,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 'bold'
                }}>
                  {card.percent}
                </div>
              )}
            </div>
            
            {/* Value */}
            <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '0.25rem' }}>
              {card.value}
            </div>
            {/* Label */}
            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', letterSpacing: '0.05em' }}>
              {card.label}
            </div>
          </div>
        ))}
      </div>

      {/* Charts (Optional, keep them simple as requested) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '2rem', color: '#1e293b' }}>Répartition par Statut</h3>
          <div style={{ height: '300px' }}>
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
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '2rem', color: '#1e293b' }}>Distribution par Filière</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.by_filiere?.slice(0, 5) || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
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

